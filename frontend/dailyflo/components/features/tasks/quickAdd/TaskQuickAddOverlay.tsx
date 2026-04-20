/**
 * full-screen task quick-add shell: backdrop + keyboard-anchored glass composer.
 * stack animation: 'none' so router.back() does not run a native fade that interrupts reanimated transforms.
 * enter: backdrop opacity timing + spring sheet up (parallel).
 * exit: backdrop fade + sheet slide use the same withTiming duration/easing so they stay locked — then router.back().
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { BackHandler, Keyboard, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useKeyboardHeight } from '@/components/layout/ScreenLayout';
import { QuickAddGlassPanel } from './QuickAddGlassPanel';
import { QuickAddModalBackdrop } from './QuickAddModalBackdrop';
import { TaskQuickAddForm } from './TaskQuickAddForm';

/** same math as KeyboardAnchoredContainer: positive = tighter to keyboard, negative = more gap */
const KEYBOARD_ANCHOR_OFFSET = 0;

const SHEET_SPRING = {
  stiffness: 420,
  damping: 36,
  mass: 1,
  overshootClamping: true,
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 0.5,
} as const;

/** ios-like ease — shared by exit fade + exit slide so they finish together */
const IOS_STANDARD_EASING = Easing.bezier(0.42, 0, 0.58, 1);

const ENTER_BACKDROP_MS = 380;
/** exit: one duration for opacity + translateY so the slide is never cut off by a separate native fade */
const EXIT_OVERLAY_MS = 320;

function sheetEnterOffset(windowHeight: number) {
  return Math.min(560, Math.max(120, Math.round(windowHeight * 0.28)));
}

export interface TaskQuickAddOverlayProps {
  /** router.back() after exit timing completes */
  onRequestClose: () => void;
}

export function TaskQuickAddOverlay({ onRequestClose }: TaskQuickAddOverlayProps) {
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const bottomInset = useMemo(
    () => Math.max(0, keyboardHeight), // DONT CHANGE THIS
    [keyboardHeight, insets.bottom],
  );

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(sheetEnterOffset(windowHeight));

  const isExitingRef = useRef(false);
  const onRequestCloseRef = useRef(onRequestClose);
  onRequestCloseRef.current = onRequestClose;

  const finishClose = useCallback(() => {
    onRequestCloseRef.current();
  }, []);

  const handleClose = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    Keyboard.dismiss();
    const slide = sheetEnterOffset(windowHeight);
    const exitConfig = { duration: EXIT_OVERLAY_MS, easing: IOS_STANDARD_EASING };
    backdropOpacity.value = withTiming(0, exitConfig);
    sheetTranslateY.value = withTiming(slide, exitConfig, (finished) => {
      if (finished) {
        runOnJS(finishClose)();
      }
    });
  }, [backdropOpacity, sheetTranslateY, finishClose, windowHeight]);

  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  useFocusEffect(
    useCallback(() => {
      isExitingRef.current = false;
      const slide = sheetEnterOffset(windowHeight);
      backdropOpacity.value = 0;
      sheetTranslateY.value = slide;
      backdropOpacity.value = withTiming(1, {
        duration: ENTER_BACKDROP_MS,
        easing: IOS_STANDARD_EASING,
      });
      sheetTranslateY.value = withSpring(0, SHEET_SPRING);

      let sub: { remove: () => void } | undefined;
      if (Platform.OS === 'android') {
        sub = BackHandler.addEventListener('hardwareBackPress', () => {
          handleCloseRef.current();
          return true;
        });
      }
      return () => sub?.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable reanimated refs; only re-run enter when height changes
    }, [windowHeight]),
  );

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.backdropWrap, backdropAnimatedStyle]} pointerEvents="box-none">
        <QuickAddModalBackdrop onRequestClose={handleClose} />
      </Animated.View>

      <Animated.View style={[styles.keyboardAnchor, sheetAnimatedStyle]} pointerEvents="box-none">
        <QuickAddGlassPanel bottomInset={bottomInset}>
          <TaskQuickAddForm />
        </QuickAddGlassPanel>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdropWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  keyboardAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    zIndex: 2,
  },
});
