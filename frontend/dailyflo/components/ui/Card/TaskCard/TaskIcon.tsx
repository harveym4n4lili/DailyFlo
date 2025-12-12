/**
 * TaskIcon Component
 * 
 * Displays the task icon in the task's color. The icon is shown without a circle background,
 * just the icon itself in the task color as a stroke.
 * 
 * This component is used by TaskCard to display the task's icon on the left side.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TaskIconProps {
  // icon name from Ionicons
  icon: string;
  // color to display the icon in (task color)
  color: string;
  // icon size (default: 24)
  size?: number;
}

/**
 * TaskIcon Component
 * 
 * Renders a task icon in the specified color without any background or circle.
 */
export default function TaskIcon({ icon, color, size = 24 }: TaskIconProps) {
  return (
    <View style={styles.container}>
      <Ionicons
        name={icon as any}
        size={size}
        color={color}
        style={styles.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // container for the icon
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // icon styling - no circle, just icon in task color stroke
  icon: {
    // icon color is set via color prop in Ionicons component
  },
});

