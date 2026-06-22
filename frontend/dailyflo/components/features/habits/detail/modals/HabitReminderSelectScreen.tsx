/**
 * Daily reminder picker — root route /habit-reminder-select.
 * time wheel + "No reminder" pill; mirrors task time-duration sheet pattern.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useCreateHabitDraft } from '@/app/habit/CreateHabitDraftContext';
import { OnboardingQuestionnaireTimeWheel } from '@/components/features/onboarding/onboarding/ui/OnboardingQuestionnaireTimeWheel';
import { QuickAddLabelOnlyPill } from '@/components/features/tasks/quickAdd/QuickAddLabelOnlyPill';
import { GroupedList } from '@/components/ui/List/GroupedList';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { HabitPickerSheetChrome } from './HabitPickerSheetChrome';

const DEFAULT_WHEEL_HOUR = 9;
const DEFAULT_WHEEL_MINUTE = 0;

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

function wheelDateToTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function HabitReminderSelectScreen() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const { draft, setReminderTime } = useCreateHabitDraft();
  const userClearedReminderRef = useRef(false);

  const wheelDate = useMemo(() => timeStringToWheelDate(draft.reminderTime), [draft.reminderTime]);

  const handleTimeChange = useCallback(
    (next: Date) => {
      userClearedReminderRef.current = false;
      setReminderTime(wheelDateToTimeString(next));
    },
    [setReminderTime],
  );

  const handleClearReminder = useCallback(() => {
    userClearedReminderRef.current = true;
    setReminderTime('');
  }, [setReminderTime]);

  const handleClose = useCallback(() => {
    if (!draft.reminderTime.trim() && !userClearedReminderRef.current) {
      setReminderTime(wheelDateToTimeString(wheelDate));
    }
    router.back();
  }, [draft.reminderTime, router, setReminderTime, wheelDate]);

  return (
    <HabitPickerSheetChrome
      title="Reminder"
      subtitle="Get a daily notification when this habit is due."
      onClose={handleClose}
    >
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
        <View style={styles.timeWheelWrap}>
          <OnboardingQuestionnaireTimeWheel
            value={wheelDate}
            onChange={handleTimeChange}
            brandRamp="marple"
            accessibilityLabel="Select habit reminder time"
          />
        </View>
      </GroupedList>

      <View style={styles.noReminderPillRow}>
        <QuickAddLabelOnlyPill
          label="No reminder"
          onPress={handleClearReminder}
          variant="primarySecondaryBlend"
          accessibilityLabel="Turn off habit reminder"
        />
      </View>
    </HabitPickerSheetChrome>
  );
}

const styles = StyleSheet.create({
  listContainer: { marginVertical: 0 },
  timeWheelWrap: {
    width: '100%',
    alignItems: 'center',
  },
  noReminderPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Paddings.formDataPillRowGap,
  },
});
