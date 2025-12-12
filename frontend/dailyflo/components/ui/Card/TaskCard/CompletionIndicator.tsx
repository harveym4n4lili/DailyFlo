/**
 * CompletionIndicator Component
 * 
 * Displays a green checkmark icon when a task is completed.
 * The indicator is positioned absolutely in the top-right corner of the card.
 * 
 * This component is used by TaskCard to show completion status.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSemanticColors } from '@/hooks/useColorPalette';

interface CompletionIndicatorProps {
  // whether the task is completed
  isCompleted: boolean;
}

/**
 * CompletionIndicator Component
 * 
 * Renders a green checkmark icon when the task is completed.
 * Returns null if the task is not completed.
 */
export default function CompletionIndicator({ isCompleted }: CompletionIndicatorProps) {
  const semanticColors = useSemanticColors();

  // don't render if task is not completed
  if (!isCompleted) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Ionicons
        name="checkmark"
        size={20}
        color={semanticColors.success()} // green checkmark
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // completion indicator container - positioned absolutely in top-right corner
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    justifyContent: 'center', // center checkmark icon
    alignItems: 'center', // center checkmark icon
  },
});

