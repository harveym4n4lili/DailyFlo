/**
 * FormPickerButton Component
 * 
 * A reusable button component for form field pickers (date, time, alerts, etc.).
 * Features animated highlights, dynamic text/colors, and consistent styling.
 * 
 * This component is designed to match the reference design style with:
 * - Icon + text layout
 * - Dynamic color states based on selection
 * - Highlight animations on press
 * - Customizable display logic
 * 
 * Usage:
 * ```tsx
 * <FormPickerButton
 *   icon="calendar-outline"
 *   defaultText="No Date"
 *   displayText="Today"
 *   textColor={colors.success}
 *   iconColor={colors.success}
 *   onPress={handleShowDatePicker}
 *   highlightOpacity={dateButtonHighlight}
 * />
 * ```
 */

import React from 'react';
import { Pressable, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';

/**
 * Props for FormPickerButton component
 */
export interface FormPickerButtonProps {
  /**
   * Icon name from Ionicons library
   * Example: 'calendar-outline', 'time-outline', 'notifications-outline'
   */
  icon: string;
  
  /**
   * Default text to display when no value is selected
   * Example: 'No Date', 'No Time', 'No Alerts'
   */
  defaultText: string;
  
  /**
   * Current display text (overrides defaultText when provided)
   * This is the dynamic text that shows the current selection
   * Example: 'Today', 'Tomorrow', '10:30 AM', '30min'
   */
  displayText?: string;
  
  /**
   * Text color (defaults to theme secondary if not provided)
   * Use semantic colors for status-based styling:
   * - Success green for "Today"
   * - Warning amber for "Tomorrow"
   * - Error red for overdue dates
   * - Secondary gray for unset or neutral states
   */
  textColor?: string;
  
  /**
   * Icon color (defaults to textColor or theme secondary)
   * Usually matches textColor for visual consistency
   */
  iconColor?: string;
  
  /**
   * Callback when button is pressed
   * Opens the associated picker modal
   */
  onPress: () => void;
  
  /**
   * Animated value for highlight effect (optional)
   * Controls the background color animation when button is pressed
   * Range: 0 (no highlight) to 1 (full highlight)
   * 
   * How it works:
   * - Parent component creates: useRef(new Animated.Value(0)).current
   * - Parent triggers animation on press using triggerButtonHighlight()
   * - This component interpolates the value to create smooth color transitions
   */
  highlightOpacity?: Animated.Value;
  
  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Custom style for the button container (optional)
   * Allows overriding default styles while maintaining base functionality
   */
  containerStyle?: any;
}

/**
 * FormPickerButton Component
 * 
 * Renders a pressable button with icon and text, used for opening picker modals.
 * Supports animated highlights and dynamic styling based on selection state.
 */
export const FormPickerButton: React.FC<FormPickerButtonProps> = ({
  icon,
  defaultText,
  displayText,
  textColor,
  iconColor,
  onPress,
  highlightOpacity,
  disabled = false,
  containerStyle,
}) => {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();
  
  // determine final colors to use (fallback to theme secondary if not provided)
  const finalTextColor = textColor || themeColors.text.secondary();
  const finalIconColor = iconColor || finalTextColor;
  
  // determine final display text (use displayText if provided, otherwise defaultText)
  const finalDisplayText = displayText || defaultText;
  
  // create animated container if highlightOpacity is provided
  // this allows the button to have a subtle highlight animation when pressed
  // flow: user taps button → parent triggers animation → background color smoothly transitions
  const AnimatedContainer = highlightOpacity ? Animated.View : React.Fragment;
  
  // get animated styles if highlightOpacity is provided
  // interpolates the animated value to smoothly transition background color
  const animatedStyle = highlightOpacity ? {
    backgroundColor: highlightOpacity.interpolate({
      inputRange: [0, 1],
      outputRange: [
        themeColors.background.primary(), // normal state
        themeColors.background.quaternary(), // highlighted state
      ],
    }),
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: themeColors.border.primary(),
    alignSelf: 'flex-start' as const,
    ...containerStyle,
  } : {};
  
  // static styles when no animation is needed
  const staticStyle = !highlightOpacity ? {
    backgroundColor: themeColors.background.primary(),
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: themeColors.border.primary(),
    alignSelf: 'flex-start' as const,
    ...containerStyle,
  } : {};

  return (
    <AnimatedContainer style={highlightOpacity ? animatedStyle : staticStyle}>
      {/* pressable inner content with icon and text */}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          // reduce opacity when disabled for visual feedback
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* icon on the left */}
        <Ionicons
          name={icon as any}
          size={16}
          color={finalIconColor}
        />
        
        {/* label text on the right */}
        <Text
          style={{
            ...getTextStyle('body-large'),
            color: finalTextColor,
            textAlignVertical: 'center',
            includeFontPadding: false,
          }}
        >
          {finalDisplayText}
        </Text>
      </Pressable>
    </AnimatedContainer>
  );
};

export default FormPickerButton;


