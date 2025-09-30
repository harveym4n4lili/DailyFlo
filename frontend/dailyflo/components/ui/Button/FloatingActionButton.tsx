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
} from 'react-native';

// REACT NATIVE SAFE AREA CONTEXT IMPORT
// useSafeAreaInsets: hook that provides safe area insets for the device
// this helps position the FAB correctly above home indicators, notches, etc.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// EXPO VECTOR ICONS IMPORT
// ionicons: provides the plus icon for the FAB button
// expo provides a large library of icons through @expo/vector-icons
import { Ionicons } from '@expo/vector-icons';

// CUSTOM HOOKS IMPORTS
// useColorScheme: hook that detects if user is in light or dark mode
// this allows the FAB to potentially adapt to theme changes in the future
import { useColorScheme } from '@/hooks/useColorScheme';

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
  // THEME DETECTION
  // get the current color scheme (light or dark mode) from the system
  // this allows the FAB to potentially adapt to theme changes in the future
  // currently we use a fixed dark color, but this hook is here for future enhancements
  const colorScheme = useColorScheme();
  
  // SAFE AREA INSETS
  // get the safe area insets for the current device
  // these tell us how much space to leave for device features like:
  // - notches (iPhone X and newer)
  // - home indicators (bottom bar on gesture-based navigation)
  // - status bars
  // - rounded corners
  // flow: device provides insets → hook reads them → we use them for positioning
  const insets = useSafeAreaInsets();
  
  /**
   * Handle FAB press
   * For now, logs to console as requested
   */
  // PRESS HANDLER FUNCTION
  // this function runs when the user taps the FAB button
  // flow: user taps FAB → TouchableOpacity calls this function → we log to console → we call parent's onPress
  const handlePress = () => {
    // first, log to console as requested in requirements
    // this helps with debugging and shows that the button is working
    console.log('FAB Pressed');
    
    // then call the parent's onPress callback if it was provided
    // the ?. is optional chaining - only calls onPress if it exists
    // this allows the parent component to handle what happens next (e.g., open task creation modal)
    onPress?.();
  };

  // COMPONENT RENDER
  // this is what gets displayed on screen
  // flow: parent renders FAB → this JSX is rendered → user sees circular button with plus icon
  return (
    // TOUCHABLE CONTAINER
    // TouchableOpacity provides the tappable area and press feedback
    // when pressed, it reduces opacity briefly to give visual feedback
    <TouchableOpacity
      // STYLE ARRAY
      // styles are applied in order: base styles → inset-based positioning → disabled styles → custom styles
      // later styles override earlier ones if there are conflicts
      style={[
        styles.fab,                    // base FAB styles (size, shape, color, shadow, z-index)
        {
          // DYNAMIC POSITIONING BASED ON SAFE AREA INSETS
          // position the FAB above the home indicator and away from screen edges
          // bottom: 16px base margin + bottom inset (for home indicator)
          // right: 16px base margin + right inset (for rounded corners/notches)
          // flow: device provides insets → we add base margin → FAB positioned safely
          bottom: 20 +insets.bottom,  // 16px margin + safe area (home indicator spacing)
          right: 8 + insets.right,    // 16px margin + safe area (rounded corners/notch spacing)
        },
        //disabled && styles.fabDisabled, // if disabled is true, apply disabled styles (grayed out)
        //style,                         // custom styles from parent (overrides everything)
      ]}
      // TOUCH HANDLER
      // onPress: called when user taps the button
      // flow: user taps → TouchableOpacity detects tap → calls handlePress function
      onPress={handlePress}
      // DISABLED STATE
      // if true, button won't respond to taps and will show disabled styling
      disabled={disabled}
      // ACTIVE OPACITY
      // controls how transparent the button becomes when pressed (0.8 = 80% opacity)
      // this provides visual feedback that the button was tapped
      activeOpacity={0.8}
      // ACCESSIBILITY PROPERTIES
      // these help screen readers understand and announce the button correctly
      // flow: screen reader focuses button → reads role → reads label → reads hint → reads state
      accessibilityRole="button"           // tells screen reader this is a button element
      accessibilityLabel={accessibilityLabel} // what the button does ("Add new task")
      accessibilityHint={accessibilityHint}   // how to use it ("Double tap to create a new task")
      accessibilityState={{ disabled }}       // current state (disabled: true/false)
    >
      {/* PLUS ICON */}
      {/* this is the white + symbol that appears inside the circular button */}
      {/* Ionicons component renders vector icons that scale perfectly at any size */}
      <Ionicons
        name="add"        // icon name from ionicons library (+ symbol)
        size={24}         // icon size in pixels (24px as per design specs)
        color="#FFFFFF"   // icon color (white for contrast against dark background)
        style={styles.fabIcon} // additional icon styles (currently empty but available for future use)
      />
    </TouchableOpacity>
  );
};

/**
 * Styles for the FloatingActionButton component
 * 
 * Follows the design system specifications:
 * - 56px diameter circular button
 * - Dark background (#111827)
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
  fab: {
    // SIZE AND SHAPE
    // the FAB is a perfect circle created by equal width/height and borderRadius = half the size
    width: 64,              // 56px width as per design specs
    height: 64,             // 56px height as per design specs
    borderRadius: 28,       // half of width/height (56/2 = 28) creates perfect circle
    
    // BACKGROUND COLOR
    // dark background from the design system color palette
    // this matches the primary dark color used throughout the app
    backgroundColor: '#111827', // primary dark color from design system (#111827)
    
    // POSITIONING
    // position: 'absolute' removes the FAB from normal document flow
    // this allows it to float over other content without affecting layout
    // note: bottom and right values are set dynamically in the component using insets
    // this ensures the FAB respects safe areas (home indicators, notches, etc.)
    position: 'absolute',   // take out of normal flow so it floats over content
    // bottom and right are set dynamically in component: 16 + insets.bottom/right
    // this ensures proper spacing on all devices (iPhones with notches, home indicators, etc.)
    
    // Z-INDEX
    // ensures the FAB appears above all other content on the screen
    // higher z-index means it stacks on top of elements with lower z-index
    zIndex: 1000,           // very high z-index ensures FAB is always on top
    
    // FLEXBOX CENTERING
    // these properties center the icon inside the circular button
    // flow: FAB container uses flexbox → icon child is centered both horizontally and vertically
    justifyContent: 'center', // center children vertically in the container
    alignItems: 'center',     // center children horizontally in the container
    
    // TOUCH FEEDBACK
    // overflow: 'hidden' clips anything that goes outside the border radius
    // this ensures press effects stay within the circular shape
    overflow: 'hidden',       // clip content to border radius (keeps ripple effect circular)
  },
  
  
  // ICON STYLES
  // placeholder for any additional icon styling if needed in the future
  // currently the icon size and color are set directly on the Ionicons component
  fabIcon: {
    // icon styling is mostly handled by Ionicons component props:
    // - size is set via the size prop (24px)
    // - color is set via the color prop (#FFFFFF white)
    // this style object is here for future customization if needed
  },
});

// DEFAULT EXPORT
// allows importing the component as: import FloatingActionButton from './FloatingActionButton'
// provides an alternative to the named export
export default FloatingActionButton;
