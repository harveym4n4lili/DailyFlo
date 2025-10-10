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
}

export function ModalBackdrop({
  isVisible,
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  duration = 250,
  zIndex = 50,
}: ModalBackdropProps) {
  // shared value for backdrop opacity animation
  // backdrop fades in when any modal opens, fades out when all modals close
  const backdropOpacity = useSharedValue(0);

  // watch for visibility changes and animate the backdrop accordingly
  // this creates a darker backdrop that fades behind modals
  useEffect(() => {
    if (isVisible) {
      // fade in the backdrop
      backdropOpacity.value = withTiming(1, { duration });
    } else {
      // fade out the backdrop
      backdropOpacity.value = withTiming(0, { duration });
    }
  }, [isVisible, duration]);

  // animated style for the backdrop
  // applies the opacity animation to the backdrop view
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor,
          zIndex,
        },
        backdropAnimatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

export default ModalBackdrop;

