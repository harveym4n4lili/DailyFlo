/**
 * DraggableModal
 * 
 * Reusable draggable bottom sheet modal with snap points.
 * Handles all drag gestures, animations, and snap behavior.
 * Can be used by any modal that needs draggable functionality.
 */

import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { View, Pressable, useWindowDimensions, StyleSheet, BackHandler, Platform, ScrollView, ScrollViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  runOnJS,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useColorPalette';

// Context to provide scroll lock state to children
interface ScrollLockContextType {
  isScrollLocked: boolean;
}

const ScrollLockContext = createContext<ScrollLockContextType>({ isScrollLocked: true });

/**
 * Hook for children to access scroll lock state
 * 
 * Returns `{ isScrollLocked: boolean }` indicating whether scrolling is currently locked.
 * 
 * @returns {ScrollLockContextType} Object with `isScrollLocked` boolean property
 * 
 * @example
 * ```tsx
 * const { isScrollLocked } = useScrollLock();
 * // Use isScrollLocked to conditionally enable/disable scrolling
 * ```
 * 
 * @throws {Error} If used outside of DraggableModal context
 */
export const useScrollLock = () => {
  const context = useContext(ScrollLockContext);
  if (context === undefined) {
    throw new Error('useScrollLock must be used within a DraggableModal');
  }
  return context;
};

export interface DraggableModalProps {
  // whether the modal is visible
  visible: boolean;
  
  // callback when modal should close
  onClose: () => void;
  
  // modal content
  children: React.ReactNode;
  
  // snap points as percentages of screen height (0-1)
  // example: [0.3, 0.5, 0.9] creates three snap points at 30%, 50%, and 90% of screen
  // the lowest snap point (first in array) will close the modal when reached
  snapPoints: number[];
  
  // initial snap point index (which snap point to start at)
  // @default 1 (second snap point, typically the middle one)
  initialSnapPoint?: number;
  
  // border radius for top corners
  // @default 20
  borderRadius?: number;
  
  // optional sticky footer that stays locked to bottom of screen (doesn't move with modal)
  // useful for FABs, action buttons, or any content that should stay in place while modal drags
  // will be rendered outside the draggable animated content, fixed to screen
  stickyFooter?: React.ReactNode;
  
  // optional sticky header that moves with modal drag but floats over scrolling content
  // useful for toolbars, filters, or controls that should always be visible while content scrolls
  // will be rendered inside the draggable content with absolute positioning
  stickyHeader?: React.ReactNode;
  
  // z-index for modal stacking
  // higher z-index modals appear on top of lower z-index modals
  // @default 10001 (higher than FullScreenModal's default 10000)
  zIndex?: number;
  
  // whether to show the backdrop overlay
  // when false, backdrop is hidden (useful when stacked on another modal with its own backdrop)
  // @default true
  showBackdrop?: boolean;
}

export function DraggableModal({
  visible,
  onClose,
  children,
  snapPoints,
  initialSnapPoint = 1,
  borderRadius = 12,
  stickyFooter,
  stickyHeader,
  zIndex = 10001, // default higher than FullScreenModal for stacking
  showBackdrop = true, // default to showing backdrop
}: DraggableModalProps) {
  
  const { height: screenHeight } = useWindowDimensions();
  const themeColors = useThemeColors();
  
  /**
   * Get iOS ve1rsion number for conditional styling
   * iOS 15+ introduced the glass UI design with larger border radius
   * Returns the major version number (e.g., 14, 15, 16, 17)
   */
  const getIOSVersion = (): number => {
    if (Platform.OS !== 'ios') return 0;
    const version = Platform.Version as string;
    // Platform.Version can be a string like "15.0" or number like 15
    // parse it to get the major version number
    const majorVersion = typeof version === 'string' 
      ? parseInt(version.split('.')[0], 10) 
      : Math.floor(version as number);
    return majorVersion;
  };
  
  /**
   * Calculate border radius based on iOS version
   * iOS 15+ (glass UI): uses larger, rounder border radius (28px)
   * iOS < 15 (pre-glass UI): uses smaller border radius (20px)
   * if borderRadius prop is provided, use that instead (allows override)
   */
  const getBorderRadius = (): number => {
    // if borderRadius is explicitly provided, use that (allows override)
    if (borderRadius !== 12) {
      return borderRadius;
    }
    
    // otherwise, use iOS version-based styling
    const iosVersion = getIOSVersion();
    if (iosVersion >= 15) {
      // iOS 15+ glass UI design - larger, rounder corners (increased from 20px to 28px)
      return 36;
    } else if (iosVersion > 0) {
      // iOS < 15 - pre-glass UI design - smaller corners (increased from 12px to 20px)
      return 20;
    } else {
      // not iOS (Android, web, etc.) - use default
      return borderRadius;
    }
  };
  
  // calculate the border radius to use based on iOS version
  const calculatedBorderRadius = getBorderRadius();
  
  // backdrop opacity for fade in/out animation
  // coordinates with modal slide animation for polished transitions
  // initialize based on visible state to prevent flash on first render
  // if modal is initially visible, backdrop should start at full opacity (1)
  // if modal is initially hidden, backdrop should start invisible (0)
  const backdropOpacity = useSharedValue(visible ? 1 : 0);
  
  // validate snap points
  if (snapPoints.length < 2) {
    console.warn('DraggableModal requires at least 2 snap points');
  }
  
  // sort snap points from smallest to largest
  const sortedSnapPoints = [...snapPoints].sort((a, b) => a - b);
  
  // calculate actual pixel heights for snap points
  // snapHeights[0] is the lowest (close), snapHeights[last] is the highest (expanded)
  const snapHeights = sortedSnapPoints.map(point => screenHeight * point);
  
  // the maximum height the modal can be (highest snap point)
  const maxHeight = snapHeights[snapHeights.length - 1];
  
  // initial position is the difference between max and the initial snap point
  const initialPosition = maxHeight - snapHeights[Math.min(initialSnapPoint, snapHeights.length - 1)];
  
  // shared value to track the current vertical offset of the modal
  // starts off-screen (maxHeight) so modal can slide up when opening
  // this ensures the modal starts hidden and animates in smoothly
  const translateY = useSharedValue(maxHeight);
  
  // store the starting position when gesture begins
  // this allows us to apply the drag relative to where we started
  const startY = useSharedValue(0);
  
  // track if modal is at top anchor (highest snap point)
  // when at top, scroll views should be enabled
  // when not at top, scroll views should be locked and swipes should drag modal
  const topAnchorTranslateY = 0; // fully expanded = translateY of 0
  const [isAtTopAnchor, setIsAtTopAnchor] = useState(false);
  
  // function to update scroll lock state (called from worklet)
  const updateScrollLock = (atTop: boolean) => {
    setIsAtTopAnchor(atTop);
  };
  
  // derived value to check if modal is at top anchor (within 5px threshold)
  // this allows for slight floating point differences
  // updates scroll lock state when position changes
  useDerivedValue(() => {
    const atTop = Math.abs(translateY.value - topAnchorTranslateY) < 5;
    runOnJS(updateScrollLock)(atTop);
    return atTop;
  }, []);
  
  // track if modal is animating out to handle cleanup
  // we need to keep rendering during animation so it can complete smoothly
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  // track previous visible value to detect transitions synchronously
  // this allows us to keep component mounted when visible becomes false
  // preventing the flash that occurs when cancel button is tapped
  const prevVisibleRef = useRef(visible);
  
  // track backdrop visibility state using ref to avoid bridge calls
  // this prevents flash by avoiding synchronous shared value reads
  // ref tracks the expected backdrop state without requiring bridge communication
  const backdropVisibleRef = useRef(visible);
  
  // synchronously detect when visible changes from true to false
  // this must happen during render, not in useEffect, to prevent flash
  // when cancel button is tapped, visible becomes false immediately
  // we use a ref to track this transition so early return can check it
  const isTransitioningOut = prevVisibleRef.current && !visible;
  
  // update ref for next render (after checking transition)
  prevVisibleRef.current = visible;
  
  // MODAL SLIDE ANIMATION EFFECT
  // replicates iOS's native slide animation using Reanimated
  // iOS slide animation: 300ms duration, cubic bezier easing (0.42, 0, 0.58, 1)
  // this creates the exact same smoothness as iOS's built-in slide animation
  // when opening: animate from off-screen (maxHeight) to initial snap position
  // when closing: animate to off-screen (maxHeight)
  // drag gestures work after modal is open (no conflict with slide animation)
  useEffect(() => {
    if (visible) {
      // update ref to track that backdrop should be visible
      backdropVisibleRef.current = true;
      
      // immediately set initial position off-screen before animating
      // this prevents the modal from flashing in its final position
      translateY.value = maxHeight;
      backdropOpacity.value = 0;
      
      // use requestAnimationFrame to ensure the initial position is set before animation starts
      // this prevents the janky flash where modal appears in final position before sliding
      requestAnimationFrame(() => {
        // slide up from bottom - replicate iOS native slide animation
        // start from off-screen (maxHeight) and animate to initial snap position
        translateY.value = withTiming(initialPosition, {
          duration: 300, // matches iOS native slide animation duration
          easing: Easing.bezier(0.42, 0, 0.58, 1), // iOS native slide easing curve
        });
        
        // fade in backdrop simultaneously for coordinated transition
        backdropOpacity.value = withTiming(1, {
          duration: 300, // matches modal slide duration for coordination
          easing: Easing.bezier(0.42, 0, 0.58, 1), // same easing for consistency
        });
      });
      
      setIsAnimatingOut(false);
    } else {
      // when closing, ensure smooth fade-out and slide-down animation
      // matches the smoothness of time/duration modal by ensuring proper synchronization
      // check ref instead of reading shared value to avoid bridge call
      // this prevents flash by avoiding synchronous shared value reads
      if (!backdropVisibleRef.current) {
        // backdrop already invisible, skip animation (already closed)
        setIsAnimatingOut(false);
        return;
      }
      
      // IMPORTANT: set isAnimatingOut to true IMMEDIATELY before any async operations
      // this prevents the early return from unmounting the component before animation starts
      // if we set it after requestAnimationFrame, the component will flash/disappear
      setIsAnimatingOut(true);
      
      // update ref to track that backdrop should be invisible
      backdropVisibleRef.current = false;
      
      // use requestAnimationFrame to prevent flash when closing
      // ensures animation starts in the same frame without any intermediate state
      // prevents the flash that occurs when backdrop opacity is checked synchronously
      requestAnimationFrame(() => {
        // animate backdrop directly from current opacity to 0 without resetting first
        // this prevents flash by avoiding any intermediate opacity changes
        // backdrop should be at 1 (fully visible) when modal is open, so it animates smoothly from 1 to 0
        backdropOpacity.value = withTiming(0, {
          duration: 300, // matches modal slide duration for coordination
          easing: Easing.bezier(0.42, 0, 0.58, 1), // same easing for consistency
        });
        
        // start slide-down animation simultaneously
        // slide down to bottom - replicate iOS native slide-down animation
        translateY.value = withTiming(maxHeight, {
          duration: 300, // matches iOS native slide animation duration
          easing: Easing.bezier(0.42, 0, 0.58, 1), // iOS native slide easing curve
        });
      });
      
      // reset after animation completes (300ms)
      const timer = setTimeout(() => {
        setIsAnimatingOut(false);
        // ensure values are reset after animation completes
        translateY.value = maxHeight;
        backdropOpacity.value = 0;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, initialPosition, maxHeight]);
  
  // ANDROID BACK BUTTON HANDLER
  // handles Android back button press to close modal
  // this replicates Modal's onRequestClose functionality
  useEffect(() => {
    if (!visible) return;
    
    // create back handler function
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // console.log('🔙 Android back button pressed - closing DraggableModal');
      onClose();
      return true; // prevent default back behavior
    });
    
    // cleanup: remove listener when modal closes or component unmounts
    return () => backHandler.remove();
  }, [visible, onClose]);

  // pan gesture handler for dragging the modal
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // remember where we started from
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      // apply the drag relative to where we started
      // allow dragging between fully expanded (0) and below the close point
      const newTranslateY = Math.max(
        0, // max drag up (fully expanded state)
        Math.min(
          maxHeight - snapHeights[0] + 100, // allow dragging 100px below close point
          startY.value + event.translationY
        )
      );
      translateY.value = newTranslateY;
    })
    .onEnd((event) => {
      // when user releases, snap to nearest point based on velocity and current position
      
      // find which snap point we should go to
      let targetSnapIndex = 0;
      let minDistance = Infinity;
      
      // calculate translateY values for each snap point
      const snapTranslateYs = snapHeights.map(height => maxHeight - height);
      
      // check if modal is currently at top anchor
      const currentlyAtTop = Math.abs(translateY.value - topAnchorTranslateY) < 5;
      
      // check for strong velocity first
      if (Math.abs(event.velocityY) > 500) {
        // fast swipe up → go to more expanded snap point
        // if not at top and swiping up, always go to top anchor
        if (event.velocityY < 0) {
          if (!currentlyAtTop) {
            // not at top and swiping up → go to top anchor (highest snap point)
            targetSnapIndex = snapTranslateYs.length - 1;
          } else {
            // already at top, find next expanded point (should stay at top)
            targetSnapIndex = snapTranslateYs.findIndex(y => y < translateY.value);
            if (targetSnapIndex === -1) targetSnapIndex = snapTranslateYs.length - 1;
          }
        } 
        // fast swipe down → go to more collapsed snap point or close
        else {
          for (let i = snapTranslateYs.length - 1; i >= 0; i--) {
            if (translateY.value < snapTranslateYs[i]) {
              targetSnapIndex = i;
              break;
            }
          }
        }
      } else {
        // slow drag → snap to nearest point based on current position
        // but if swiping up and not at top, prefer going to top
        if (event.translationY < -10 && !currentlyAtTop) {
          // swiping up and not at top → go to top anchor
          targetSnapIndex = snapTranslateYs.length - 1;
        } else {
          // normal snap to nearest point
          snapTranslateYs.forEach((snapY, index) => {
            const distance = Math.abs(translateY.value - snapY);
            if (distance < minDistance) {
              minDistance = distance;
              targetSnapIndex = index;
            }
          });
        }
      }
      
      const targetPosition = snapTranslateYs[targetSnapIndex];
      
      // if target is the close position (first snap point = index 0 = highest translateY), dismiss the modal
      // the lowest snap point in the snapPoints array corresponds to index 0 in snapTranslateYs
      if (targetSnapIndex === 0) {
        // animate down and then close
        translateY.value = withSpring(targetPosition, {
          damping: 30,
          stiffness: 400,
          mass: 0.5,
          overshootClamping: true,
        });
        // close modal after animation
        runOnJS(onClose)();
      } else {
        // animate to the target snap point
        translateY.value = withSpring(targetPosition, {
          damping: 30,
          stiffness: 400,
          mass: 0.5,
          overshootClamping: true,
        });
      }
    });

  // animated styles for smooth transitions
  // these styles are applied using Reanimated for 60fps performance
  // modalSlideStyle: animates the modal sliding up/down and dragging
  // backdropStyle: animates the backdrop fading in/out
  const modalSlideStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });
  
  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });
  
  // don't render if not visible and not animating (optimization)
  // this prevents unnecessary rendering when modal is fully closed
  // during closing animation, we keep rendering to ensure smooth transition
  // also check isTransitioningOut to prevent flash when cancel button is tapped
  // isTransitioningOut is detected synchronously during render, before useEffect runs
  if (!visible && !isAnimatingOut && !isTransitioningOut) {
    return null;
  }
  
  // keep sticky elements visible during closing animation to prevent visual jumps
  // hide them only after animation completes (when component unmounts)
  // this ensures smooth animation without layout shifts
  const shouldShowStickyElements = visible || isAnimatingOut;
  
  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { zIndex: zIndex },
        styles.rootContainer,
      ]}
      // when showBackdrop is false, use box-none to allow parent backdrop to receive touches
      // when showBackdrop is true, use auto to allow backdrop Pressable to receive touches
      // when hidden, disable all touches
      pointerEvents={
        !visible
          ? 'none' // disable touches when hidden
          : showBackdrop
          ? 'auto' // allow touches when backdrop is shown (backdrop needs to receive taps)
          : 'box-none' // allow touches to pass through when backdrop is disabled (parent handles backdrop)
      }
    >
      {/* animated backdrop - dark overlay behind modal */}
      {/* fades in/out in sync with modal slide animation */}
      {/* tapping this area dismisses the modal */}
      {/* only render if showBackdrop is true (allows stacking without duplicate backdrops) */}
      {showBackdrop && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.backdrop,
            backdropStyle,
          ]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              // console.log('🟢 DraggableModal backdrop pressed');
              onClose();
            }}
          />
        </Animated.View>
      )}
      
      {/* transparent layout container for modal positioning */}
      <View
        style={[
          styles.modalContainer,
          { zIndex: zIndex + 1 },
        ]}
        pointerEvents="box-none" // allow touches to pass through transparent areas
      >
        {/* GestureDetector wraps the modal to enable drag gestures */}
        <GestureDetector gesture={panGesture}>
          {/* Animated.View applies the translateY style to move the modal */}
          {/* replicates iOS native slide animation when opening/closing */}
          {/* handles drag gestures and snap points when modal is open */}
          <Animated.View style={[{ width: '100%' }, modalSlideStyle]}>
            {/* Modal container with maximum height and rounded top corners */}
            <View
              style={{
                width: '100%',
                height: maxHeight,
                backgroundColor: themeColors.background.primary(),
                // use calculated border radius based on iOS version
                // iOS 15+ (glass UI): 28px for rounder corners (increased from 20px)
                // iOS < 15 (pre-glass UI): 20px for smaller corners (increased from 12px)
                borderTopLeftRadius: calculatedBorderRadius,
                borderTopRightRadius: calculatedBorderRadius,
                overflow: 'hidden',
              }}
            >
              {/* sticky header that moves with modal but stays fixed over scrolling content */}
              {/* positioned absolutely within the modal so it moves with modal drag */}
              {/* hide during closing animation to prevent layout recalculations */}
              {shouldShowStickyElements && stickyHeader}
              
              {/* main modal content */}
              {/* wrap children with ScrollLockContext to provide scroll lock state */}
              <ScrollLockContext.Provider value={{ isScrollLocked: !isAtTopAnchor }}>
                {children}
              </ScrollLockContext.Provider>
            </View>
          </Animated.View>
        </GestureDetector>
        
        {/* sticky footer rendered outside draggable content */}
        {/* stays locked to screen position while modal slides up/down */}
        {/* can contain FABs, action buttons, or any custom content */}
        {/* hide during closing animation to prevent layout recalculations */}
        {shouldShowStickyElements && stickyFooter}
      </View>
    </View>
  );
}

/**
 * Styles for the DraggableModal component
 * 
 * Uses absolute positioning for true modal stacking support
 */
const styles = StyleSheet.create({
  // ROOT CONTAINER STYLES
  // absolute positioned container that covers entire screen
  // allows modal to stack on top of other content
  rootContainer: {
    // absolute positioning covers entire screen
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // transparent background - doesn't block content behind
    backgroundColor: 'transparent',
  },
  
  // BACKDROP STYLES
  // dark overlay behind the modal - fades in/out with animation
  backdrop: {
    // absolute positioning to cover entire screen
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // dark semi-transparent background for dimming effect
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  // MODAL CONTAINER STYLES
  // positions the modal at the bottom of the screen
  modalContainer: {
    // flex container to position modal at bottom
    flex: 1,
    alignItems: 'center',      // center horizontally
    justifyContent: 'flex-end', // position at bottom
    // transparent background so backdrop is visible
    backgroundColor: 'transparent',
  },
});

/**
 * LockableScrollView
 * 
 * A ScrollView wrapper that automatically locks scrolling when the modal is not at the top anchor.
 * When scroll is locked, swipes on the content will drag the modal instead of scrolling.
 * Taps still work when scroll is locked.
 * 
 * Features:
 * - Automatically locks scrolling when modal is partially visible (not at top anchor)
 * - Unlocks scrolling when modal reaches top anchor (fully expanded)
 * - Allows modal dragging when scroll is locked
 * - Preserves all ScrollView props and behavior
 * 
 * Usage:
 * Simply replace ScrollView with LockableScrollView inside any DraggableModal.
 * 
 * Example:
 * <DraggableModal visible={visible} onClose={onClose} snapPoints={[0.3, 0.6, 0.9]}>
 *   <ModalHeader title="My Modal" />
 *   <LockableScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
 *     <View>Your scrollable content</View>
 *   </LockableScrollView>
 * </DraggableModal>
 * 
 * Props:
 * Accepts all standard ScrollView props. The scrollEnabled prop will be automatically
 * overridden based on modal position, but you can still pass it for conditional control.
 */
export function LockableScrollView({ 
  scrollEnabled: propScrollEnabled = true, 
  ...props 
}: ScrollViewProps) {
  const { isScrollLocked } = useScrollLock();
  
  // when scroll is locked, disable scrolling (allows pan gesture to drag modal)
  // when scroll is unlocked (at top), enable scrolling if prop allows it
  const scrollEnabled = !isScrollLocked && propScrollEnabled;
  
  return <ScrollView {...props} scrollEnabled={scrollEnabled} />;
}

export default DraggableModal;

