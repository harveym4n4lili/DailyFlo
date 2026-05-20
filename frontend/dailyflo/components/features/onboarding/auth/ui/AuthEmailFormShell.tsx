/**
 * shared chrome for onboarding email login/register formSheets —
 * mirrors settings schedule picker rhythm: transparent ios fill, padded scroll, cancel + primary action.
 */

import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSemanticColors, useThemeColors } from '@/hooks/useColorPalette';
import { getTypographyStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

export type AuthEmailFormShellProps = {
  title: string;
  cancelLabel: string;
  onCancel: () => void;
  submitLabel: string;
  onSubmit: () => void;
  submitDisabled?: boolean;
  submitting?: boolean;
  errorText?: string | null;
  children: React.ReactNode;
};

export function AuthEmailFormShell({
  title,
  cancelLabel,
  onCancel,
  submitLabel,
  onSubmit,
  submitDisabled,
  submitting,
  errorText,
  children,
}: AuthEmailFormShellProps) {
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';

  const scrollPaddingTop = Paddings.screen + Paddings.groupedListHeaderContentGap;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: 'transparent' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: scrollPaddingTop,
            paddingBottom: insets.bottom + Paddings.modalBottomExtra,
            paddingHorizontal: Paddings.screen + Paddings.touchTargetSmall,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text
              style={[
                getTypographyStyle('body-medium', typographyPlatform),
                { color: themeColors.text.secondary() },
              ]}
            >
              {cancelLabel}
            </Text>
          </Pressable>
        </View>

        <Text
          accessibilityRole="header"
          accessibilityLabel={title}
          style={[
            styles.title,
            getTypographyStyle('heading-3', typographyPlatform),
            { color: themeColors.text.primary() },
          ]}
        >
          {title}
        </Text>

        <View style={styles.fieldStack}>{children}</View>

        {errorText ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.errorText,
              getTypographyStyle('body-medium', typographyPlatform),
              { color: semanticColors.error() },
            ]}
          >
            {errorText}
          </Text>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={submitDisabled || submitting}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          style={({ pressed }) => [
            styles.submitOuter,
            {
              backgroundColor: themeColors.background.primarySecondaryBlend(),
              opacity: submitDisabled || submitting ? 0.5 : pressed ? 0.92 : 1,
            },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={themeColors.text.primary()} />
          ) : (
            <Text
              style={[
                getTypographyStyle('button-secondary', typographyPlatform),
                { color: themeColors.text.primary(), textAlign: 'center' },
              ]}
            >
              {submitLabel}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  topRow: {
    alignSelf: 'flex-start',
    marginBottom: Paddings.touchTargetSmall,
  },
  title: {
    marginBottom: Paddings.sectionCompact,
  },
  fieldStack: {
    gap: Paddings.listItemVertical,
    marginBottom: Paddings.listItemVertical,
  },
  errorText: {
    marginBottom: Paddings.listItemVertical,
  },
  submitOuter: {
    minHeight: 52,
    borderRadius: Paddings.continueButtonRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Paddings.onboardingContinueButtonPaddingVertical,
    paddingHorizontal: Paddings.onboardingContinueButtonPaddingHorizontal,
  },
});
