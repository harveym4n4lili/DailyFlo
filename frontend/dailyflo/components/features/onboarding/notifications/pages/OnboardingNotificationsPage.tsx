/**
 * final onboarding step — explains why notifications help, then triggers native os permission on primary CTA.
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingContinueButton } from '@/components/ui/Button/OnboardingContinueButton/OnboardingContinueButton';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import {
  AUTH_LANDING_SLIDE_UI,
  OnboardingAuthShell,
  resolveIntroBackgroundColor,
  resolveIntroContinueButtonPaint,
  resolveIntroTextColor,
  splitIntroTitleHighlight,
} from '@/components/features/onboarding/auth';
import {
  ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
  ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE,
  ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_TEXT_STYLE,
  ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE,
} from '@/components/features/onboarding/onboarding/constants/typography';
import { ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP } from '@/components/features/onboarding/onboarding/constants/pagerLayout';
import { ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP } from '@/components/features/onboarding/onboarding/constants/topSection';

import {
  ONBOARDING_NOTIFICATIONS_CAPTION,
  ONBOARDING_NOTIFICATIONS_ENABLE_ACCESSIBILITY_LABEL,
  ONBOARDING_NOTIFICATIONS_ENABLE_LABEL,
  ONBOARDING_NOTIFICATIONS_NOT_NOW_ACCESSIBILITY_LABEL,
  ONBOARDING_NOTIFICATIONS_NOT_NOW_LABEL,
  ONBOARDING_NOTIFICATIONS_TITLE,
  ONBOARDING_NOTIFICATIONS_TITLE_HIGHLIGHT,
} from '../constants';
import { useOnboardingNotificationPrompt } from '../hooks';

export function OnboardingNotificationsPage() {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { busy, onEnableNotifications, onNotNow } = useOnboardingNotificationPrompt();

  const slideUi = AUTH_LANDING_SLIDE_UI;
  const titleParts = useMemo(
    () => splitIntroTitleHighlight(ONBOARDING_NOTIFICATIONS_TITLE, ONBOARDING_NOTIFICATIONS_TITLE_HIGHLIGHT),
    [],
  );

  const titleColor = resolveIntroTextColor(themeColors, 'primary');
  const highlightColor = resolveIntroTextColor(themeColors, slideUi.sloganEmphasisColor);
  const captionColor = resolveIntroTextColor(themeColors, 'secondary');
  const notNowColor = resolveIntroTextColor(themeColors, 'secondary');
  const iconColor = resolveIntroTextColor(themeColors, slideUi.sloganEmphasisColor);
  const continueTint = resolveIntroContinueButtonPaint(themeColors, slideUi.continueButtonBackground);
  const continueLabelColor = resolveIntroContinueButtonPaint(
    themeColors,
    slideUi.continueButtonIcon ?? 'primarySecondaryBlend',
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: resolveIntroBackgroundColor(themeColors, slideUi.background) },
      ]}
    >
      <OnboardingAuthShell>
        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <Ionicons name="notifications-outline" size={56} color={iconColor} accessibilityElementsHidden />
          </View>

          <Text style={[ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE, { color: titleColor }]}>
            {titleParts.before}
            <Text style={[ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_TEXT_STYLE, { color: highlightColor }]}>
              {titleParts.match}
            </Text>
            {titleParts.after}
          </Text>

          <Text
            style={[
              ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
              styles.caption,
              { color: captionColor, marginTop: ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP },
            ]}
          >
            {ONBOARDING_NOTIFICATIONS_CAPTION}
          </Text>
        </View>
      </OnboardingAuthShell>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, Paddings.screen),
          },
        ]}
      >
        <OnboardingContinueButton
          label={ONBOARDING_NOTIFICATIONS_ENABLE_LABEL}
          accessibilityLabel={ONBOARDING_NOTIFICATIONS_ENABLE_ACCESSIBILITY_LABEL}
          onPress={() => {
            void onEnableNotifications();
          }}
          loading={busy}
          disabled={busy}
          labelStyle={[ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE, { color: continueLabelColor }]}
          tintColor={continueTint}
          labelColor={continueLabelColor}
        />

        <Pressable
          onPress={() => {
            void onNotNow();
          }}
          disabled={busy}
          hitSlop={ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={ONBOARDING_NOTIFICATIONS_NOT_NOW_ACCESSIBILITY_LABEL}
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [styles.notNowPressable, { opacity: busy ? 0.5 : pressed ? 0.72 : 1 }]}
        >
          <Text style={[ONBOARDING_SLIDES_CAPTION_TEXT_STYLE, { color: notNowColor }]}>
            {ONBOARDING_NOTIFICATIONS_NOT_NOW_LABEL}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'flex-start',
    marginBottom: Paddings.touchTarget,
  },
  caption: {
    maxWidth: 340,
  },
  footer: {
    paddingHorizontal: Paddings.screen + Paddings.touchTarget,
    paddingTop: Paddings.touchTarget,
    gap: Paddings.touchTarget,
  },
  notNowPressable: {
    alignSelf: 'center',
    paddingVertical: Paddings.onboardingContinueButtonHitSlop,
  },
});
