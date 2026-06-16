/**
 * multi-select weekday picker for custom habit frequency — tap toggles day on/off.
 */

import React, { useCallback, useMemo } from 'react';

import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { useThemeColors } from '@/hooks/useColorPalette';
import { HABIT_WEEKDAYS } from './habitFormConstants';
import { getHabitFormListGroupProps } from './habitFormChrome';

type HabitCustomDaysPickerProps = {
  selectedDays: number[];
  onChange: (days: number[]) => void;
};

export function HabitCustomDaysPicker({ selectedDays, onChange }: HabitCustomDaysPickerProps) {
  const themeColors = useThemeColors();
  const listGroupProps = useMemo(() => getHabitFormListGroupProps(themeColors), [themeColors]);
  const selectedSet = useMemo(() => new Set(selectedDays), [selectedDays]);

  const toggleDay = useCallback(
    (day: number) => {
      const next = new Set(selectedSet);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      onChange([...next].sort((a, b) => a - b));
    },
    [selectedSet, onChange],
  );

  return (
    <GroupedList {...listGroupProps}>
      {HABIT_WEEKDAYS.map((d) => (
        <FormDetailButton
          key={d.value}
          label={d.label}
          value={selectedSet.has(d.value) ? 'Selected' : ''}
          onPress={() => toggleDay(d.value)}
          showChevron={false}
        />
      ))}
    </GroupedList>
  );
}
