/**
 * frequency picker body — shared by habit create/edit and detail picker sheet.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { GroupedList, GroupedListHeader } from '@/components/ui/List/GroupedList';
import { WeekdayCirclePicker, WEEKDAY_PICKER_TRACK_HEIGHT } from '@/components/ui/WeekdayCirclePicker';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getHabitFormListGroupProps } from './habitFormChrome';

type HabitFrequencyPickerBodyProps = {
  scheduleDays: number[];
  onScheduleDaysChange: (days: number[]) => void;
  showSectionHeader?: boolean;
};

export function HabitFrequencyPickerBody({
  scheduleDays,
  onScheduleDaysChange,
  showSectionHeader = true,
}: HabitFrequencyPickerBodyProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(), []);
  const listGroupProps = useMemo(() => getHabitFormListGroupProps(themeColors), [themeColors]);

  return (
    <>
      {showSectionHeader ? <GroupedListHeader title="Frequency" style={styles.sectionHeader} /> : null}
      <GroupedList
        containerStyle={styles.listContainer}
        {...listGroupProps}
        contentPaddingHorizontal={0}
        contentPaddingVertical={0}
        contentMinHeight={WEEKDAY_PICKER_TRACK_HEIGHT}
      >
        <WeekdayCirclePicker mode="multi" selectedDays={scheduleDays} onChange={onScheduleDaysChange} />
      </GroupedList>
      <Text style={[styles.sectionHint, { color: themeColors.text.secondary() }]}>
        Tap the days this habit is due.
      </Text>
    </>
  );
}

const createStyles = () =>
  StyleSheet.create({
    sectionHeader: {
      marginTop: 0,
    },
    listContainer: {
      marginVertical: 0,
    },
    sectionHint: {
      ...getTextStyle('body-medium'),
      marginTop: Paddings.sectionCompact,
      paddingHorizontal: Paddings.touchTargetSmall,
    },
  });
