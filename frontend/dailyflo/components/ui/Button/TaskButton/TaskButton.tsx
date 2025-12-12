/**
 * TaskButton Component
 * 
 * Reusable button component for task-related actions.
 * Contains a label and icon, styled with task category colors.
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { TaskCategoryColors } from '@/constants/ColorPalette';
import type { TaskColor } from '@/types';

/**
 * Props for TaskButton component
 */
export interface TaskButtonProps {
  /** Label text to display */
  label: string;
  
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  
  /** Task category color for styling */
  taskCategoryColor: TaskColor;
  
  /** Callback when button is pressed */
  onPress: () => void;
  
  /** Whether the button is disabled */
  disabled?: boolean;
  
  /** Whether to use primary button styling (primary background with white text) */
  primary?: boolean;
  
  /** Optional custom style override */
  style?: ViewStyle;
  
  /** Optional custom text style override */
  textStyle?: TextStyle;
  
  /** Icon size */
  iconSize?: number;
}

/**
 * TaskButton Component
 * 
 * Displays a button with an icon and label, styled with task category colors.
 */
export const TaskButton: React.FC<TaskButtonProps> = ({
  label,
  icon,
  taskCategoryColor,
  onPress,
  disabled = false,
  primary = false,
  style,
  textStyle,
  iconSize = 20,
}) => {
  // get theme-aware colors for styling
  const themeColors = useThemeColors();
  // get typography system for consistent text styling
  const typography = useTypography();
  
  // determine background color - primary uses light overlay, otherwise uses elevated background
  const backgroundColor = primary 
    ? themeColors.background.lightOverlay() // light overlay background for primary button
    : themeColors.background.elevated();
  
  // determine text and icon color - primary uses lightest task color shade, otherwise uses task category color
  const textColor = primary 
    ? TaskCategoryColors[taskCategoryColor][50] // lightest shade of task category color for primary button
    : themeColors.text.primary();
  const iconColor = primary 
    ? TaskCategoryColors[taskCategoryColor][50] // lightest shade of task category color for primary button icon
    : TaskCategoryColors[taskCategoryColor][500];
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: backgroundColor,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* icon container */}
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon}
          size={iconSize}
          color={iconColor}
        />
      </View>
      
      {/* label text */}
      <Text
        style={[
          typography.getTextStyle('heading-4'),
          styles.label,
          {
            color: textColor,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// STYLES
// stylesheet for component styling
const styles = StyleSheet.create({
  // button container - horizontal layout with icon and label
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // center icon and label horizontally
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24, // matches GroupedList border radius
    gap: 8, // space between icon and label
  },
  
  // icon container - wraps icon for consistent spacing
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // label text style
  label: {
    // removed flex: 1 to allow content to be centered instead of taking full width
  },
});

export default TaskButton;

