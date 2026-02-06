/**
 * PickerButtonsSection Component
 *
 * Renders picker actions (Date, Time & Duration, Alerts) using GroupedList + TaskFormButton.
 * - Fields WITH values: shown as TaskFormButton rows in the GroupedList (with dynamic messaging)
 * - Fields WITHOUT values: shown as TaskOptionButtons in a horizontal scroll below the list
 *
 * When a TaskOptionButton is tapped, the picker modal opens. After selection, the field
 * moves from the TaskOptionButton area into the GroupedList as a TaskFormButton row.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
// reusable grouped list: wraps children in rounded container with separators
import { GroupedList, TaskFormButton } from '@/components/ui/List/GroupedList';
// TaskOptionButton: simplified pill for fields with no value (no dynamic messaging)
import { TaskOptionButton } from '@/components/ui/Button/FormPickerButton';
// custom SVG icons (not Ionicons) for date, time, alerts
import { CalendarIcon, ClockIcon, BellIcon } from '@/components/ui/Icon';

// strings returned by formPickerUtils when field has no value
const NO_DATE = 'No Date';
const NO_TIME_OR_DURATION = 'No Time or Duration';
const NO_ALERTS = 'No Alerts';

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
  /** Background color for TaskOptionButtons (defaults to theme background.secondary) */
  taskOptionBackgroundColor?: string;
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
  taskOptionBackgroundColor,
}) => {
  const themeColors = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();

  // determine if each field has a value (used to show TaskFormButton vs TaskOptionButton)
  const hasDate = dateValue !== NO_DATE && dateValue !== 'Select';
  const hasTimeDuration = timeDurationValue !== NO_TIME_OR_DURATION && timeDurationValue !== 'Select';
  const hasAlerts = alertsValue !== NO_ALERTS && alertsValue !== 'Select';

  // build list of TaskFormButton rows only for fields that have values
  const groupedListItems: React.ReactNode[] = [];
  if (hasDate) {
    groupedListItems.push(
      <TaskFormButton
        key="date"
        iconComponent={<CalendarIcon size={20} color={themeColors.text.primary()} />}
        label={dateValue}
        value={dateSecondaryValue ?? ''}
        onPress={onShowDatePicker}
        showChevron
      />
    );
  }
  if (hasTimeDuration) {
    groupedListItems.push(
      <TaskFormButton
        key="timeDuration"
        iconComponent={<ClockIcon size={20} color={themeColors.text.primary()} />}
        label={timeDurationValue}
        value={timeDurationSecondaryValue ?? ''}
        onPress={onShowTimeDurationPicker}
        showChevron
      />
    );
  }
  if (hasAlerts) {
    groupedListItems.push(
      <TaskFormButton
        key="alerts"
        iconComponent={<BellIcon size={20} color={themeColors.text.primary()} />}
        label="Alerts"
        value={alertsValue}
        onPress={onShowAlertsPicker}
        showChevron
      />
    );
  }

  // TaskOptionButtons for fields with no value (shown in horizontal scroll)
  const taskOptionButtons: React.ReactNode[] = [];
  const taskOptionIconSize = 18;
  if (!hasDate) {
    taskOptionButtons.push(
      <TaskOptionButton
        key="date"
        customIcon={<CalendarIcon size={taskOptionIconSize} color={themeColors.text.tertiary()} />}
        label="Date"
        onPress={onShowDatePicker}
        containerStyle={styles.taskOptionSpacing}
        {...(taskOptionBackgroundColor != null && { backgroundColor: taskOptionBackgroundColor })}
      />
    );
  }
  if (!hasTimeDuration) {
    taskOptionButtons.push(
      <TaskOptionButton
        key="timeDuration"
        customIcon={<ClockIcon size={taskOptionIconSize} color={themeColors.text.tertiary()} />}
        label="Time & Duration"
        onPress={onShowTimeDurationPicker}
        containerStyle={styles.taskOptionSpacing}
        {...(taskOptionBackgroundColor != null && { backgroundColor: taskOptionBackgroundColor })}
      />
    );
  }
  if (!hasAlerts) {
    taskOptionButtons.push(
      <TaskOptionButton
        key="alerts"
        customIcon={<BellIcon size={taskOptionIconSize} color={themeColors.text.tertiary()} />}
        label="Alerts"
        onPress={onShowAlertsPicker}
        containerStyle={styles.taskOptionSpacing}
        {...(taskOptionBackgroundColor != null && { backgroundColor: taskOptionBackgroundColor })}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* GroupedList: only shows TaskFormButton rows for fields that have values */}
      {groupedListItems.length > 0 && (
        <GroupedList
          containerStyle={styles.listContainer}
          contentPaddingHorizontal={16}
          backgroundColor={themeColors.background.secondary()}
          separatorColor={themeColors.background.quaternary()}
          separatorInsetLeft={50}
          separatorInsetRight={16}
        >
          {groupedListItems}
        </GroupedList>
      )}

      {/* horizontal scroll of TaskOptionButtons for fields with no value */}
      {/* overflow: visible so the glass highlight on TaskOptionButton is not clipped by the scroll */}
      {taskOptionButtons.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.taskOptionsScrollContent,
            { paddingRight: 64, paddingVertical: 0, paddingBottom: 4, overflow: 'visible' as const },
          ]}
          style={[styles.taskOptionsScroll, { width: screenWidth, overflow: 'visible' as const }]}
        >
          {taskOptionButtons}
        </ScrollView>
      )}
    </View>
  );
};

// equal spacing: top edge ↔ GroupedList and GroupedList ↔ slider
const SECTION_GAP = 16;

const styles = StyleSheet.create({
  // outer container: Settings-like horizontal inset (20pt) and bottom spacing
  // overflow: visible so the horizontal scroll's glass pills are not clipped
  container: {
    paddingHorizontal: 20,
    paddingTop: SECTION_GAP,
    paddingBottom: 8,
    overflow: 'visible',
  },
  // list wrapper: no extra gap so the grouped list is one visual block
  listContainer: {
    marginVertical: 0,
  },
  // horizontal scroll: bypass container padding (-20) so it extends edge-to-edge; left content inset 20
  // overflow: visible so glass animation on TaskOptionButtons is not clipped
  taskOptionsScroll: {
    marginTop: SECTION_GAP,
    marginHorizontal: -20,
    flexGrow: 0,
    overflow: 'visible',
  },
  // content container: left inset 20; row of pills; right padding = screen width for full scroll range
  taskOptionsScrollContent: {
    paddingLeft: 20,
    flexDirection: 'row',
    overflow: 'visible',
  },
  // spacing between each TaskOptionButton (icon) pill
  taskOptionSpacing: {
    marginRight: 36,
  },
});

export default PickerButtonsSection;

