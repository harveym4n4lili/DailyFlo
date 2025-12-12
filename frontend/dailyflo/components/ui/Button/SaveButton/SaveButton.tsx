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
}) => {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();
  // get typography system for consistent text styling
  const typography = useTypography();
  
  // check if running on iOS 15+ (newer glass UI design)
  const isNewerIOS = getIOSVersion() >= 15;
  
  // determine button icon/text color based on task category color
  // always use task category color, including white case
  const getButtonTextColor = () => {
    return TaskCategoryColors[taskCategoryColor][500]; // task category color
  };
  
  // determine if button should be active (not disabled and not loading)
  const isActive = !disabled && !isLoading;
  
  // handle button press - call parent callback
  const handlePress = () => {
    if (isActive && onPress) {
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!isActive}
      style={({ pressed }) => ({
        ...(isNewerIOS ? {
          // iOS 15+: circular button with lightOverlay background (matches MainCloseButton)
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: themeColors.background.lightOverlay(), // same as MainCloseButton
          // when pressed: use inactive state opacity (0.4), no animations
          // inactive state: 0.4 opacity, loading state: 0.6 opacity, active state: 1.0 opacity
          opacity: pressed ? 0.4 : (!isActive ? 0.4 : isLoading ? 0.6 : 1),
        } : {
          // iOS < 15: text button with colored background
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
        // iOS 15+ (newer): tick/checkmark icon button (or hourglass when saving)
        <Ionicons
          name={isLoading ? "hourglass-outline" : "checkmark"}
          size={24}
          color={getButtonTextColor()}
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
};

export default SaveButton;

