/**
 * Checkbox Component
 * 
 * A square checkbox with rounded borders that animates to filled with primary text color when tapped.
 * Used for task completion and other boolean selections.
 */

import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

interface CheckboxProps {
  // whether the checkbox is checked
  checked: boolean;
  // callback function called when checkbox is tapped
  onPress: () => void;
  // optional size of the checkbox (default 24)
  size?: number;
  // optional border radius (default 6)
  borderRadius?: number;
  // optional disabled state
  disabled?: boolean;
}

/**
 * Checkbox Component
 * 
 * Renders a square checkbox with rounded borders that animates to filled
 * with primary text color when checked. Uses smooth animations for state transitions.
 */
export default function Checkbox({
  checked,
  onPress,
  size = 24,
  borderRadius = 6,
  disabled = false,
}: CheckboxProps) {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();

  // animated value for fill animation (0 = unchecked, 1 = checked)
  // this controls the background color and border color transitions
  const fillAnimation = useRef(new Animated.Value(checked ? 1 : 0)).current;

  // animated value for scale animation (for tap feedback)
  // this provides visual feedback when the checkbox is tapped
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  // update animation when checked state changes
  // smoothly animates from unchecked to checked state (or vice versa)
  useEffect(() => {
    Animated.timing(fillAnimation, {
      toValue: checked ? 1 : 0, // animate to 1 when checked, 0 when unchecked
      duration: 200, // animation duration in milliseconds
      useNativeDriver: false, // can't use native driver for color animations
    }).start();
  }, [checked, fillAnimation]);

  // handle checkbox press - triggers scale animation and calls onPress callback
  const handlePress = () => {
    if (disabled) return;

    // scale down animation for tap feedback
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.9, // scale down to 90%
        duration: 100,
        useNativeDriver: true, // can use native driver for scale animations
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1, // scale back to 100%
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // call the onPress callback
    onPress();
  };

  // create dynamic styles using theme colors
  const styles = createStyles(themeColors, size, borderRadius);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={1} // disable default opacity change since we're using custom scale animation
      style={styles.container}
    >
      {/* animated view for scale animation (uses native driver for better performance) */}
      <Animated.View
        style={[
          styles.checkboxContainer,
          {
            transform: [{ scale: scaleAnimation }], // apply scale animation for tap feedback
          },
        ]}
      >
        {/* animated view for fill animation (color transitions) */}
        <Animated.View
          style={[
            styles.checkbox,
            {
              // animate border color from tertiary (grey) to primary text color
              borderColor: fillAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [themeColors.text.tertiary(), themeColors.text.primary()],
              }),
              // animate background color from transparent to primary text color
              backgroundColor: fillAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', themeColors.text.primary()],
              }),
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// create dynamic styles using theme colors
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  size: number,
  borderRadius: number
) =>
  StyleSheet.create({
    // container for the checkbox - provides touch target area
    container: {
      justifyContent: 'center',
      alignItems: 'center',
    },

    // checkbox container for scale animation
    checkboxContainer: {
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // checkbox square with rounded borders
    checkbox: {
      width: size,
      height: size,
      borderRadius: borderRadius,
      borderWidth: 1.5, // border width for the checkbox outline
      borderColor: themeColors.text.tertiary(), // default border color (grey)
      backgroundColor: 'transparent', // default background (transparent)
    },
  });
