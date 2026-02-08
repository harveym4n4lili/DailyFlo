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
// reusable display row component
import { CustomFormDetailButton, CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS } from '@/components/ui/Button/TaskButton/CustomFormDetailButton';
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

  // time/duration labels: All day / No duration, time / No duration, or start - end / Xmin
  const { mainLabel: timeMainLabel, subLabel: timeSubLabel } = getTimeDurationDisplayLabels(time, duration);

  // alerts labels: no alerts → "No Alerts"; 1 → "1 Alert"; n → "n Alerts". sub: "Nudge" for now
  const alertsMainLabel = alertsCount === 0 ? 'No Alerts' : `${alertsCount} Alert${alertsCount === 1 ? '' : 's'}`;
  const alertsSubLabel = 'Nudge';

  // icon components
  const clockIcon = (
    <ClockIcon 
      size={CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS.ICON_SIZE} 
      color={themeColors.text.primary()} 
      isSolid 
    />
  );

  const bellIcon = (
    <BellIcon 
      size={CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS.ICON_SIZE} 
      color={themeColors.text.primary()} 
      isSolid 
    />
  );

  return (
    <View style={styles.container}>
      {/* date picker row in GroupedList */}
      {hasDate && (
        <View style={styles.groupedListWrap}>
          <GroupedList
            containerStyle={styles.listContainer}
            contentPaddingHorizontal={16}
            backgroundColor={themeColors.background.secondary()}
            separatorColor={themeColors.background.quaternary()}
            separatorInsetLeft={50}
            separatorInsetRight={16}
          >
            <FormDetailButton
              key="date"
              iconComponent={<CalendarIcon size={18} color={themeColors.text.primary()} isSolid />}
              label={dateMainLabel}
              value={dateValue}
              onPress={onShowDatePicker}
              showChevron
            />
          </GroupedList>
        </View>
      )}

      {/* time and alert display row */}
      <View style={styles.timeAndAlertRow}>
        <View style={styles.timeDurationDisplayWrap}>
          <CustomFormDetailButton
            icon={clockIcon}
            mainLabel={timeMainLabel}
            subLabel={timeSubLabel}
            showChevron={true}
            onPress={onShowTimeDurationPicker}
            boldMainLabel={true}
            borderTopLeftRadius={CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS.OUTER_RADIUS}
            borderBottomLeftRadius={CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS.OUTER_RADIUS}
            borderTopRightRadius={CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS.INNER_RADIUS}
            borderBottomRightRadius={CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS.INNER_RADIUS}
          />
        </View>
        <View style={styles.alertDisplayWrap}>
          <CustomFormDetailButton
            icon={bellIcon}
            mainLabel={alertsMainLabel}
            subLabel={alertsSubLabel}
            showChevron={true}
            onPress={onShowAlertsPicker}
            boldMainLabel={false}
            borderTopLeftRadius={CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS.INNER_RADIUS}
            borderBottomLeftRadius={CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS.INNER_RADIUS}
            borderTopRightRadius={CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS.OUTER_RADIUS}
            borderBottomRightRadius={CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS.OUTER_RADIUS}
          />
        </View>
      </View>
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
  // time and alert display row: side-by-side layout
  timeAndAlertRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  // time duration display wrapper: flex to fill available space
  timeDurationDisplayWrap: {
    flex: 1,
    minWidth: 0,
  },
  // alert display wrapper: flex to fill available space
  alertDisplayWrap: {
    flex: 1,
    minWidth: 0,
  },
});

export default FormDetailSection;

