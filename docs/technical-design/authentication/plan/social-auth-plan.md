# Social Authentication Implementation Plan — DailyFlo (Google + Apple)

**Reading level:** CS student, comfortable with Python/TypeScript, has read `email-password-authentication.md` first.  
**Goal:** replace the stub `SocialAuthView` with production-ready, secure Google + Apple sign-in.  
**What this is:** a plan / design doc — not finished code. Each section tells you *what* to build, *why*, and *exactly where* to touch in this repo.  
**Status note:** written after a full codebase audit (Apr 2026). Every claim is checked against the live files.

---

## 0 — Concepts you must understand before you touch any code

Work through these in order. There are no shortcuts.

### 0.1 — What OAuth 2.0 actually is

OAuth 2.0 is an **authorization framework** that lets a third party (Google, Apple) prove to *your* server that a user is who they say they are — without your server ever seeing their password.

```
User         Your app           Google / Apple         Your Django server
  |               |                    |                       |
  |--tap login--> |                    |                       |
  |               |---open browser---> |                       |
  |               |                    |                       |
  |<---------- Google / Apple login form (in browser) -------> |
  |               |                    |                       |
  |               |<---redirect back with TOKEN--------------- |
  |               |                                            |
  |               |---POST token to Django-------------------> |
  |               |                    Django verifies token   |
  |               |<---DailyFlo JWT (access + refresh)-------- |
```

The user never types their password into *your* app. Google/Apple handle that entirely.

### 0.2 — ID token vs access token (two completely different things)

This naming trips up almost every developer new to OAuth:

| Token name | Who issues it | What it proves | Used for |
|------------|---------------|----------------|----------|
| **ID token** (from Google/Apple) | Google or Apple | "This user's identity is verified — here are their profile claims" | Send to your backend to prove who the user is |
| **OAuth access token** (from Google/Apple) | Google or Apple | "This app can call Google/Apple APIs" | Rarely needed in a mobile login-only flow |
| **DailyFlo access JWT** | Your Django server | "This user is logged in to DailyFlo" | Every DailyFlo API call |
| **DailyFlo refresh JWT** | Your Django server | "Allowed to issue new DailyFlo access tokens" | Token refresh |

**In DailyFlo social auth you care about the ID token from the provider.** Send it to Django → Django verifies → Django issues its own JWTs.

> **Codebase note:** the current `SocialAuthSerializer` has a field called `access_token` — this name is misleading. When we rewrite it we rename it `id_token` to reflect what is actually sent.

### 0.3 — OIDC (OpenID Connect)

OpenID Connect is a thin layer on top of OAuth 2.0 that **standardises the format of the ID token**. Both Google and Apple support OIDC. The ID token is itself a **JWT** (yes, a JWT inside a JWT flow!) signed by the provider.

The ID token contains **claims** — JSON fields like:
- `sub` — stable, unique user ID at this provider (never changes)
- `email` — user's email
- `email_verified` — boolean
- `given_name`, `family_name` — name
- `picture` — avatar URL
- `iss` — issuer (who signed the token)
- `aud` — audience (which app the token was issued for)
- `exp` — expiry timestamp

### 0.4 — Why backend verification is mandatory

The mobile app receives a Google/Apple ID token. You **must not** trust it without backend verification. A malicious user could:

- Forge the claims inside the token
- Replay a stolen token from another user
- Use a token issued for a different app

Your Django server must:
1. Verify the token's **signature** using Google's/Apple's public keys
2. Verify the **`aud` claim** matches YOUR app's client ID (audience pinning)
3. Verify the **`iss` claim** matches the expected provider URL
4. Verify **`exp`** is in the future

**This is the exact step the current `SocialAuthView` does not do** — it has a `# TODO: implement social provider token validation` comment and blindly trusts whatever `user_info` dict the mobile app sends. Anyone could send `{ "id": "123", "email": "admin@example.com" }` and get a DailyFlo JWT for that account.

### 0.5 — Apple's special quirks

Apple Sign In is **mandatory on iOS** if you offer any third-party social login (App Store Guideline 4.8). Unique behaviours:

- Apple only sends `email` and `name` on the **first** sign-in for a user. Every subsequent sign-in, those fields are absent — only `sub` is reliable.
- Apple can **hide the real email** and relay it via a proxy (`xyz@privaterelay.appleid.com`). Accept this as a normal email.
- Apple ID tokens are JWTs signed with RS256 (RSA + SHA-256). You verify using Apple's public keys at `https://appleid.apple.com/auth/keys`.

### 0.6 — Deep linking

OAuth uses a browser redirect. For a mobile app, the OS delivers the redirect back to your app via a **deep link URI scheme**. You define this in `app.json` (e.g. `dailyflo://`). `expo-auth-session` handles the mechanics.

---

## 1 — Exact state of the codebase right now (audit results)

This section was written after reading every auth-related file. Do not skip it.

### 1.1 — Backend: what exists, what is missing, what is broken

| File | What's there | Gaps / issues |
|------|--------------|---------------|
| `apps/accounts/models.py` | `CustomUser` with `auth_provider`, `auth_provider_id`, `is_email_verified`, DB unique constraint on `(auth_provider, auth_provider_id)`, `set_unusable_password()` for social users | **Ready — no changes needed** |
| `apps/accounts/urls.py` | `POST /accounts/auth/social/` routes to `SocialAuthView` | **Ready — no changes needed** |
| `apps/accounts/views.py` — `SocialAuthView` | Validates serializer, does `get_or_create` user, issues DailyFlo JWTs | **SECURITY GAP:** `# TODO: implement social provider token validation` — accepts client-supplied `user_info` dict as truth with zero cryptographic verification |
| `apps/accounts/views.py` — `PasswordResetConfirmView` | Has `# TODO: implement token validation` | Not part of social auth but noted: **password reset confirm is unimplemented** |
| `apps/accounts/views.py` — `PasswordResetRequestView` | Returns the raw reset token in the response body | **Dev-only — remove `reset_token` from response before production** |
| `apps/accounts/serializers.py` — `SocialAuthSerializer` | `provider` (choices: google/apple/facebook), `access_token` (wrong name — should be `id_token`), `user_info` (free-form dict from client) | Field names are wrong; `user_info` from client must be replaced by server-side token verification |
| `config/settings.py` | `JWTAuthentication` active, no `SIMPLE_JWT` block | **Missing:** JWT lifetime configuration, rotation, blacklist |
| `config/settings.py` | `CORS_ALLOW_ALL_ORIGINS = True` | Must be `False` in production |
| `config/settings.py` | Hardcoded `SECRET_KEY`, `DEBUG = True` | **Dev-only — never ship these values** |
| `requirements.txt` | Has `PyJWT==2.9.0`, `djangorestframework_simplejwt==5.5.0` | **Missing:** `google-auth`, `cryptography`, `requests`; `rest_framework_simplejwt.token_blacklist` not in `INSTALLED_APPS` |

### 1.2 — Frontend: what exists, what is missing, what is unused

| File | What's there | Gaps / issues |
|------|--------------|---------------|
| `package.json` | `expo-web-browser` (needed), `expo-secure-store` (used) | **Missing:** `expo-auth-session`, `expo-apple-authentication` |
| `store/slices/auth/authSlice.ts` — `socialAuth` thunk | Entire body is a mock — generates fake tokens locally, never calls the API | **Must be fully rewritten** |
| `services/api/auth.ts` — `socialLogin` | HTTP POST to `/accounts/auth/social/` | **Ready to use** — just needs correct payload shape |
| `services/auth/tokenStorage.ts` | `storeAccessToken`, `storeRefreshToken`, `storeTokenExpiry`, `clearAllTokens`, `hasValidTokens` | **Ready — no changes needed** |
| `services/api/client.ts` | Axios + request/response interceptors | **Ready — no changes needed** |
| `app/_layout.tsx` | Routing gate, `checkAuthStatus` | **Ready — no changes needed** |
| `services/auth/AuthService.ts` | High-level auth service class | **Dead code** — imports from `../storage/SecureStorage` which is a different abstraction than the live path. Not used by any thunk or component in the active flow. |
| `services/auth/TokenManager.ts` | JWT token management class | **Dead code** — same issue; uses the old `SecureStorage` abstraction, not `tokenStorage.ts` |
| `services/auth/index.ts` | Exports `AuthService`, `TokenManager`, and `tokenStorage` functions | Creates confusion by exporting unused legacy classes alongside live helpers |
| `types/api/auth.ts` | `RegisterRequest` wraps data in `{ user: RegisterUserInput }` | **Mismatch** — actual `authSlice` calls pass fields directly, not wrapped. Types and actual usage are inconsistent. |

---

## 2 — Security principles for this implementation

Every decision below is justified by one of these:

1. **Never trust the client** — The mobile app sends an ID token; Django verifies it cryptographically. The app cannot forge or replay a valid verification.
2. **Audience pinning** — Verify `aud` in the ID token equals YOUR app's client ID. Tokens for other apps cannot authenticate DailyFlo users.
3. **Short access JWTs + rotating refresh** — If a DailyFlo JWT leaks, damage is time-limited. Refresh token rotation means a stolen refresh token can only be used once before being invalidated.
4. **Secrets never in source code** — Google Client ID, Apple Key ID, Apple Team ID must come from environment variables, never hardcoded.
5. **Email account conflict protection** — If someone tries to sign in with Google using an email already registered with email/password, do not silently merge. Return a clear error — silent merging is an account takeover vector.
6. **HTTPS only in production** — Token exchange must never happen over plain HTTP.

---

## 3 — Step-by-step: Backend

### Step 3.1 — Install missing backend dependencies

`requirements.txt` already has `PyJWT==2.9.0`. Add the three missing packages:

```bash
# from backend/dailyflo/
pip install google-auth cryptography requests
pip freeze > requirements.txt
```

| Package | Why |
|---------|-----|
| `google-auth` | Verifies Google ID tokens against Google's public JWKS; handles key fetching and caching |
| `cryptography` | Required by PyJWT for RS256 (RSA signature) — needed for Apple token verification |
| `requests` | Used to fetch Apple's JWKS endpoint (list of Apple's public keys) |

`PyJWT==2.9.0` is already installed — no change needed.

### Step 3.2 — Add `SIMPLE_JWT` config and social credential settings

`settings.py` currently has no `SIMPLE_JWT` block, so all lifetimes are library defaults (5-minute access, 1-day refresh, no rotation). Add this after the `REST_FRAMEWORK` dict:

```python
from datetime import timedelta
import os

SIMPLE_JWT = {
    # 15-minute access window — if this token leaks, it's dead within 15 minutes
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    # 30-day refresh — long enough for normal use; user stays logged in for a month
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    # rotation: every refresh call issues a NEW refresh token and blacklists the old one
    # this means a stolen refresh token can only be used once before it's invalidated
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# social provider credentials — load from environment, never hardcode
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
APPLE_TEAM_ID    = os.environ.get('APPLE_TEAM_ID')
APPLE_CLIENT_ID  = os.environ.get('APPLE_CLIENT_ID')   # your iOS bundle ID
APPLE_KEY_ID     = os.environ.get('APPLE_KEY_ID')
```

Also add `'rest_framework_simplejwt.token_blacklist'` to `INSTALLED_APPS`, then run:

```bash
python manage.py migrate   # creates the blacklist tables in the database
```

**Why does the blacklist need a database table?**  
When a refresh token is rotated, the old one needs to be stored somewhere so Django can check "has this token been used before?" — that's the blacklist table.

### Step 3.3 — Create a token verification service file

Create: `backend/dailyflo/apps/accounts/social_auth.py`

**Why a separate file?** Pure functions with no Django ORM dependencies. You can unit test them in isolation by passing in a token string and checking the returned claims dict — no database, no HTTP server needed.

```python
# backend/dailyflo/apps/accounts/social_auth.py

import requests as http_requests
from django.conf import settings
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
import jwt                             # PyJWT 2.9.0 is already in requirements.txt
from jwt.algorithms import RSAAlgorithm


# -----------------------------------------------------------------------
# GOOGLE VERIFICATION
# -----------------------------------------------------------------------

def verify_google_id_token(token: str) -> dict:
    """
    Verify a Google ID token received from the mobile app.

    What happens here:
    1. google-auth fetches Google's public JWKS (cached automatically)
    2. Decodes the JWT and verifies the RS256 signature
    3. Checks 'aud' matches GOOGLE_CLIENT_ID (audience pinning)
    4. Checks 'iss' is accounts.google.com or accounts.google.com
    5. Checks 'exp' has not passed

    Returns a dict of verified claims: sub, email, email_verified, given_name,
    family_name, picture, etc.
    Raises ValueError if anything fails.
    """
    try:
        claims = google_id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID,   # audience pinning
        )
        return claims
    except Exception as e:
        raise ValueError(f"Google token verification failed: {e}")


# -----------------------------------------------------------------------
# APPLE VERIFICATION
# -----------------------------------------------------------------------

APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys'
APPLE_ISSUER   = 'https://appleid.apple.com'

def _fetch_apple_public_keys() -> list:
    """fetch Apple's current public signing keys from their JWKS endpoint."""
    response = http_requests.get(APPLE_JWKS_URL, timeout=5)
    response.raise_for_status()
    return response.json()['keys']


def verify_apple_id_token(token: str) -> dict:
    """
    Verify an Apple ID token received from the mobile app.

    Apple uses RS256. Their private key signs the token; we verify using
    the matching public key fetched from Apple's JWKS endpoint.

    Steps:
    1. Read the JWT header (without signature check) to find which key ID ('kid') was used
    2. Fetch Apple's public keys and find the one with matching 'kid'
    3. Convert the JWKS key to a PEM public key object (PyJWT needs PEM format)
    4. Verify: signature, aud = APPLE_CLIENT_ID, iss = apple, exp not past

    Returns verified claims dict: sub, email (first sign-in only), email_verified, etc.
    Raises ValueError if anything fails.
    """
    try:
        # read header without verifying so we know which key Apple used to sign
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        if not kid:
            raise ValueError("No 'kid' in Apple token header")

        # find the matching key from Apple's public JWKS
        jwks = _fetch_apple_public_keys()
        apple_key_data = next((k for k in jwks if k['kid'] == kid), None)
        if not apple_key_data:
            raise ValueError("Matching Apple public key not found in JWKS")

        # convert the JWKS key (a dict) to a public key object PyJWT can use for RS256
        public_key = RSAAlgorithm.from_jwk(apple_key_data)

        # decode and verify — PyJWT checks signature, aud, iss, exp automatically
        claims = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=settings.APPLE_CLIENT_ID,   # audience pinning (your bundle ID)
            issuer=APPLE_ISSUER,
        )
        return claims

    except jwt.ExpiredSignatureError:
        raise ValueError("Apple token has expired")
    except jwt.InvalidAudienceError:
        raise ValueError("Apple token audience does not match this app")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Apple token is invalid: {e}")
```

### Step 3.4 — Rewrite `SocialAuthSerializer`

The current serializer:
- Accepts `access_token` (wrong name)
- Accepts `user_info` as a free-form client-supplied dict (security hole — client controls claimed identity)
- Allows `facebook` as a provider choice (not being implemented)

Replace it:

```python
class SocialAuthSerializer(serializers.Serializer):
    # which provider the user chose
    provider = serializers.ChoiceField(choices=['google', 'apple'])
    # the raw ID token string issued by Google or Apple — this is what Django will verify
    id_token = serializers.CharField(required=True)
    # Apple-only: name is only sent on first sign-in; client must forward it if present
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name  = serializers.CharField(required=False, allow_blank=True, default='')
```

**Why remove `user_info`?** Because the server must extract user identity from the *verified token*, not from whatever the client claims. Keeping `user_info` as a client-supplied field is the vulnerability.

### Step 3.5 — Rewrite `SocialAuthView`

Replace the current view body entirely:

```python
class SocialAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .social_auth import verify_google_id_token, verify_apple_id_token

        serializer = SocialAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        provider   = serializer.validated_data['provider']
        raw_token  = serializer.validated_data['id_token']
        first_name = serializer.validated_data.get('first_name', '')
        last_name  = serializer.validated_data.get('last_name', '')

        # step 1: verify the ID token cryptographically with the provider
        # this is the critical security step the old view was missing
        try:
            if provider == 'google':
                claims = verify_google_id_token(raw_token)
            else:  # apple
                claims = verify_apple_id_token(raw_token)
        except ValueError as e:
            return Response({'error': str(e)}, status=401)

        # 'sub' is the stable, unique user ID at this provider — never changes
        provider_user_id = claims['sub']
        email            = claims.get('email', '')
        email_verified   = claims.get('email_verified', False)

        # step 2: email conflict check — prevents silent account takeover
        # if 'bob@gmail.com' already exists as an email/password account,
        # a Google login with the same address should NOT silently merge
        if email:
            conflict = CustomUser.objects.filter(
                email=email
            ).exclude(auth_provider=provider).first()
            if conflict:
                return Response({
                    'error': 'account_conflict',
                    'message': (
                        f'An account with this email already exists using '
                        f'{conflict.auth_provider}. Please sign in with that method.'
                    ),
                }, status=409)

        # step 3: find existing user or create new one
        # 'defaults' is only used when creating — get_or_create won't overwrite existing rows
        user, created = CustomUser.objects.get_or_create(
            auth_provider=provider,
            auth_provider_id=provider_user_id,
            defaults={
                'email': email,
                'first_name': claims.get('given_name', first_name),
                'last_name':  claims.get('family_name', last_name),
                'avatar_url': claims.get('picture', None),
                'is_email_verified': email_verified,
            }
        )

        # step 4: issue DailyFlo JWTs — same function used for email/password login
        tokens = get_tokens_for_user(user)
        return Response({
            'message': f'Authenticated with {provider}',
            'tokens': tokens,
            'user': UserProfileSerializer(user).data,
            'is_new_user': created,
        }, status=200)
```

---

## 4 — Step-by-step: Frontend

### Step 4.1 — Install missing packages

```bash
# from frontend/dailyflo/
npx expo install expo-auth-session expo-apple-authentication
```

`expo-web-browser` is already in `package.json` — no change needed. `expo-auth-session` uses it internally.

| Package | Why |
|---------|-----|
| `expo-auth-session` | Manages the OAuth browser redirect flow for Google; generates the redirect URI; handles the deep link callback |
| `expo-apple-authentication` | Apple's native sign-in UI (a required native button, not a web redirect) |

> **Critical:** Neither package works in Expo Go. You need `npx expo run:ios` or `npx expo run:android` to build a development client. Plan for this before you start.

### Step 4.2 — Configure `app.json`

The scheme (`dailyflo://`) is the deep link the browser redirects to after the user signs in with Google. Without this, the OAuth redirect has nowhere to return.

```json
{
  "expo": {
    "scheme": "dailyflo",
    "ios": {
      "bundleIdentifier": "com.yourteam.dailyflo",
      "usesAppleSignIn": true,
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "com.yourteam.dailyflo",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-apple-authentication"
    ]
  }
}
```

### Step 4.3 — Developer portal setup: Google

Must be done before writing any code.

1. Google Cloud Console → create/select project
2. APIs & Services → OAuth consent screen → fill in app details
3. Credentials → Create OAuth 2.0 Client ID:
   - **iOS**: select "iOS", enter bundle ID, copy the reversed client ID (used in `app.json`)
   - **Android**: select "Android", enter package name + SHA-1 fingerprint of your signing key
4. Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) → place at project root
5. Store the client ID in `.env` as `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` (Django server)

### Step 4.4 — Developer portal setup: Apple

1. [developer.apple.com](https://developer.apple.com) → Certificates, IDs & Profiles → Identifiers
2. Find your App ID (or create one) → edit → enable "Sign In with Apple"
3. Keys → create a new key → enable "Sign In with Apple" → download the `.p8` file
4. Note: **Team ID** (top-right of portal), **Key ID** (shown after key creation), **Client ID** (your bundle ID)
5. Store on Django server: `APPLE_TEAM_ID`, `APPLE_CLIENT_ID`, `APPLE_KEY_ID`; keep the `.p8` file on server only — **never commit it**

### Step 4.5 — Create `services/auth/socialAuth.ts`

This is a new file. It contains the two functions that open the sign-in flow for each provider and return a verified ID token to hand to Redux.

```typescript
/**
 * Social Authentication Service
 *
 * Google flow: opens a browser via expo-auth-session → user signs in →
 * browser redirects back to app via deep link → we receive the ID token
 *
 * Apple flow: calls Apple's native SDK via expo-apple-authentication →
 * native system popup (no browser) → we receive the identity token
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// required: tells expo-auth-session to dismiss the browser if the redirect already happened
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID  = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;
// makeRedirectUri builds the correct deep link for the current environment
// e.g. dailyflo://  (in a dev build on device)
const GOOGLE_REDIRECT   = AuthSession.makeRedirectUri({ scheme: 'dailyflo' });


/**
 * Open Google sign-in and return the raw ID token.
 * 'discovery' is the OIDC discovery document — call useAutoDiscovery at component level
 * and pass the result here so this function stays non-hook-like.
 */
export async function triggerGoogleSignIn(
    discovery: AuthSession.DiscoveryDocument | null
): Promise<{ idToken: string }> {
    if (!discovery) throw new Error('Google discovery not ready');

    const request = new AuthSession.AuthRequest({
        clientId:     GOOGLE_CLIENT_ID,
        scopes:       ['openid', 'profile', 'email'],
        redirectUri:  GOOGLE_REDIRECT,
        // ResponseType.IdToken requests an ID token directly, not an auth code
        responseType: AuthSession.ResponseType.IdToken,
    });

    const result = await request.promptAsync(discovery);

    if (result.type !== 'success') {
        throw new Error('Google sign-in was cancelled or failed');
    }

    const idToken = result.params.id_token;
    if (!idToken) throw new Error('No ID token received from Google');

    return { idToken };
}


/**
 * Open Apple sign-in and return the raw identity token and any name data.
 * Apple only provides name on the very first authorization — never again.
 */
export async function triggerAppleSignIn(): Promise<{
    idToken:   string;
    firstName: string;
    lastName:  string;
}> {
    const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
    });

    if (!credential.identityToken) throw new Error('No identity token received from Apple');

    return {
        idToken:   credential.identityToken,
        firstName: credential.fullName?.givenName  ?? '',
        lastName:  credential.fullName?.familyName ?? '',
    };
}
```

### Step 4.6 — Rewrite the `socialAuth` Redux thunk

The current thunk in `store/slices/auth/authSlice.ts` is entirely mocked — it never calls the API. Replace the body:

```typescript
export const socialAuth = createAsyncThunk(
    'auth/socialAuth',
    async (
        payload: { provider: 'google' | 'apple'; idToken: string; firstName?: string; lastName?: string },
        { rejectWithValue }
    ) => {
        try {
            // send the raw ID token to Django for server-side cryptographic verification
            // Django calls verify_google_id_token or verify_apple_id_token depending on provider
            const response = await authApiService.socialLogin({
                provider:   payload.provider,
                id_token:   payload.idToken,
                first_name: payload.firstName ?? '',
                last_name:  payload.lastName  ?? '',
            });

            const accessToken  = response.tokens?.access;
            const refreshToken = response.tokens?.refresh;
            const user         = response.user;

            if (!accessToken || !refreshToken) throw new Error('Tokens not received from server');

            // store tokens exactly as email/password login does
            await storeAccessToken(accessToken);
            await storeRefreshToken(refreshToken);
            const expiryTime = Date.now() + (15 * 60 * 1000);
            await storeTokenExpiry(expiryTime);

            return {
                user:      transformApiUserToUser(user),
                accessToken,
                refreshToken,
                expiresAt: new Date(expiryTime),
                isNewUser: response.is_new_user ?? false,
            };
        } catch (error: any) {
            // handle the 409 conflict case from the backend
            if (error.response?.status === 409) {
                return rejectWithValue({
                    code:    'account_conflict',
                    message: error.response.data.message,
                });
            }
            return rejectWithValue(error.message ?? 'Social authentication failed');
        }
    }
);
```

Note: `transformApiUserToUser` is already defined in `authSlice.ts` — reuse it as-is.

### Step 4.7 — Build the UI buttons

**Apple** — must use `AppleAuthentication.AppleAuthenticationButton`. Using your own custom button is an App Store rejection reason.

**Google** — can use any custom button. Use `AuthSession.useAutoDiscovery('https://accounts.google.com')` at the component level to get the discovery document, then pass it to `triggerGoogleSignIn`.

---

## 5 — Edge cases and how to handle each

### Case A — User already registered with email/password, tries Google with same email

Django's `SocialAuthView` returns HTTP 409 with `{ error: 'account_conflict', message: '...' }`. The Redux thunk catches the 409 and calls `rejectWithValue`. Your UI should show: *"An account with this email exists. Sign in with email and password instead."*

### Case B — Apple hides the real email (private relay)

The email in the ID token looks like `abc123@privaterelay.appleid.com`. This is expected and valid — accept it, store it. `sub` (Apple user ID) is your reliable unique key, not email.

### Case C — Apple name only on first sign-in

On the first authorization Apple sends `fullName.givenName` and `fullName.familyName` in the credential object. After that, those fields are `null`. Your `get_or_create` in Django handles this correctly — the `defaults` dict only applies when creating a new row.

**Frontend implication:** your UI buttons must forward `firstName` and `lastName` from the Apple credential to the Django payload on every sign-in attempt — Django will ignore them for returning users (field already set in DB) but needs them for new users.

### Case D — User deletes app, reinstalls, signs in with Apple again

Apple sends the same `sub` value. `get_or_create` finds the existing user. Works correctly.

### Case E — User revokes app access in Apple/Google settings

The ID token issued after revocation fails verification. Django returns 401. User sees a failed login — expected. No special handling needed.

### Case F — Account linking (add Google to an existing email/password account)

Out of scope for initial launch. Design: a separate authenticated POST `/accounts/auth/link/` endpoint that verifies the new provider token, checks no conflict, then updates `auth_provider`/`auth_provider_id` on the existing user. Do not implement until the basic flow is solid.

---

## 6 — Modern engineering practices applied here

### 6.1 — Environment variables, never hardcoded secrets

Google Client ID and Apple credentials must be in environment variables:
- Frontend: prefix with `EXPO_PUBLIC_` for values bundled into the app (these are visible to users — only put non-secret values here)
- Backend: standard OS env vars or a `.env` file loaded by `python-decouple` or `django-environ` (never commit these)
- The Apple `.p8` private key file must never be committed to git — add it to `.gitignore`

### 6.2 — Separation of concerns in `social_auth.py`

Token verification functions have no Django ORM or HTTP dependencies beyond fetching public keys. This makes them:
- **Unit-testable** without a running Django server or database
- **Easy to swap** — replace the Google library with a different one by changing one function

### 6.3 — Dev build required — plan for it from day one

`expo-apple-authentication` and the Google OAuth redirect **do not work in Expo Go**. This is a hard constraint. Every developer needs:

```bash
npx expo run:ios    # builds and installs a dev client on simulator or physical device
npx expo run:android
```

Physical iOS device required for Apple Sign In (simulator may work but is not guaranteed for biometric confirmation prompts).

### 6.4 — `SIMPLE_JWT` config matters for security

Without the config block, Django Simple JWT defaults to 5-minute access + 1-day refresh, no rotation, no blacklist. With the config in Step 3.2: 15-minute access + 30-day refresh + rotation + blacklist. The blacklist means logout actually invalidates the session server-side.

### 6.5 — Remove development-only response data before production

`PasswordResetRequestView` currently returns `reset_token` and `uid` in the response body. This is intentional for development (so you can test without email) but must be removed before any user-facing deployment.

---

## 7 — Testing plan

| What | How |
|------|-----|
| `verify_google_id_token` | Unit test: use Google's OAuth 2.0 Playground to generate a real test token; mock `google_requests.Request()` for CI |
| `verify_apple_id_token` | Unit test: generate a test JWT signed by a local RSA key pair matching the JWKS format; mock `_fetch_apple_public_keys` |
| `SocialAuthView` — conflict case | Seed an email/password user; POST with same email + Google provider → expect 409 |
| `SocialAuthView` — new user | POST a valid verified token → expect 200, `is_new_user: true`, DailyFlo tokens |
| `SocialAuthView` — returning user | POST the same token again → expect 200, `is_new_user: false`, same user |
| `socialAuth` Redux thunk | Mock `authApiService.socialLogin`; check SecureStore writes, Redux state update |
| End-to-end Google | Physical device or simulator with dev build; test full browser redirect → app → tabs |
| End-to-end Apple | Physical iOS device with dev build |

---

## 8 — Recommended implementation order

Start backend and prove it works in isolation before writing any mobile UI.

| Phase | Task |
|-------|------|
| 1 | `pip install google-auth cryptography requests` + update `requirements.txt` |
| 2 | Add `SIMPLE_JWT` config + `token_blacklist` to `INSTALLED_APPS` + `python manage.py migrate` |
| 3 | Write `social_auth.py` verification functions |
| 4 | Write unit tests for both verification functions |
| 5 | Rewrite `SocialAuthSerializer` (rename `access_token` → `id_token`, remove `user_info`) |
| 6 | Rewrite `SocialAuthView` |
| 7 | Test Django endpoints with Postman using real ID tokens from each provider |
| 8 | `npx expo install expo-auth-session expo-apple-authentication` |
| 9 | Configure `app.json` scheme + `usesAppleSignIn` + plugin |
| 10 | Google Cloud Console + Apple Developer Portal setup |
| 11 | Create `services/auth/socialAuth.ts` |
| 12 | Rewrite `socialAuth` Redux thunk |
| 13 | Build UI buttons (Apple native, Google custom) |
| 14 | End-to-end test on physical device |

---

## 9 — Complete file change list

| File | Change |
|------|--------|
| `backend/dailyflo/requirements.txt` | Add `google-auth`, `cryptography`, `requests` |
| `backend/dailyflo/config/settings.py` | Add `SIMPLE_JWT` block, `GOOGLE_CLIENT_ID`, Apple env var references; add `rest_framework_simplejwt.token_blacklist` to `INSTALLED_APPS` |
| `backend/dailyflo/apps/accounts/social_auth.py` | **New file** — `verify_google_id_token`, `verify_apple_id_token` |
| `backend/dailyflo/apps/accounts/serializers.py` | Replace `SocialAuthSerializer` (rename field, remove `user_info`) |
| `backend/dailyflo/apps/accounts/views.py` | Replace `SocialAuthView` body; also note `PasswordResetRequestView` leaks token in response — fix before production |
| `frontend/dailyflo/package.json` | Add `expo-auth-session`, `expo-apple-authentication` |
| `frontend/dailyflo/app.json` | Add `scheme`, `usesAppleSignIn: true`, `expo-apple-authentication` plugin |
| `frontend/dailyflo/services/auth/socialAuth.ts` | **New file** — `triggerGoogleSignIn`, `triggerAppleSignIn` |
| `frontend/dailyflo/store/slices/auth/authSlice.ts` | Replace mock `socialAuth` thunk with real implementation |

### Files confirmed NOT needing changes for social auth

| File | Why untouched |
|------|---------------|
| `apps/accounts/models.py` | `CustomUser` is fully ready — `auth_provider`, `auth_provider_id`, constraints, `set_unusable_password` all correct |
| `apps/accounts/urls.py` | Route already exists at `POST /accounts/auth/social/` |
| `services/auth/tokenStorage.ts` | Provider-agnostic; social auth writes to same keys as email login |
| `services/api/client.ts` | Interceptors are provider-agnostic |
| `services/api/auth.ts` — `socialLogin` | HTTP call is correct; just needs correct payload keys |
| `app/_layout.tsx` | Routing gate works for any auth method |

### Dead code to be aware of (not blocking, but cleanup recommended)

| File | Status |
|------|--------|
| `services/auth/AuthService.ts` | Unused — imports `../storage/SecureStorage` which is a different abstraction from the active `tokenStorage.ts` path |
| `services/auth/TokenManager.ts` | Unused — same issue |

These files do not cause breakage but add confusion. Removing or replacing them with redirects to `tokenStorage.ts` is a separate cleanup task.

---

## 10 — Out of scope for this plan

- **Facebook** — the model and original serializer both list it as a choice; leave it in the model but remove from the rewritten serializer until there is an actual plan to implement it
- **Account linking UI** — merging a Google account with an existing email/password account
- **Server-side Apple secret generation** — required for Apple's web-based OAuth flow; not needed for native app
- **Email verification / password reset** — both views have `# TODO` markers; separate work item

---

*Codebase audit performed Apr 2026. All file paths, existing stubs, package versions, and gaps confirmed by reading the live files before writing this plan.*
