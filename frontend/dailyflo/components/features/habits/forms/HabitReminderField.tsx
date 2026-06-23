/**
 * optional daily reminder time — saves as HH:MM on habit.reminderTime for Phase 4 local notifications.
 */

import React from 'react';
import { TextInput, Switch, View, Text, StyleSheet, Platform } from 'react-native';

import { GroupedList } from '@/components/ui/List/GroupedList';
import type { GroupedListProps } from '@/components/ui/List/GroupedList/GroupedList.types';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { formatWakeSleepLabel } from '@/utils/preferenceScheduleTimes';

type HabitReminderFieldProps = {
  enabled: boolean;
  timeHHMM: string;
  onEnabledChange: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
  listGroupProps: Pick<
    GroupedListProps,
    | 'backgroundColor'
    | 'separatorColor'
    | 'separatorInsetRight'
    | 'separatorVariant'
    | 'borderRadius'
    | 'minimalStyle'
    | 'separatorConsiderIconColumn'
    | 'iconColumnWidth'
    | 'itemPadding'
  >;
  switchTrackColor: string;
};

export function HabitReminderField({
  enabled,
  timeHHMM,
  onEnabledChange,
  onTimeChange,
  listGroupProps,
  switchTrackColor,
}: HabitReminderFieldProps) {
  const themeColors = useThemeColors();
  const timeLabel = formatWakeSleepLabel(timeHHMM, '09:00', '12h');

  return (
    <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
      <View style={styles.toggleRow}>
        <View style={styles.rowText}>
          <Text style={[getTextStyle('body-large'), { color: themeColors.text.primary() }]}>
            Daily reminder
          </Text>
          <Text style={[getTextStyle('body-small'), { color: themeColors.text.secondary() }]}>
            {enabled ? timeLabel : 'Off — local notification when habit is due today'}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onEnabledChange}
          accessibilityLabel="Daily habit reminder"
          trackColor={{
            false: themeColors.interactive.tertiary(),
            true: switchTrackColor,
          }}
          thumbColor={themeColors.background.elevated()}
          ios_backgroundColor={themeColors.interactive.tertiary()}
        />
      </View>
      {enabled ? (
        <View style={styles.timeRow}>
          <TextInput
            placeholder="HH:MM (24h, e.g. 09:00)"
            placeholderTextColor={themeColors.text.tertiary()}
            value={timeHHMM}
            onChangeText={onTimeChange}
            keyboardType="numbers-and-punctuation"
            style={[
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
            ]}
          />
        </View>
      ) : null}
    </GroupedList>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    marginVertical: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    marginRight: Paddings.groupedListIconTextSpacing,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});
