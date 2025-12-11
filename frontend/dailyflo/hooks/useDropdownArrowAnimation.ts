/**
 * useDropdownArrowAnimation Hook
 * 
 * Custom hook for managing dropdown arrow rotation animations.
 * Provides a consistent animation pattern for all dropdown lists across the app.
 * 
 * This hook encapsulates the arrow rotation animation logic used in ListCard's GroupHeader
 * and makes it reusable for any dropdown component that needs arrow rotation.
 * 
 * Animation pattern:
 * - 0 = collapsed/closed (arrow points right at 90deg)
 * - 1 = expanded/open (arrow points down at 0deg)
 * - 200ms duration with native driver for smooth performance
 */

import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * Return type for useDropdownArrowAnimation hook
 */
export interface UseDropdownArrowAnimationReturn {
  /**
   * Animated interpolation value for arrow rotation
   * Use this in an Animated.View transform: [{ rotate: arrowRotation }]
   */
  arrowRotation: Animated.AnimatedInterpolation<string | number>;
  
  /**
   * Function to toggle the dropdown state with animation
   * @param isExpanded - whether the dropdown should be expanded (true) or collapsed (false)
   */
  toggle: (isExpanded: boolean) => void;
  
  /**
   * Function to set the dropdown state without animation (for initial state)
   * @param isExpanded - whether the dropdown should be expanded (true) or collapsed (false)
   */
  setExpanded: (isExpanded: boolean) => void;
}

/**
 * Custom hook for managing dropdown arrow rotation animations
 * 
 * @param initialExpanded - initial state of the dropdown (defaults to false/collapsed)
 * @returns Object containing arrow rotation interpolation and toggle function
 * 
 * @example
 * ```tsx
 * const { arrowRotation, toggle } = useDropdownArrowAnimation(false);
 * 
 * const handlePress = () => {
 *   const willBeExpanded = !isExpanded;
 *   setIsExpanded(willBeExpanded);
 *   toggle(willBeExpanded);
 * };
 * 
 * <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
 *   <Ionicons name="chevron-down" size={16} />
 * </Animated.View>
 * ```
 */
export function useDropdownArrowAnimation(
  initialExpanded: boolean = false
): UseDropdownArrowAnimationReturn {
  // animated value for arrow rotation (0 = collapsed/right, 1 = expanded/down)
  // matches the animation pattern used in ListCard's GroupHeader
  const arrowRotationValue = useRef(
    new Animated.Value(initialExpanded ? 1 : 0)
  ).current;

  // calculate arrow rotation interpolation - matches GroupHeader pattern
  // smoothly rotate arrow between right (closed) and down (open)
  const arrowRotation = arrowRotationValue.interpolate({
    inputRange: [0, 1], // input range: 0 = collapsed (right pointing), 1 = expanded (down pointing)
    outputRange: ['90deg', '0deg'], // output range: rotate from 90 degrees (right) to 0 degrees (down)
  });

  /**
   * Toggle dropdown state with animation
   * Animates the arrow rotation based on the expanded state
   */
  const toggle = (isExpanded: boolean) => {
    Animated.timing(arrowRotationValue, {
      toValue: isExpanded ? 1 : 0, // 1 = expanded/down, 0 = collapsed/right
      duration: 200, // 200ms animation duration for smooth rotation (matches GroupHeader)
      useNativeDriver: true, // use native driver for better performance
    }).start();
  };

  /**
   * Set dropdown state without animation (for initial state)
   * Useful when you need to set the initial state without animating
   */
  const setExpanded = (isExpanded: boolean) => {
    arrowRotationValue.setValue(isExpanded ? 1 : 0);
  };

  return {
    arrowRotation,
    toggle,
    setExpanded,
  };
}

