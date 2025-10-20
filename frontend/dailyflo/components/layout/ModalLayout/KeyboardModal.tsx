/**
 * KeyboardModal Component
 * 
 * A modal that appears with the keyboard and has no KeyboardAvoidingView.
 * Uses the same styling as DraggableModal (rounded top corners, elevated background).
 * Has no accessibility buttons (no close/cancel buttons).
 * 
 * Features:
 * - Appears anchored at the bottom like a bottom sheet
 * - Same styling as DraggableModal (rounded corners, elevated background)
 * - No KeyboardAvoidingView - content doesn't adjust for keyboard
 * - No close/cancel buttons - parent handles dismissal
 * - Fixed height or auto-sizing based on content
 */

// REACT IMPORTS
// react: core react library for building components
import React from 'react';

// REACT NATIVE IMPORTS
// these are the building blocks from react native that we use to create the modal
import {
  Modal,        // modal component that displays content on top of app
  View,         // basic container component
  Pressable,    // pressable component for backdrop tap-to-dismiss
  StyleSheet,   // utility for creating optimized stylesheets
  ViewStyle,    // typescript type for view/container styles
  DimensionValue, // typescript type for height values
} from 'react-native';

// CUSTOM HOOKS IMPORTS
// useThemeColors: hook that provides theme-aware colors
// this allows the modal to adapt to theme changes and use design system colors
import { useThemeColors } from '@/hooks/useColorPalette';

/**
 * Props for the KeyboardModal component
 */
// TYPESCRIPT INTERFACE
// this defines what props can be passed to the modal component
// interfaces provide type safety and autocomplete in the IDE
export interface KeyboardModalProps {
  /**
   * Whether the modal is visible
   * Controls modal visibility state
   */
  // visible: boolean to control if modal is shown
  // flow: parent sets visible=true → modal appears → parent sets visible=false → modal dismisses
  visible: boolean;
  
  /**
   * Callback when modal should close
   * Called when user taps the backdrop
   */
  // onClose: function that gets called when user wants to close modal
  // flow: user taps backdrop → onClose is called → parent handles closing modal
  onClose: () => void;
  
  /**
   * Modal content
   * Children components to render inside the modal
   */
  // children: the content to display inside the modal
  children: React.ReactNode;
  
  /**
   * Border radius for top corners
   * @default 20
   */
  // borderRadius: optional custom border radius for rounded top corners
  // matches DraggableModal default of 20
  borderRadius?: number;
  
  /**
   * Custom height for the modal
   * Can be a number (px) or string ('50%', '300', etc.)
   * If not provided, modal will size to fit content
   */
  // height: optional height to constrain the modal
  // if undefined, modal sizes to content height
  height?: DimensionValue;
  
  /**
   * Whether to allow backdrop tap to dismiss
   * @default true
   */
  // backdropDismiss: whether tapping the backdrop closes the modal
  backdropDismiss?: boolean;
  
  /**
   * Custom background color override
   * If not provided, uses theme's elevated background color
   */
  // backgroundColor: optional custom background color
  // by default uses theme.background.elevated() from design system
  backgroundColor?: string;
  
  /**
   * Whether to show backdrop overlay
   * @default true
   */
  // showBackdrop: whether to show the dark overlay behind modal
  showBackdrop?: boolean;
}

/**
 * KeyboardModal Component
 * 
 * A bottom sheet modal that appears with the keyboard.
 * No KeyboardAvoidingView, no accessibility buttons.
 */
// COMPONENT DEFINITION
// this is the main modal component that gets exported and used in screens
// it's a functional component that receives props and returns JSX
// flow: parent renders modal → modal receives props → modal displays as bottom sheet → user interacts → onClose callback
export const KeyboardModal: React.FC<KeyboardModalProps> = ({
  // DESTRUCTURING PROPS
  // we extract the props from the props object for easier access
  // default values are set here
  visible,
  onClose,
  children,
  borderRadius = 20,
  height,
  backdropDismiss = true,
  backgroundColor,
  showBackdrop = true,
}) => {
  // COLOR PALETTE USAGE
  // get theme-aware colors from the design system
  // this provides consistent colors that work with both light and dark modes
  const themeColors = useThemeColors();
  
  /**
   * Handle backdrop press
   * Dismisses modal if backdropDismiss is enabled
   */
  // BACKDROP PRESS HANDLER
  // this function runs when the user taps the backdrop (area outside modal)
  // flow: user taps backdrop → this function checks backdropDismiss → calls onClose if allowed
  const handleBackdropPress = () => {
    if (backdropDismiss) {
      onClose();
    }
  };
  
  // COMPONENT RENDER
  // this is what gets displayed on screen
  // flow: parent renders modal → this JSX is rendered → user sees bottom sheet modal
  return (
    <Modal
      visible={visible}
      animationType="slide" // slide up from bottom animation
      presentationStyle="overFullScreen" // overlay on top of current screen
      onRequestClose={onClose} // android back button handling
      transparent={true} // allow backdrop to be visible
    >
      {/* backdrop - dark overlay behind modal */}
      {/* tapping this area can dismiss the modal if backdropDismiss is true */}
      {showBackdrop && (
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdropPress}
        />
      )}
      
      {/* modal positioning container */}
      {/* centers modal horizontally and positions at bottom of screen */}
      <View
        style={styles.modalContainer}
        pointerEvents="box-none" // allow touches to pass through transparent areas
      >
        {/* modal content container with rounded top corners */}
        {/* this has the same styling as DraggableModal */}
        <View
          style={[
            styles.contentContainer,
            {
              // theme colors for modal background
              backgroundColor: backgroundColor || themeColors.background.elevated(),
              // rounded top corners (same as DraggableModal)
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              // custom height if provided, otherwise auto-size to content
              height: height,
            },
          ]}
        >
          {/* main modal content */}
          {/* no KeyboardAvoidingView - content does not adjust for keyboard */}
          {/* no header, no close buttons - just the content */}
          {children}
        </View>
      </View>
    </Modal>
  );
};

/**
 * Styles for the KeyboardModal component
 * 
 * Follows the same styling as DraggableModal:
 * - Bottom sheet presentation
 * - Rounded top corners
 * - Elevated background
 * - Dark backdrop overlay
 * - No padding (handled by children)
 */
// STYLESHEET CREATION
// StyleSheet.create optimizes styles for better performance
// it validates styles and ensures they're only created once (not on every render)
// flow: component renders → styles are referenced → react native applies them to elements
const styles = StyleSheet.create({
  // BACKDROP STYLES
  // dark overlay behind the modal
  // tapping this can dismiss the modal
  backdrop: {
    // absolute positioning to cover entire screen
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // dark semi-transparent background (same as other modals)
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  // MODAL CONTAINER STYLES
  // positions the modal at the bottom of the screen
  modalContainer: {
    // flex container to position modal at bottom
    flex: 1,
    alignItems: 'center',      // center horizontally
    justifyContent: 'flex-end', // position at bottom
    // transparent background so backdrop is visible
    backgroundColor: 'transparent',
  },
  
  // CONTENT CONTAINER STYLES
  // the actual modal content with rounded top corners
  // follows DraggableModal styling
  contentContainer: {
    // full width like bottom sheet
    width: '100%',
    // background color is set dynamically in the component using themeColors
    // this allows the modal to adapt to theme changes
    // backgroundColor is applied inline in the component
    
    // border radius for top corners is set dynamically via props
    // borderTopLeftRadius and borderTopRightRadius are applied inline
    
    // no padding - let children handle their own padding
    // this matches DraggableModal approach
    
    // overflow hidden to respect border radius
    overflow: 'hidden',
    
    // height is set dynamically via props
    // if not provided, modal auto-sizes to content
    // height is applied inline in the component
  },
});

// DEFAULT EXPORT
// allows importing the component as: import KeyboardModal from './KeyboardModal'
// provides an alternative to the named export
export default KeyboardModal;

