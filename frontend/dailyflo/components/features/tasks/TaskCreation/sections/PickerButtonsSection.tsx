/**
 * PickerButtonsSection Component
 *
 * Renders the remaining picker actions (Date, Time & Duration, Alerts)
 * using the shared GroupedList + GroupedListButton for a consistent iOS Settings look.
 *
 * Each row is a GroupedListButton:
 * - Date
 * - Time & Duration
 * - Alerts
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
// reusable grouped list: wraps children in rounded container with separators
import { GroupedList, GroupedListButton } from '@/components/ui/List/GroupedList';
// custom SVG icons (not Ionicons) for date, time, alerts
import { CalendarIcon, ClockIcon, BellIcon } from '@/components/ui/Icon';

export interface PickerButtonsSectionProps {
  /** Handler functions for each picker */
  onShowDatePicker: () => void;
  onShowTimeDurationPicker: () => void;
  onShowAlertsPicker: () => void;
  /** Optional display values shown on the right (default "Select") */
  dateValue?: string;
  timeDurationValue?: string;
  alertsValue?: string;
}

export const PickerButtonsSection: React.FC<PickerButtonsSectionProps> = ({
  onShowDatePicker,
  onShowTimeDurationPicker,
  onShowAlertsPicker,
  dateValue = 'Select',
  timeDurationValue = 'Select',
  alertsValue = 'Select',
}) => {
  const themeColors = useThemeColors();

  return (
    <View style={styles.container}>
      <GroupedList
        containerStyle={styles.listContainer}
        borderRadius={20}
        backgroundColor={themeColors.background.secondary()}
        separatorColor={themeColors.background.quaternary()}
        separatorInset={20}
      >
        <GroupedListButton
          iconComponent={<CalendarIcon size={20} color={themeColors.text.primary()} />}
          label="Date"
          value={dateValue}
          onPress={onShowDatePicker}
          showChevron
        />
        <GroupedListButton
          iconComponent={<ClockIcon size={20} color={themeColors.text.primary()} />}
          label="Time & Duration"
          value={timeDurationValue}
          onPress={onShowTimeDurationPicker}
          showChevron
        />
        <GroupedListButton
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

