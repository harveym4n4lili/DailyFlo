/**
 * MainBackButton Component
 * 
 * A back button component for modals that adapts its styling based on iOS version.
 * For iOS 15+: displays a circular back arrow icon button with tertiary background.
 * For older iOS: displays a text "Back" button with task category color background.
 * 
 * This component is similar to MainCloseButton but uses a back arrow icon instead of close icon.
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
import { TaskCategoryColors } from '@/constants/ColorPalette';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useThemeColors } from '@/hooks/useColorPalette';

// TYPES IMPORTS
// typescript types for type safety
import type { TaskColor } from '@/types';

/**
 * Props for MainBackButton component
 */
export interface MainBackButtonProps {
  /** Callback when button is pressed */
  onPress: () => void;
  
  /** Task color for styling (used for older iOS text button background) */
  color?: TaskColor;
  
  /** Optional top position override (defaults to 16 + safe area top for newer iOS, 20 + safe area top for older iOS) */
  top?: number;
  
  /** Optional left position override (defaults to 16) */
  left?: number;
  
  /** Optional right position override (if provided, left is ignored) */
  right?: number;
}

/**
 * MainBackButton Component
 * 
 * Renders a back button that adapts to iOS version:
 * - iOS 15+: circular back arrow icon button with tertiary background
 * - Older iOS: text "Back" button with task category color background
 */
export const MainBackButton: React.FC<MainBackButtonProps> = ({
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
  
  // determine button text/icon color based on task category color
  // always use task category color, including white case
  const getButtonTextColor = () => {
    return TaskCategoryColors[color][500]; // task category color
  };

  // calculate top position
  // defaults to 16px from top + safe area inset for newer iOS, 20px for older iOS
  // or uses provided top value if specified
  const topPosition = top !== undefined 
    ? top 
    : isNewerIOS 
      ? 16 + insets.top  // newer iOS: 16px from top
      : 20 + insets.top; // older iOS: 20px from top

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        // use right position if provided, otherwise use left position
        ...(right !== undefined 
          ? { right: right } 
          : { left: left }
        ),
        top: topPosition, // top position (default 16px + safe area top)
        zIndex: 10, // ensure button appears above other content
        ...(isNewerIOS ? {
          // iOS 15+ (newer): circular back arrow icon button with tertiary background
          width: 42, // button width
          height: 42, // button height
          borderRadius: 21, // circular shape (half of width/height)
          alignItems: 'center', // center icon horizontally
          justifyContent: 'center', // center icon vertically
          backgroundColor: themeColors.background.lightOverlay(), // tertiary background for newer iOS
        } : {
          // iOS < 15 (older): text button with colored background
          paddingHorizontal: 12, // horizontal padding for text
          paddingVertical: 8, // vertical padding for text
          borderRadius: 20, // rounded corners
          backgroundColor: TaskCategoryColors[color][500], // task category color background
        }),
      }}
    >
      {isNewerIOS ? (
        // iOS 15+ (newer): back arrow icon button
        <Ionicons
          name="arrow-back"
          size={32}
          color={getButtonTextColor()}
        />
      ) : (
        // iOS < 15 (older): text button (current style)
        <Text style={{
          ...getTextStyle('button-secondary'),
          // use white text for contrast on colored backgrounds
          color: '#FFFFFF',
        }}>
          Back
        </Text>
      )}
    </Pressable>
  );
};

export default MainBackButton;
