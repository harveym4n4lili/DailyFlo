/**
 * SaveButton Component
 * 
 * A reusable button component for saving changes.
 * Uses a tick/checkmark icon for iOS 15+ and text button for older iOS versions.
 * 
 * Features:
 * - Circular icon button (iOS 15+) or text button (older iOS)
 * - Tick/checkmark icon for save action
 * - Loading state with hourglass icon
 * - Disabled state when inactive
 * - Task category color styling
 */

// REACT IMPORTS
import React from 'react';
import { Pressable, Text, Platform } from 'react-native';

// EXPO VECTOR ICONS IMPORT
import { Ionicons } from '@expo/vector-icons';

// CUSTOM HOOKS IMPORTS
// useThemeColors: hook for accessing theme-aware colors
import { useThemeColors } from '@/hooks/useColorPalette';
// useTypography: hook for accessing typography system
import { useTypography } from '@/hooks/useTypography';

// CONSTANTS IMPORTS
// design system constants for styling
import { getTextStyle } from '@/constants/Typography';
import { TaskCategoryColors } from '@/constants/ColorPalette';

// EXPO GLASS EFFECT IMPORTS
// GlassView: native iOS UIVisualEffectView liquid glass surface (same pattern as MainCloseButton)
// isGlassEffectAPIAvailable: runtime check so we only use glass when the API exists
import GlassView from 'expo-glass-effect/build/GlassView';
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';

// TYPES IMPORTS
import type { TaskColor } from '@/types';

/**
 * Props interface for SaveButton component
 */
export interface SaveButtonProps {
  /**
   * Callback when the button is pressed
   * This is where the parent component handles saving changes
   */
  onPress: () => void;
  
  /**
   * Whether the button is disabled
   * When true, button shows inactive state and cannot be pressed
   */
  disabled?: boolean;
  
  /**
   * Whether a save operation is in progress (loading state)
   * When true, shows hourglass icon and reduces opacity
   */
  isLoading?: boolean;
  
  /**
   * Task category color for button styling
   * Used to determine icon/text color
   */
  taskCategoryColor?: TaskColor;
  
  /**
   * Custom text to display (for older iOS versions)
   * @default "Save"
   */
  text?: string;
  
  /**
   * Custom loading text to display (for older iOS versions)
   * @default "Saving..."
   */
  loadingText?: string;

  /**
   * Button size in pixels (icon size for circular button; whole button scales with this)
   * @default 24
   */
  size?: number;
}

/**
 * Get iOS version number for conditional styling
 * iOS 15+ introduced the glass UI design with updated button styling
 * Returns the major version number (e.g., 14, 15, 16, 17)
 */
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

/**
 * SaveButton Component
 * 
 * Renders a save button with tick/checkmark icon.
 * Adapts styling based on iOS version (circular icon button for iOS 15+, text button for older).
 */
export const SaveButton: React.FC<SaveButtonProps> = ({
  onPress,
  disabled = false,
  isLoading = false,
  taskCategoryColor = 'blue',
  text = 'Save',
  loadingText = 'Saving...',
  size = 24,
}) => {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();
  // get typography system for consistent text styling
  const typography = useTypography();
  
  // check if running on iOS 15+ (newer glass UI design)
  const isNewerIOS = getIOSVersion() >= 15;
  
  // check if liquid glass API is available at runtime (prevents crashes on some iOS 26 betas)
  const glassAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable();
  
  // determine icon color
  // always use the primary text color from the theme so the icon
  // matches other primary text (not the user-selected task color)
  const getIconColor = () => {
    return themeColors.text.primary();
  };
  
  // background tint color for the save button glass container
  const saveButtonGlassTintColor = themeColors.background.secondary();
  // fallback background when glass is not used (newer iOS without glass)
  const saveButtonBackgroundColor = themeColors.background.secondary();

  // scale the whole button with size: default was icon 24 inside 42x42 (ratio 42/24)
  // so container and border radii scale proportionally
  const containerSize = Math.round(size * (42 / 24));
  const outerBorderRadius = Math.round(containerSize * (24 / 42));
  const innerBorderRadius = Math.round(containerSize / 2);

  const isActive = !disabled && !isLoading;
  
  // handle button press - call parent callback
  const handlePress = () => {
    if (isActive && onPress) {
      onPress();
    }
  };

  // core button content (icon or text)
  // wrapped so we can reuse it inside or outside GlassView
  const buttonContent = (
    <Pressable
      onPress={handlePress}
      disabled={!isActive}
      style={({ pressed }) => ({
        // make the pressable fill the container so the whole area is tappable
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        // when inside a glass surface we add a subtle 1px border that hugs
        // the circular button (same pattern as `MainCloseButton`)
        ...(isNewerIOS && glassAvailable
          ? {
              borderWidth: 1,
              borderColor: themeColors.border.primary(),
              borderRadius: innerBorderRadius,
            }
          : null),
        // when pressed: use inactive state opacity (0.4), no animations
        // inactive state: 0.4 opacity, loading state: 0.6 opacity, active state: 1.0 opacity
        opacity: pressed ? 0.4 : (!isActive ? 0.4 : isLoading ? 0.6 : 1),
      })}
      // hitSlop expands the tap area slightly outside the visual circle
      // to make light taps easier to register
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {isNewerIOS ? (
        // iOS 15+ (newer): tick/checkmark icon button (or hourglass when saving)
        <Ionicons
          name={isLoading ? "hourglass-outline" : "checkmark"}
          size={size}
          color={getIconColor()}
        />
      ) : (
        // iOS < 15 (older): text button
        <Text style={{
          ...getTextStyle('button-secondary'),
          // use white text for contrast on colored backgrounds
          color: '#FFFFFF',
          fontWeight: '900', // save button is bold
        }}>
          {isLoading ? loadingText : text}
        </Text>
      )}
    </Pressable>
  );

  // when glass is available on newer iOS we wrap the pressable in a GlassView
  // the glass background itself is visually transparent (no custom tint),
  // and the icon always uses the primary text color
  if (isNewerIOS && glassAvailable) {
    return (
      <GlassView
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: outerBorderRadius,
          overflow: 'visible',
        }}
        // use the same regular glass effect + themed tint as `MainCloseButton`
        // this is what creates the subtle, soft-glass header button look
        tintColor={saveButtonGlassTintColor as any}
        glassEffectStyle="regular"
        isInteractive
      >
        {buttonContent}
      </GlassView>
    );
  }

  // fallback for Android, web, and older iOS:
  // - newer iOS with no liquid glass: circular icon button with transparent background
  // - older iOS: keep the original text button with colored background
  return (
    <Pressable
      onPress={handlePress}
      disabled={!isActive}
      style={({ pressed }) => ({
        ...(isNewerIOS
          ? {
              width: containerSize,
              height: containerSize,
              borderRadius: innerBorderRadius,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: saveButtonBackgroundColor,
              // when pressed: use inactive state opacity (0.4), no animations
              // inactive state: 0.4 opacity, loading state: 0.6 opacity, active state: 1.0 opacity
              opacity: pressed ? 0.4 : (!isActive ? 0.4 : isLoading ? 0.6 : 1),
            }
          : {
              // iOS < 15 (older): text button with colored background (preserve old design)
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: TaskCategoryColors[taskCategoryColor][500],
              justifyContent: 'center',
              alignItems: 'center',
              // when pressed: use inactive state opacity (0.4), no animations
              // inactive state: 0.4 opacity, loading state: 0.6 opacity, active state: 1.0 opacity
              opacity: pressed ? 0.4 : (!isActive ? 0.4 : isLoading ? 0.6 : 1),
            }),
      })}
    >
      {isNewerIOS ? (
        // newer iOS fallback: icon with primary text color, background is transparent
        <Ionicons
          name={isLoading ? "hourglass-outline" : "checkmark"}
          size={size}
          color={getIconColor()}
        />
      ) : (
        // iOS < 15 (older): text button (current style)
        <Text style={{
          ...getTextStyle('button-secondary'),
          // use white text for contrast on colored backgrounds
          color: '#FFFFFF',
          fontWeight: '900', // save button is bold
        }}>
          {isLoading ? loadingText : text}
        </Text>
      )}
    </Pressable>
  );
};

export default SaveButton;

