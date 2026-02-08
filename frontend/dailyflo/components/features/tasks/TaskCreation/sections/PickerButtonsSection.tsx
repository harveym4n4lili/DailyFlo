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
  /** Horizontal padding for container and scroll content (default 20). Pass 0 for no h padding. */
  contentPaddingHorizontal?: number;
  /** When false, hides the horizontal scroll of TaskOptionButton pills (e.g. for NEW task creation). Default true. */
  showTaskOptionPills?: boolean;
  /** When true, time/duration row is not shown in the grouped list (e.g. NEW shows only date in list). Default false. */
  hideTimeInList?: boolean;
  /** When true, alerts row is not shown in the grouped list (e.g. NEW shows only date in list). Default false. */
  hideAlertsInList?: boolean;
  /** When true, no bottom padding so the next block (e.g. time/alert displays row) can touch the list. Default false. */
  noBottomPadding?: boolean;
  /** When true, no top padding so the list can sit closer to the block above (e.g. description). Default false. */
  noTopPadding?: boolean;
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
  contentPaddingHorizontal = 20,
  showTaskOptionPills = true,
  hideTimeInList = false,
  hideAlertsInList = false,
  noBottomPadding = false,
  noTopPadding = false,
}) => {
  const themeColors = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();
  const paddingH = contentPaddingHorizontal;

  // determine if each field has a value (used to show TaskFormButton vs TaskOptionButton)
  const hasDate = dateValue !== NO_DATE && dateValue !== 'Select';
  const hasTimeDuration = timeDurationValue !== NO_TIME_OR_DURATION && timeDurationValue !== 'Select';
  const hasAlerts = alertsValue !== NO_ALERTS && alertsValue !== 'Select';

  // build list of TaskFormButton rows only for fields that have values (skip time/alerts when hidden)
  const groupedListItems: React.ReactNode[] = [];
  if (hasDate) {
    // date row: main label = "Due today" (or Due + relative, lowercase), sublabel = formatted date
    const dateMainLabel = dateSecondaryValue ? `Due ${dateSecondaryValue.toLowerCase()}` : dateValue;
    groupedListItems.push(
      <TaskFormButton
        key="date"
        iconComponent={<CalendarIcon size={18} color={themeColors.text.primary()} isSolid />}
        label={dateMainLabel}
        value={dateValue}
        onPress={onShowDatePicker}
        showChevron
      />
    );
  }
  if (hasTimeDuration && !hideTimeInList) {
    groupedListItems.push(
      <TaskFormButton
        key="timeDuration"
        iconComponent={<ClockIcon size={18} color={themeColors.text.primary()} isSolid />}
        label={timeDurationValue}
        value={timeDurationSecondaryValue ?? ''}
        onPress={onShowTimeDurationPicker}
        showChevron
      />
    );
  }
  if (hasAlerts && !hideAlertsInList) {
    groupedListItems.push(
      <TaskFormButton
        key="alerts"
        iconComponent={<BellIcon size={18} color={themeColors.text.primary()} />}
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
        customIcon={<CalendarIcon size={taskOptionIconSize} color={themeColors.text.primary()} isSolid />}
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
        customIcon={<ClockIcon size={taskOptionIconSize} color={themeColors.text.primary()} isSolid />}
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
        customIcon={<BellIcon size={taskOptionIconSize} color={themeColors.text.primary()} />}
        label="Alerts"
        onPress={onShowAlertsPicker}
        containerStyle={styles.taskOptionSpacing}
        {...(taskOptionBackgroundColor != null && { backgroundColor: taskOptionBackgroundColor })}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingHorizontal: paddingH }, noBottomPadding && styles.containerNoBottomPadding, noTopPadding && styles.containerNoTopPadding]}>
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

      {/* horizontal scroll of TaskOptionButtons for fields with no value (hidden when showTaskOptionPills is false, e.g. NEW) */}
      {showTaskOptionPills && taskOptionButtons.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.taskOptionsScrollContent,
            { paddingLeft: paddingH, paddingRight: 64, paddingTop: 4, paddingBottom: 4, overflow: 'visible' as const },
          ]}
          style={[styles.taskOptionsScroll, { width: screenWidth, marginHorizontal: -paddingH, overflow: 'visible' as const }]}
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
  // outer container: paddingHorizontal overridden via prop (default 20)
  container: {
    paddingTop: SECTION_GAP,
    paddingBottom: 8,
    overflow: 'visible',
  },
  // when noBottomPadding is true (e.g. NEW task creation): list and displays row touch with no gap
  containerNoBottomPadding: {
    paddingBottom: 0,
  },
  // when noTopPadding is true (e.g. NEW): less gap between description and grouped list
  containerNoTopPadding: {
    paddingTop: 0,
  },
  // list wrapper: no extra gap so the grouped list is one visual block
  listContainer: {
    marginVertical: 0,
  },
  // horizontal scroll: marginHorizontal set via prop to match container padding
  taskOptionsScroll: {
    marginTop: SECTION_GAP,
    flexGrow: 0,
    overflow: 'visible',
  },
  taskOptionsScrollContent: {
    flexDirection: 'row',
    overflow: 'visible',
  },
  // spacing between each TaskOptionButton (icon) pill
  taskOptionSpacing: {
    marginRight: 36,
  },
});

export default PickerButtonsSection;

