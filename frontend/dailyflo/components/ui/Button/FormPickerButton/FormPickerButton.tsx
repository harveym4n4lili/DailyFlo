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
import { TouchableOpacity, Text, Animated, View } from 'react-native';
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
   * Optional - if not provided, no text will be shown when no value is selected
   */
  defaultText?: string;
  
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
  
  /**
   * Overlay icon to display at bottom-left of the button (optional)
   * Example: 'color-palette' for color selection indicators
   */
  overlayIcon?: string;
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
  overlayIcon,
}) => {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();
  
  // determine final colors to use (fallback to theme secondary if not provided)
  const finalTextColor = textColor || themeColors.text.secondary();
  const finalIconColor = iconColor || finalTextColor;
  
  // determine final display text (use displayText if provided, or empty string if not)
  const finalDisplayText = displayText || '';
  
  // determine if button has a value set (affects styling and animation)
  const hasValue = !!finalDisplayText;
  
  // create animated container if highlightOpacity is provided
  // this allows the button to have a subtle highlight animation when pressed
  // flow: user taps button → parent triggers animation → background color smoothly transitions
  const AnimatedContainer = highlightOpacity ? Animated.View : React.Fragment;
  
  // get animated styles if highlightOpacity is provided and has value
  // interpolates the animated value to smoothly transition background color
  const animatedStyle = (highlightOpacity && hasValue) ? {
    backgroundColor: highlightOpacity.interpolate({
      inputRange: [0, 1],
      outputRange: [
        themeColors.background.primary(), // normal state
        themeColors.background.quaternary(), // highlighted state
      ],
    }),
    borderRadius: 16,
    paddingVertical: 0, // Icons have their own padding container
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: themeColors.border.primary(),
    alignSelf: 'flex-start' as const,
    ...containerStyle,
  } : {};
  
  // static styles when no animation is needed or no value is set
  const staticStyle = !highlightOpacity || !hasValue ? {
    backgroundColor: hasValue ? themeColors.background.primary() : 'transparent',
    borderRadius: hasValue ? 16 : 0,
    paddingVertical: hasValue ? 0 : 8, // Default state has vertical padding, selected state has no vertical padding
    paddingHorizontal: hasValue ? 12 : 0, // Default state has no horizontal padding, selected state has horizontal padding
    borderWidth: hasValue ? 1 : 0,
    borderColor: hasValue ? themeColors.border.primary() : 'transparent',
    alignSelf: 'flex-start' as const,
    ...containerStyle,
  } : {};

  // handle press with debugging
  const handlePress = () => {
    console.log('🟢 FormPickerButton: Tapped!', icon);
    onPress();
  };

  return (
    <AnimatedContainer style={highlightOpacity ? animatedStyle : staticStyle}>
      {/* touchable inner content with icon and text */}
      {/* uses TouchableOpacity to prevent keyboard dismissal (same as SubtaskSection) */}
      {/* flow: user taps button → onPress callback → picker modal opens → keyboard stays open */}
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: hasValue && finalDisplayText ? 8 : 0,
          // reduce opacity when disabled for visual feedback
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* icon on the left */}
        <View style={{
          paddingVertical: 8, // Always add vertical padding for consistent icon spacing
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {hasValue ? (
            <Ionicons
              name={icon as any}
              size={24}
              color={finalIconColor}
            />
          ) : (
            <Animated.View style={{
              opacity: highlightOpacity ? highlightOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.6],
              }) : 1,
            }}>
              <Ionicons
                name={icon as any}
                size={24}
                color={finalIconColor}
              />
            </Animated.View>
          )}
        </View>
        
        {/* label text on the right - only render if there's text to display and has value */}
        {hasValue && finalDisplayText ? (
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
        ) : null}
      </TouchableOpacity>
      
      {/* overlay icon at bottom-left - only render if provided */}
      {overlayIcon ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -8,
            left: -8,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: themeColors.background.overlay(),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={overlayIcon as any}
            size={12}
            color={themeColors.text.primary()}
          />
        </View>
      ) : null}
    </AnimatedContainer>
  );
};

export default FormPickerButton;


