/**
 * PickerButtonsSection Component
 *
 * Renders the remaining picker actions (Date, Time & Duration, Alerts)
 * using the shared GroupedList + TaskFormButton for a consistent iOS Settings look.
 *
 * Each row is a TaskFormButton:
 * - Date
 * - Time & Duration
 * - Alerts
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
// reusable grouped list: wraps children in rounded container with separators
import { GroupedList, TaskFormButton } from '@/components/ui/List/GroupedList';
// custom SVG icons (not Ionicons) for date, time, alerts
import { CalendarIcon, ClockIcon, BellIcon } from '@/components/ui/Icon';

export interface PickerButtonsSectionProps {
  /** Handler functions for each picker */
  onShowDatePicker: () => void;
  onShowTimeDurationPicker: () => void;
  onShowAlertsPicker: () => void;
  /** Main label for date (e.g., "Thu, 5 Feb 2026") */
  dateValue?: string;
  /** Sublabel for date shown on the right (e.g., "Today", "Tomorrow") */
  dateSecondaryValue?: string;
  /** Main label for time/duration (e.g., "14:30 - 15:00" or "14:30") */
  timeDurationValue?: string;
  /** Sublabel for time/duration shown on the right (e.g., "30min") */
  timeDurationSecondaryValue?: string;
  alertsValue?: string;
}

export const PickerButtonsSection: React.FC<PickerButtonsSectionProps> = ({
  onShowDatePicker,
  onShowTimeDurationPicker,
  onShowAlertsPicker,
  dateValue = 'Select',
  dateSecondaryValue,
  timeDurationValue = 'Select',
  timeDurationSecondaryValue,
  alertsValue = 'Select',
}) => {
  const themeColors = useThemeColors();

  return (
    <View style={styles.container}>
      <GroupedList
        containerStyle={styles.listContainer}
        contentPaddingHorizontal={16}
        backgroundColor={themeColors.background.secondary()}
        separatorColor={themeColors.background.quaternary()}
        separatorInsetLeft={50}
        separatorInsetRight={16}
      >
        <TaskFormButton
          iconComponent={<CalendarIcon size={20} color={themeColors.text.primary()} />}
          label={dateValue}
          value={dateSecondaryValue ?? ''}
          onPress={onShowDatePicker}
          showChevron
        />
        <TaskFormButton
          iconComponent={<ClockIcon size={20} color={themeColors.text.primary()} />}
          label={timeDurationValue}
          value={timeDurationSecondaryValue ?? ''}
          onPress={onShowTimeDurationPicker}
          showChevron
        />
        <TaskFormButton
          iconComponent={<BellIcon size={20} color={themeColors.text.primary()} />}
          label="Alerts"
          value={alertsValue}
          onPress={onShowAlertsPicker}
          showChevron
        />
      </GroupedList>
    </View>
  );
};

const styles = StyleSheet.create({
  // outer container: Settings-like horizontal inset (20pt) and bottom spacing
  container: {
    paddingHorizontal: 20,
      paddingTop: 24,
    paddingBottom: 8,
  },
  // list wrapper: no extra gap so the grouped list is one visual block
  listContainer: {
    marginVertical: 0,
  },
});

export default PickerButtonsSection;

