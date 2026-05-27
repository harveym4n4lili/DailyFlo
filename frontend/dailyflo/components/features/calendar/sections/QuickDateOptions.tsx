/**
 * QuickDateOptions Component
 *
 * Quick date selection rows inside a GroupedList (Today, Tomorrow, This Weekend, etc.).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CalendarIcon, SFSymbolIcon } from '@/components/ui/Icon';
import { GroupedList } from '@/components/ui/List/GroupedList';
import { getTextStyle } from '@/constants/Typography';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';

/** same 18px + 30px icon column as alert-select grouped rows */
const GROUPED_LIST_ICON_SIZE = 18;
const GROUPED_LIST_ICON_COLUMN_WIDTH = 30;

export interface QuickDateOptionsProps {
  /** currently selected date (ISO string) — reserved for future selected-row styling */
  selectedDate: string;
  /** parent receives ISO date + option label when a row is tapped */
  onSelectDate: (date: string, optionName: string) => void;
}

export const QuickDateOptions: React.FC<QuickDateOptionsProps> = ({
  onSelectDate,
}) => {
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const iconColor = getMarpleBrandColor(500);

  const getDateFromToday = (daysFromToday: number | null): string => {
    if (daysFromToday === null) return '';
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  };

  const getDayOfWeek = (dateString: string): string => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getThisWeekendDate = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;

    const weekendDate = new Date(today);
    weekendDate.setDate(today.getDate() + daysUntilSaturday);
    weekendDate.setHours(0, 0, 0, 0);
    return weekendDate.toISOString();
  };

  const quickOptions: {
    label: string;
    daysFromToday: number | null;
    systemImage: string;
    fallbackIcon: keyof typeof Ionicons.glyphMap;
    isSpecial?: 'weekend' | 'no-deadline';
  }[] = [
    { label: 'Today', daysFromToday: 0, systemImage: 'calendar', fallbackIcon: 'calendar' },
    { label: 'Tomorrow', daysFromToday: 1, systemImage: 'sun.max.fill', fallbackIcon: 'sunny' },
    {
      label: 'This Weekend',
      daysFromToday: null,
      systemImage: 'calendar.badge.clock',
      fallbackIcon: 'calendar-outline',
      isSpecial: 'weekend',
    },
    { label: 'Next Week', daysFromToday: 7, systemImage: 'arrow.right', fallbackIcon: 'arrow-forward' },
    {
      label: 'No Deadline',
      daysFromToday: null,
      systemImage: 'xmark.circle.fill',
      fallbackIcon: 'remove-circle',
      isSpecial: 'no-deadline',
    },
  ];

  return (
    <GroupedList
      containerStyle={styles.listContainer}
      backgroundColor={themeColors.background.primarySecondaryBlend()}
      separatorColor={themeColors.border.primary()}
      separatorInsetRight={Paddings.groupedListContentHorizontal}
      separatorVariant="solid"
      borderRadius={24}
      minimalStyle={false}
      separatorConsiderIconColumn
      iconColumnWidth={GROUPED_LIST_ICON_COLUMN_WIDTH}
    >
      {quickOptions.map((option) => {
        let optionDate = '';
        if (option.isSpecial === 'weekend') {
          optionDate = getThisWeekendDate();
        } else if (option.isSpecial === 'no-deadline') {
          optionDate = '';
        } else {
          optionDate = getDateFromToday(option.daysFromToday);
        }

        const dayOfWeek = option.isSpecial === 'no-deadline' ? '—' : getDayOfWeek(optionDate);

        return (
          <TouchableOpacity
            key={option.label}
            onPress={() => onSelectDate(optionDate, option.label)}
            activeOpacity={0.6}
            style={styles.optionRow}
            accessibilityRole="button"
            accessibilityLabel={`Select ${option.label}${dayOfWeek ? `, ${dayOfWeek}` : ''}`}
          >
            <View style={styles.leadingIconWrap}>
              <SFSymbolIcon
                name={option.systemImage}
                size={GROUPED_LIST_ICON_SIZE}
                color={iconColor}
                fallback={
                  option.systemImage === 'calendar_today' ? (
                    <CalendarIcon size={GROUPED_LIST_ICON_SIZE} color={iconColor} isSolid />
                  ) : (
                    <Ionicons name={option.fallbackIcon} size={GROUPED_LIST_ICON_SIZE} color={iconColor} />
                  )
                }
              />
            </View>

            <Text
              style={[
                getTextStyle('body-large'),
                styles.label,
                { color: themeColors.text.primary() },
              ]}
            >
              {option.label}
            </Text>

            <Text
              style={[
                getTextStyle('body-large'),
                styles.dayOfWeekText,
                { color: themeColors.text.tertiary?.() || themeColors.text.secondary() },
              ]}
            >
              {dayOfWeek}
            </Text>
          </TouchableOpacity>
        );
      })}
    </GroupedList>
  );
};

const styles = StyleSheet.create({
  listContainer: { marginVertical: 0 },
  optionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leadingIconWrap: {
    marginRight: Paddings.groupedListIconTextSpacing,
  },
  label: {
    flex: 1,
    marginRight: Paddings.groupedListIconTextSpacing,
  },
  dayOfWeekText: {},
});

export default QuickDateOptions;
