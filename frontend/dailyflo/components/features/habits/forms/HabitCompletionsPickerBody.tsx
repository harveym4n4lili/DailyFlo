/**
 * completions-per-day picker body — shared by habit create/edit and detail picker sheet.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { GroupedList, GroupedListHeader } from '@/components/ui/List/GroupedList';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getHabitFormListGroupProps } from './habitFormChrome';
import { HabitCompletionsPerDayStepper } from './HabitCompletionsPerDayStepper';

type HabitCompletionsPickerBodyProps = {
  value: number;
  onChange: (next: number) => void;
  /** false on root picker sheets — chrome already shows the section title */
  showSectionHeader?: boolean;
};

export function HabitCompletionsPickerBody({
  value,
  onChange,
  showSectionHeader = true,
}: HabitCompletionsPickerBodyProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(), []);
  const listGroupProps = useMemo(() => getHabitFormListGroupProps(themeColors), [themeColors]);

  return (
    <>
      {showSectionHeader ? (
        <GroupedListHeader title="Completions per day" style={styles.sectionHeader} />
      ) : null}
      <GroupedList containerStyle={styles.listContainer} {...listGroupProps} separatorConsiderIconColumn={false}>
        <HabitCompletionsPerDayStepper value={value} onChange={onChange} />
      </GroupedList>
      <Text style={[styles.sectionHint, { color: themeColors.text.secondary() }]}>
        How many times you want to complete this habit on each due day.
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
