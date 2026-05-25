/**
 * onboarding email sign-up formSheet — dispatch `registerUser` then push questionnaire slides.
 */

import React, { useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { completeOnboardingEmailAuth } from '../hooks/completeOnboardingEmailAuth';
import {
  AUTH_EMAIL_FIELD_LABEL_EMAIL,
  AUTH_EMAIL_FIELD_LABEL_PASSWORD,
  AUTH_EMAIL_FORM_EMAIL_PLACEHOLDER,
  AUTH_EMAIL_FORM_PASSWORD_PLACEHOLDER,
  AUTH_EMAIL_REGISTER_PASSWORD_HINT,
  AUTH_EMAIL_REGISTER_SHEET_TITLE,
  AUTH_EMAIL_REGISTER_SUBMIT_LABEL,
} from '../constants/textValues';
import { AuthEmailFormShell } from '../ui/AuthEmailFormShell';
import { AuthGlassTextField } from '../ui/AuthGlassTextField';

import { getTypographyStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser } from '@/store/slices/auth/authSlice';

const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;

const typographyPlatform =
  Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';

export function AuthRegisterScreen() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const dispatch = useAppDispatch();
  const isRegistering = useAppSelector((s) => s.auth.isRegistering);
  const registerError = useAppSelector((s) => s.auth.registerError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !password) return;
    try {
      // register creates user row + tokens; redux persists refresh like oauth paths
      await dispatch(registerUser({ email: trimmed, password })).unwrap();
      completeOnboardingEmailAuth(router);
    } catch {
      // thunk maps django validation into registerError string
    }
  }, [dispatch, email, password, router]);

  const containerBg = useLiquidGlass ? 'transparent' : themeColors.background.secondary();

  return (
    <View style={{ flex: 1, backgroundColor: containerBg }}>
      <AuthEmailFormShell
        title={AUTH_EMAIL_REGISTER_SHEET_TITLE}
        onCancel={handleCancel}
        submitLabel={AUTH_EMAIL_REGISTER_SUBMIT_LABEL}
        onSubmit={() => void handleSubmit()}
        submitDisabled={!email.trim() || !password || isRegistering}
        submitting={isRegistering}
        errorText={registerError}
      >
        <AuthGlassTextField
          label={AUTH_EMAIL_FIELD_LABEL_EMAIL}
          placeholder={AUTH_EMAIL_FORM_EMAIL_PLACEHOLDER}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <View style={styles.passwordSection}>
          <AuthGlassTextField
            label={AUTH_EMAIL_FIELD_LABEL_PASSWORD}
            placeholder={AUTH_EMAIL_FORM_PASSWORD_PLACEHOLDER}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="password-new"
          />
          <Text
            style={[styles.passwordHint, getTypographyStyle('body-small', typographyPlatform), { color: themeColors.text.tertiary() }]}
          >
            {AUTH_EMAIL_REGISTER_PASSWORD_HINT}
          </Text>
        </View>
      </AuthEmailFormShell>
    </View>
  );
}

const styles = StyleSheet.create({
  // keeps password chrome + validator copy spaced like label→field (touchTarget) without pinching wrapped lines
  passwordSection: {
    gap: Paddings.touchTarget,
  },
  passwordHint: {
    lineHeight: 18,
  },
});
