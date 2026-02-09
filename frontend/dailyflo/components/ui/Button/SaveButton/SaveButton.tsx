/**
 * SaveButton Component
 * 
 * A reusable button component for saving changes.
 * Uses custom SaveIcon for iOS 15+ and text button for older iOS versions.
 * 
 * Features:
 * - Circular icon button (iOS 15+) or text button (older iOS)
 * - Custom save icon (upward arrow) for save action
 * - Loading state shown via reduced opacity (same icon)
 * - Disabled state when inactive
 * - Task category color styling
 */

// REACT IMPORTS
import React, { useEffect } from 'react';
import { View, Pressable, Text, Platform } from 'react-native';

// REANIMATED: spring scale animation when visible prop changes (show/hide)
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// CUSTOM ICON IMPORTS
// SaveIcon: custom SVG save/checkmark icon (replaces Ionicons checkmark)
import { SaveIcon } from '@/components/ui/icon';

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
// GlassView: native iOS UIVisualEffectView liquid glass surface (same pattern as MainCloseButton).
// We don't call isGlassEffectAPIAvailable here; GlassView will safely no-op on
// unsupported platforms, we just gate on Platform.OS === 'ios'.
import GlassView from 'expo-glass-effect/build/GlassView';

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
   * Button size in pixels (controls circular button container; icon scales with this when iconSize is not set)
   * @default 24
   */
  size?: number;

  /**
   * Icon size in pixels; when set, only the icon scales and the button container keeps the size from `size`.
   * Use this to make the icon smaller or larger inside the same container.
   */
  iconSize?: number;

  /**
   * When false, the button animates out (scale to 0) with a spring and is non-interactive.
   * When true or undefined, the button is visible (scale 1) with spring animation on appear.
   * Use this to show/hide the button without unmounting so enter/exit animations can run.
   */
  visible?: boolean;

  /**
   * When true, show the text label next to the icon (same color as icon, max font weight).
   * Uses the `text` prop for the label when not loading, `loadingText` when loading.
   */
  showLabel?: boolean;
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
// spring when button appears (more overshoot for a bouncy entrance)
const SPRING_CONFIG_SHOW = { damping: 5, stiffness: 100, overshootClamping: false, mass: 0.2 };
// spring when button disappears (snappier, less bounce)
const SPRING_CONFIG_HIDE = { damping: 18, stiffness: 100, overshootClamping: true, mass: 0.1 };

export const SaveButton: React.FC<SaveButtonProps> = ({
  onPress,
  disabled = false,
  isLoading = false,
  taskCategoryColor = 'blue',
  text = 'Save',
  loadingText = 'Saving...',
  size = 24,
  iconSize,
  visible = true,
  showLabel = false,
}) => {
  // reanimated: scale value for show/hide spring animation (0 = hidden, 1 = visible)
  const scale = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    scale.value = withSpring(visible ? 1 : 0, visible ? SPRING_CONFIG_SHOW : SPRING_CONFIG_HIDE);
  }, [visible, scale]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();
  // get typography system for consistent text styling
  const typography = useTypography();
  
  // check if running on iOS 15+ (newer glass UI design)
  const isNewerIOS = getIOSVersion() >= 15;
  
  // check if liquid glass API is available at runtime (prevents crashes on some iOS 26 betas)
  // on iOS we wrap the button in GlassView; expo-glass-effect safely falls back elsewhere
  const glassAvailable = Platform.OS === 'ios';
  
  // determine icon color
  // always use the primary text color from the theme so the icon
  // matches other primary text (not the user-selected task color)
  const getIconColor = () => {
    return themeColors.background.primary();
  };
  
  // background tint color for the save button glass container
  const saveButtonGlassTintColor = themeColors.background.invertedTertiary();
  // fallback background when glass is not used (newer iOS without glass)
  const saveButtonBackgroundColor = themeColors.background.invertedTertiary();

  // container size is always derived from size (keeps tap target consistent)
  const containerSize = Math.round(size * (42 / 24));
  const outerBorderRadius = Math.round(containerSize * (24 / 42));
  const innerBorderRadius = Math.round(containerSize / 2);
  // when iconSize is set, only the icon scales; container stays at containerSize
  const iconSizePx = iconSize ?? size;

  const isActive = !disabled && !isLoading;
  
  // handle button press - call parent callback
  const handlePress = () => {
    if (isActive && onPress) {
      onPress();
    }
  };

  // label text: same color as icon, max font weight (900)
  const labelText = isLoading ? loadingText : text;
  const labelElement = showLabel ? (
    <Text
      style={{
        ...getTextStyle('button-secondary'),
        color: getIconColor(),
        fontWeight: '900',
        marginRight: 12,
        alignSelf: 'center',
      }}
    >
      {labelText}
    </Text>
  ) : null;

  // core button content (icon or icon+text or text only)
  // wrapped so we can reuse it inside or outside GlassView
  const buttonContent = (
    <Pressable
      onPress={handlePress}
      disabled={!isActive}
      style={({ pressed }) => ({
        // when showLabel: size to content so button doesn't fill screen; otherwise fill container
        ...(showLabel ? { flexDirection: 'row' as const, alignSelf: 'flex-start', alignContent: 'center' } : { width: '100%', height: '100%' }),
        alignItems: 'center',
        justifyContent: 'center',
        // when inside a glass surface we add a subtle 1px border that hugs
        // the circular button (same pattern as `MainCloseButton`)
        ...(isNewerIOS && glassAvailable && !showLabel
          ? {
              borderWidth: 1,
              borderColor: themeColors.border.primary(),
              borderRadius: innerBorderRadius,
            }
          : null),
        // when showLabel, add padding so the row has room
        ...(showLabel ? { paddingHorizontal: 12, paddingVertical: 0 } : null),
        // when pressed: use inactive state opacity (0.4), no animations
        // inactive state: 0.4 opacity, loading state: 0.6 opacity, active state: 1.0 opacity
        opacity: pressed ? 0.4 : (!isActive ? 0.4 : isLoading ? 0.6 : 1),
      })}
      // hitSlop expands the tap area slightly outside the visual circle
      // to make light taps easier to register
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {isNewerIOS ? (
        // iOS 15+ (newer): text first, then icon (icon wrapped for vertical centering)
        <>
          {labelElement}
          <View style={{ alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <SaveIcon size={iconSizePx} color={getIconColor()} />
          </View>
        </>
      ) : (
        // iOS < 15 (older): text button
        <Text style={{
          ...getTextStyle('button-secondary'),
          // use white text for contrast on colored backgrounds
          color: '#FFFFFF',
          fontWeight: '900', // save button is bold
        }}>
          {labelText}
        </Text>
      )}
    </Pressable>
  );

  // wrapper: spring scale animation (visible prop) + block touches when hidden
  const wrapper = (content: React.ReactNode) => (
    <Animated.View
      style={[{ alignSelf: 'flex-start' }, animatedStyle]}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      {content}
    </Animated.View>
  );

  // when glass is available on newer iOS we wrap the pressable in a GlassView
  // the glass background itself is visually transparent (no custom tint),
  // and the icon always uses the primary text color
  if (isNewerIOS && glassAvailable) {
    return wrapper(
      <GlassView
        style={{
          ...(showLabel
            ? { alignSelf: 'flex-start' as const, minHeight: containerSize, paddingLeft: 12, paddingRight: 0, paddingVertical: 8, borderRadius: 28, justifyContent: 'center' as const, alignItems: 'center' as const }
            : { width: containerSize, height: containerSize, borderRadius: outerBorderRadius }),
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
  return wrapper(
    <Pressable
      onPress={handlePress}
      disabled={!isActive}
      style={({ pressed }) => ({
        ...(isNewerIOS
          ? {
              ...(showLabel
                ? { minWidth: containerSize, minHeight: containerSize, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 64, flexDirection: 'row' as const, alignItems: 'center', justifyContent: 'center' }
                : { width: containerSize, height: containerSize, borderRadius: innerBorderRadius, alignItems: 'center', justifyContent: 'center' }),
              backgroundColor: saveButtonBackgroundColor,
              // when pressed: use inactive state opacity (0.4), no animations
              // inactive state: 0.4 opacity, loading state: 0.6 opacity, active state: 1.0 opacity
              opacity: pressed ? 0.4 : (!isActive ? 0.4 : isLoading ? 0.6 : 1),
            }
          : {
              // iOS < 15 (older): text button with colored background (preserve old design)
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 64,
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
        // newer iOS fallback: text first, then icon (icon wrapped for vertical centering)
        <>
          {labelElement}
          <View style={{ alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <SaveIcon size={iconSizePx} color={getIconColor()} />
          </View>
        </>
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

