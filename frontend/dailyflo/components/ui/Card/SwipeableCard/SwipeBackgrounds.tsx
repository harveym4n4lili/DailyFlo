/**
 * SwipeBackgrounds Component
 * 
 * This component renders the background actions that appear when swiping a card.
 * It shows different colored backgrounds and icons for left (complete) and right (delete) swipes.
 * 
 * This component is used by SwipeableCard to provide visual feedback during swipe gestures.
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// types for swipe action configuration
export interface SwipeAction {
  backgroundColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconSize?: number;
}

interface SwipeBackgroundsProps {
  // animated value that tracks horizontal swipe position
  translateX: Animated.Value;
  // left swipe action configuration (e.g., complete action)
  leftAction?: SwipeAction;
  // right swipe action configuration (e.g., delete action)
  rightAction?: SwipeAction;
  // border radius to match the card
  borderRadius?: number;
}

/**
 * SwipeBackgrounds Component
 * 
 * Renders animated backgrounds that appear when swiping left or right on a card.
 * The backgrounds fade in/out based on swipe distance and show action icons.
 */
export default function SwipeBackgrounds({
  translateX,
  leftAction,
  rightAction,
  borderRadius = 20,
}: SwipeBackgroundsProps) {
  return (
    <>
      {/* left swipe background (e.g., green for complete) */}
      {leftAction && (
        <Animated.View
          style={[
            styles.swipeBackgroundLeft,
            {
              backgroundColor: leftAction.backgroundColor,
              borderRadius,
              opacity: translateX.interpolate({
                inputRange: [-100, -5, 0, 100],
                outputRange: [1, 0.3, 0, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          {/* icon that appears during left swipe */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: translateX.interpolate({
                  inputRange: [-100, -5, 0, 100],
                  outputRange: [1, 0.3, 0, 0],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    translateX: translateX.interpolate({
                      inputRange: [-80, 0],
                      outputRange: [-20, 0], // stretch icon across swipe area
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={leftAction.icon}
              size={leftAction.iconSize || 24}
              color={leftAction.iconColor || 'white'}
            />
          </Animated.View>
        </Animated.View>
      )}

      {/* right swipe background (e.g., red for delete) */}
      {rightAction && (
        <Animated.View
          style={[
            styles.swipeBackgroundRight,
            {
              backgroundColor: rightAction.backgroundColor,
              borderRadius,
              opacity: translateX.interpolate({
                inputRange: [-100, 0, 5, 50],
                outputRange: [0, 0, 0.1, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          {/* icon that appears during right swipe */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: translateX.interpolate({
                  inputRange: [-100, 0, 5, 100],
                  outputRange: [0, 0, 0.3, 1],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    translateX: translateX.interpolate({
                      inputRange: [0, 80],
                      outputRange: [0, 20], // stretch icon across swipe area
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={rightAction.icon}
              size={rightAction.iconSize || 24}
              color={rightAction.iconColor || 'white'}
            />
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // left swipe background positioned absolutely
  swipeBackgroundLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end', // align to right side
    zIndex: 0, // behind the card content
  },

  // right swipe background positioned absolutely
  swipeBackgroundRight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-start', // align to left side
    zIndex: 0, // behind the card content
  },

  // container for swipe action icons
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

