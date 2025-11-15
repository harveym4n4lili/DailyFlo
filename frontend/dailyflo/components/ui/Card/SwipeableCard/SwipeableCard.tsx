/**
 * SwipeableCard Component
 * 
 * This is a reusable wrapper component that adds swipe gesture functionality to any card.
 * It handles pan gestures, swipe detection, and animations, allowing child components
 * to focus on display logic without worrying about gesture handling.
 * 
 * This component follows the composition pattern - it wraps content and adds swipe behavior.
 */

import React, { useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import SwipeBackgrounds, { SwipeAction } from './SwipeBackgrounds';

interface SwipeableCardProps {
  // children to wrap with swipe functionality
  children: React.ReactNode;
  // callback when user swipes left (negative translation)
  onSwipeLeft?: () => void;
  // callback when user swipes right (positive translation)
  onSwipeRight?: () => void;
  // minimum distance in pixels to trigger a swipe action (default: 60)
  swipeThreshold?: number;
  // left swipe action configuration (background color, icon, etc.)
  leftAction?: SwipeAction;
  // right swipe action configuration (background color, icon, etc.)
  rightAction?: SwipeAction;
  // border radius to match the card (default: 20)
  borderRadius?: number;
  // optional container style
  containerStyle?: object;
}

/**
 * SwipeableCard Component
 * 
 * Wraps any content with swipe gesture functionality. Handles pan gestures,
 * detects swipe direction and distance, and triggers callbacks when thresholds are met.
 */
export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 60,
  leftAction,
  rightAction,
  borderRadius = 20,
  containerStyle,
}: SwipeableCardProps) {
  // animated value that tracks horizontal swipe position
  // starts at 0 (center), negative = left swipe, positive = right swipe
  const translateX = useRef(new Animated.Value(0)).current;

  // handle continuous movement during swipe - updates translateX animation value
  // this runs continuously as the user drags their finger
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true } // use native driver for better performance
  );

  // handle gesture state changes (start, end, cancel, etc.)
  // this is called when the gesture begins, ends, or is cancelled
  const onHandlerStateChange = (event: any) => {
    const { state } = event.nativeEvent;

    // handle gesture end - check if swipe threshold was met and trigger callbacks
    if (state === State.END) {
      // get the final translation distance
      const { translationX } = event.nativeEvent;

      // determine if swipe threshold was met and in which direction
      if (Math.abs(translationX) > swipeThreshold) {
        // swipe left (negative translationX) - trigger onSwipeLeft callback
        if (translationX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
        // swipe right (positive translationX) - trigger onSwipeRight callback
        else if (translationX > 0 && onSwipeRight) {
          onSwipeRight();
        }
      }

      // reset card position to center with smooth spring animation
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100, // spring tension for smooth animation
        friction: 8,  // spring friction for natural feel
        overshootClamping: true,
      }).start();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* swipe action backgrounds that appear during swipe */}
      <SwipeBackgrounds
        translateX={translateX}
        leftAction={leftAction}
        rightAction={rightAction}
        borderRadius={borderRadius}
      />

      {/* pan gesture handler - wraps content to detect horizontal swipes */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent} // handles continuous swipe movement
        onHandlerStateChange={onHandlerStateChange} // handles swipe start/end events
        activeOffsetX={[-10, 10]} // horizontal movement threshold to activate gesture
      >
        {/* animated view that moves horizontally during swipe gestures */}
        <Animated.View
          style={[
            styles.swipeContainer,
            { transform: [{ translateX }] }, // applies horizontal translation based on swipe
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  // container for the swipeable card
  container: {
    width: '100%', // ensure full width
    position: 'relative', // needed for absolute positioning of backgrounds
    alignItems: 'stretch', // ensure children take full width
  },

  // container for swipeable content
  swipeContainer: {
    width: '100%', // ensure full width
    position: 'relative',
    zIndex: 1, // above the background
    backgroundColor: 'transparent', // ensure transparent so card background shows through
  },
});

