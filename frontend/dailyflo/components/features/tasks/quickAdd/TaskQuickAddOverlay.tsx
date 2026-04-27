/**
 * full-screen task quick-add shell: backdrop + keyboard-anchored glass composer.
 * stack animation: 'none' so router.back() does not run a native fade that interrupts reanimated transforms.
 * enter: backdrop opacity timing + spring sheet up (parallel).
 * exit: backdrop fade + sheet slide use the same withTiming duration/easing so they stay locked — then router.back().
 */

import React, { useCallback, useMemo, useRef } from 'react';
import {
  Alert,
  BackHandler,
  InteractionManager,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
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
  /**
   * pass through to TaskQuickAddForm — show subtasks + description GroupedList (default false).
   * task-quick-add can set via ?showSubtasks=1
   */
  showSubtasksAndDescription?: boolean;
}

export function TaskQuickAddOverlay({
  onRequestClose,
  showSubtasksAndDescription = false,
}: TaskQuickAddOverlayProps) {
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // title ref lives here so useFocusEffect runs in the same module as the quick-add route tree — refocus after popping /date-select etc.
  const titleInputRef = useRef<TextInput>(null);
  // false while closing: native Alert.dismiss can restore first responder to the title field and pop the keyboard over the exit animation
  const titleFocusAllowedRef = useRef(true);

  const bottomInset = useMemo(
    () => Math.max(0, keyboardHeight), // DONT CHANGE THIS
    [keyboardHeight, insets.bottom],
  );

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(sheetEnterOffset(windowHeight));

  const isExitingRef = useRef(false);
  const onRequestCloseRef = useRef(onRequestClose);
  onRequestCloseRef.current = onRequestClose;

  // form pushes edits here so backdrop + android back read latest without stale closures
  const hasUnsavedWorkRef = useRef(false);
  const onHasUnsavedWorkChange = useCallback((hasUnsaved: boolean) => {
    hasUnsavedWorkRef.current = hasUnsaved;
  }, []);

  const finishClose = useCallback(() => {
    onRequestCloseRef.current();
  }, []);

  // runs the sheet exit animation then router.back — used after optional discard confirm
  const performClose = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    titleFocusAllowedRef.current = false;
    titleInputRef.current?.blur();
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

  // native alert when closing with any quick-add edits; tap outside or back uses this path
  const confirmCloseIfNeeded = useCallback(() => {
    if (!hasUnsavedWorkRef.current) {
      performClose();
      return;
    }
    Alert.alert('Discard changes?', 'You will lose what you entered.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        // defer close until after the alert tears down — otherwise ios restores focus to the text field and the keyboard flashes
        onPress: () => {
          titleFocusAllowedRef.current = false;
          titleInputRef.current?.blur();
          Keyboard.dismiss();
          setTimeout(() => performClose(), 60);
        },
      },
    ]);
  }, [performClose]);

  const handleCloseRef = useRef(confirmCloseIfNeeded);
  handleCloseRef.current = confirmCloseIfNeeded;

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
          handleCloseRef.current(); // may show discard alert if form has edits
          return true;
        });
      }
      return () => sub?.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable reanimated refs; only re-run enter when height changes
    }, [windowHeight]),
  );

  // keyboard: reopen whenever the quick-add modal route is focused again (return from picker stack screens).
  // interactionmanager + delayed retries beat ios sheet transition stealing focus on first call.
  useFocusEffect(
    useCallback(() => {
      titleFocusAllowedRef.current = true;
      let cancelled = false;
      const timeouts: ReturnType<typeof setTimeout>[] = [];
      const focusTitle = () => {
        if (cancelled || !titleFocusAllowedRef.current) return;
        titleInputRef.current?.focus();
      };
      const task = InteractionManager.runAfterInteractions(() => {
        focusTitle();
        timeouts.push(setTimeout(focusTitle, 120));
        timeouts.push(setTimeout(focusTitle, 300));
      });
      return () => {
        cancelled = true;
        timeouts.forEach(clearTimeout);
        const cancel = (task as { cancel?: () => void } | undefined)?.cancel;
        cancel?.();
      };
    }, []),
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
        <QuickAddModalBackdrop onRequestClose={confirmCloseIfNeeded} />
      </Animated.View>

      <Animated.View style={[styles.keyboardAnchor, sheetAnimatedStyle]} pointerEvents="box-none">
        <QuickAddGlassPanel bottomInset={bottomInset}>
          <TaskQuickAddForm
            titleInputRef={titleInputRef}
            titleFocusAllowedRef={titleFocusAllowedRef}
            showSubtasksAndDescription={showSubtasksAndDescription}
            onHasUnsavedWorkChange={onHasUnsavedWorkChange}
          />
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
