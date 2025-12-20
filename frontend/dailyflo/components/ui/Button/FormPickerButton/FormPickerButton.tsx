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
  
  /**
   * Force the button to show selected state styling even without displayText
   * Useful for cases where there's always a default value (like icon picker)
   * @default false
   */
  forceSelected?: boolean;
  
  /**
   * Custom container to render on the right side of the icon
   * Allows for custom styling and content (like color palette icon)
   */
  rightContainer?: React.ReactNode;
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
  forceSelected = false,
  rightContainer,
}) => {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();
  
  // determine final colors to use (fallback to theme secondary if not provided)
  const finalTextColor = textColor || themeColors.text.secondary();
  const finalIconColor = iconColor || finalTextColor;
  
  // determine final display text (use displayText if provided, or empty string if not)
  const finalDisplayText = displayText || '';
  
  // determine if button has a value set (affects styling and animation)
  // use forceSelected to override the hasValue logic for cases like icon picker
  const hasValue = forceSelected || !!finalDisplayText;
  
  // create animated container - always use View (not Fragment) so we can apply styles
  // use Animated.View when highlightOpacity is provided, regular View otherwise
  // this allows the button to have a subtle highlight animation when pressed
  // flow: user taps button → parent triggers animation → background color smoothly transitions
  const AnimatedContainer = highlightOpacity ? Animated.View : View;
  
  // get animated styles if highlightOpacity is provided and has value
  // use opacity-based highlight overlay instead of backgroundColor interpolation
  // this allows useNativeDriver to work properly and prevents jankiness
  // the highlight is a separate overlay that fades in/out smoothly
  const animatedStyle = (highlightOpacity && hasValue) ? {
    backgroundColor: 'transparent', // static background color
    borderRadius: 20,
    paddingVertical: 0, // Icons have their own padding container
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: themeColors.border.primary(),
    alignSelf: 'flex-start' as const,
    overflow: 'hidden', // ensure highlight overlay respects border radius
    ...containerStyle,
  } : {};
  
  // static styles when no animation is needed or no value is set
  const staticStyle = !highlightOpacity || !hasValue ? {
    backgroundColor: 'transparent',
    borderRadius: hasValue ? 20 : 0,
    paddingVertical: hasValue ? 0 : 8, // Default state has vertical padding, selected state has no vertical padding
    paddingHorizontal: hasValue ? 12 : 0, // Default state has no horizontal padding, selected state has horizontal padding
    borderWidth: hasValue ? 1 : 0,
    borderColor: hasValue ? themeColors.border.primary() : 'transparent',
    alignSelf: 'flex-start' as const,
    ...containerStyle,
  } : {};

  // handle press with debugging
  const handlePress = () => {
    // console.log('🟢 FormPickerButton: Tapped!', icon);
    onPress();
  };

  return (
    <AnimatedContainer style={highlightOpacity ? animatedStyle : staticStyle}>
      {/* highlight overlay - only shown when button has value and highlightOpacity is provided */}
      {/* uses opacity animation which can use native driver for smooth performance */}
      {/* positioned absolutely to overlay the button without affecting layout */}
      {highlightOpacity && hasValue ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.background.quaternary(),
            opacity: highlightOpacity,
            borderRadius: 20,
          }}
          pointerEvents="none" // don't intercept touches
        />
      ) : null}
      
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
          // ensure content is above highlight overlay
          zIndex: 1,
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
        
        {/* custom right container - only render if provided */}
        {rightContainer ? (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8, // spacing from the main icon
          }}>
            {rightContainer}
          </View>
        ) : null}
        
        {/* label text on the right - only render if there's text to display and has value */}
        {/* For forceSelected buttons, don't show text even if hasValue is true */}
        {hasValue && finalDisplayText && !forceSelected ? (
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
      
      {/* overlay icon - only render if provided */}
      {overlayIcon ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.1)', // subtle background for contrast
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={overlayIcon as any}
            size={12}
            color="white" // white color as requested
          />
        </View>
      ) : null}
    </AnimatedContainer>
  );
};

export default FormPickerButton;


