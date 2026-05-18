/**
 * google sign-in on the onboarding auth landing screen (native ios/android).
 *
 * flow:
 * 1. user taps the row → `triggerGoogleSignIn` runs **GoogleSignin.signIn()** (native ui — not expo-auth-session / custom scheme redirect).
 * 2. we read `id_token` (from user object or `getTokens()`), then dispatch `socialAuth` → django `/accounts/auth/social/`; thunk stores DailyFlo jwts in SecureStore like email login.
 * 3. on success we `router.push` questionnaire slides — authenticated before onboarding per product rules.
 *
 * requires a **development/production build** with `@react-native-google-signin/google-signin` + `app.json` plugin — not Expo Go.
 */

import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { triggerGoogleSignIn } from '@/services/auth/socialAuth';
import { useAppDispatch } from '@/store';
import { socialAuth } from '@/store/slices/auth/authSlice';

const SLIDES_HREF = '/(onboarding)/slides' as Href;

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
      await dispatch(socialAuth({ provider: 'google', idToken })).unwrap();
      router.push(SLIDES_HREF);
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
