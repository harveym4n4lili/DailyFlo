/**
 * useTaskCardAnimations Hook
 * 
 * Custom hook for managing task card fade-in and scale animations when groups expand.
 * Handles staggered animations for multiple cards appearing at once.
 * 
 * This hook is extracted from ListCard to improve reusability and testability.
 */

import { useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Return type for useTaskCardAnimations hook
 */
export interface UseTaskCardAnimationsReturn {
  // function to get or create animated values for a specific task card
  getTaskCardAnimation: (
    taskId: string,
    index: number,
    groupTitle?: string
  ) => {
    opacityValue: Animated.Value;
    scaleValue: Animated.Value;
  };
  // mark a group as currently expanding (so its task cards animate)
  markGroupExpanding: (groupTitle: string) => void;
  // clear the expanding flag for a group
  clearGroupExpanding: (groupTitle: string) => void;
}

/**
 * Custom hook for managing task card animations
 * 
 * @returns Object containing animation functions
 */
export function useTaskCardAnimations(): UseTaskCardAnimationsReturn {
  // animated values for task cards - tracks animating task cards by their id
  const taskCardAnimations = useRef<
    Map<
      string,
      {
        opacityValue: Animated.Value;
        scaleValue: Animated.Value;
      }
    >
  >(new Map());

  // track which group is currently being expanded so only those task cards animate
  const expandingGroups = useRef<Set<string>>(new Set());

  // function to get or create animated values for a specific task card
  // this function is called whenever a task card should animate in but only animates if part of expanding group
  const getTaskCardAnimation = (
    taskId: string,
    index: number = 0,
    groupTitle?: string
  ) => {
    // only animate if this task card belongs to a group that is currently expanding
    const shouldAnimate = groupTitle ? expandingGroups.current.has(groupTitle) : false;

    // check if animation already exists, reset it for fresh animation if needed
    let animatedValue = taskCardAnimations.current.get(taskId);

    if (animatedValue) {
      // reset values for re-animation when group expands
      animatedValue.opacityValue.setValue(shouldAnimate ? 0 : 1); // start at invisible only if animating
      animatedValue.scaleValue.setValue(shouldAnimate ? 0.95 : 1); // start smaller only if animating
    } else {
      // create new animated values for task card
      animatedValue = {
        opacityValue: new Animated.Value(shouldAnimate ? 0 : 1), // start at invisible only if animating
        scaleValue: new Animated.Value(shouldAnimate ? 0.95 : 1), // start smaller only if animating
      };
      taskCardAnimations.current.set(taskId, animatedValue);
    }

    // only trigger animations if this card belongs to an expanding group
    if (shouldAnimate) {
      // calculate staggered delay for multiple card animations - adds slight delay for natural appearance order
      const delay = index * 50; // 50ms delay per card for staggered effect

      // animate fade-in with slight scale for smooth task card appearance when group expands
      Animated.parallel([
        Animated.timing(animatedValue.opacityValue, {
          toValue: 1, // fade to full opacity
          duration: 400, // 400ms fade duration for smooth appearance
          delay: delay, // apply staggered delay based on card index
          useNativeDriver: true, // use native driver for better performance
        }),
        Animated.timing(animatedValue.scaleValue, {
          toValue: 1, // scale to full size from slightly smaller size
          duration: 400, // 400ms scale duration for smooth appearance
          delay: delay, // apply staggered delay based on card index
          useNativeDriver: true, // use native driver for better performance
        }),
      ]).start();
    }

    return animatedValue;
  };

  // mark a group as currently expanding (so its task cards animate)
  const markGroupExpanding = (groupTitle: string) => {
    expandingGroups.current.add(groupTitle);
    // clear the expanding flag after animations are complete
    setTimeout(() => {
      expandingGroups.current.delete(groupTitle);
    }, 600); // slightly longer than animation max duration (400ms + 50ms delay)
  };

  // clear the expanding flag for a group
  const clearGroupExpanding = (groupTitle: string) => {
    expandingGroups.current.delete(groupTitle);
  };

  return {
    getTaskCardAnimation,
    markGroupExpanding,
    clearGroupExpanding,
  };
}

