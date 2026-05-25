/**
 * Add-alert offset picker — liquid glass stack screen with onboarding-style hour + minute spinner.
 * Writes the new alert id into CreateTaskDraftContext then navigates back.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { MainCloseButton, OnboardingContinueButton } from '@/components/ui/Button';
import { AUTH_LANDING_SLIDE_UI } from '@/components/features/onboarding/auth/constants/slideUiTokens';
import { resolveIntroContinueButtonPaint } from '@/components/features/onboarding/auth/scrollTransition';
import { ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE } from '@/components/features/onboarding/onboarding/constants/typography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTypographyStyle } from '@/constants/Typography';
import { GroupedList } from '@/components/ui/List/GroupedList';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { Paddings } from '@/constants/Paddings';
import {
  alertIdForMinutesBefore,
  normalizeAlertIdForComparison,
} from './alertOptions';
import { AlertOffsetSpinner } from './AlertOffsetSpinner';
import {
  ALERT_SHEET_CLOSE_TOP,
  ALERT_SHEET_HEADER_TRAILING_INSET,
  ALERT_SHEET_HORIZONTAL_INSET,
  ALERT_SHEET_SCROLL_PADDING_TOP,
} from './alertSheetChrome';

export function AlertOffsetSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const { draft, setAlerts } = useCreateTaskDraft();

  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass
    ? 'transparent'
    : themeColors.background.secondary();

  const [selectedMinutes, setSelectedMinutes] = useState(15);

  // marple glass fill + label tint — same tokens as onboarding continue / tab FAB
  const addButtonTint = useMemo(
    () => resolveIntroContinueButtonPaint(themeColors, AUTH_LANDING_SLIDE_UI.continueButtonBackground),
    [themeColors],
  );
  const addButtonLabelColor = useMemo(
    () =>
      resolveIntroContinueButtonPaint(
        themeColors,
        AUTH_LANDING_SLIDE_UI.continueButtonIcon ?? 'primarySecondaryBlend',
      ),
    [themeColors],
  );
  const addButtonLabelStyle = useMemo(
    () => [ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE, { color: addButtonLabelColor }],
    [addButtonLabelColor],
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleAdd = useCallback(() => {
    const nextId = alertIdForMinutesBefore(selectedMinutes);
    const existing = draft.alerts ?? [];
    const alreadySaved = existing.some(
      (id) => normalizeAlertIdForComparison(id) === normalizeAlertIdForComparison(nextId),
    );

    if (!alreadySaved) {
      setAlerts([...existing, nextId]);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [draft.alerts, router, selectedMinutes, setAlerts]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: ALERT_SHEET_SCROLL_PADDING_TOP,
            paddingBottom: insets.bottom + Paddings.modalBottomExtra,
            paddingHorizontal: ALERT_SHEET_HORIZONTAL_INSET,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            getTypographyStyle('heading-3', typographyPlatform),
            styles.title,
            {
              color: themeColors.text.primary(),
              paddingRight: ALERT_SHEET_HEADER_TRAILING_INSET,
            },
          ]}
          accessibilityRole="header"
        >
          Add Alert
        </Text>

        <Text
          style={[
            getTypographyStyle('body-medium', typographyPlatform),
            styles.subtitle,
            { color: themeColors.text.secondary() },
          ]}
        >
          Select duration before the task start time.
        </Text>

        <View style={styles.spinnerSection}>
          <GroupedList
            containerStyle={styles.listContainer}
            backgroundColor={themeColors.background.primarySecondaryBlend()}
            separatorColor={themeColors.border.primary()}
            separatorInsetRight={Paddings.groupedListContentHorizontal}
            separatorVariant="solid"
            borderRadius={24}
            minimalStyle={false}
            contentPaddingHorizontal={0}
            contentPaddingVertical={Paddings.groupedListContentVertical}
          >
            <View key="alert-offset-spinner" style={styles.spinnerWrap}>
              <AlertOffsetSpinner
                valueMinutes={selectedMinutes}
                onChangeMinutes={setSelectedMinutes}
              />
            </View>
          </GroupedList>
        </View>

        <View style={styles.footer}>
          <OnboardingContinueButton
            label="Add"
            onPress={handleAdd}
            labelStyle={addButtonLabelStyle}
            tintColor={addButtonTint}
            labelColor={addButtonLabelColor}
            accessibilityLabel="Add alert"
          />
        </View>
      </ScrollView>

      <View style={styles.headerOverlay} pointerEvents="box-none">
        <MainCloseButton
          onPress={handleClose}
          top={ALERT_SHEET_CLOSE_TOP}
          right={ALERT_SHEET_HORIZONTAL_INSET}
          iconEmphasis="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  title: {
    marginBottom: Paddings.groupedListHeaderContentGap,
  },
  subtitle: {
    marginBottom: Paddings.screen,
  },
  spinnerSection: {
    width: '100%',
    marginBottom: Paddings.screen,
  },
  listContainer: { marginVertical: 0 },
  spinnerWrap: {
    width: '100%',
    alignItems: 'center',
  },
  footer: {
    marginTop: Paddings.screenSmall,
    overflow: 'visible',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
