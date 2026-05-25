/**
 * shared chrome for onboarding email login/register formSheets —
 * matches task formSheet pattern: ScrollView fills the sheet, then overlay header anchors MainCloseButton top-left (RNScreens + native sheet).
 */

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';

import { MainCloseButton } from '@/components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUTH_LANDING_SLIDE_UI } from '../constants/slideUiTokens';
import { resolveIntroContinueButtonPaint } from '../scrollTransition';
import {
  authLandingAuthRowMinHeight,
  authLandingAuthRowPaddingVertical,
  onboardingContinueHitSlop,
} from './AuthLandingGlassAuthRow';
import { ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE } from '../../onboarding/constants/typography';

import { useSemanticColors, useThemeColors } from '@/hooks/useColorPalette';
import { getTypographyStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

/** circular MainCloseButton hit size — keep scroll title below this chrome */
const HEADER_CLOSE_DIAMETER = 42;

function iosMajor(): number {
  if (Platform.OS !== 'ios') return 0;
  const v = Platform.Version as string | number;
  return typeof v === 'string' ? parseInt(v.split('.')[0]!, 10) : Math.floor(v as number);
}

export type AuthEmailFormShellProps = {
  title: string;
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

  // onboard email routes use native formSheet/modal chrome — ios already clears status bar in the presented card; skip `insets.top` here or the close control + scroll title sit oddly low with a tall empty band above
  const closeButtonTop = Paddings.screen;
  const scrollPaddingTop =
    closeButtonTop + HEADER_CLOSE_DIAMETER + Paddings.groupedListHeaderContentGap;

  // same marple fill + muted label pairing as Continue with email (`AUTH_LANDING_SLIDE_UI`)
  const marpleGlassTint = useMemo(
    () => resolveIntroContinueButtonPaint(themeColors, AUTH_LANDING_SLIDE_UI.continueButtonBackground),
    [themeColors],
  );
  const rowLabelTint = useMemo(
    () =>
      resolveIntroContinueButtonPaint(
        themeColors,
        AUTH_LANDING_SLIDE_UI.continueButtonIcon ?? 'primarySecondaryBlend',
      ),
    [themeColors],
  );

  const isLiquidGlassIos = iosMajor() >= 15 && Platform.OS === 'ios';
  const liquidGlassBleed = Paddings.liquidGlassBleed;

  const rowInnerStyle = useMemo(
    () => ({
      width: '100%' as const,
      minHeight: authLandingAuthRowMinHeight,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: authLandingAuthRowPaddingVertical,
      paddingHorizontal: Paddings.onboardingContinueButtonPaddingHorizontal,
      borderRadius: Paddings.continueButtonRadius,
    }),
    [],
  );

  const glassSurfaceStyle = useMemo(
    () =>
      ({
        width: '100%' as const,
        minHeight: authLandingAuthRowMinHeight,
        borderRadius: Paddings.continueButtonRadius,
        overflow: 'visible' as const,
      }) satisfies ViewStyle,
    [],
  );

  const haloWrap: ViewStyle = {
    overflow: 'visible',
    padding: liquidGlassBleed,
    alignSelf: 'stretch',
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: 'transparent' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* collapsable=false: native formSheet stack prefers a predictable header + scroll pair (same idea as TaskScreenContent) */}
      <View style={styles.sheetRoot} collapsable={false}>
        {/* scroll layer first so title/fields scroll; fills sheet when absolute (matches task modal) */}
        <ScrollView
          style={styles.scrollFill}
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

          <View style={styles.formSections}>
            <View style={styles.fieldStack}>{children}</View>

            {errorText ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[
                  getTypographyStyle('body-medium', typographyPlatform),
                  { color: semanticColors.error() },
                ]}
              >
                {errorText}
              </Text>
            ) : null}

            <View style={styles.submitOuter}>
              <View style={haloWrap}>
              {isLiquidGlassIos ? (
                <GlassView
                  style={glassSurfaceStyle}
                  tintColor={marpleGlassTint as any}
                  glassEffectStyle="regular"
                  isInteractive
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={submitLabel}
                    onPress={onSubmit}
                    disabled={submitDisabled || submitting}
                    hitSlop={onboardingContinueHitSlop}
                    style={({ pressed }) => ({
                      ...rowInnerStyle,
                      opacity: submitDisabled || submitting ? 0.5 : pressed ? 0.92 : 1,
                    })}
                  >
                    {submitting ? (
                      <ActivityIndicator color={rowLabelTint} />
                    ) : (
                      <Text style={[ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE, { color: rowLabelTint }]}>
                        {submitLabel}
                      </Text>
                    )}
                  </Pressable>
                </GlassView>
              ) : (
                <View style={[glassSurfaceStyle, { backgroundColor: marpleGlassTint, overflow: 'hidden' }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={submitLabel}
                    onPress={onSubmit}
                    disabled={submitDisabled || submitting}
                    hitSlop={onboardingContinueHitSlop}
                    style={({ pressed }) => ({
                      ...rowInnerStyle,
                      opacity: submitDisabled || submitting ? 0.5 : pressed ? 0.92 : 1,
                    })}
                  >
                    {submitting ? (
                      <ActivityIndicator color={rowLabelTint} />
                    ) : (
                      <Text style={[ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE, { color: rowLabelTint }]}>
                        {submitLabel}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </View>
          </View>
        </ScrollView>

        {/* overlay toolbar: anchored top-left over the sheet (same stack as TaskScreen overflow row / MainCloseButton) */}
        <View style={styles.headerOverlay} collapsable={false} pointerEvents="box-none">
          <MainCloseButton
            onPress={onCancel}
            top={closeButtonTop}
            left={Paddings.screen}
            iconEmphasis="secondary"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheetRoot: {
    flex: 1,
  },
  /** absolute fill pushes scroll under top safe/chrome so overlay close matches task formSheet */
  scrollFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: { flexGrow: 1 },
  title: {
    marginBottom: Paddings.sectionCompact,
  },
  formSections: {
    alignSelf: 'stretch',
    // same rhythm as spacing between email/password stacks — separates fields ⇄ error ⇄ login / create account CTA
    gap: Paddings.sectionCompact,
  },
  fieldStack: {
    // section spacing between stacked field groups (email vs password); label→input gaps stay compact in AuthGlassTextField
    gap: Paddings.sectionCompact,
  },
  submitOuter: {
    alignSelf: 'stretch',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});
