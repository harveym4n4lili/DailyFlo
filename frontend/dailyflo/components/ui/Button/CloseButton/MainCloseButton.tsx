/**
 * MainCloseButton Component
 * 
 * A close button component for modals that adapts its styling based on iOS version.
 * For iOS 15+: displays a circular X icon button with tertiary background.
 * For older iOS: displays a text "Cancel" button with task category color background.
 * 
 * This component preserves the original styling and functionality from TaskCreationContent.
 */

// REACT IMPORTS
// react: core react library for building components
import React from 'react';

// REACT NATIVE IMPORTS
// building blocks from react native for UI components
import { Pressable, Text, Platform } from 'react-native';

// REACT NATIVE SAFE AREA CONTEXT IMPORT
// useSafeAreaInsets: hook that provides safe area insets for the device
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// EXPO VECTOR ICONS IMPORT
// ionicons: provides icons for the UI
import { Ionicons } from '@expo/vector-icons';

// CONSTANTS IMPORTS
// design system constants for styling
import { getTextStyle } from '@/constants/Typography';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useThemeColors } from '@/hooks/useColorPalette';

// EXPO GLASS EFFECT IMPORTS
// GlassView: native iOS UIVisualEffectView liquid glass surface (same pattern as FAB)
// isGlassEffectAPIAvailable: runtime check so we only use glass when the API exists
import GlassView from 'expo-glass-effect/build/GlassView';
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';

// TYPES IMPORTS
// typescript types for type safety
import type { TaskColor } from '@/types';

/**
 * Props for MainCloseButton component
 */
export interface MainCloseButtonProps {
  /** Callback when button is pressed */
  onPress: () => void;
  
  /** Task color for styling (kept for older iOS text button background if needed) */
  color?: TaskColor;
  
  /** Optional top position override (defaults to 16 + safe area top for newer iOS, 20 + safe area top for older iOS) */
  top?: number;
  
  /** Optional left position override (defaults to 16) */
  left?: number;
  
  /** Optional right position override (if provided, left is ignored) */
  right?: number;
}

/**
 * MainCloseButton Component
 * 
 * Renders a close button that adapts to iOS version:
 * - iOS 15+: circular X icon button with tertiary background
 * - Older iOS: text "Cancel" button with task category color background
 */
export const MainCloseButton: React.FC<MainCloseButtonProps> = ({
  onPress,
  color = 'blue',
  top,
  left = 16,
  right,
}) => {
  // HOOKS
  // get theme-aware colors for styling
  const themeColors = useThemeColors();
  // get safe area insets for positioning
  const insets = useSafeAreaInsets();

  // IOS VERSION DETECTION
  // get iOS version number for conditional styling
  // iOS 15+ introduced the glass UI design with updated header styling
  // returns the major version number (e.g., 14, 15, 16, 17)
  const getIOSVersion = (): number => {
    if (Platform.OS !== 'ios') return 0;
    const version = Platform.Version as string;
    // Platform.Version can be a string like "15.0" or number like 15
    // parse it to get the major version number
    const majorVersion = typeof version === 'string' 
      ? parseInt(version.split('.')[0], 10) 
      : Math.floor(version as number);
    return majorVersion;
  };
  
  // check if running on iOS 15+ (newer glass UI design)
  const isNewerIOS = getIOSVersion() >= 15;
  
  // determine icon color
  // always use the primary text color from the theme so the X icon
  // matches other primary text (not the user-selected task color)
  const getIconColor = () => {
    return themeColors.text.primary();
  };

  // background color for the close button container
  // align the close button surface styling with the FAB glass background
  // by using the same secondary background tone from the theme
  const closeButtonBackgroundColor = themeColors.background.secondary();

  // calculate top position
  // defaults to 16px from top + safe area inset for newer iOS, 20px for older iOS
  // or uses provided top value if specified
  const topPosition = top !== undefined 
    ? top 
    : isNewerIOS 
      ? 16 + insets.top  // newer iOS: 16px from top
      : 20 + insets.top; // older iOS: 20px from top

  // check if liquid glass API is available at runtime (prevents crashes on some iOS 26 betas)
  const glassAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

  // base positioning style shared between glass + non-glass versions
  const basePositionStyle = {
    position: 'absolute' as const,
    // use right position if provided, otherwise use left position
    ...(right !== undefined ? { right } : { left }),
    top: topPosition,
    zIndex: 10,
  };

  // when glass is available on newer iOS we wrap the pressable in a GlassView
  // and use the same style of glass surface as the FAB (clear style + themed tint)
  // while keeping the close button's own size and icon size
  if (isNewerIOS && glassAvailable) {
    return (
      <GlassView
        // container uses slightly larger size than the visible icon circle
        // so the liquid glass highlight has room to expand on press
        style={{
          ...basePositionStyle,
          width: 42,
          height: 42,
          borderRadius: 24,
          // keep the actual view background transparent so the tint stands out
     
          // allow the glass effect to bleed out naturally instead of clipping it
          overflow: 'visible',
        }}
        // clear style + themed tint matches the FAB's liquid glass styling
        tintColor={closeButtonBackgroundColor as any}
        glassEffectStyle="regular"
        isInteractive
      >
        <Pressable
          onPress={onPress}
          style={{
            // make the pressable fill the glass circle so the whole area is tappable
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            // add a subtle 1px border that hugs the glass circle
            // keeping it here ensures the border moves perfectly with the button content
            borderWidth: 1,
            borderColor: themeColors.border.primary(),
            borderRadius: 21,
          }}
          // hitSlop expands the tap area slightly outside the visual circle
          // to make light taps easier to register
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={32} color={getIconColor()} />
        </Pressable>
      </GlassView>
    );
  }

  // fallback for Android, web, and older iOS:
  // - newer iOS with no liquid glass: circular icon button with transparent background
  // - older iOS: keep the original "Cancel" pill button using task color background
  return (
    <Pressable
      onPress={onPress}
      style={{
        ...basePositionStyle,
        ...(isNewerIOS
          ? {
              // iOS 15+ without glass: circular icon button with no visible background
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: closeButtonBackgroundColor,
            }
          : {
              // iOS < 15 (older): text button with colored background (preserve old design)
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: themeColors.interactive.primary(),
            }),
      }}
    >
      {isNewerIOS ? (
        // newer iOS fallback: X icon with primary text color, background is transparent
        <Ionicons name="close" size={32} color={getIconColor()} />
      ) : (
        // iOS < 15 (older): text button (current style)
        <Text
          style={{
            ...getTextStyle('button-secondary'),
            color: '#FFFFFF',
          }}
        >
          Cancel
        </Text>
      )}
    </Pressable>
  );
};

export default MainCloseButton;

