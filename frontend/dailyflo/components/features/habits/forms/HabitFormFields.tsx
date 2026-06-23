/**
 * shared habit form fields — grouped lists + section headers match browse settings / list-create.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ColorCirclePicker } from '@/components/ui/ColorCirclePicker';
import { GroupedListHeader, GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { SFSymbolIcon } from '@/components/ui/Icon';
import { useThemeColors, useColorPalette } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import type { HabitColor } from '@/types/api/habits';
import { HABIT_COLORS } from './habitFormConstants';
import { HabitNameDescriptionSection } from './HabitNameDescriptionSection';
import { HabitCompletionsPickerBody } from './HabitCompletionsPickerBody';
import { HabitFrequencyPickerBody } from './HabitFrequencyPickerBody';

export type HabitFormFieldsState = {
  title: string;
  description: string;
  /** accent color saved on the habit — same ids as task colors in ColorPalette.ts */
  color: HabitColor;
  /** how many times this habit should be completed each due day */
  completionsPerDay: number;
  /** which weekdays the habit is due — 0 = Monday … 6 = Sunday */
  scheduleDays: number[];
};

type HabitFormFieldsProps = HabitFormFieldsState & {
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onColorChange: (color: HabitColor) => void;
  onCompletionsPerDayChange: (value: number) => void;
  onScheduleDaysChange: (days: number[]) => void;
  /** list picker row — optional on create */
  listRowValue?: string;
  onListPress?: () => void;
  autoFocusTitle?: boolean;
  /** remounts description field after edit screen loads habit from API */
  descriptionInputKey?: string;
};

export function HabitFormFields({
  title,
  description,
  color,
  completionsPerDay,
  scheduleDays,
  onTitleChange,
  onDescriptionChange,
  onColorChange,
  onCompletionsPerDayChange,
  onScheduleDaysChange,
  listRowValue,
  onListPress,
  autoFocusTitle = false,
  descriptionInputKey,
}: HabitFormFieldsProps) {
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const groupedListIconColor = getMarpleBrandColor(500);
  const styles = useMemo(() => createStyles(), []);

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
        <Text style={[styles.sectionHint, { color: themeColors.text.secondary() }]}>
          Add a name and optional description for this habit.
        </Text>
      </View>

      <HabitCompletionsPickerBody
        value={completionsPerDay}
        onChange={onCompletionsPerDayChange}
      />

      <HabitFrequencyPickerBody
        scheduleDays={scheduleDays}
        onScheduleDaysChange={onScheduleDaysChange}
      />

      {onListPress ? (
        <>
          <GroupedListHeader title="Organization" style={styles.sectionHeader} />
          <GroupedList>
            <FormDetailButton
              iconComponent={
                <SFSymbolIcon
                  name="tray.fill"
                  size={18}
                  color={groupedListIconColor}
                  fallback={
                    <Ionicons name="file-tray" size={18} color={groupedListIconColor} />
                  }
                />
              }
              label="List"
              value={listRowValue ?? 'Habits'}
              onPress={onListPress}
              showChevron
            />
          </GroupedList>
        </>
      ) : null}

      <GroupedListHeader title="Color" style={styles.sectionHeader} />
      <ColorCirclePicker<HabitColor>
        selectedColor={color}
        onChange={onColorChange}
        colors={HABIT_COLORS}
      />
    </>
  );
}

const createStyles = () =>
  StyleSheet.create({
    groupedListSectionFirst: {
      marginTop: 0,
    },
    sectionHeader: {
      marginTop: Paddings.section,
    },
    sectionHint: {
      ...getTextStyle('body-medium'),
      marginTop: Paddings.sectionCompact,
      paddingHorizontal: Paddings.touchTargetSmall,
    },
  });
