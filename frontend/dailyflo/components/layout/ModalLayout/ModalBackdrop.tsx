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
  variant?: 'detail' | 'create';
}

export function ModalBackdrop({ children, variant = 'detail' }: ModalBackdropProps) {
  const colors = useThemeColors();
  const isCreate = variant === 'create';

  return (
    <View
      style={[
        styles.backdrop,
        {
          backgroundColor: isCreate ? colors.background.primary() : colors.background.overlay(),
          justifyContent: isCreate ? 'flex-start' : 'flex-end',
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end', // align to bottom for slide-up modal
    padding: 0, // no padding to allow modal to touch edges
  },
});

export default ModalBackdrop;


