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
import {
  View,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
  DynamicColorIOS,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddIcon } from '@/components/ui/icon';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeColors } from '@/hooks/useColorPalette';

// expo-glass-effect: native iOS UIVisualEffectView liquid glass. Circular FAB.
// import GlassView from build path to avoid index.js export resolution issues.
// we don't call isGlassEffectAPIAvailable here; GlassView will safely no-op on
// unsupported platforms, so we only gate on Platform.OS === 'ios'.
import GlassView from 'expo-glass-effect/build/GlassView';

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
  
  const insets = useSafeAreaInsets();
  const { getThemeColorValue } = useThemeColor();
  const themeColors = useThemeColors();
  // backgroundColor: base surface color pulled from theme for the glass background.
  const backgroundColor = themeColors.background.secondary();
  // iconColor: uses the primary text color so the plus icon always matches our main text color
  const iconColor = themeColors.text.primary();
  // tintColor: iOS uses DynamicColorIOS so the system can treat this as a "dynamic" color
  // just like the navbar; Android falls back to the plain hex value.
  const tintColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ light: backgroundColor, dark: backgroundColor })
      : backgroundColor;
  const navBarBg = themeColors.background.invertedPrimary();
  const navBarBorder = themeColors.border.primary();

  // handlePress runs on tap: haptics then parent onPress (e.g. open task-creation modal).
  const handlePress = () => {
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    onPress?.();
  };

  // check if liquid glass API is available at runtime (prevents crashes on some iOS 26 betas)
  // on iOS we wrap the FAB in GlassView; expo-glass-effect safely falls back elsewhere
  const glassAvailable = Platform.OS === 'ios';

  const buttonContent = glassAvailable ? (
    // iOS with glass available: single glassview with pressable child for a clean glass FAB
    <GlassView
      style={[styles.fab, style]}
      glassEffectStyle="clear"
      // cast to any so we can pass DynamicColorIOS on iOS while keeping TypeScript happy
      tintColor={tintColor as any}
      isInteractive
    >
      <Pressable
        onPress={disabled ? undefined : handlePress}
        style={styles.fabGlass}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
      >
        <AddIcon
          size={24}
          color={iconColor}
        />
      </Pressable>
    </GlassView>
  ) : (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor: navBarBg,
          borderWidth: 1,
          borderColor: navBarBorder,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <AddIcon
        size={20}
        color={iconColor}
      />
    </TouchableOpacity>
  );

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.fabContainer,
        {
          bottom: 48 + 16 + insets.bottom - 29,
          right: 16 + insets.right - 29,
        },
      ]}
    >
      {buttonContent}
    </View>
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
    position: 'absolute',
    zIndex: 1000,
    width: 134,
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
  },

  fab: {
    width: 64,
    height: 64,
    borderRadius: 34,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },

  fabGlass: {
    // width/height 100% makes the pressable fill the glass circle
    // before this, only the icon area was fully pressable on iOS,
    // which caused some light edge taps to not register opening the modal
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 29,
  },

  fabIcon: {},
});

// DEFAULT EXPORT
// allows importing the component as: import FloatingActionButton from './FloatingActionButton'
// provides an alternative to the named export
export default FloatingActionButton;
