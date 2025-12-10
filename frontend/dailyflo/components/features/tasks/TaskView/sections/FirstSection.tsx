/**
 * FirstSection Component
 * 
 * The first section of the task view modal containing:
 * - Task icon and title
 * - Task description
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { TaskCategoryColors } from '@/constants/ColorPalette';
import type { Task, TaskColor } from '@/types';

export interface FirstSectionProps {
  /** Task data */
  task?: Task;
  
  /** Task color for styling (defaults to task.color or 'blue') */
  taskColor?: TaskColor;
}

/**
 * FirstSection Component
 * 
 * Displays the task icon, title, and description in an elevated container.
 */
export const FirstSection: React.FC<FirstSectionProps> = ({ task, taskColor }) => {
  // HOOKS
  // get theme-aware colors for styling
  const themeColors = useThemeColors();
  // get typography system for text styling
  const typography = useTypography();

  // get task color for styling (use prop, task.color, or default to 'blue')
  // this determines the color used for the icon and title
  const color: TaskColor = taskColor || task?.color || 'blue';

  // get task category colors for icon and title
  // icon uses the base color (500 shade) for visibility
  const iconColor = TaskCategoryColors[color][500];
  // title uses the lightest version (50 shade) for subtle styling
  const titleColor = TaskCategoryColors[color][50];

  // TEXT STYLES
  // create text styles inside component to access typography hook
  // task title uses heading-3 typography style with bold weight
  const taskTitleStyle = {
    flex: 1, // take up remaining space after icon
    ...typography.getTextStyle('heading-3'), // use heading-3 typography style
    fontWeight: '700' as const, // bold for emphasis
    color: titleColor, // lightest version of task color for title
  };

  // task description uses body-large typography style
  const taskDescriptionStyle = {
    ...typography.getTextStyle('body-large'), // use body-large typography style
    lineHeight: 22, // comfortable line height for readability
    color: themeColors.text.primary(), // primary text color
  };

  return (
    <View style={styles.elevatedContainer}>
      {/* top layer: icon and task title */}
      <View style={styles.topLayer}>
        {/* task icon - displayed without container */}
        {task?.icon && (
          <Ionicons
            name={task.icon as any}
            size={24}
            color={iconColor}
            style={styles.icon}
          />
        )}
        
        {/* task title */}
        <Text 
          style={taskTitleStyle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {task?.title || 'Untitled Task'}
        </Text>
      </View>

      {/* second layer: task description */}
      {task?.description && (
        <View style={styles.secondLayer}>
          {/* description icon - smaller icon on the left */}
          <Ionicons
            name="menu-outline"
            size={16}
            color={themeColors.text.secondary()}
            style={styles.descriptionIcon}
          />
          <Text 
            style={[taskDescriptionStyle, styles.descriptionText]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {task.description}
          </Text>
        </View>
      )}
    </View>
  );
};

// STYLES
// stylesheet for component styling
const styles = StyleSheet.create({
  // elevated container - contains both layers (icon + title and description)
  elevatedContainer: {
    // no additional styling needed, parent handles background and padding
  },
  
  // top layer - contains icon and task title
  topLayer: {
    flexDirection: 'row', // horizontal layout for icon and title
    alignItems: 'center', // vertically center icon and title
    marginBottom: 12, // space between top layer and second layer
  },
  
  // icon style - spacing for task icon (no container)
  icon: {
    marginRight: 12, // space between icon and title
  },
  
  // second layer - contains task description
  secondLayer: {
    marginTop: 0, // no top margin (spacing handled by topLayer marginBottom)
    flexDirection: 'row', // horizontal layout for icon and description
    alignItems: 'flex-start', // align to top for multi-line text
  },
  
  // description icon style - smaller icon on the left of description
  descriptionIcon: {
    marginRight: 8, // space between icon and description text
    marginTop: 2, // slight top offset to align with first line of text
  },
  
  // description text style - ensures text doesn't overflow container
  descriptionText: {
    flex: 1, // take up remaining space after icon
    flexShrink: 1, // allow text to shrink if needed
  },
});

export default FirstSection;

