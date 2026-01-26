/**
 * TimelineSubtaskButton Component
 * 
 * Displays a button showing subtask completion count with an animated dropdown arrow.
 * Toggles subtask list expansion when pressed.
 * Positioned absolutely at the bottom of the task card.
 * 
 * This component is used by TimelineItem to show and toggle subtask visibility.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useDropdownArrowAnimation } from '@/hooks/useDropdownArrowAnimation';
import { Task } from '@/types';

interface TimelineSubtaskButtonProps {
  // task to display subtask count for
  task: Task;
  // whether subtasks are currently expanded
  isExpanded: boolean;
  // callback when button is pressed (to toggle expansion)
  onToggle: () => void;
}

/**
 * TimelineSubtaskButton Component
 * 
 * Renders a button with subtask completion count and animated dropdown arrow.
 * Provides haptic feedback on press.
 */
export default function TimelineSubtaskButton({
  task,
  isExpanded,
  onToggle,
}: TimelineSubtaskButtonProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  
  // dropdown arrow animation hook
  const { arrowRotation, toggle: toggleArrow } = useDropdownArrowAnimation(isExpanded);

  // handle subtask button press - toggle expansion and animate card height
  const handleSubtaskPress = () => {
    // provide light haptic feedback when subtask button is pressed
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const willBeExpanded = !isExpanded;
    toggleArrow(willBeExpanded);
    
    // notify parent to update expansion state
    // the card height will automatically update via cardHeight calculation
    // and this will be reported to parent via animation listener
    onToggle();
  };

  // calculate completed and total subtask counts
  const completedCount = task.metadata?.subtasks?.filter(st => st.isCompleted).length ?? 0;
  const totalCount = task.metadata?.subtasks?.length ?? 0;

  // create dynamic styles using theme colors and typography
  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

  // don't render if no subtasks
  if (totalCount === 0) return null;

  return (
    <TouchableOpacity
      style={[
        styles.subtaskButton,
        { left: 16 }, // align with task content padding (icon is now separate)
      ]}
      onPress={handleSubtaskPress}
      activeOpacity={0.7}
    >
      <View style={styles.subtaskContainer}>
        {/* checkbox icon on the left */}
        <Ionicons
          name="checkbox-outline"
          size={14}
          color={themeColors.text.secondary()}
          style={styles.subtaskIcon}
        />
        {/* subtask count text */}
        <Text style={styles.subtaskText}>
          {completedCount}/{totalCount}
        </Text>
        {/* dropdown arrow icon on the right - animated */}
        <Animated.View
          style={[
            styles.subtaskDropdownIconContainer,
            {
              transform: [{ rotate: arrowRotation }],
            },
          ]}
        >
          <Ionicons
            name="chevron-down"
            size={12}
            color={themeColors.text.secondary()}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // subtask button - absolutely positioned layer above task card
  subtaskButton: {
    position: 'absolute',
    bottom: 12, // position at bottom with padding
    right: 0, // match container paddingRight
    zIndex: 10, // layer above task card
    // left is set dynamically based on icon presence
  },

  // subtask container - wraps subtask count text with border radius, padding, and border
  subtaskContainer: {
    flexDirection: 'row', // horizontal layout for checkbox, text, and dropdown arrow
    alignItems: 'center', // vertically center all items
    alignSelf: 'flex-start', // align to start (left)
    paddingVertical: 4, // vertical padding
    paddingHorizontal: 8, // horizontal padding
    borderRadius: 16, // border radius for rounded container
    borderWidth: 0, // no border
    borderColor: themeColors.text.tertiary(), // border color (not used when borderWidth is 0)
    backgroundColor: themeColors.background.tertiary(), // use tertiary background color from theme
  },

  // subtask icon styling (checkbox on the left)
  subtaskIcon: {
    marginRight: 4, // spacing between checkbox and text
  },

  // subtask dropdown icon container - for animation
  subtaskDropdownIconContainer: {
    marginLeft: 2, // spacing between text and dropdown arrow
  },

  // subtask text styling - matches TaskMetadata styling
  subtaskText: {
    // use the body-medium text style from typography system (12px, regular, satoshi font)
    ...typography.getTextStyle('body-medium'),
    // use secondary text color - lighter than tertiary
    color: themeColors.text.secondary(),
    fontWeight: '900', // match TaskMetadata font weight
  },
});

