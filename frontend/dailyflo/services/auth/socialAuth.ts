/**
 * Social login triggers — apple uses expo-apple-authentication; google uses **native** `@react-native-google-signin/google-signin`
 * (needs a dev/EAS build with the config plugin — not Expo Go). Both return an identity **id_token** jwt that django verifies.
 * Redux `socialAuth` thunk posts that token to `/accounts/auth/social/`.
 */

// Apple's expo wrapper around ios native apis — opens system ui, returns jwt + optional name once.
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  isCancelledResponse,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

/**
 * Reads `frontend/dailyflo/.env` at bundle time (`EXPO_PUBLIC_*`).
 * Use the **DailyFlo iOS** OAuth client id from Google Cloud — must match django `GOOGLE_CLIENT_ID` (jwt `aud`).
 * If unset, `GoogleService-Info.plist` (via `ios.googleServicesFile` + prebuild) still supplies the iOS client for the native sdk.
 */
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

let googleNativeConfigureOnce = false;

/**
 * Tell the native Google sdk which app/keys to use — safe to call once per app lifetime.
 */
function ensureGoogleNativeConfigured(): void {
  if (googleNativeConfigureOnce) return;
  GoogleSignin.configure({
    // explicit ios client keeps local/dev parity when plist is missing from the repo
    ...(googleIosClientId ? { iosClientId: googleIosClientId } : {}),
    offlineAccess: false,
  });
  googleNativeConfigureOnce = true;
}

/**
 * Native google sign-in sheet → returns **id_token** for django (`SocialAuthView`).
 * On iOS the token’s `aud` is the **iOS** OAuth client when that’s what you configured above / in plist.
 */
export async function triggerGoogleSignIn(): Promise<{ idToken: string }> {
  if (Platform.OS === 'web') {
    throw new Error('Google Sign-In is not available on web in DailyFlo');
  }

  ensureGoogleNativeConfigured();

  // android: play services must exist before the modal; ios: resolves immediately
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();

  if (isCancelledResponse(response)) {
    throw new Error('Google sign-in was cancelled');
  }
  if (!isSuccessResponse(response)) {
    throw new Error('Google sign-in failed');
  }

  // sometimes `user.idToken` is null until you call `getTokens()` — both paths yield the same jwt django needs
  let idToken = response.data.idToken;
  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    idToken = tokens.idToken;
  }
  if (!idToken) {
    throw new Error('No ID token received from Google');
  }

  return { idToken };
}

/**
 * Native apple flow — no google-style native module; apple ids are tied to your app's bundle id / services id on backend.
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
