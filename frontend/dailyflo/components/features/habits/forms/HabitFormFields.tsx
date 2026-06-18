/**
 * shared habit form fields — grouped lists + section headers match browse settings / list-create.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { GroupedList, GroupedListHeader } from '@/components/ui/List/GroupedList';
import { WeekdayCirclePicker, WEEKDAY_PICKER_TRACK_HEIGHT } from '@/components/ui/WeekdayCirclePicker';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { getHabitFormListGroupProps } from './habitFormChrome';
import { HabitNameDescriptionSection } from './HabitNameDescriptionSection';
import { HabitCompletionsPerDayStepper } from './HabitCompletionsPerDayStepper';

export type HabitFormFieldsState = {
  title: string;
  description: string;
  /** how many times this habit should be completed each due day */
  completionsPerDay: number;
  /** which weekdays the habit is due — 0 = Monday … 6 = Sunday */
  scheduleDays: number[];
};

type HabitFormFieldsProps = HabitFormFieldsState & {
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCompletionsPerDayChange: (value: number) => void;
  onScheduleDaysChange: (days: number[]) => void;
  autoFocusTitle?: boolean;
  /** remounts description field after edit screen loads habit from API */
  descriptionInputKey?: string;
};

export function HabitFormFields({
  title,
  description,
  completionsPerDay,
  scheduleDays,
  onTitleChange,
  onDescriptionChange,
  onCompletionsPerDayChange,
  onScheduleDaysChange,
  autoFocusTitle = false,
  descriptionInputKey,
}: HabitFormFieldsProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(), []);

  const listGroupProps = useMemo(() => getHabitFormListGroupProps(themeColors), [themeColors]);

  return (
    <>
      <View style={styles.groupedListSectionFirst}>
        <HabitNameDescriptionSection
          title={title}
          onTitleChange={onTitleChange}
          description={description}
          onDescriptionChange={onDescriptionChange}
          autoFocusTitle={autoFocusTitle}
          descriptionInputKey={descriptionInputKey}
        />
      </View>

      <GroupedListHeader title="Completions per day" style={styles.sectionHeader} />
      <GroupedList
        containerStyle={styles.listContainer}
        {...listGroupProps}
        separatorConsiderIconColumn={false}
        contentPaddingHorizontal={0}
      >
        <HabitCompletionsPerDayStepper value={completionsPerDay} onChange={onCompletionsPerDayChange} />
      </GroupedList>

      <GroupedListHeader title="Frequency" style={styles.sectionHeader} />
      <GroupedList
        containerStyle={styles.listContainer}
        {...listGroupProps}
        contentPaddingHorizontal={0}
        contentPaddingVertical={0}
        contentMinHeight={WEEKDAY_PICKER_TRACK_HEIGHT}
      >
        <WeekdayCirclePicker
          mode="multi"
          selectedDays={scheduleDays}
          onChange={onScheduleDaysChange}
        />
      </GroupedList>
      <Text style={[styles.scheduleHint, { color: themeColors.text.secondary() }]}>
        Tap the days this habit is due.
      </Text>
    </>
  );
}

const createStyles = () =>
  StyleSheet.create({
    groupedListSectionFirst: {
      marginTop: 0,
    },
    listContainer: {
      marginVertical: 0,
    },
    sectionHeader: {
      marginTop: Paddings.section,
    },
    scheduleHint: {
      ...getTextStyle('body-medium'),
      marginTop: Paddings.sectionCompact,
      paddingHorizontal: Paddings.touchTargetSmall,
    },
  });
