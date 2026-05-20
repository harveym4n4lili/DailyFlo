/**
 * apple sign-in on the onboarding auth landing screen (ios only).
 *
 * flow:
 * 1. user taps the row → `triggerAppleSignIn` runs Apple's system sheet (Face ID / Apple ID).
 * 2. we read `identityToken` (+ optional name on first sign-in), dispatch `socialAuth` → django `/accounts/auth/social/`.
 * 3. on success we `router.push` questionnaire slides — same path as google.
 *
 * requires a **development/production build** with `expo-apple-authentication` + `usesAppleSignIn` in `app.json` — not available on android/web.
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { triggerAppleSignIn } from '@/services/auth/socialAuth';
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

/** apple's native module uses this code when the user dismisses the sheet */
function isAppleSignInCancelled(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    return (err as { code: string }).code === 'ERR_REQUEST_CANCELED';
  }
  return unwrapSocialAuthError(err).toLowerCase().includes('cancel');
}

export function useAppleAuthOnboarding() {
  const dispatch = useAppDispatch();
  const router = useGuardedRouter();
  const [busy, setBusy] = useState(false);
  const [appleReady, setAppleReady] = useState(false);

  // sign in with apple only exists on ios 13+; hide the row when the native api is unavailable
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setAppleReady(false);
      return;
    }
    let cancelled = false;
    void AppleAuthentication.isAvailableAsync().then((available) => {
      if (!cancelled) setAppleReady(available);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onApplePress = useCallback(async () => {
    if (!appleReady || busy) return;
    setBusy(true);
    try {
      const { idToken, firstName, lastName } = await triggerAppleSignIn();
      await dispatch(
        socialAuth({
          provider: 'apple',
          idToken,
          firstName,
          lastName,
        }),
      ).unwrap();
      router.push(SLIDES_HREF);
    } catch (err: unknown) {
      if (isAppleSignInCancelled(err)) {
        return;
      }
      const msg = unwrapSocialAuthError(err);
      Alert.alert("Couldn't sign in with Apple", msg || 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, [appleReady, busy, dispatch, router]);

  return { onApplePress, appleBusy: busy, appleReady };
}
