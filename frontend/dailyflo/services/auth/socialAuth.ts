/**
 * Social login triggers — google uses oauth via browser + redirect back into the app;
 * apple uses the native sign-in-with-apple sheet. Both return a jwt **identity/id token**
 * string your backend verifies (`social_auth.py`). Redux thunk sends that token to django —
 * same payload shape you tested with postman.
 */

// Apple's expo wrapper around ios native apis — opens system ui, returns jwt + optional name once.
import * as AppleAuthentication from 'expo-apple-authentication';
// Google's oauth/openid flow in react native — builds redirect uri, runs browser prompt, parses tokens.
import * as AuthSession from 'expo-auth-session';
// Opens oauth in an in-app browser tab — expo-auth-session relies on this for the redirect handshake.
import * as WebBrowser from 'expo-web-browser';

/**
 * Run once when this module loads. After google redirects to dailyflo://... with oauth params,
 * this finishes closing the browser tab so the user lands cleanly back in the app.
 * Required pairing when using `promptAsync` (see expo-auth-session docs).
 */
WebBrowser.maybeCompleteAuthSession();

/**
 * Reads `frontend/dailyflo/.env` at **bundle/build time** (only vars prefixed `EXPO_PUBLIC_`).
 * Same oauth client id as google cloud console (typically ios bundle client's id string when signing in from app).
 * Matches django `GOOGLE_CLIENT_ID` for verifying tokens minted for **this** audience.
 */
const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Where google may redirect after login — computed per platform by expo-auth-session.
 * Uses `scheme: 'dailyflo'` which must match `expo.scheme` in app.json so the os routes the callback to dailyflo.
 * You must register this exact uri (or list variants) as an **authorized redirect uri** on that google oauth client.
 */
const googleRedirectUri = AuthSession.makeRedirectUri({ scheme: 'dailyflo' });

/**
 * Opens google sign-in and resolves with the raw **openid id_token** jwt string.
 *
 * @param discovery — OIDC discovery doc usually from `AuthSession.useAutoDiscovery('https://accounts.google.com')`
 *   in the screen component; describes authorize/token endpoints google exposes. Passed in so this file stays a plain
 *   async helper (no hooks inside).
 */
export async function triggerGoogleSignIn(
  discovery: AuthSession.DiscoveryDocument | null
): Promise<{ idToken: string }> {
  if (!discovery) {
    throw new Error('Google discovery not ready');
  }
  if (!googleClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set');
  }

  /**
   * AuthRequest config object — describes **one** oauth authorization request to google:
   * - clientId: which google cloud oauth client this login is for (must match token `aud` django checks).
   * - scopes: openid issues id_token; profile/email ask for standard claims inside it.
   * - redirectUri: must match an allowed redirect uri on that client (see `googleRedirectUri` above).
   * - responseType IdToken: implicit-style response — google returns id_token in redirect params (what we need for django).
   */
  const request = new AuthSession.AuthRequest({
    clientId: googleClientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: googleRedirectUri,
    responseType: AuthSession.ResponseType.IdToken,
  });

  /**
   * Opens browser / ASWebAuthenticationSession; user signs in on google; redirect hits app with fragment/query params.
   * Result union: `success` includes `params` (oauth fields); `cancel`, `error`, etc. otherwise.
   */
  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    throw new Error('Google sign-in was cancelled or failed');
  }

  /**
   * On success, google passes tokens as string keys on `params` (OAuth2 implicit-style).
   * `id_token` is the jwt string django's `verify_google_id_token` validates.
   */
  const idToken =
    typeof result.params.id_token === 'string' ? result.params.id_token : undefined;

  if (!idToken) {
    throw new Error('No ID token received from Google');
  }

  return { idToken };
}

/**
 * Native apple flow — no google-style discovery doc; apple ids are tied to your app's bundle id / services id on backend.
 * Returns identity jwt plus optional name fields (apple only sends full name on **first** authorization).
 */
export async function triggerAppleSignIn(): Promise<{
  idToken: string;
  firstName: string;
  lastName: string;
}> {
  /**
   * `signInAsync` arguments — requestedScopes tells apple what user may share:
   * FULL_NAME / EMAIL map to apple's credential payload (still optional per user privacy choices).
   */
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  /**
   * credential.identityToken — jwt from apple (django verifies with apple jwks + `APPLE_CLIENT_ID`).
   * credential.fullName — only populated on first successful sign-in for many users; forwarded so django can fill user row on create.
   */
  if (!credential.identityToken) {
    throw new Error('No identity token received from Apple');
  }

  return {
    idToken: credential.identityToken,
    firstName: credential.fullName?.givenName ?? '',
    lastName: credential.fullName?.familyName ?? '',
  };
}
