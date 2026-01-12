/**
 * FloatingActionButton Component
 * 
 * A floating action button (FAB) component for quick task creation.
 * Follows the design system specifications with proper styling, positioning,
 * and accessibility features.
 */

// REACT IMPORTS
// react: core react library for building components
import React from 'react';

// REACT NATIVE IMPORTS
// these are the building blocks from react native that we use to create the FAB
import {
  TouchableOpacity,  // touchable component that provides press feedback
  StyleSheet,        // utility for creating optimized stylesheets
  ViewStyle,         // typescript type for view/container styles
  AccessibilityInfo, // utility for accessibility features (not directly used but available)
  Animated,          // animated api for creating performant animations
  Easing,            // easing functions for smoother animation curves
} from 'react-native';

// REACT NATIVE SAFE AREA CONTEXT IMPORT
// useSafeAreaInsets: hook that provides safe area insets for the device
// this helps position the FAB correctly above home indicators, notches, etc.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// EXPO VECTOR ICONS IMPORT
// ionicons: provides the plus icon for the FAB button
// expo provides a large library of icons through @expo/vector-icons
import { Ionicons } from '@expo/vector-icons';

// EXPO HAPTICS IMPORT
// provides subtle vibration feedback on supported devices
import * as Haptics from 'expo-haptics';

// CUSTOM HOOKS IMPORTS
// useThemeColors: hook that provides theme-aware colors
// this allows the FAB to adapt to theme changes and use design system colors
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
// useThemeColor: hook that provides the global theme color selected by the user
import { useThemeColor } from '@/hooks/useThemeColor';

// TASK CREATION MODAL IMPORT - REMOVED
// TaskCreationModal is now managed by parent screens, not inside FAB
// this prevents duplicate modals and touch blocking issues
// import { TaskCreationModal } from '@/components/features/tasks/TaskCreation/TaskCreationModal';

/**
 * Props for the FloatingActionButton component
 */
// TYPESCRIPT INTERFACE
// this defines what props can be passed to the FAB component
// interfaces provide type safety and autocomplete in the IDE
export interface FloatingActionButtonProps {
  /**
   * Callback function called when the FAB is pressed
   * For now, this will log "FAB Pressed" to console
   */
  // onPress: optional function that gets called when user taps the FAB
  // the parent component can pass this to handle what happens on press
  // flow: user taps FAB → handlePress (internal) → onPress (parent function)
  onPress?: () => void;
  
  /**
   * Whether the FAB is disabled
   * @default false
   */
  // disabled: optional boolean to disable the FAB (prevents taps)
  // when true, the FAB will have reduced opacity and won't respond to taps
  disabled?: boolean;
  
  /**
   * Custom style overrides for the FAB container
   */
  // style: optional custom styles that can override the default FAB styles
  // this allows parent components to customize positioning or appearance if needed
  style?: ViewStyle;
  
  /**
   * Accessibility label for screen readers
   * @default "Add new task"
   */
  // accessibilityLabel: text read by screen readers to describe the button
  // this helps visually impaired users understand what the button does
  accessibilityLabel?: string;
  
  /**
   * Accessibility hint for screen readers
   * @default "Double tap to create a new task"
   */
  // accessibilityHint: additional context read by screen readers
  // tells users how to interact with the button (e.g., "double tap to activate")
  accessibilityHint?: string;
}

/**
 * FloatingActionButton Component
 * 
 * A prominent floating action button positioned in the bottom right corner
 * of the screen. Used for quick task creation throughout the app.
 */
// COMPONENT DEFINITION
// this is the main FAB component that gets exported and used in screens
// it's a functional component that receives props and returns JSX
// flow: parent component renders FAB → FAB receives props → FAB renders button → user taps → handlePress → onPress callback
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  // DESTRUCTURING PROPS
  // we extract the props from the props object for easier access
  // default values are set here (disabled = false, etc.)
  onPress,                                               // optional callback function from parent
  disabled = false,                                      // whether button is disabled (default: false)
  style,                                                 // optional custom styles from parent
  accessibilityLabel = 'Add new task',                  // screen reader label (default provided)
  accessibilityHint = 'Double tap to create a new task', // screen reader hint (default provided)
}) => {
  // MODAL STATE MANAGEMENT - REMOVED
  // modal is now managed by parent screens to prevent duplicate modals
  // const [isModalVisible, setIsModalVisible] = useState(false);
  
  // COLOR PALETTE USAGE
  // get theme-aware colors from the design system
  // this provides consistent colors that work with both light and dark modes
  const themeColors = useThemeColors();
  
  // THEME COLOR USAGE
  // get the global theme color selected by the user (default: red)
  // this is used for interactive elements like the FAB
  const { getThemeColorValue } = useThemeColor();
  const themeColor = getThemeColorValue(500); // use shade 500 for FAB background
  
  // TYPOGRAPHY USAGE
  // get typography system for consistent text styling
  const typography = useTypography();
  
  // SAFE AREA INSETS
  // get the safe area insets for the current device
  // these tell us how much space to leave for device features like:
  // - notches (iPhone X and newer)
  // - home indicators (bottom bar on gesture-based navigation)
  // - status bars
  // - rounded corners
  // flow: device provides insets → hook reads them → we use them for positioning
  const insets = useSafeAreaInsets();
  
  // pulse animation values
  // using two animated values: one for scale and one for opacity
  const pulseScale = React.useRef(new Animated.Value(0)).current;
  const pulseOpacity = React.useRef(new Animated.Value(0.25)).current;
  
  // start looping pulse animation (respects reduced motion when enabled)
  React.useEffect(() => {
    let isMounted = true;
    const startAnimation = (shouldAnimate: boolean) => {
      if (!isMounted || !shouldAnimate) return;
      // animate scale (0→1 mapped to actual scale via interpolate) and fade out
      const growAndFade = Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 0.25, // change pulse size here
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);
      const resetInstant = Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0.25,
          duration: 0,
          useNativeDriver: true,
        }),
      ]);
      Animated.loop(
        Animated.sequence([growAndFade, resetInstant]),
        { resetBeforeIteration: true }
      ).start();
    };
    // check for reduced motion to improve accessibility
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((reduced) => startAnimation(!reduced))
      .catch(() => startAnimation(true));
    return () => {
      isMounted = false;
    };
  }, [pulseOpacity, pulseScale]);
  
  /**
   * Handle FAB press
   * Calls the parent's onPress callback to handle modal opening
   */
  // PRESS HANDLER FUNCTION
  // this function runs when the user taps the FAB button
  // flow: user taps FAB → TouchableOpacity calls this function → we call parent's onPress
  // parent screen manages the modal, not the FAB component
  const handlePress = () => {
    // give light haptic feedback on tap (no-op on unsupported platforms)
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    // log to console for debugging
    console.log('FAB Pressed');
    
    // call the parent's onPress callback to handle modal opening
    // the ?. is optional chaining - only calls onPress if it exists
    // parent screen will manage opening/closing the TaskCreationModal
    onPress?.();
  };

  // COMPONENT RENDER
  // this is what gets displayed on screen
  // flow: parent renders FAB → this JSX is rendered → user sees circular button with plus icon and modal
  return (
    <>
      {/* container keeps the fab positioned and allows the pulse to radiate outside */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.fabContainer,
          {
            // dynamic positioning based on safe area insets
            // space between navbar and FAB = space between FAB and right edge (16px)
            // navbar height (~80px) + spacing (16px) + safe area bottom
            bottom: 48 + 16 + insets.bottom,
            right: 16 + insets.right,
          },
        ]}
      >
        {/* animated pulse behind the button (ghost ripple) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulse,
            {
              opacity: pulseOpacity,
              transform: [
                {
                  // map 0→1 to actual scale values so the pulse grows beyond the fab
                  scale: pulseScale.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }),
                },
              ],
              backgroundColor: themeColor, // use global theme color
            },
          ]}
        />

        {/* tappable fab */}
        <TouchableOpacity
          style={[
            styles.fab,
            {
              // use global theme color for FAB background
              backgroundColor: themeColor,
            },
            style, // allow parent to override size/shape while we keep content centered
          ]}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled }}
        >
          {/* plus icon */}
          {/* icon size 28px for better visibility on 58px FAB */}
          {/* icon color is white (#FFFFFF) - whitest color from palette */}
          <Ionicons
            name="add"
            size={28}
            color="#FFFFFF"
            style={styles.fabIcon}
          />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

/**
 * Styles for the FloatingActionButton component
 * 
 * Follows the design system specifications:
 * - 56px diameter circular button
 * - White background (from color palette)
 * - Black icon (from color palette)
 * - Bottom right positioning with 16px margins
 * - Large elevation shadow
 * - High z-index for overlay positioning
 */
// STYLESHEET CREATION
// StyleSheet.create optimizes styles for better performance
// it validates styles and ensures they're only created once (not on every render)
// flow: component renders → styles are referenced → react native applies them to elements
const styles = StyleSheet.create({
  // BASE FAB STYLES
  // these styles define the appearance and positioning of the floating action button
  // they follow the design system specifications from the documentation
  fabContainer: {
    // absolute container sized to its child to host the pulse and button
    position: 'absolute',
    zIndex: 1000,
  },

  // base fab styles
  fab: {
    // SIZE AND SHAPE
    // size is 58px (larger than create button size 42px, smaller than original 64px)
    width: 58,
    height: 58,
    borderRadius: 999, // large radius keeps fully rounded corners for any size
    
    // BACKGROUND COLOR
    // background color is set dynamically in the component using themeColors
    // this allows the FAB to adapt to theme changes (white background)
    // backgroundColor is applied in the style array in the component
    
    // z-index
    // ensures the fab appears above its pulse background
    zIndex: 1,
    
    // FLEXBOX CENTERING
    // these properties center the icon inside the circular button
    // flow: FAB container uses flexbox → icon child is centered both horizontally and vertically
    justifyContent: 'center', // center children vertically in the container
    alignItems: 'center',     // center children horizontally in the container
    
    // touch feedback
    // keep overflow hidden so press feedback remains circular (pulse sits behind in container)
    overflow: 'hidden',
  },
  
  // pulse circle expands and fades repeatedly to create a ghost ripple effect
  pulse: {
    ...StyleSheet.absoluteFillObject, // fill the button area so it adapts to any size
    borderRadius: 999,
    zIndex: 0,
  },
  
  
  // ICON STYLES
  // placeholder for any additional icon styling if needed in the future
  // currently the icon size and color are set directly on the Ionicons component
  fabIcon: {
    // icon styling is mostly handled by Ionicons component props:
    // - size is set via the size prop (28px)
    // - color is set via the color prop (#FFFFFF white)
    // this style object is here for future customization if needed
  },
});

// DEFAULT EXPORT
// allows importing the component as: import FloatingActionButton from './FloatingActionButton'
// provides an alternative to the named export
export default FloatingActionButton;
