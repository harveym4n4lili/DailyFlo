"""
verify id tokens from google and apple before your api issues django JWT access/refresh tokens.

-- jwt in one sentence --
a JWT is header.payload.signature: claims about the user + crypto proof google/apple signed it.

-- concepts (quick) --
- verifying: we use the issuer's *public* keys — never trust the phone alone (the user controls the device).
- jwks: apple publishes a json list of public keys online; each key has a "kid" so we know which key matches.
- audience ("aud"): which oauth client created this token — we pin it so tokens for *another* app cannot unlock your api.

-- scenarios: why this code exists (happy path vs failures) --

  happy path — real user taps "sign in with google/apple", sdk returns an id_token string, app POSTs it to your
  django endpoint. these functions prove the token truly came from google/apple and lists your app's client id
  in `aud`. then the view can safely upsert a CustomUser and return your own jwt pair.

  attacker edits jwt text in a proxy — signature check fails → verification raises → your api returns 401, no user row.

  attacker replays an old token after expiry — `exp` check fails → same outcome.

  attacker steals a token that was minted for *their* oauth client id — `aud` does not match GOOGLE_CLIENT_ID /
  APPLE_CLIENT_ID → rejected (tokens are scoped per registered app).

  apple rotates signing keys — old tokens still verify until expiry because kid still maps to a key row in jwks;
  when apple introduces a new key, new tokens pick up new kid; we fetch fresh jwks each verify call so we stay current.

  misconfigured server missing GOOGLE_CLIENT_ID / APPLE_CLIENT_ID — we fail fast here instead of opaque library errors.

  offline / apple jwks unreachable — http fetch fails → ValueError from _fetch_apple_public_keys so you can map that to 503/401.

this file stays pure (no database) so you can unit-test by mocking tokens and http.
"""

from __future__ import annotations

# pyjwt — decode/verify jwts and map apple's jwk dict into an rsa public key object.
import jwt
# django.conf.settings — same settings object as settings.py (reads GOOGLE_CLIENT_ID etc. after load_dotenv).
from django.conf import settings
# google.auth.transport.requests.Request — a tiny adapter so google-auth can use the `requests` library
# to hit google's servers when it needs discovery docs / certs (you don't call .get() yourself here).
from google.auth.transport import requests as google_requests
# google.oauth2.id_token — helper that verifies google *oauth2* id tokens (openid connect style).
from google.oauth2 import id_token as google_id_token
# RSAAlgorithm.from_jwk turns one json key dict from apple into something jwt.decode can use for RS256.
from jwt.algorithms import RSAAlgorithm
# pyjwt raises typed errors; we catch them and turn everything into ValueError so views can treat failures uniformly.
from jwt.exceptions import ExpiredSignatureError, InvalidAudienceError, InvalidTokenError

# standard http client — used only to download apple's jwks json (google-auth brings its own transport).
import requests as http_requests

# apple publishes rotating signing keys here — we match jwt header "kid" to pick the right public key row.
APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys'
# issuer claim value apple puts inside the token — jwt.decode checks the token's `iss` matches this string.
APPLE_ISSUER = 'https://appleid.apple.com'


def _fetch_apple_public_keys() -> list:
    """download apple's current jwks and return the `keys` array (list of key dicts)."""
    try:
        # scenario: user signs in while apple's CDN is flaky — timeout/error surfaces as ValueError for your api layer.
        # .get issues an http GET; timeout avoids hanging forever if apple is unreachable.
        response = http_requests.get(APPLE_JWKS_URL, timeout=10)
        # turns http error statuses (4xx/5xx) into an exception so we don't parse garbage as keys.
        response.raise_for_status()
        # .json() parses response body as json; ['keys'] is the jwks standard shape per openid discovery.
        return response.json()['keys']
    except (http_requests.RequestException, KeyError, ValueError) as exc:
        # RequestException covers timeouts, connection errors, etc.; KeyError if json shape wrong.
        raise ValueError(f'could not load apple signing keys: {exc}') from exc


def verify_google_id_token(token: str) -> dict:
    """
    verify a google id token string from the mobile app.

    returns the decoded payload dict (claims): sub, email, email_verified, names, etc.
    raises ValueError if the token is forged, expired, wrong audience, or malformed.

    usage later: SocialAuthView calls this, reads claims["sub"] / email, creates user if needed, returns django jwt.
    """
    # getattr(..., None) avoids attributeerror if setting missing; empty string is also treated as missing.
    if not getattr(settings, 'GOOGLE_CLIENT_ID', None):
        raise ValueError('GOOGLE_CLIENT_ID is not configured')

    try:
        # scenario: token was issued for your ios oauth client — verify_oauth2_token confirms signature + aud + exp.
        # scenario: someone pasted a token from oauth playground tied to a *different* client id → audience mismatch.
        # verify_oauth2_token: validates signature using google's keys, checks exp/iss/aud in one call.
        # arg2 Request() is required — google-auth uses it internally for metadata fetch/cache.
        # audience= must match the oauth client id configured for your ios/android app or verification fails.
        claims = google_id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID,
        )
        return claims
    except Exception as exc:
        # google-auth raises many exception types (invalid token, wrong audience, clock skew, etc.).
        # callers only need "failed" vs "ok", so we normalize to ValueError with the original chained via `from exc`.
        raise ValueError(f'Google token verification failed: {exc}') from exc


def verify_apple_id_token(token: str) -> dict:
    """
    verify apple's identity token (jwt from sign in with apple).

    returns decoded claims dict. raises ValueError on any failure.

    usage later: same as google — view trusts claims only after this passes, then issues app jwt or updates user.
    """
    if not getattr(settings, 'APPLE_CLIENT_ID', None):
        raise ValueError('APPLE_CLIENT_ID is not configured')

    try:
        # scenario: need kid before verify — apple may sign with key A today and key B tomorrow (rotation).
        # get_unverified_header only base64-decodes the first chunk — no signature check yet (safe for reading kid).
        header = jwt.get_unverified_header(token)
        # kid tells us which row from apple's jwks signed this token (apple rotates keys periodically).
        kid = header.get('kid')
        if not kid:
            raise ValueError("no 'kid' in apple token header")

        jwks = _fetch_apple_public_keys()
        # scenario: token references kid that apple deprecated — not in current jwks → cannot verify (reject).
        # next(...) picks first matching key dict in the list; None if kid not found — token can't be verified then.
        apple_key_data = next((k for k in jwks if k.get('kid') == kid), None)
        if not apple_key_data:
            raise ValueError('matching apple public key not found in JWKS')

        # from_jwk converts the json key (n, e, kty, etc.) into a cryptography rsa public key pyjwt understands.
        public_key = RSAAlgorithm.from_jwk(apple_key_data)

        # scenario: wrong bundle id in token — aud won't match APPLE_CLIENT_ID → InvalidAudienceError below.
        # decode verifies RS256 signature using public_key, then enforces standard jwt checks:
        # exp not passed, aud equals your bundle/service id, iss equals apple's issuer url.
        claims = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=settings.APPLE_CLIENT_ID,
            issuer=APPLE_ISSUER,
        )
        return claims

    # order matters: subclasses before base InvalidTokenError (expired/audience are subclasses of invalid token).
    except ExpiredSignatureError as exc:
        raise ValueError('Apple token has expired') from exc
    except InvalidAudienceError as exc:
        raise ValueError('Apple token audience does not match this app') from exc
    except InvalidTokenError as exc:
        # catches bad signature, malformed jwt, wrong issuer, bad claims, etc.
        raise ValueError(f'Apple token is invalid: {exc}') from exc
