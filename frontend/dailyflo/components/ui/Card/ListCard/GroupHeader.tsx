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
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

interface GroupHeaderProps {
  // group title to display
  title: string;
  // number of tasks in the group
  count: number;
  // whether the group is currently collapsed
  isCollapsed: boolean;
  // animated rotation value for the arrow (0 = collapsed/right, 1 = expanded/down)
  arrowRotation: Animated.AnimatedInterpolation<string | number>;
  // optional handler for a secondary action shown next to the arrow (e.g. "Reschedule")
  // this lets parent components add custom actions for specific groups like "Overdue"
  onSecondaryActionPress?: () => void;
  // optional flag to control visibility of the secondary action label
  // when true, we render a tappable text button before the dropdown arrow
  showSecondaryAction?: boolean;
  /** when false (e.g. Today’s date group): no chevron, title is not tappable to collapse */
  collapsible?: boolean;
  // callback when header is pressed (expand/collapse); ignored when collapsible is false
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
  onSecondaryActionPress,
  showSecondaryAction,
  collapsible = true,
  onPress,
}: GroupHeaderProps) {
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();

  // create dynamic styles using theme colors, semantic colors, and typography
  const styles = createStyles(themeColors, semanticColors, typography);

  const titleBlock = (
    <View style={styles.groupTitleContainer}>
      <Text style={styles.groupTitle}>{title}</Text>
      {collapsible && isCollapsed && <Text style={styles.groupCount}>({count})</Text>}
    </View>
  );

  return (
    <View style={styles.groupHeader}>
      {/* title: tappable only when group can collapse */}
      {collapsible ? (
        <TouchableOpacity style={styles.leftContainer} onPress={onPress} activeOpacity={0.7}>
          {titleBlock}
        </TouchableOpacity>
      ) : (
        <View style={styles.leftContainer}>{titleBlock}</View>
      )}

      {/* Reschedule button - separate touchable so tap doesn't trigger group toggle */}
      {showSecondaryAction && onSecondaryActionPress && (
        <TouchableOpacity
          onPress={onSecondaryActionPress}
          activeOpacity={0.7}
          style={styles.secondaryActionButton}
        >
          <Text style={styles.secondaryActionText}>Reschedule</Text>
        </TouchableOpacity>
      )}

      {collapsible && (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.animatedArrowContainer}
        >
          <Animated.View
            style={{
              transform: [{ rotate: arrowRotation }],
            }}
          >
            <Ionicons
              name="chevron-down"
              size={20}
              color={themeColors.text.tertiary()}
            />
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// create dynamic styles using theme colors, semantic colors, and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  semanticColors: ReturnType<typeof useSemanticColors>,
  typography: ReturnType<typeof useTypography>
) =>
  StyleSheet.create({
    // --- LAYOUT STYLES ---
    // container for title/count and optional secondary action
    leftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    // group title and count container styling
    groupTitleContainer: {
      flexDirection: 'row', // horizontal layout for title and count
      alignItems: 'center', // center align
      flex: 1, // take up available space
    },

    // animated arrow container - touchable for toggle, centers the chevron (matches GroupedListHeader)
    animatedArrowContainer: {
      marginLeft: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // --- PADDING STYLES ---
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 0,
      paddingLeft: Paddings.touchTargetSmall,
      paddingRight: 0, // chevron flush to list/card right edge; left inset keeps title aligned with content
      // top: breathing room above title; bottom: small gap before first task (see Paddings.groupHeaderPaddingBottom)
      paddingTop: Paddings.listItemVertical,
      paddingBottom: Paddings.groupHeaderPaddingBottom,
    },
    // secondary action (e.g. Reschedule): margins + hit-friendly padding from shared tokens
    secondaryActionButton: {
      marginLeft: 8,
      marginRight: 4,
      paddingHorizontal: Paddings.touchTarget,
      paddingVertical: Paddings.touchTargetSmall,
    },

    // --- TYPOGRAPHY STYLES ---
    groupTitle: {
      ...typography.getTextStyle('heading-4'),
      color: themeColors.text.secondary(),
      marginRight: 8,
    },
    groupCount: {
      ...typography.getTextStyle('body-large'),
      color: themeColors.text.tertiary(),
    },
    secondaryActionText: {
      ...typography.getTextStyle('body-medium'),
      color: semanticColors.error(),
    },
  });

