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
import { TouchableOpacity, Pressable, Text, Animated, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';

// EXPO GLASS EFFECT IMPORTS
// GlassView: native iOS liquid glass surface used for selected picker states
// isGlassEffectAPIAvailable: runtime check so we only enable liquid glass when supported
import GlassView from 'expo-glass-effect/build/GlassView';
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';

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

  /**
   * Custom icon element to render instead of Ionicons (e.g. ClockIcon).
   * When provided, this is shown in place of the icon-name-based Ionicons icon.
   */
  customIcon?: React.ReactNode;
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
  customIcon,
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

  // determine if we should render any text label next to the icon
  // this drives spacing between icon and text so it's consistent in all cases
  // - show text when: not forceSelected AND (we have a selected value OR a default/base label)
  // - hide text for forceSelected icon-only pills
  const shouldShowText = !forceSelected && ((hasValue && finalDisplayText) || defaultText);

  // check if liquid glass API is available at runtime (prevents crashes on unsupported iOS versions)
  const glassAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable();
  
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
    borderRadius: 16,
    // lock in a consistent pill height for all picker buttons with values
    minHeight: 32,
    paddingVertical: 0, // Icons have their own padding container
    paddingHorizontal: 10,
    // border removed - no border on picker buttons
    borderWidth: 1,
    borderColor: themeColors.border.primary(),
    alignSelf: 'flex-start' as const,
    overflow: 'hidden', // ensure highlight overlay respects border radius
    ...containerStyle,
  } : {};
  
  // static styles when no animation is needed or no value is set
  const staticStyle = !highlightOpacity || !hasValue ? {
    backgroundColor: 'transparent',
    borderRadius: hasValue ? 16 : 0,
    // ensure buttons without values use the same base height
    // so the date picker doesn't appear taller than its siblings
    minHeight: 32,
  
    // border removed - no border on picker buttons
    borderWidth: 1,
    borderColor: 'transparent',
    alignSelf: 'flex-start' as const,
    ...containerStyle,
  } : {};

  // handle press with debugging
  const handlePress = () => {
    // console.log('🟢 FormPickerButton: Tapped!', icon);
    onPress();
  };

  // choose inner button component:
  // - when using GlassView (hasValue + glassAvailable) we prefer Pressable for better
  //   interaction feedback inside the glass surface
  // - otherwise we keep using TouchableOpacity (to preserve existing behavior)
  const InnerButton = hasValue && glassAvailable ? Pressable : TouchableOpacity;

  // core button content (icon + text + overlays)
  // wrapped in AnimatedContainer so we can reuse it inside or outside GlassView
  const content = (
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
         
            
          }}
          pointerEvents="none" // don't intercept touches
        />
      ) : null}
      
      {/* touchable inner content with icon and text */}
      {/* uses TouchableOpacity to prevent keyboard dismissal (same as SubtaskSection) */}
      {/* flow: user taps button → onPress callback → picker modal opens → keyboard stays open */}
      <InnerButton
        onPress={handlePress}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          // keep a consistent fixed gap between icon and text whenever text is shown
          // when there is no text (icon-only pill), gap is 0
          gap: shouldShowText ? 4 : 0,
          // when there is no value, add a subtle border so the pill is still clearly visible
          // when there is a value, keep the existing styling (no extra border here)
          borderWidth: hasValue ? 0 : 1,
          borderColor: hasValue ? 'transparent' : themeColors.border.primary(),
          borderRadius: hasValue ? 0 : 16,
          // uniform vertical padding so icon-only and text pills have identical height
          paddingVertical: 8,
          paddingHorizontal: hasValue ? 0 : 10,
          // add right-side padding so text does not touch the pill border **only**
          // when there is no value (when InnerButton owns the border).
          // when there IS a value, the outer animated container already supplies horizontal padding,
          // so we set this back to 0 to avoid "extra" right padding on selected pills.
        
          // reduce opacity when disabled for visual feedback
          opacity: disabled ? 0.5 : 1,
          // ensure content is above highlight overlay
          zIndex: 1,
        }}>
        {/* icon on the left - customIcon (e.g. ClockIcon) or Ionicons by name */}
        <View
          style={{
            // no extra vertical padding here; we center the whole row via InnerButton
            alignItems: 'center',
            justifyContent: 'center',
            // add consistent horizontal padding around the icon so the visual
            // space between the icon and the text is the same for ALL picker buttons
            // regardless of whether they currently have a value or not
            marginRight: 2,
          }}
        >
          {hasValue ? (
            customIcon ?? (
              <Ionicons
                name={icon as any}
                size={18}
                color={finalIconColor}
              />
            )
          ) : (
            <Animated.View
              style={{
                opacity: highlightOpacity
                  ? highlightOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.6],
                    })
                  : 1,
              }}
            >
              {customIcon ?? (
                <Ionicons
                  name={icon as any}
                  size={18}
                  color={finalIconColor}
                />
              )}
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
        
        {/* label text on the right - show selected text when there is a value, otherwise show base/default text */}
        {/* for example: time button can pass "Time" and reminders button can pass "Reminders" as defaultText */}
        {/* for forceSelected buttons, don't show any text even if there is a value */}
        {shouldShowText && (
          hasValue && finalDisplayText ? (
            <Text
              style={{
                ...getTextStyle('body-large'),
                fontWeight: '900',
                color: finalTextColor,
                includeFontPadding: false,
              }}
            >
              {finalDisplayText}
            </Text>
          ) : defaultText ? (
            <Text
              style={{
                ...getTextStyle('body-large'),
                fontWeight: '900',
                color: finalTextColor,
                includeFontPadding: false,
              }}
            >
              {defaultText}
            </Text>
          ) : null
        )}
      </InnerButton>
      
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
            size={18}
            color="white" // white color as requested
          />
        </View>
      ) : null}
    </AnimatedContainer>
  );

  // when liquid glass is available on iOS, always wrap the picker button in a GlassView
  // so both "no value" and "has value" states share the same glass surface styling.
  // flow: glassAvailable → GlassView → AnimatedContainer → InnerButton
  if (glassAvailable) {
    return (
      <GlassView
        style={{
          borderRadius: 16,
          // keep background transparent so we rely on the system glass effect only
          backgroundColor: 'transparent',
          // add a subtle border only when we actually have a value selected
          // this mirrors the close button's glass border but keeps "no value" state lighter
          borderWidth: hasValue ? 0 : 0,
          borderColor: hasValue ? themeColors.border.primary() : 'transparent',
          // allow the glass effect to expand beyond the container bounds
          // this prevents clipping of the liquid glass highlight animation
          overflow: 'visible',
        }}
        glassEffectStyle="clear"
        // mark as interactive so touches pass correctly through the glass view
        isInteractive
        // tintColor uses the same background quaternary color as other glass elements
        tintColor={themeColors.background.primarySecondaryBlend() as any}
      >
        {content}
      </GlassView>
    );
  }

  // fallback for Android/web or when no glass is available:
  // return the regular animated button without any glass wrapper
  return content;
};

export default FormPickerButton;


