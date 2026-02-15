/**
 * RepeatingSection Component
 *
 * Renders a "Repeating" button below the grouped list in task create content.
 * Tapping opens a context menu (DropdownList) with options: every day, once a week,
 * once a month, once a year. The selected routine type is stored in routineType
 * and passed to the task when created.
 *
 * routineType flow: user selects from menu -> onChange('routineType', value) ->
 * parent updates form state -> routineType sent to API on create
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GroupedList, FormDetailButton } from '@/components/ui/list/GroupedList';
import { DropdownList } from '@/components/ui/list';
import { useThemeColors } from '@/hooks/useColorPalette';
import type { RoutineType } from '@/types';

// map routine type to human-readable label (e.g. for display on the button)
const ROUTINE_TYPE_LABELS: Record<RoutineType, string> = {
  once: 'Once',
  daily: 'Every day',
  weekly: 'Once a week',
  monthly: 'Once a month',
  yearly: 'Once a year',
};

// menu options for the context dropdown (excludes 'once' - user can tap to cycle or we show all)
// we show all 5 options so user can select "Once" to turn off repeating
const ROUTINE_MENU_OPTIONS: { id: RoutineType; label: string }[] = [
  { id: 'once', label: 'Once' },
  { id: 'daily', label: 'Every day' },
  { id: 'weekly', label: 'Once a week' },
  { id: 'monthly', label: 'Once a month' },
  { id: 'yearly', label: 'Once a year' },
];

export interface RepeatingSectionProps {
  /** current routine type from form state */
  routineType: RoutineType;
  /** called when user selects a routine type from the menu */
  onRoutineTypeChange: (routineType: RoutineType) => void;
}

export const RepeatingSection: React.FC<RepeatingSectionProps> = ({
  routineType,
  onRoutineTypeChange,
}) => {
  const themeColors = useThemeColors();
  const [isRepeatingMenuVisible, setIsRepeatingMenuVisible] = useState(false);

  // open the repeating context menu when user taps the button
  const handleRepeatingPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRepeatingMenuVisible(true);
  };

  // when user selects an option, update form state and close menu
  const handleSelectOption = (option: RoutineType) => {
    onRoutineTypeChange(option);
    setIsRepeatingMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* single row: Repeating button in GroupedList - matches FormDetailSection style */}
      <GroupedList
        containerStyle={styles.listContainer}
        contentPaddingHorizontal={0}
        backgroundColor="transparent"
        separatorColor={themeColors.border.primary()}
        separatorInsetRight={0}
        borderRadius={0}
        minimalStyle={true}
        useDashedSeparator={true}
        itemWrapperPaddingVertical={16}
        separatorConsiderIconColumn={true}
        iconColumnWidth={30}
      >
        <FormDetailButton
          iconComponent={
            <Ionicons
              name="repeat"
              size={18}
              color={themeColors.text.primary()}
            />
          }
          label="Repeating"
          value={ROUTINE_TYPE_LABELS[routineType]}
          onPress={handleRepeatingPress}
          showChevron
        />
      </GroupedList>

      {/* context menu - opens when user taps Repeating button */}
      <DropdownList
        visible={isRepeatingMenuVisible}
        onClose={() => setIsRepeatingMenuVisible(false)}
        items={ROUTINE_MENU_OPTIONS.map((opt) => ({
          id: opt.id,
          label: opt.label,
          onPress: () => handleSelectOption(opt.id),
        }))}
        anchorPosition="top-left"
        topOffset={120}
        leftOffset={20}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 36,
    overflow: 'visible',
  },
  listContainer: {
    marginVertical: 0,
  },
});

export default RepeatingSection;
