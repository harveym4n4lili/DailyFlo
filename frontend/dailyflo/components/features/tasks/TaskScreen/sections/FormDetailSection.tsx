/**
 * FormDetailSection Component
 *
 * Renders date picker action using GroupedList + FormDetailButton.
 * Shows date, time/duration, and alerts rows in the GroupedList when a date is selected.
 * Repeating is in a separate container below the GroupedList (same padding, border radius, primarySecondaryBlend).
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { GroupedList, FormDetailButton } from '@/components/ui/list/GroupedList';
import { DropdownList } from '@/components/ui/list';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { CalendarIcon, ClockIcon, BellIcon, RepeatIcon, SFSymbolIcon } from '@/components/ui/icon';
import { getTimeDurationDisplayLabels } from '@/components/ui/button';
import type { RoutineType } from '@/types';
import { Host, ContextMenu, Button } from '@expo/ui/swift-ui';

// string returned by formPickerUtils when field has no value
const NO_DATE = 'No Date';

// menu options and labels for repeating (default: Once)
const ROUTINE_MENU_OPTIONS: { id: RoutineType; label: string }[] = [
  { id: 'once', label: 'Once' },
  { id: 'daily', label: 'Every day' },
  { id: 'weekly', label: 'Once a week' },
  { id: 'monthly', label: 'Once a month' },
  { id: 'yearly', label: 'Once a year' },
];
const ROUTINE_TYPE_LABELS: Record<RoutineType, string> = {
  once: 'Once',
  daily: 'Every day',
  weekly: 'Once a week',
  monthly: 'Once a month',
  yearly: 'Once a year',
};

export interface FormDetailSectionProps {
  onShowDatePicker: () => void;
  onShowTimeDurationPicker: () => void;
  onShowAlertsPicker: () => void;
  dateValue?: string;
  dateSecondaryValue?: string;
  time?: string;
  duration?: number;
  alertsCount?: number;
  routineType?: RoutineType;
  onRoutineTypeChange?: (routineType: RoutineType) => void;
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
  routineType = 'once',
  onRoutineTypeChange,
}) => {
  const themeColors = useThemeColors();
  const [isRepeatingMenuVisible, setIsRepeatingMenuVisible] = useState(false);

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
            backgroundColor={themeColors.background.primarySecondaryBlend()}
            separatorColor={themeColors.border.primary()}
            separatorInsetRight={Paddings.groupedListContentHorizontal}
            separatorVariant="solid"
            borderRadius={24}
            minimalStyle={false}
            separatorConsiderIconColumn={true}
            iconColumnWidth={30}
          >
            <FormDetailButton
              key="date"
              iconComponent={
                <SFSymbolIcon
                  name="calendar"
                  size={20}
                  color={themeColors.text.primary()}
                  fallback={<CalendarIcon size={18} color={themeColors.text.primary()} isSolid />}
                />
              }
              label={dateMainLabel}
              value={dateValue}
              onPress={onShowDatePicker}
              showChevron
            />
            <FormDetailButton
              key="time"
              iconComponent={
                <SFSymbolIcon
                  name="clock.fill"
                  size={20}
                  color={themeColors.text.primary()}
                  fallback={<ClockIcon size={18} color={themeColors.text.primary()} isSolid />}
                />
              }
              label={timeMainLabel}
              value={timeSubLabel}
              onPress={onShowTimeDurationPicker}
              showChevron
            />
            <FormDetailButton
              key="alerts"
              iconComponent={
                <SFSymbolIcon
                  name="bell.fill"
                  size={20}
                  color={themeColors.text.primary()}
                  fallback={<BellIcon size={18} color={themeColors.text.primary()} isSolid />}
                />
              }
              label={alertsMainLabel}
              value={alertsSubLabel}
              onPress={onShowAlertsPicker}
              showChevron
            />
          </GroupedList>

          {/* Repeating: iOS = native ContextMenu (liquid glass), Android = DropdownList */}
          {Platform.OS === 'ios' ? (
            <View style={styles.repeatingWrapper}>
              <Host matchContents={false} style={styles.repeatingHost}>
                <ContextMenu activationMethod="singlePress">
                  <ContextMenu.Trigger>
                    <View style={styles.repeatingTapArea}>
                      <View
                        style={[
                          styles.repeatingPill,
                          { backgroundColor: themeColors.background.primarySecondaryBlend() },
                        ]}
                      >
                        <SFSymbolIcon
                          name="repeat"
                          size={18}
                          color={themeColors.text.primary()}
                          fallback={<RepeatIcon size={18} color={themeColors.text.primary()} style={styles.repeatingIcon} />}
                          style={styles.repeatingIcon}
                        />
                        <Text style={[styles.repeatingText, { color: themeColors.text.primary() }]}>
                          {ROUTINE_TYPE_LABELS[routineType]}
                        </Text>
                      </View>
                    </View>
                  </ContextMenu.Trigger>
                  <ContextMenu.Items>
                    {ROUTINE_MENU_OPTIONS.map((opt) => (
                      <Button key={opt.id} onPress={() => onRoutineTypeChange?.(opt.id)}>
                        {opt.label}
                      </Button>
                    ))}
                  </ContextMenu.Items>
                </ContextMenu>
              </Host>
            </View>
          ) : (
            <>
              <Pressable
                style={styles.repeatingTapArea}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsRepeatingMenuVisible(true);
                }}
              >
                <View
                  style={[
                    styles.repeatingPill,
                    { backgroundColor: themeColors.background.primarySecondaryBlend() },
                  ]}
                >
                  <RepeatIcon size={18} color={themeColors.text.primary()} style={styles.repeatingIcon} />
                  <Text style={[styles.repeatingText, { color: themeColors.text.primary() }]}>
                    {ROUTINE_TYPE_LABELS[routineType]}
                  </Text>
                </View>
              </Pressable>
              <DropdownList
                visible={isRepeatingMenuVisible}
                onClose={() => setIsRepeatingMenuVisible(false)}
                items={ROUTINE_MENU_OPTIONS.map((opt) => ({
                  id: opt.id,
                  label: opt.label,
                  onPress: () => {
                    onRoutineTypeChange?.(opt.id);
                    setIsRepeatingMenuVisible(false);
                  },
                }))}
                anchorPosition="top-left"
                topOffset={120}
                leftOffset={20}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // --- LAYOUT STYLES ---
  container: {
    overflow: 'visible',
  },
  groupedListWrap: {
    marginBottom: 0,
  },
  listContainer: {
    marginVertical: 0,
  },
  repeatingWrapper: {
    marginTop: 12,
    alignSelf: 'stretch' as const,
  },
  repeatingHost: {
    alignSelf: 'stretch' as const,
  },
  // full-width tap area
  repeatingTapArea: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'stretch' as const,
    marginTop: 12,
    minHeight: 48,
  },
  repeatingIcon: {
    marginRight: Paddings.groupedListIconTextSpacing,
  },

  // --- PADDING STYLES ---
  repeatingPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    paddingVertical: Paddings.listItemVertical,
    paddingHorizontal: Paddings.groupedListContentHorizontal,
    borderRadius: 24,
    overflow: 'hidden',
  },

  // --- TYPOGRAPHY STYLES ---
  repeatingText: {
    ...getTextStyle('body-large'),
  },
});

export default FormDetailSection;

