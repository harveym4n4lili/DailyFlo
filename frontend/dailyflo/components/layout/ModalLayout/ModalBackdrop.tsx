/**
 * ModalBackdrop
 * 
 * Provides a dimmed background overlay behind modal content.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

export interface ModalBackdropProps {
  children?: React.ReactNode;
}

export function ModalBackdrop({ children }: ModalBackdropProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.backdrop, { backgroundColor: colors.background.overlay() }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});

export default ModalBackdrop;


