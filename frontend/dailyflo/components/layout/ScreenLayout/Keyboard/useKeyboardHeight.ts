/**
 * useKeyboardHeight Hook
 * 
 * Provides keyboard height state with LayoutAnimation synchronization.
 * Perfect for components that need to position themselves relative to the keyboard.
 * 
 * Features:
 * - Tracks keyboard height in real-time
 * - Uses LayoutAnimation for smooth keyboard-synced animations
 * - Works on both iOS and Android
 * - Handles keyboard show/hide events
 * 
 * @returns {number} Current keyboard height in pixels
 * 
 * @example
 * ```tsx
 * const keyboardHeight = useKeyboardHeight();
 * 
 * return (
 *   <View style={{ paddingBottom: keyboardHeight }}>
 *     {children}
 *   </View>
 * );
 * ```
 */

import { useState, useEffect, useRef } from 'react';
import { Keyboard, KeyboardEvent, Platform, LayoutAnimation, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Hook to track keyboard height with LayoutAnimation synchronization
 * 
 * Returns the current keyboard height, updating smoothly as keyboard shows/hides.
 * Uses LayoutAnimation to ensure animations sync perfectly with keyboard animations.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // track if keyboard is currently shown
  // once keyboard opens, we lock the height and ignore subsequent show events
  // this prevents twitching when switching fields - button stays at locked position
  const isKeyboardOpenRef = useRef(false);
  const lockedHeightRef = useRef(0);

  useEffect(() => {
    // Keyboard show listener
    // Uses keyboardWillShow on iOS for smoother animation, keyboardDidShow on Android
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event: KeyboardEvent) => {
        const height = event.endCoordinates.height;
        const duration = event.duration || 250;

        // if keyboard is already open, ignore this event
        // this prevents button position changes when switching between fields
        // button stays locked at the position where keyboard first opened
        if (isKeyboardOpenRef.current) {
          return;
        }

        // keyboard is opening for the first time
        // lock the height and mark keyboard as open
        isKeyboardOpenRef.current = true;
        lockedHeightRef.current = height;

        // Configure LayoutAnimation to sync with keyboard animation
        // This only runs when keyboard first opens
        LayoutAnimation.configureNext({
          duration: duration,
          update: {
            type: LayoutAnimation.Types.keyboard, // use keyboard animation curve
            property: LayoutAnimation.Properties.opacity,
          },
          create: {
            type: LayoutAnimation.Types.keyboard,
            property: LayoutAnimation.Properties.opacity,
          },
        });

        // Update state with locked height
        setKeyboardHeight(height);
      }
    );

    // Keyboard hide listener
    // Uses keyboardWillHide on iOS for smoother animation, keyboardDidHide on Android
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event: KeyboardEvent) => {
        const duration = event.duration || 250;

        // keyboard is closing - reset lock
        // next time keyboard opens, we'll lock to new height
        isKeyboardOpenRef.current = false;
        lockedHeightRef.current = 0;

        // Configure LayoutAnimation to sync with keyboard hide animation
        LayoutAnimation.configureNext({
          duration: duration,
          update: {
            type: LayoutAnimation.Types.keyboard,
            property: LayoutAnimation.Properties.opacity,
          },
          delete: {
            type: LayoutAnimation.Types.keyboard,
            property: LayoutAnimation.Properties.opacity,
          },
        });

        // Update state - keyboard is closed
        setKeyboardHeight(0);
      }
    );

    // Cleanup: remove listeners when component unmounts
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  return keyboardHeight;
}
