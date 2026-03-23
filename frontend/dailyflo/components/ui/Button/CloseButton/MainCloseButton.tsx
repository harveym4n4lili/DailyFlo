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

// EXPO VECTOR ICONS IMPORT
// ionicons: fallback icons on Android/Web (SF Symbols not available there)
import { Ionicons } from '@expo/vector-icons';

// CUSTOM ICON IMPORTS
// SFSymbolIcon: SF Symbols on iOS, falls back to Ionicons on Android/Web
import { SFSymbolIcon } from '@/components/ui/icon';

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

  /**
   * modal: fullscreen overlay + absolute position (default — sheets / modals).
   * inline: same glass / X styling in a normal row (e.g. next to a search field).
   */
  layout?: 'modal' | 'inline';
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
  layout = 'modal',
}) => {
  // HOOKS
  // get theme-aware colors for styling
  const themeColors = useThemeColors();
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
  const isInline = layout === 'inline';

  // base positioning style shared between glass + non-glass versions (modal only)
  const basePositionStyle = {
    position: 'absolute' as const,
    ...(right !== undefined ? { right } : { left }),
    top: topPosition,
    zIndex: 10,
  };

  const absoluteWrapperStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: windowWidth,
    height: windowHeight,
    zIndex: 10,
  };

  const glassCircleStyle = {
    width: 42,
    height: 42,
    borderRadius: 24,
    overflow: 'visible' as const,
  };

  // when glass is available on newer iOS we wrap the pressable in a GlassView
  if (isNewerIOS && glassAvailable) {
    const glassBody = (
      <GlassView
        style={isInline ? glassCircleStyle : { ...basePositionStyle, ...glassCircleStyle }}
        tintColor={closeButtonBackgroundColor as any}
        glassEffectStyle="regular"
        isInteractive
      >
        <Pressable
          onPress={onPress}
          style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0,
            borderColor: themeColors.border.primary(),
            borderRadius: 21,
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <SFSymbolIcon name="xmark" size={20} color={getIconColor()} fallback={<Ionicons name="close" size={28} color={getIconColor()} />} />
        </Pressable>
      </GlassView>
    );
    if (isInline) return glassBody;
    return (
      <View pointerEvents="box-none" style={absoluteWrapperStyle}>
        {glassBody}
      </View>
    );
  }

  // fallback for Android, web, and older iOS
  const fallbackPressableStyle = isInline
    ? isNewerIOS
      ? {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          backgroundColor: closeButtonBackgroundColor,
        }
      : {
          paddingHorizontal: Paddings.contextMenuHorizontal,
          paddingVertical: Paddings.contextMenuVertical,
          borderRadius: 20,
          backgroundColor: themeColors.interactive.primary(),
        }
    : {
        ...basePositionStyle,
        ...(isNewerIOS
          ? {
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center' as const,
              justifyContent: 'center' as const,
              backgroundColor: closeButtonBackgroundColor,
            }
          : {
              paddingHorizontal: Paddings.contextMenuHorizontal,
              paddingVertical: Paddings.contextMenuVertical,
              borderRadius: 20,
              backgroundColor: themeColors.interactive.primary(),
            }),
      };

  const fallbackBody = (
    <Pressable
      onPress={onPress}
      style={fallbackPressableStyle}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Cancel"
    >
      {isNewerIOS ? (
        <SFSymbolIcon name="xmark" size={28} color={getIconColor()} fallback={<Ionicons name="close" size={28} color={getIconColor()} />} />
      ) : (
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

  if (isInline) return fallbackBody;
  return (
    <View pointerEvents="box-none" style={absoluteWrapperStyle}>
      {fallbackBody}
    </View>
  );
};

export default MainCloseButton;

