/**
 * DraggableModal
 * 
 * Reusable draggable bottom sheet modal with snap points.
 * Handles all drag gestures, animations, and snap behavior.
 * Can be used by any modal that needs draggable functionality.
 */

import React, { useEffect } from 'react';
import { Modal, View, Pressable, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useColorPalette';

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
  
  // optional floating container that appears fixed on screen (not draggable with modal)
  // useful for FABs, action buttons, or any content that should stay in place while modal moves
  // will be rendered inside the modal but outside the draggable animated content
  floatingContainer?: React.ReactNode;
}

export function DraggableModal({
  visible,
  onClose,
  children,
  snapPoints,
  initialSnapPoint = 1,
  borderRadius = 20,
  floatingContainer,
}: DraggableModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  const themeColors = useThemeColors();
  
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
  // starts at initial position
  const translateY = useSharedValue(initialPosition);
  
  // store the starting position when gesture begins
  // this allows us to apply the drag relative to where we started
  const startY = useSharedValue(0);
  
  // reset modal position when it becomes visible
  useEffect(() => {
    if (visible) {
      translateY.value = initialPosition;
    }
  }, [visible, initialPosition]);

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
      
      // check for strong velocity first
      if (Math.abs(event.velocityY) > 500) {
        // fast swipe up → go to more expanded snap point
        if (event.velocityY < 0) {
          targetSnapIndex = snapTranslateYs.findIndex(y => y < translateY.value);
          if (targetSnapIndex === -1) targetSnapIndex = 0;
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
        snapTranslateYs.forEach((snapY, index) => {
          const distance = Math.abs(translateY.value - snapY);
          if (distance < minDistance) {
            minDistance = distance;
            targetSnapIndex = index;
          }
        });
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

  // animated style that applies the translateY value to move the modal
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      transparent={true}
    >
      {/* transparent backdrop - kept for tap-to-dismiss functionality */}
      {/* the darker overlay is handled by the parent component */}
      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
        }}
        onPress={onClose}
      />
      
      {/* transparent layout container for modal positioning */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-end',
          backgroundColor: 'transparent',
        }}
        pointerEvents="box-none"
      >
        {/* GestureDetector wraps the modal to enable drag gestures */}
        <GestureDetector gesture={panGesture}>
          {/* Animated.View applies the translateY style to move the modal */}
          <Animated.View style={[{ width: '100%' }, animatedStyle]}>
            {/* Modal container with maximum height and rounded top corners */}
            <View
              style={{
                width: '100%',
                height: maxHeight,
                backgroundColor: themeColors.background.elevated(),
                borderTopLeftRadius: borderRadius,
                borderTopRightRadius: borderRadius,
                overflow: 'hidden',
              }}
            >
              {children}
            </View>
          </Animated.View>
        </GestureDetector>
        
        {/* floating container rendered inside modal but outside draggable content */}
        {/* stays fixed on screen while modal slides up/down */}
        {/* can contain FABs, action buttons, or any custom content */}
        {floatingContainer}
      </View>
    </Modal>
  );
}

export default DraggableModal;

