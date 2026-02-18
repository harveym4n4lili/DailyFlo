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
import { Pressable, Text, Platform, useWindowDimensions, View } from 'react-native';

// REACT NATIVE SAFE AREA CONTEXT IMPORT
// useSafeAreaInsets: hook that provides safe area insets for the device
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// EXPO VECTOR ICONS IMPORT
// ionicons: provides icons for the UI
import { Ionicons } from '@expo/vector-icons';

// CONSTANTS IMPORTS
// design system constants for styling
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useThemeColors } from '@/hooks/useColorPalette';

// EXPO GLASS EFFECT IMPORTS
// GlassView: native iOS UIVisualEffectView liquid glass surface (same pattern as FAB)
// we don't call isGlassEffectAPIAvailable here because older SDKs may not export it;
// GlassView itself will safely no-op on unsupported platforms.
import GlassView from 'expo-glass-effect/build/GlassView';

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
  
  /** Optional top position override (defaults to 0 so button reaches top of modal) */
  top?: number;
  
  /** Optional left position override (defaults to 0) */
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
  left = 0,
  right,
}) => {
  // HOOKS
  // get theme-aware colors for styling
  const themeColors = useThemeColors();
  // get safe area insets for positioning
  const insets = useSafeAreaInsets();
  // window dimensions for absolute positioning relative to screen
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

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
  const closeButtonBackgroundColor = themeColors.background.primary();

  // top position: 0 so button reaches top of modal (pass top={insets.top} for safe area if needed)
  const topPosition = top !== undefined ? top : 20;

  // on iOS we always render the GlassView wrapper; on unsupported platforms
  // expo-glass-effect falls back internally so we don't need an explicit check.
  const glassAvailable = Platform.OS === 'ios';

  // base positioning style shared between glass + non-glass versions
  const basePositionStyle = {
    position: 'absolute' as const,
    // use right position if provided, otherwise use left position
    ...(right !== undefined ? { right } : { left }),
    top: topPosition,
    zIndex: 10,
  };

  // wrapper: absolutely positioned to window so button stays fixed at top-left when content scrolls
  const absoluteWrapperStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: windowWidth,
    height: windowHeight,
    zIndex: 10,
  };

  // when glass is available on newer iOS we wrap the pressable in a GlassView
  if (isNewerIOS && glassAvailable) {
    return (
      <View pointerEvents="box-none" style={absoluteWrapperStyle}>
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
            borderWidth: 0,
            borderColor: themeColors.border.primary(),
            borderRadius: 21,
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={28} color={getIconColor()} />
        </Pressable>
      </GlassView>
    </View>
    );
  }

  // fallback for Android, web, and older iOS:
  // - newer iOS with no liquid glass: circular icon button with transparent background
  // - older iOS: keep the original "Cancel" pill button using task color background
  return (
    <View pointerEvents="box-none" style={absoluteWrapperStyle}>
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
              paddingHorizontal: Paddings.contextMenuHorizontal,
              paddingVertical: Paddings.contextMenuVertical,
              borderRadius: 20,
              backgroundColor: themeColors.interactive.primary(),
            }),
      }}
    >
      {isNewerIOS ? (
        // newer iOS fallback: X icon with primary text color, background is transparent
        <Ionicons name="close" size={28} color={getIconColor()} />
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
    </View>
  );
};

export default MainCloseButton;

