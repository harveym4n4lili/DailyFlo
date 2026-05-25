/**
 * google sign-in on the onboarding auth landing screen (native ios/android).
 *
 * flow:
 * 1. user taps the row → `triggerGoogleSignIn` runs **GoogleSignin.signIn()** (native ui — not expo-auth-session / custom scheme redirect).
 * 2. we read `id_token` (from user object or `getTokens()`), then `completeOnboardingSocialSignIn` → django `/accounts/auth/social/`.
 * 3. `socialAuth` stores DailyFlo access + refresh in SecureStore; cold start uses refresh via `checkAuthStatus` (same as apple).
 *
 * requires a **development/production build** with `@react-native-google-signin/google-signin` + `app.json` plugin — not Expo Go.
 */

import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { triggerGoogleSignIn } from '@/services/auth/socialAuth';
import { useAppDispatch } from '@/store';

import { completeOnboardingSocialSignIn } from './completeOnboardingSocialSignIn';

function unwrapSocialAuthError(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Sign in failed. Please try again.';
}

export function useGoogleAuthOnboarding() {
  const dispatch = useAppDispatch();
  const router = useGuardedRouter();
  const [busy, setBusy] = useState(false);

  // web: no native module; ios/android: ready (configure runs on first sign-in)
  const googleReady = Platform.OS !== 'web';

  const onGooglePress = useCallback(async () => {
    if (!googleReady || busy) return;
    setBusy(true);
    try {
      const { idToken } = await triggerGoogleSignIn();
      await completeOnboardingSocialSignIn(dispatch, router, { provider: 'google', idToken });
    } catch (err: unknown) {
      const msg = unwrapSocialAuthError(err);
      if (msg.toLowerCase().includes('cancel')) {
        return;
      }
      Alert.alert("Couldn't sign in with Google", msg || 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, [busy, dispatch, googleReady, router]);

  return { onGooglePress, googleBusy: busy, googleReady };
}
