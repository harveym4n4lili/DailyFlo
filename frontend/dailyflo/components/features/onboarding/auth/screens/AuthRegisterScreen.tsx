/**
 * onboarding email sign-up formSheet — dispatch `registerUser` then push questionnaire slides.
 */

import React, { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';

import { completeOnboardingEmailAuth } from '../hooks/completeOnboardingEmailAuth';
import {
  AUTH_EMAIL_FORM_EMAIL_PLACEHOLDER,
  AUTH_EMAIL_FORM_FIRST_NAME_PLACEHOLDER,
  AUTH_EMAIL_FORM_LAST_NAME_PLACEHOLDER,
  AUTH_EMAIL_FORM_PASSWORD_PLACEHOLDER,
  AUTH_EMAIL_REGISTER_SHEET_TITLE,
  AUTH_EMAIL_REGISTER_SUBMIT_LABEL,
  AUTH_EMAIL_SHEET_CANCEL_LABEL,
} from '../constants/textValues';
import { AuthEmailFormShell } from '../ui/AuthEmailFormShell';
import { AuthGlassTextField } from '../ui/AuthGlassTextField';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser } from '@/store/slices/auth/authSlice';

const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;

export function AuthRegisterScreen() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const dispatch = useAppDispatch();
  const isRegistering = useAppSelector((s) => s.auth.isRegistering);
  const registerError = useAppSelector((s) => s.auth.registerError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !password) return;
    try {
      // register creates user row + tokens; redux persists refresh like oauth paths
      await dispatch(
        registerUser({
          email: trimmed,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      ).unwrap();
      completeOnboardingEmailAuth(router);
    } catch {
      // thunk maps django validation into registerError string
    }
  }, [dispatch, email, firstName, lastName, password, router]);

  const containerBg = useLiquidGlass ? 'transparent' : themeColors.background.secondary();

  return (
    <View style={{ flex: 1, backgroundColor: containerBg }}>
      <AuthEmailFormShell
        title={AUTH_EMAIL_REGISTER_SHEET_TITLE}
        cancelLabel={AUTH_EMAIL_SHEET_CANCEL_LABEL}
        onCancel={handleCancel}
        submitLabel={AUTH_EMAIL_REGISTER_SUBMIT_LABEL}
        onSubmit={() => void handleSubmit()}
        submitDisabled={!email.trim() || !password || isRegistering}
        submitting={isRegistering}
        errorText={registerError}
      >
        <AuthGlassTextField
          placeholder={AUTH_EMAIL_FORM_FIRST_NAME_PLACEHOLDER}
          value={firstName}
          onChangeText={setFirstName}
          textContentType="givenName"
          autoComplete="name-given"
        />
        <AuthGlassTextField
          placeholder={AUTH_EMAIL_FORM_LAST_NAME_PLACEHOLDER}
          value={lastName}
          onChangeText={setLastName}
          textContentType="familyName"
          autoComplete="name-family"
        />
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
          textContentType="newPassword"
          autoComplete="password-new"
        />
      </AuthEmailFormShell>
    </View>
  );
}
