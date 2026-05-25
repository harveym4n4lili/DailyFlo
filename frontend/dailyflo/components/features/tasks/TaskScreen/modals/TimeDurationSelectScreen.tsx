/**
 * Time & duration select screen content. Used by app/time-duration-select (root-level route).
 * Draft via CreateTaskDraftProvider — onboarding time wheel + glass duration slider.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainCloseButton } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTypographyStyle } from '@/constants/Typography';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { OnboardingQuestionnaireTimeWheel } from '@/components/features/onboarding/onboarding/ui/OnboardingQuestionnaireTimeWheel';
import { GroupedList } from '@/components/ui/List/GroupedList';
import { QuickAddLabelOnlyPill } from '@/components/features/tasks/quickAdd/QuickAddLabelOnlyPill';
import { Paddings } from '@/constants/Paddings';
import { TaskDurationSlider } from './TaskDurationSlider';
import {
  ALERT_SHEET_CLOSE_TOP,
  ALERT_SHEET_HEADER_TRAILING_INSET,
  ALERT_SHEET_HORIZONTAL_INSET,
  ALERT_SHEET_SCROLL_PADDING_TOP,
} from './alertSheetChrome';

const TIME_HEADING_GAP = Paddings.listItemVertical + Paddings.groupedListHeaderContentGap;

const DEFAULT_WHEEL_HOUR = 9;
const DEFAULT_WHEEL_MINUTE = 0;

/** draft.time is `HH:mm` — convert to a Date the spinner can bind to */
function timeStringToWheelDate(time: string | undefined): Date {
  const date = new Date();
  if (time && /^\d{2}:\d{2}$/.test(time)) {
    const [hours, minutes] = time.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  date.setHours(DEFAULT_WHEEL_HOUR, DEFAULT_WHEEL_MINUTE, 0, 0);
  return date;
}

/** spinner returns a Date — store only hour/minute on the draft */
function wheelDateToTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function TimeDurationSelectScreen() {
  const typographyPlatform = Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const router = useRouter();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { draft, setTime, setDuration } = useCreateTaskDraft();

  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass
    ? 'transparent'
    : themeColors.background.secondary();

  const selectedTime = draft.time;
  const selectedDuration = draft.duration;

  const wheelDate = useMemo(() => timeStringToWheelDate(selectedTime), [selectedTime]);

  const handleTimeChange = useCallback(
    (next: Date) => {
      setTime(wheelDateToTimeString(next));
    },
    [setTime],
  );

  const handleClearTime = useCallback(() => {
    setTime(undefined);
  }, [setTime]);

  const handleDurationChange = useCallback(
    (minutes: number) => {
      setDuration(minutes);
    },
    [setDuration],
  );

  const handleClearDuration = useCallback(() => {
    setDuration(undefined);
  }, [setDuration]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.timeSection}>
          <Text
            style={[
              getTypographyStyle('heading-3', typographyPlatform),
              styles.timeHeading,
              {
                color: themeColors.text.primary(),
                paddingRight: ALERT_SHEET_HEADER_TRAILING_INSET,
              },
            ]}
            accessibilityRole="header"
            accessibilityLabel="Time"
          >
            Time
          </Text>

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
            <View key="time-wheel" style={styles.timeWheelWrap}>
              <OnboardingQuestionnaireTimeWheel
                value={wheelDate}
                onChange={handleTimeChange}
                brandRamp="marple"
                accessibilityLabel="Select task time"
              />
            </View>
          </GroupedList>

          <View style={styles.noTimePillRow}>
            <QuickAddLabelOnlyPill
              label="No time"
              onPress={handleClearTime}
              variant="primarySecondaryBlend"
              accessibilityLabel="Clear task time"
            />
          </View>
        </View>

        <View style={styles.durationSection}>
          <Text
            style={[
              getTypographyStyle('heading-4', typographyPlatform),
              styles.durationHeading,
              { color: themeColors.text.primary() },
            ]}
            accessibilityRole="header"
          >
            Duration
          </Text>

          <View style={styles.durationSliderBlock}>
            <TaskDurationSlider
              valueMinutes={selectedDuration}
              onChangeMinutes={handleDurationChange}
              accessibilityLabel="How long to spend on this task"
            />

            <View style={styles.noDurationPillRow}>
              <QuickAddLabelOnlyPill
                label="No duration"
                onPress={handleClearDuration}
                variant="primarySecondaryBlend"
                accessibilityLabel="Clear task duration"
              />
            </View>
          </View>
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
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1 },
  timeSection: {
    width: '100%',
    alignItems: 'stretch',
  },
  durationSection: {
    width: '100%',
    marginTop: Paddings.listItemVertical,
  },
  timeHeading: {
    marginBottom: TIME_HEADING_GAP,
  },
  listContainer: { marginVertical: 0 },
  durationHeading: {
    marginBottom: Paddings.groupedListHeaderContentGap,
  },
  timeWheelWrap: {
    width: '100%',
    alignItems: 'center',
  },
  noTimePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Paddings.formDataPillRowGap,
  },
  durationSliderBlock: {
    width: '100%',
  },
  noDurationPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Paddings.formDataPillRowGap,
    marginStart: Paddings.touchTargetSmall,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
