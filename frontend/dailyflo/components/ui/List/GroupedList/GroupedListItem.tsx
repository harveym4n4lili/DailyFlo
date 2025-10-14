/**
 * GroupedListItem Component
 * 
 * Individual row item within a GroupedList.
 * Handles rendering of icon, label, value, and chevron.
 * Applies appropriate styling based on position (first/middle/last).
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import type { GroupedListItemProps } from './GroupedList.types';

export const GroupedListItem: React.FC<GroupedListItemProps> = ({
  config,
  position,
  showSeparator,
  borderRadius,
  separatorColor,
  itemStyle,
}) => {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();

  // determine which corners should be rounded based on item position
  // first item: round top corners
  // last item: round bottom corners
  // middle items: no rounded corners
  // only item: round all corners
  const getBorderRadiusStyle = () => {
    switch (position) {
      case 'first':
        return {
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
        };
      case 'last':
        return {
          borderBottomLeftRadius: borderRadius,
          borderBottomRightRadius: borderRadius,
        };
      case 'only':
        return {
          borderRadius: borderRadius,
        };
      case 'middle':
      default:
        return {};
    }
  };

  // separator style applied to all items except the last one
  // creates the horizontal line between items
  const separatorStyle = showSeparator
    ? {
        borderBottomWidth: 1,
        borderBottomColor: separatorColor,
      }
    : {};

  // combine all container styles
  const containerStyle = [
    {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: themeColors.background.elevated(),
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    getBorderRadiusStyle(),
    separatorStyle,
    itemStyle, // parent-level override
    config.customStyles?.container, // item-specific override
  ];

  // determine icon color (custom or default)
  const iconColor = config.customStyles?.icon?.color || themeColors.text.primary();
  const iconSize = config.customStyles?.icon?.size || 20;

  // determine text color for secondary value (lighter/tertiary)
  const labelColor = themeColors.text.secondary();

  // render the value - can be a string or custom component
  const renderValue = () => {
    if (typeof config.value === 'string') {
      return (
        <Text
          style={[
            getTextStyle('body-large'),
            {
              color: themeColors.text.tertiary?.() || labelColor,
            },
            config.customStyles?.value,
          ]}
        >
          {config.value}
        </Text>
      );
    }
    // if value is a custom component, render it directly
    return config.value;
  };

  return (
    <Pressable
      onPress={config.onPress}
      disabled={config.disabled}
      style={containerStyle}
    >
      {/* left icon */}
      <Ionicons
        name={config.icon}
        size={iconSize}
        color={iconColor}
        style={{ marginRight: 12 }}
      />

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
            config.customStyles?.label,
          ]}
        >
          {config.label}
        </Text>

        {/* value(s) on the right */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* secondary value (if provided) - e.g., "Today", "In 3 days" */}
          {config.secondaryValue && (
            <Text
              style={[
                getTextStyle('body-large'),
                {
                  color: themeColors.text.tertiary?.() || labelColor,
                },
                config.customStyles?.secondaryValue,
              ]}
            >
              {config.secondaryValue}
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

export default GroupedListItem;

