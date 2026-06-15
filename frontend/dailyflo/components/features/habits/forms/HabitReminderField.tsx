/**
 * optional daily reminder time — saves as HH:MM on habit.reminderTime for Phase 4 local notifications.
 */

import React from 'react';
import { TextInput, Switch, View, Text, StyleSheet } from 'react-native';

import { GroupedList } from '@/components/ui/List/GroupedList';
import { useThemeColors, useBrandColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { formatWakeSleepLabel } from '@/utils/preferenceScheduleTimes';

type HabitReminderFieldProps = {
  enabled: boolean;
  timeHHMM: string;
  onEnabledChange: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
};

export function HabitReminderField({
  enabled,
  timeHHMM,
  onEnabledChange,
  onTimeChange,
}: HabitReminderFieldProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const { getMarpleBrandColor } = useBrandColors();
  const timeLabel = formatWakeSleepLabel(timeHHMM, '09:00', '12h');

  return (
    <>
      <GroupedList
        backgroundColor={themeColors.background.primarySecondaryBlend()}
        borderRadius={24}
      >
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[typography.getTextStyle('body-medium'), { color: themeColors.text.primary() }]}>
              Daily reminder
            </Text>
            <Text style={[typography.getTextStyle('body-small'), { color: themeColors.text.secondary() }]}>
              {enabled ? timeLabel : 'Off — local notification when habit is due today'}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={onEnabledChange}
            trackColor={{ false: themeColors.text.tertiary(), true: getMarpleBrandColor(500) }}
          />
        </View>
      </GroupedList>
      {enabled ? (
        <TextInput
          placeholder="HH:MM (24h, e.g. 09:00)"
            placeholderTextColor={themeColors.text.tertiary()}
            value={timeHHMM}
            onChangeText={onTimeChange}
            keyboardType="numbers-and-punctuation"
            style={[
              styles.input,
              {
                color: themeColors.text.primary(),
                backgroundColor: themeColors.background.primarySecondaryBlend(),
              },
          ]}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Paddings.groupedListContentHorizontal,
    paddingVertical: Paddings.listItemVertical,
  },
  rowText: {
    flex: 1,
    marginRight: Paddings.sectionCompact,
  },
  input: {
    borderRadius: Paddings.formDataPillRadius,
    paddingHorizontal: Paddings.groupedListContentHorizontal,
    paddingVertical: Paddings.listItemVertical,
    fontSize: 16,
  },
});
