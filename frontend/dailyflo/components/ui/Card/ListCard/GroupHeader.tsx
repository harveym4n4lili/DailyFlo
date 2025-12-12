/**
 * GroupHeader Component
 * 
 * Displays a collapsible group header with title, count, and dropdown arrow.
 * Handles expand/collapse interactions and arrow rotation animations.
 * 
 * This component is used by ListCard to display group headers.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

interface GroupHeaderProps {
  // group title to display
  title: string;
  // number of tasks in the group
  count: number;
  // whether the group is currently collapsed
  isCollapsed: boolean;
  // animated rotation value for the arrow (0 = collapsed/right, 1 = expanded/down)
  arrowRotation: Animated.AnimatedInterpolation<string | number>;
  // callback when header is pressed
  onPress: () => void;
}

/**
 * GroupHeader Component
 * 
 * Renders a group header with title, count (when collapsed), and animated dropdown arrow.
 */
export default function GroupHeader({
  title,
  count,
  isCollapsed,
  arrowRotation,
  onPress,
}: GroupHeaderProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // create dynamic styles using theme colors and typography
  const styles = createStyles(themeColors, typography);

  return (
    <TouchableOpacity
      style={styles.groupHeader}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* group title and count container */}
      <View style={styles.groupTitleContainer}>
        <Text style={styles.groupTitle}>{title}</Text>
        {/* show count only when group is collapsed */}
        {isCollapsed && <Text style={styles.groupCount}>({count})</Text>}
      </View>

      {/* dropdown arrow icon with smooth rotation animation - positioned on the right */}
      <Animated.View
        style={[
          styles.animatedArrowContainer,
          {
            transform: [{ rotate: arrowRotation }], // apply rotation animation transform
          },
        ]}
      >
        <Ionicons
          name="chevron-down" // always use chevron-down icon since we handle rotation with animation
          size={16}
          color={themeColors.text.tertiary()}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) =>
  StyleSheet.create({
    // group header styling
    groupHeader: {
      flexDirection: 'row', // horizontal layout
      alignItems: 'center', // center align
      justifyContent: 'space-between', // space between title/count and arrow
      marginBottom: 12, // space between header and tasks
      paddingHorizontal: 4, // slight padding for alignment
      paddingVertical: 8, // add vertical padding for better touch target
    },

    // group title and count container styling
    groupTitleContainer: {
      flexDirection: 'row', // horizontal layout for title and count
      alignItems: 'center', // center align
      flex: 1, // take up available space
    },

    // group title text styling
    // using typography system for consistent text styling
    groupTitle: {
      // use the heading-4 text style from typography system (16px, bold, satoshi font)
      ...typography.getTextStyle('heading-4'),
      // use theme-aware primary text color from color system
      color: themeColors.text.primary(),
      marginRight: 8, // space between title and count
    },

    // group count text styling
    // using typography system for consistent text styling
    groupCount: {
      // use the body-large text style from typography system (14px, regular, satoshi font)
      ...typography.getTextStyle('body-large'),
      // use theme-aware tertiary text color from color system
      color: themeColors.text.tertiary(),
      fontWeight: '500',
    },

    // animated arrow container for smooth rotation animations
    animatedArrowContainer: {
      marginLeft: 8, // space between count and arrow
      justifyContent: 'center', // center the arrow icon
      alignItems: 'center', // center the arrow icon
    },
  });

