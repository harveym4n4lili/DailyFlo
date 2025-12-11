/**
 * GroupedListButton Component
 * 
 * Button-style item for GroupedList (settings page style).
 * Displays icon, label, value, and chevron in a pressable row.
 * This is the button-style component extracted from the original GroupedListItem.
 * 
 * Usage:
 * <GroupedListButton
 *   id="date"
 *   icon="calendar-outline"
 *   label="Date Picker"
 *   value="Today"
 *   onPress={() => {}}
 * />
 */

import React from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import type { GroupedListButtonProps } from './GroupedList.types';

/**
 * GroupedListButton Component
 * 
 * Button-style item with icon, label, value, and chevron.
 * Designed for settings pages and similar use cases.
 */
export const GroupedListButton: React.FC<GroupedListButtonProps> = ({
  icon,
  label,
  value,
  secondaryValue,
  onPress,
  disabled = false,
  customStyles,
}) => {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();

  // determine icon color (custom or default)
  const iconColor = customStyles?.icon?.color || themeColors.text.primary();
  const iconSize = customStyles?.icon?.size || 20;

  // determine text color for secondary value (lighter/tertiary)
  const labelColor = themeColors.text.secondary();

  // render the value - can be a string or custom component
  const renderValue = () => {
    if (typeof value === 'string') {
      return (
        <Text
          style={[
            getTextStyle('body-large'),
            {
              color: themeColors.text.tertiary?.() || labelColor,
            },
            customStyles?.value,
          ]}
        >
          {value}
        </Text>
      );
    }
    // if value is a custom component, render it directly
    return value;
  };

  // container style for the button
  const containerStyle: ViewStyle = {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    ...customStyles?.container, // allow custom container style override
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={containerStyle}
    >
      {/* left icon */}
      {icon && (
        <Ionicons
          name={icon}
          size={iconSize}
          color={iconColor}
          style={{ marginRight: 12 }}
        />
      )}

      {/* middle section: label and values */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* label text on the left */}
        <Text
          style={[
            getTextStyle('body-large'),
            {
              color: themeColors.text.primary(),
            },
            customStyles?.label,
          ]}
        >
          {label}
        </Text>

        {/* value(s) on the right */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* secondary value (if provided) - e.g., "Today", "In 3 days" */}
          {secondaryValue && (
            <Text
              style={[
                getTextStyle('body-large'),
                {
                  color: themeColors.text.tertiary?.() || labelColor,
                },
                customStyles?.secondaryValue,
              ]}
            >
              {secondaryValue}
            </Text>
          )}

          {/* main value - e.g., date string, "Optional" */}
          {renderValue()}
        </View>
      </View>

      {/* right chevron icon */}
      <Ionicons
        name="chevron-forward"
        size={16}
        color={themeColors.text.tertiary?.() || labelColor}
        style={{ marginLeft: 8 }}
      />
    </Pressable>
  );
};

export default GroupedListButton;

