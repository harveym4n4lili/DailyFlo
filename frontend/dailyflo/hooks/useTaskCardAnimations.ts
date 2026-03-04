/**
 * useTaskCardAnimations Hook
 * 
 * Custom hook for managing task card fade-in and scale animations when groups expand.
 * Handles staggered animations for multiple cards appearing at once.
 * 
 * This hook is extracted from ListCard to improve reusability and testability.
 */

import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

/**
 * Return type for useTaskCardAnimations hook
 */
export interface UseTaskCardAnimationsReturn {
  getTaskCardAnimation: (
    taskId: string,
    index: number,
    groupTitle?: string
  ) => {
    opacityValue: Animated.Value | null;
    scaleValue: Animated.Value | null;
    shouldAnimate: boolean;
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

  // stable ref so renderTaskCard/FlatList don't get new renderItem on every ListCard render
  const getTaskCardAnimation = useCallback(
    (taskId: string, index: number = 0, groupTitle?: string) => {
      const shouldAnimate = groupTitle ? expandingGroups.current.has(groupTitle) : false;

      if (!shouldAnimate) {
        return { opacityValue: null, scaleValue: null, shouldAnimate: false };
      }

      let animatedValue = taskCardAnimations.current.get(taskId);
      if (animatedValue) {
        animatedValue.opacityValue.setValue(0);
        animatedValue.scaleValue.setValue(0.95);
      } else {
        animatedValue = {
          opacityValue: new Animated.Value(0),
          scaleValue: new Animated.Value(0.95),
        };
        taskCardAnimations.current.set(taskId, animatedValue);
      }

      const delay = index * 50;
      Animated.parallel([
        Animated.timing(animatedValue.opacityValue, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue.scaleValue, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
      ]).start();

      return { ...animatedValue, shouldAnimate: true };
    },
    []
  );

  const markGroupExpanding = useCallback((groupTitle: string) => {
    expandingGroups.current.add(groupTitle);
    // clear the expanding flag after animations are complete
    setTimeout(() => {
      expandingGroups.current.delete(groupTitle);
    }, 600); // slightly longer than animation max duration (400ms + 50ms delay)
  }, []);

  const clearGroupExpanding = useCallback((groupTitle: string) => {
    expandingGroups.current.delete(groupTitle);
  }, []);

  return {
    getTaskCardAnimation,
    markGroupExpanding,
    clearGroupExpanding,
  };
}

