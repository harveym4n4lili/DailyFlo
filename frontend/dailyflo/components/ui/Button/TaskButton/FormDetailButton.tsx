/**
 * FormDetailButton Component
 *
 * Button-style item for GroupedList in task forms (settings page style).
 * Displays icon, label, value, and chevron in a pressable row.
 * Designed for task creation/editing pickers (Date, Time, Alerts, etc.).
 *
 * Usage:
 * <FormDetailButton
 *   icon="calendar-outline"
 *   label="Date"
 *   value="Today"
 *   onPress={() => {}}
 * />
 */

import React from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
// import FormDetailButtonProps type from GroupedList types
import type { FormDetailButtonProps } from '@/components/ui/List/GroupedList/GroupedList.types';

// re-export the type for convenience
export type { FormDetailButtonProps };

/**
 * FormDetailButton Component
 *
 * Button-style item with icon, label, value, and chevron.
 * Used in task forms for picker rows (Date, Time & Duration, Alerts, etc.).
 */
export const FormDetailButton: React.FC<FormDetailButtonProps> = ({
  icon,
  iconComponent,
  label,
  value,
  secondaryValue,
  onPress,
  disabled = false,
  showChevron = true, // default to showing chevron for backward compatibility
  customStyles,
}) => {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();

  // determine icon color (custom or default)
  const iconColor = customStyles?.icon?.color || themeColors.text.primary();
  const iconSize = customStyles?.icon?.size || 20;
  const showLeftIcon = iconComponent != null || icon != null;

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

  // container style: no padding/minHeight here; GroupedListItemWrapper provides them
  const containerStyle: ViewStyle = {
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
      {/* left icon: custom iconComponent or Ionicons when icon name provided */}
      {showLeftIcon && (
        <View style={{ marginRight: 12 }}>
          {iconComponent != null ? (
            iconComponent
          ) : (
            <Ionicons
              name={icon!}
              size={iconSize}
              color={iconColor}
            />
          )}
        </View>
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

      {/* right chevron icon - only shown if showChevron is true */}
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={themeColors.text.tertiary?.() || labelColor}
          style={{ marginLeft: 8 }}
        />
      )}
    </Pressable>
  );
};

export default FormDetailButton;
