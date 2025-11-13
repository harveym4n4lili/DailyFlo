/**
 * ModalBackdrop
 * 
 * Reusable fade backdrop that dims the background when modals are open.
 * Lives in the parent component and fades in/out independently of modal animations.
 * 
 * Usage:
 * - Place this component in your parent container (above content, below modals in z-index)
 * - Pass the isVisible prop based on your modal visibility state
 * - Backdrop will automatically fade in/out with smooth transitions
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';

export interface ModalBackdropProps {
  // whether any modal is currently visible
  // when true, backdrop fades in; when false, backdrop fades out
  isVisible: boolean;
  
  // background color of the backdrop
  // @default 'rgba(0, 0, 0, 0.5)' (50% black)
  backgroundColor?: string;
  
  // fade in/out duration in milliseconds
  // @default 250
  duration?: number;
  
  // z-index for the backdrop
  // @default 50
  zIndex?: number;
  
  // callback when backdrop is tapped
  // when provided, backdrop becomes tappable
  // typically used to close modals when tapping outside
  onPress?: () => void;
}

export function ModalBackdrop({
  isVisible,
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  duration = 250,
  zIndex = 50,
  onPress,
}: ModalBackdropProps) {
  // get safe area insets to extend backdrop into safe areas
  const insets = useSafeAreaInsets();
  
  // shared value for backdrop opacity animation
  // backdrop fades in when any modal opens, fades out when all modals close
  // initialize based on isVisible to prevent flash on first render
  const backdropOpacity = useSharedValue(isVisible ? 1 : 0);

  // watch for visibility changes and animate the backdrop accordingly
  // this creates a darker backdrop that fades behind modals
  // ensures smooth transitions without flashing by animating from current opacity
  // only animate if the visibility state actually changed to prevent unnecessary animations
  useEffect(() => {
    // get current opacity value to check if we need to animate
    const currentOpacity = backdropOpacity.value;
    
    if (isVisible && currentOpacity !== 1) {
      // fade in the backdrop from current opacity to fully visible (1)
      // only animate if not already at target value
      backdropOpacity.value = withTiming(1, { duration });
    } else if (!isVisible && currentOpacity !== 0) {
      // fade out the backdrop from current opacity to invisible (0)
      // only animate if not already at target value
      backdropOpacity.value = withTiming(0, { duration });
    }
    // if already at target opacity, don't animate (prevents flash when form picker closes)
  }, [isVisible, duration]);

  // animated style for the backdrop
  // applies the opacity animation to the backdrop view
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // create animated pressable component
  // this allows the backdrop to be tappable while maintaining animations
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <AnimatedPressable
      style={[
        StyleSheet.absoluteFillObject,
        {
          // Use negative margins to extend into safe areas
          marginTop: -Math.max(insets.top, 100),
          marginLeft: -Math.max(insets.left, 100),
          marginRight: -Math.max(insets.right, 100),
          marginBottom: -Math.max(insets.bottom, 100),
          backgroundColor,
          zIndex,
        },
        backdropAnimatedStyle,
      ]}
      pointerEvents={onPress && isVisible ? 'auto' : 'none'}
      onPress={onPress}
    />
  );
}

export default ModalBackdrop;

