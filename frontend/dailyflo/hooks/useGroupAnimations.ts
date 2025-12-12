/**
 * useGroupAnimations Hook
 * 
 * Custom hook for managing group collapse/expand animations.
 * Handles animated values for group headers (arrow rotation) and tracks collapsed state.
 * 
 * This hook is extracted from ListCard to improve reusability and testability.
 */

import { useState, useRef } from 'react';
import { Animated, LayoutAnimation } from 'react-native';

/**
 * Return type for useGroupAnimations hook
 */
export interface UseGroupAnimationsReturn {
  // set of collapsed group titles
  collapsedGroups: Set<string>;
  // function to toggle group collapse state with animations
  toggleGroupCollapse: (groupTitle: string) => void;
  // function to get animated values for a specific group
  getAnimatedValuesForGroup: (groupTitle: string) => {
    rotateValue: Animated.Value;
    heightValue: Animated.Value;
  };
  // check if a group is collapsed
  isGroupCollapsed: (groupTitle: string) => boolean;
}

/**
 * Custom hook for managing group collapse/expand animations
 * 
 * @returns Object containing collapsed groups state and animation functions
 */
export function useGroupAnimations(): UseGroupAnimationsReturn {
  // state management for collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // animated values storage - keeps track of animated values for each group
  const animatedValues = useRef<
    Map<
      string,
      {
        rotateValue: Animated.Value;
        heightValue: Animated.Value;
      }
    >
  >(new Map());

  // function to get or create animated values for a specific group
  const getAnimatedValuesForGroup = (groupTitle: string) => {
    if (!animatedValues.current.has(groupTitle)) {
      // check if the group should start collapsed or expanded based on collapsedGroups state
      const isGroupCollapsed = collapsedGroups.has(groupTitle);

      animatedValues.current.set(groupTitle, {
        rotateValue: new Animated.Value(isGroupCollapsed ? 0 : 1), // 0 = collapsed (right pointing), 1 = expanded (down pointing)
        heightValue: new Animated.Value(isGroupCollapsed ? 0 : 1), // 0 = collapsed content, 1 = expanded content
      });
    }
    return animatedValues.current.get(groupTitle)!;
  };

  // function to toggle group collapse state with animations
  const toggleGroupCollapse = (groupTitle: string) => {
    const animatedValuesForGroup = getAnimatedValuesForGroup(groupTitle);

    // configure smooth layout animation for height transitions
    // this creates the smooth expand/collapse animation for the content area
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      const isCurrentlyCollapsed = newSet.has(groupTitle);

      if (isCurrentlyCollapsed) {
        // expanding the group - remove from collapsed set
        newSet.delete(groupTitle);

        // animate arrow rotation from pointing right (collapsed) to pointing down (expanded)
        Animated.timing(animatedValuesForGroup.rotateValue, {
          toValue: 1, // 1 = expanded state (down), 0 = collapsed state (right)
          duration: 200, // 200ms animation duration for smooth rotation
          useNativeDriver: true, // use native driver for better performance
        }).start();
      } else {
        // collapsing the group - add to collapsed set
        newSet.add(groupTitle);

        // animate arrow rotation from pointing down (expanded) to pointing right (collapsed)
        Animated.timing(animatedValuesForGroup.rotateValue, {
          toValue: 0, // 0 = collapsed state (right), 1 = expanded state (down)
          duration: 200, // 200ms animation duration for smooth rotation
          useNativeDriver: true, // use native driver for better performance
        }).start();
      }

      return newSet;
    });
  };

  // check if a group is collapsed
  const isGroupCollapsed = (groupTitle: string) => {
    return collapsedGroups.has(groupTitle);
  };

  return {
    collapsedGroups,
    toggleGroupCollapse,
    getAnimatedValuesForGroup,
    isGroupCollapsed,
  };
}

