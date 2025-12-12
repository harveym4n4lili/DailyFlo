/**
 * KeyboardAnchoredContainer Component
 * 
 * A composable container that positions its children relative to the keyboard.
 * Automatically adjusts padding to keep content above the keyboard.
 * 
 * Features:
 * - Automatically tracks keyboard height
 * - Smooth animations synced with keyboard
 * - Accounts for safe area insets
 * - Optional offset for custom positioning
 * 
 * Usage:
 * Wrap content that should be anchored to keyboard in this container.
 * Use inside FullScreenModal or other modal components.
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from './useKeyboardHeight';

export interface KeyboardAnchoredContainerProps {
  /**
   * Content to anchor to keyboard
   */
  children: React.ReactNode;

  /**
   * Offset to subtract from keyboard padding
   * Use this when you have a fixed bottom section (like action buttons)
   * @default 0
   */
  offset?: number;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * Container that positions children relative to the keyboard
 * 
 * Automatically adjusts paddingBottom to keep content above the keyboard.
 * The offset prop allows you to account for fixed bottom sections.
 */
export const KeyboardAnchoredContainer: React.FC<KeyboardAnchoredContainerProps> = ({
  children,
  offset = 0,
  style,
}) => {
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();

  // Calculate padding: keyboard height + safe area - offset
  // This positions the container content above the keyboard
  // Ensure padding is never negative
  const paddingBottom = Math.max(0, keyboardHeight + insets.bottom - offset);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: paddingBottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styles can be customized via style prop
  },
});

export default KeyboardAnchoredContainer;

