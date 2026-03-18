/**
 * GroupedListHeader Component
 *
 * Section header for grouped list sections. Matches ListCard GroupHeader styling
 * (heading-4 typography, 12px vertical padding). Optional dropdown arrow for
 * expand/collapse sections like "My Lists" - arrow rotates with animation.
 *
 * Usage:
 * // header without dropdown
 * <GroupedListHeader title="Browse" />
 *
 * // header with dropdown arrow - pass isExpanded to sync arrow rotation
 * <GroupedListHeader title="My Lists" showDropdownArrow isExpanded={isExpanded} onPress={() => toggle()} />
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { useDropdownArrowAnimation } from '@/hooks/useDropdownArrowAnimation';

export interface GroupedListHeaderProps {
  /** header title text */
  title: string;
  /** when true, shows chevron-down on the right for expand/collapse */
  showDropdownArrow?: boolean;
  /** whether section is expanded (arrow points down) or collapsed (arrow points right) - syncs arrow rotation */
  isExpanded?: boolean;
  /** called when header or arrow is pressed (only used when showDropdownArrow is true) */
  onPress?: () => void;
  /** optional container style for spacing (e.g. marginTop) */
  style?: ViewStyle;
}

export default function GroupedListHeader({
  title,
  showDropdownArrow = false,
  isExpanded = true,
  onPress,
  style,
}: GroupedListHeaderProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);

  // hook manages arrow rotation animation - 0 = collapsed/right, 1 = expanded/down
  const { arrowRotation, toggle } = useDropdownArrowAnimation(isExpanded);

  // sync arrow when isExpanded prop changes from parent (e.g. after toggle)
  useEffect(() => {
    toggle(isExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when isExpanded changes
  }, [isExpanded]);

  return (
    <View style={[styles.container, style]}>
      {/* title - tappable when dropdown arrow is shown */}
      {showDropdownArrow && onPress ? (
        <TouchableOpacity style={styles.leftContainer} onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.leftContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}

      {/* optional dropdown arrow - rotates with animation, tappable to toggle expand/collapse */}
      {showDropdownArrow && onPress && (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.arrowButton}
        >
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Ionicons name="chevron-down" size={20} color={themeColors.text.secondary()} />
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: Paddings.touchTargetSmall,
    },
    leftContainer: {
      flex: 1,
    },
    title: {
      ...typography.getTextStyle('heading-4'),
      color: themeColors.text.primary(),
    },
    arrowButton: {
      marginLeft: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
