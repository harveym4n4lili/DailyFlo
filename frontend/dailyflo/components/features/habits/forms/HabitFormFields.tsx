/**
 * shared habit form fields — grouped lists + section headers match browse settings / list-create.
 */

import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';

import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/List/GroupedList';
import { useThemeColors, useColorPalette } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { HABIT_COLORS, HABIT_FREQUENCIES, HABIT_WEEKDAYS } from './habitFormConstants';
import { getHabitFormListGroupProps, getHabitFormNameGroupProps } from './habitFormChrome';
import { HabitCustomDaysPicker } from './HabitCustomDaysPicker';
import { HabitReminderField } from './HabitReminderField';
import type { HabitColor, HabitFrequencyType, HabitTrackingType } from '@/types/api/habits';

export type HabitFormFieldsState = {
  title: string;
  trackingType: HabitTrackingType;
  targetValue: string;
  unitLabel: string;
  frequencyType: HabitFrequencyType;
  dayOfWeek: number;
  timesPerWeek: string;
  customDays: number[];
  reminderEnabled: boolean;
  reminderTime: string;
  color: HabitColor;
};

type HabitFormFieldsProps = HabitFormFieldsState & {
  onTitleChange: (value: string) => void;
  onTrackingTypeChange: (value: HabitTrackingType) => void;
  onTargetValueChange: (value: string) => void;
  onUnitLabelChange: (value: string) => void;
  onFrequencyTypeChange: (value: HabitFrequencyType) => void;
  onDayOfWeekChange: (value: number) => void;
  onTimesPerWeekChange: (value: string) => void;
  onCustomDaysChange: (days: number[]) => void;
  onReminderEnabledChange: (enabled: boolean) => void;
  onReminderTimeChange: (time: string) => void;
  onColorChange: (color: HabitColor) => void;
  /** create screen shows a short hint under the name field */
  showCreateHint?: boolean;
  autoFocusTitle?: boolean;
};

export function HabitFormFields({
  title,
  trackingType,
  targetValue,
  unitLabel,
  frequencyType,
  dayOfWeek,
  timesPerWeek,
  customDays,
  reminderEnabled,
  reminderTime,
  color,
  onTitleChange,
  onTrackingTypeChange,
  onTargetValueChange,
  onUnitLabelChange,
  onFrequencyTypeChange,
  onDayOfWeekChange,
  onTimesPerWeekChange,
  onCustomDaysChange,
  onReminderEnabledChange,
  onReminderTimeChange,
  onColorChange,
  showCreateHint = false,
  autoFocusTitle = false,
}: HabitFormFieldsProps) {
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const styles = useMemo(() => createStyles(), []);

  const listGroupProps = useMemo(() => getHabitFormListGroupProps(themeColors), [themeColors]);
  const nameGroupProps = useMemo(() => getHabitFormNameGroupProps(themeColors), [themeColors]);
  const groupedListIconColor = getMarpleBrandColor(500);

  const inputStyle = useMemo(
    () => [
      getTextStyle('body-large'),
      {
        color: themeColors.text.primary(),
        flex: 1,
        minWidth: 0,
        paddingVertical: Paddings.none,
        paddingHorizontal: Paddings.none,
        margin: 0,
        ...(Platform.OS === 'android' && {
          includeFontPadding: false,
          textAlignVertical: 'center' as const,
        }),
      },
    ],
    [themeColors],
  );

  return (
    <>
      <View style={styles.groupedListSectionFirst}>
        <GroupedList containerStyle={styles.listContainer} {...nameGroupProps}>
          <View style={styles.nameRow}>
            <TextInput
              value={title}
              onChangeText={onTitleChange}
              placeholder="Name"
              placeholderTextColor={themeColors.text.tertiary()}
              selectionColor="#FFFFFF"
              cursorColor="#FFFFFF"
              selectionHandleColor="#FFFFFF"
              underlineColorAndroid="transparent"
              accessibilityLabel="Habit name"
              style={inputStyle}
              autoFocus={autoFocusTitle}
              returnKeyType="done"
            />
          </View>
        </GroupedList>
        {showCreateHint ? (
          <Text style={[styles.createHint, { color: themeColors.text.secondary() }]}>
            Check off when done, or count toward a daily target you can +1 from the list.
          </Text>
        ) : null}
      </View>

      <GroupedListHeader title="Tracking" style={styles.sectionHeader} />
      <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
        {(['binary', 'numeric'] as HabitTrackingType[]).map((t) => (
          <FormDetailButton
            key={t}
            label={t === 'binary' ? 'Check off when done' : 'Count toward a target'}
            value={trackingType === t ? 'Selected' : ''}
            onPress={() => onTrackingTypeChange(t)}
            showChevron={false}
          />
        ))}
      </GroupedList>

      {trackingType === 'numeric' ? (
        <View style={styles.groupedListSection}>
          <GroupedList containerStyle={styles.listContainer} {...nameGroupProps}>
            <View style={styles.nameRow}>
              <TextInput
                value={targetValue}
                onChangeText={onTargetValueChange}
                placeholder="Daily target (e.g. 8)"
                placeholderTextColor={themeColors.text.tertiary()}
                keyboardType="number-pad"
                style={inputStyle}
              />
            </View>
            <View style={styles.nameRow}>
              <TextInput
                value={unitLabel}
                onChangeText={onUnitLabelChange}
                placeholder="Unit label (optional, e.g. glasses)"
                placeholderTextColor={themeColors.text.tertiary()}
                style={inputStyle}
              />
            </View>
          </GroupedList>
        </View>
      ) : null}

      <GroupedListHeader title="Schedule" style={styles.sectionHeader} />
      <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
        {HABIT_FREQUENCIES.map((f) => (
          <FormDetailButton
            key={f.id}
            label={f.label}
            value={frequencyType === f.id ? 'Selected' : ''}
            onPress={() => onFrequencyTypeChange(f.id)}
            showChevron={false}
          />
        ))}
      </GroupedList>

      {frequencyType === 'weekly' ? (
        <View style={styles.groupedListSection}>
          <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
            {HABIT_WEEKDAYS.map((d) => (
              <FormDetailButton
                key={d.value}
                label={d.label}
                value={dayOfWeek === d.value ? 'Selected' : ''}
                onPress={() => onDayOfWeekChange(d.value)}
                showChevron={false}
              />
            ))}
          </GroupedList>
        </View>
      ) : null}

      {frequencyType === 'custom' ? (
        <View style={styles.groupedListSection}>
          <HabitCustomDaysPicker selectedDays={customDays} onChange={onCustomDaysChange} />
        </View>
      ) : null}

      {frequencyType === 'times_per_week' ? (
        <View style={styles.groupedListSection}>
          <GroupedList containerStyle={styles.listContainer} {...nameGroupProps}>
            <View style={styles.nameRow}>
              <TextInput
                value={timesPerWeek}
                onChangeText={onTimesPerWeekChange}
                placeholder="Times per week"
                placeholderTextColor={themeColors.text.tertiary()}
                keyboardType="number-pad"
                style={inputStyle}
              />
            </View>
          </GroupedList>
        </View>
      ) : null}

      <GroupedListHeader title="Reminder" style={styles.sectionHeader} />
      <HabitReminderField
        enabled={reminderEnabled}
        timeHHMM={reminderTime}
        onEnabledChange={onReminderEnabledChange}
        onTimeChange={onReminderTimeChange}
        listGroupProps={listGroupProps}
        switchTrackColor={groupedListIconColor}
      />

      <GroupedListHeader title="Color" style={styles.sectionHeader} />
      <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
        {HABIT_COLORS.map((c) => (
          <FormDetailButton
            key={c}
            label={c.charAt(0).toUpperCase() + c.slice(1)}
            value={color === c ? 'Selected' : ''}
            onPress={() => onColorChange(c)}
            showChevron={false}
          />
        ))}
      </GroupedList>
    </>
  );
}

const createStyles = () =>
  StyleSheet.create({
    groupedListSectionFirst: {
      marginTop: 0,
    },
    groupedListSection: {
      marginTop: Paddings.section,
    },
    listContainer: {
      marginVertical: 0,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    sectionHeader: {
      marginTop: Paddings.section,
    },
    createHint: {
      ...getTextStyle('body-medium'),
      marginTop: Paddings.sectionCompact,
      paddingHorizontal: Paddings.touchTargetSmall,
    },
  });
