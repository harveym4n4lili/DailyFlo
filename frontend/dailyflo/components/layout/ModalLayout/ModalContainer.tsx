/**
 * ModalContainer
 * 
 * Provides the elevated surface that holds modal content.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

export interface ModalContainerProps {
  children?: React.ReactNode;
}

export function ModalContainer({ children }: ModalContainerProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.elevated(),
          borderColor: colors.border.primary(),
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: Platform.select({ ios: StyleSheet.hairlineWidth, android: StyleSheet.hairlineWidth, default: 1 }),
    overflow: 'hidden',
  },
});

export default ModalContainer;


