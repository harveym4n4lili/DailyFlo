/**
 * FormDetailSection Component
 *
 * Renders date picker action using GroupedList + FormDetailButton.
 * Shows date as a FormDetailButton row in the GroupedList when a date is selected.
 * Also includes time/duration and alerts display rows below the date picker.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
// reusable grouped list: wraps children in rounded container with separators
import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
// custom SVG icons
import { CalendarIcon, ClockIcon, BellIcon } from '@/components/ui/Icon';
// utility function for time/duration labels
import { getTimeDurationDisplayLabels } from '@/components/ui/Button';

// string returned by formPickerUtils when field has no value
const NO_DATE = 'No Date';

export interface FormDetailSectionProps {
  /** Handler function for date picker */
  onShowDatePicker: () => void;
  /** Handler function for time/duration picker */
  onShowTimeDurationPicker: () => void;
  /** Handler function for alerts picker */
  onShowAlertsPicker: () => void;
  /** Main label for date (e.g., "Thu, 5 Feb 2026") */
  dateValue?: string;
  /** Sublabel for date shown on the right (e.g., "Today", "Tomorrow") */
  dateSecondaryValue?: string;
  /** Time string in HH:MM format (e.g. "14:30") or undefined when not set */
  time?: string;
  /** Duration in minutes or undefined when not set */
  duration?: number;
  /** Number of alerts selected (0 = "No Alerts", 1 = "1 Alert", etc.) */
  alertsCount?: number;
}

export const FormDetailSection: React.FC<FormDetailSectionProps> = ({
  onShowDatePicker,
  onShowTimeDurationPicker,
  onShowAlertsPicker,
  dateValue = 'Select',
  dateSecondaryValue,
  time,
  duration,
  alertsCount = 0,
}) => {
  const themeColors = useThemeColors();

  // determine if date has a value (used to show FormDetailButton)
  const hasDate = dateValue !== NO_DATE && dateValue !== 'Select';

  // date row: main label = "Due today" (or Due + relative, lowercase), sublabel = formatted date
  const dateMainLabel = dateSecondaryValue ? `Due ${dateSecondaryValue.toLowerCase()}` : dateValue;

  // time/duration labels: dynamic main label (label prop) based on time selection
  // - No time: "Time & Duration"
  // - Time, no duration: the time (e.g., "09:00")
  // - Time and duration: start - end (e.g., "09:00 - 09:30")
  const hasTime = time != null && typeof time === 'string' && time.trim().length > 0;
  let timeMainLabel = 'Time & Duration'; // default when no time (used as label prop)
  if (hasTime) {
    if (duration != null && duration > 0) {
      // calculate end time for start - end format
      const [hours, minutes] = time.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      timeMainLabel = `${time} - ${endTime}`;
    } else {
      // time only, no duration
      timeMainLabel = time;
    }
  }
  
  // sub label: All day / No duration, or duration value (used as value prop)
  const { subLabel: timeSubLabel } = getTimeDurationDisplayLabels(time, duration);

  // alerts labels: dynamic main label (label prop) - no alerts → "No Alerts"; 1 → "1 Alert"; n → "n Alerts"
  // sub label (value prop): "Nudge"
  const alertsMainLabel = alertsCount === 0 ? 'No Alerts' : `${alertsCount} Alert${alertsCount === 1 ? '' : 's'}`;
  const alertsSubLabel = 'Nudge';

  return (
    <View style={styles.container}>
      {/* date, time, and alerts picker rows in GroupedList */}
      {hasDate && (
        <View style={styles.groupedListWrap}>
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
              key="date"
              iconComponent={<CalendarIcon size={18} color={themeColors.text.primary()} isSolid />}
              label={dateMainLabel}
              value={dateValue}
              onPress={onShowDatePicker}
              showChevron
            />
            <FormDetailButton
              key="time"
              iconComponent={<ClockIcon size={18} color={themeColors.text.primary()} isSolid />}
              label={timeMainLabel}
              value={timeSubLabel}
              onPress={onShowTimeDurationPicker}
              showChevron
            />
            <FormDetailButton
              key="alerts"
              iconComponent={<BellIcon size={18} color={themeColors.text.primary()} isSolid />}
              label={alertsMainLabel}
              value={alertsSubLabel}
              onPress={onShowAlertsPicker}
              showChevron
            />
          </GroupedList>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // outer container: no padding (parent handles spacing)
  container: {
    overflow: 'visible',
  },
  // grouped list wrapper
  groupedListWrap: {
    marginBottom: 0,
  },
  // list wrapper: no extra gap so the grouped list is one visual block
  listContainer: {
    marginVertical: 0,
  },
});

export default FormDetailSection;

