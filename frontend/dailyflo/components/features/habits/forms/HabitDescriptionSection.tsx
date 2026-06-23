/**
 * habit description in one GroupedList card — same chrome as HabitNameDescriptionSection
 * but without the name row (used on habit detail below the settings rows).
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { Description } from '@/components/features/tasks/TaskScreen/sections/Description';
import { GroupedList } from '@/components/ui/List/GroupedList';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getHabitFormNameGroupProps } from './habitFormChrome';
import type { HabitColor } from '@/types/api/habits';

type HabitDescriptionSectionProps = {
  description: string;
  onDescriptionChange: (value: string) => void;
  /** PATCH on blur in detail view — optional on create/edit forms that save on submit */
  onBlur?: () => void;
  /** accent color for CustomTextInput caret styling */
  habitColor?: HabitColor;
  /** remounts Description when API text hydrates into the field */
  descriptionInputKey?: string;
  /** grouped-list paragraph icon — habit detail passes color 300 */
  listIconColor?: string;
};

export function HabitDescriptionSection({
  description,
  onDescriptionChange,
  onBlur,
  habitColor = 'green',
  descriptionInputKey,
  listIconColor,
}: HabitDescriptionSectionProps) {
  const themeColors = useThemeColors();

  const resolvedListIconColor = listIconColor ?? themeColors.background.tertiary();

  const listGroupProps = useMemo(
    () => getHabitFormNameGroupProps(themeColors),
    [themeColors],
  );

  return (
    <View style={styles.container}>
      <View style={styles.groupedCard}>
        <GroupedList
          containerStyle={styles.listContainer}
          contentPaddingHorizontal={Paddings.groupedListContentHorizontal}
          contentPaddingVertical={Paddings.groupedListContentVertical}
          {...listGroupProps}
        >
          <Description
            key={descriptionInputKey}
            description={description}
            onDescriptionChange={onDescriptionChange}
            onBlur={onBlur}
            isEditing
            taskColor={habitColor}
            useInitialMinHeight
            minVisibleLines={2}
            iconColor={resolvedListIconColor}
          />
        </GroupedList>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 8 matches task SubtaskSection — gap from FormDetailSection pill row to description GroupedList
  container: {
    marginTop: 8,
  },
  groupedCard: {
    overflow: 'hidden',
    borderRadius: Paddings.groupedListBorderRadius,
  },
  listContainer: {
    marginVertical: 0,
  },
});
