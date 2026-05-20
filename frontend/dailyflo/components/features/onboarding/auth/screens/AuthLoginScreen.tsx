/**
 * onboarding email login formSheet — dispatch `loginUser` then push questionnaire slides.
 */

import React, { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';

import { completeOnboardingEmailAuth } from '../hooks/completeOnboardingEmailAuth';
import {
  AUTH_EMAIL_FORM_EMAIL_PLACEHOLDER,
  AUTH_EMAIL_FORM_PASSWORD_PLACEHOLDER,
  AUTH_EMAIL_LOGIN_SHEET_TITLE,
  AUTH_EMAIL_LOGIN_SUBMIT_LABEL,
  AUTH_EMAIL_SHEET_CANCEL_LABEL,
} from '../constants/textValues';
import { AuthEmailFormShell } from '../ui/AuthEmailFormShell';
import { AuthGlassTextField } from '../ui/AuthGlassTextField';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser } from '@/store/slices/auth/authSlice';

const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;

export function AuthLoginScreen() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const dispatch = useAppDispatch();
  const isLoggingIn = useAppSelector((s) => s.auth.isLoggingIn);
  const loginError = useAppSelector((s) => s.auth.loginError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !password) return;
    try {
      // thunk posts to django login, stores jwts in SecureStore, may fetch profile — same session as social
      await dispatch(loginUser({ email: trimmed, password })).unwrap();
      completeOnboardingEmailAuth(router);
    } catch {
      // redux thunk stores readable message on `loginError`
    }
  }, [dispatch, email, password, router]);

  const containerBg = useLiquidGlass ? 'transparent' : themeColors.background.secondary();

  return (
    <View style={{ flex: 1, backgroundColor: containerBg }}>
      <AuthEmailFormShell
        title={AUTH_EMAIL_LOGIN_SHEET_TITLE}
        cancelLabel={AUTH_EMAIL_SHEET_CANCEL_LABEL}
        onCancel={handleCancel}
        submitLabel={AUTH_EMAIL_LOGIN_SUBMIT_LABEL}
        onSubmit={() => void handleSubmit()}
        submitDisabled={!email.trim() || !password || isLoggingIn}
        submitting={isLoggingIn}
        errorText={loginError}
      >
        <AuthGlassTextField
          placeholder={AUTH_EMAIL_FORM_EMAIL_PLACEHOLDER}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <AuthGlassTextField
          placeholder={AUTH_EMAIL_FORM_PASSWORD_PLACEHOLDER}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
        />
      </AuthEmailFormShell>
    </View>
  );
}
