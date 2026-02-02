/**
 * TestModal Component
 *
 * Uses WrappedDraggableModal with test content. Snaps initially halfway (0.5).
 * When expo-glass-effect is available on iOS, the sheet content is wrapped in
 * GlassView for a glass modal look; otherwise uses solid theme background.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { WrappedDraggableModal, ModalBackdrop, ModalHeader } from '@/components/layout/ModalLayout';
import GlassView from 'expo-glass-effect/build/GlassView';
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';

export interface TestModalProps {
  /** whether the modal is visible */
  visible: boolean;
  /** called when the modal should close */
  onClose: () => void;
}

/** Snap points: 25%, 50%, 90% of screen. Initial snap index 1 = halfway (50%). */
const SNAP_POINTS = [0.25, 0.5, 0.9];
const INITIAL_SNAP_INDEX = 1;

/**
 * Renders a draggable test modal (WrappedDraggableModal) that opens at 50% height.
 * Sheet uses GlassView on iOS when available; otherwise solid background.
 */
export function TestModal({ visible, onClose }: TestModalProps) {
  const themeColors = useThemeColors();
  const textPrimary = themeColors.text.primary();
  const textSecondary = themeColors.text.secondary();
  const bg = themeColors.background.primary();
  const glassTint = themeColors.background.primarySecondaryBlend?.() ?? bg;
  const glassAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

  const bodyContent = (
    <View style={styles.body}>
      <Text style={[styles.title, { color: textPrimary }]}>Test modal</Text>
      <Text style={[styles.paragraph, { color: textSecondary }]}>
        Draggable sheet with test content. Snaps at 25%, 50%, 90%. Opens at 50%.
        Glass effect on iOS when available.
      </Text>
    </View>
  );

  const modalContent = (
    <>
      <ModalHeader
        title="Test modal"
        onClose={onClose}
        showDragIndicator
        closeButtonPosition="left"
      />
      {bodyContent}
    </>
  );

  return (
    <>
      <ModalBackdrop
        isVisible={visible}
        onPress={onClose}
        zIndex={10000}
      />
      <WrappedDraggableModal
        visible={visible}
        onClose={onClose}
        snapPoints={SNAP_POINTS}
        initialSnapPoint={INITIAL_SNAP_INDEX}
        backgroundColor="transparent"
        backdropDismiss
      >
        {glassAvailable ? (
          <GlassView
            style={styles.glassSheet}
            glassEffectStyle="regular"
            tintColor={glassTint as any}
            isInteractive
          >
            {modalContent}
          </GlassView>
        ) : (
          <View style={[styles.solidSheet, { backgroundColor: bg }]}>
            {modalContent}
          </View>
        )}
      </WrappedDraggableModal>
    </>
  );
}

const styles = StyleSheet.create({
  glassSheet: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  solidSheet: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default TestModal;
