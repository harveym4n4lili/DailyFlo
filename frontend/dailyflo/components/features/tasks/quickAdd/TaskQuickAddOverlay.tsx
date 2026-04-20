/**
 * full-screen task quick-add shell: backdrop + keyboard-anchored glass composer.
 * backdrop and glass body are split into components under this folder for clarity.
 *
 * keyboard inset is passed into QuickAddGlassPanel as padding inside the glass shell
 * so the liquid material extends to the bottom of the screen instead of ending above a transparent gap.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardHeight } from '@/components/layout/ScreenLayout';
import { QuickAddGlassPanel } from './QuickAddGlassPanel';
import { QuickAddModalBackdrop } from './QuickAddModalBackdrop';
import { TaskQuickAddForm } from './TaskQuickAddForm';

/** same math as KeyboardAnchoredContainer: positive = tighter to keyboard, negative = more gap */
const KEYBOARD_ANCHOR_OFFSET = 0;

export interface TaskQuickAddOverlayProps {
  /** tap backdrop or android back — parent calls router.back() */
  onRequestClose: () => void;
}

export function TaskQuickAddOverlay({ onRequestClose }: TaskQuickAddOverlayProps) {
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();

  const bottomInset = useMemo(
    () => Math.max(0, keyboardHeight + insets.bottom - KEYBOARD_ANCHOR_OFFSET),
    [keyboardHeight, insets.bottom],
  );

  return (
    <View style={styles.root} pointerEvents="box-none">
      <QuickAddModalBackdrop onRequestClose={onRequestClose} />

      <View style={styles.keyboardAnchor} pointerEvents="box-none">
        <QuickAddGlassPanel bottomInset={bottomInset}>
          <TaskQuickAddForm />
        </QuickAddGlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
