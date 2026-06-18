/**
 * shared habit form fields — grouped lists + section headers match browse settings / list-create.
 */

import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';

import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/List/GroupedList';
import { WeekdayCirclePicker, WEEKDAY_PICKER_TRACK_HEIGHT } from '@/components/ui/WeekdayCirclePicker';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { getHabitFormListGroupProps, getHabitFormNameGroupProps } from './habitFormChrome';
import { HabitNameDescriptionSection } from './HabitNameDescriptionSection';
import type { HabitTrackingType } from '@/types/api/habits';

export type HabitFormFieldsState = {
  title: string;
  description: string;
  trackingType: HabitTrackingType;
  targetValue: string;
  unitLabel: string;
  /** which weekdays the habit is due — 0 = Monday … 6 = Sunday */
  scheduleDays: number[];
};

type HabitFormFieldsProps = HabitFormFieldsState & {
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTrackingTypeChange: (value: HabitTrackingType) => void;
  onTargetValueChange: (value: string) => void;
  onUnitLabelChange: (value: string) => void;
  onScheduleDaysChange: (days: number[]) => void;
  autoFocusTitle?: boolean;
  /** remounts description field after edit screen loads habit from API */
  descriptionInputKey?: string;
};

export function HabitFormFields({
  title,
  description,
  trackingType,
  targetValue,
  unitLabel,
  scheduleDays,
  onTitleChange,
  onDescriptionChange,
  onTrackingTypeChange,
  onTargetValueChange,
  onUnitLabelChange,
  onScheduleDaysChange,
  autoFocusTitle = false,
  descriptionInputKey,
}: HabitFormFieldsProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(), []);

  const listGroupProps = useMemo(() => getHabitFormListGroupProps(themeColors), [themeColors]);
  const nameGroupProps = useMemo(() => getHabitFormNameGroupProps(themeColors), [themeColors]);

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
        <HabitNameDescriptionSection
          title={title}
          onTitleChange={onTitleChange}
          description={description}
          onDescriptionChange={onDescriptionChange}
          autoFocusTitle={autoFocusTitle}
          descriptionInputKey={descriptionInputKey}
        />
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

      <GroupedListHeader title="Frequency" style={styles.sectionHeader} />
      <GroupedList
        containerStyle={styles.listContainer}
        {...listGroupProps}
        contentPaddingHorizontal={0}
        contentPaddingVertical={0}
        contentMinHeight={WEEKDAY_PICKER_TRACK_HEIGHT}
      >
        <WeekdayCirclePicker
          mode="multi"
          selectedDays={scheduleDays}
          onChange={onScheduleDaysChange}
        />
      </GroupedList>
      <Text style={[styles.scheduleHint, { color: themeColors.text.secondary() }]}>
        Tap the days this habit is due.
      </Text>
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
    scheduleHint: {
      ...getTextStyle('body-medium'),
      marginTop: Paddings.sectionCompact,
      paddingHorizontal: Paddings.touchTargetSmall,
    },
  });
