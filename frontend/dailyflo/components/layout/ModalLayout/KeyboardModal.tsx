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
import React, { useEffect, useRef, useState } from 'react';

// REACT NATIVE IMPORTS
// these are the building blocks from react native that we use to create the modal
import {
  Modal,        // modal component that displays content on top of app
  View,         // basic container component
  Pressable,    // pressable component for backdrop tap-to-dismiss
  StyleSheet,   // utility for creating optimized stylesheets
  ViewStyle,    // typescript type for view/container styles
  DimensionValue, // typescript type for height values
  Animated,     // animated api for creating performant animations
  Keyboard,     // keyboard api for detecting keyboard show/hide events
  KeyboardEvent, // typescript type for keyboard events
  Platform,     // platform detection for ios/android specific behavior
  useWindowDimensions, // hook to get screen dimensions
  LayoutAnimation, // layout animation api that syncs perfectly with keyboard
  UIManager,    // native UI manager for enabling layout animations on Android
} from 'react-native';

// enable LayoutAnimation on Android
// this is required for LayoutAnimation to work on Android devices
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// REACT NATIVE SAFE AREA IMPORTS
// useSafeAreaInsets: provides safe area insets for extending modal to bottom
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  
  /**
   * Whether to position modal bottom edge on keyboard top
   * When true, modal auto-sizes to content and sits directly on keyboard
   * Modal height = content height (flexible), Modal bottom = keyboard top
   * @default false
   */
  // dynamicKeyboardHeight: whether to position modal on keyboard
  dynamicKeyboardHeight?: boolean;
  
  /**
   * Height of bottom section to subtract from keyboard padding
   * Use this when you have a fixed bottom section (like action buttons)
   * @default 0
   */
  bottomSectionHeight?: number;
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
  borderRadius = 16,
  height,
  backdropDismiss = true,
  backgroundColor,
  showBackdrop = true,
  dynamicKeyboardHeight = false,
  bottomSectionHeight = 0,
}) => {
  // COLOR PALETTE USAGE
  // get theme-aware colors from the design system
  // this provides consistent colors that work with both light and dark modes
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  
  // SCREEN DIMENSIONS
  // get screen dimensions to calculate available space
  const { height: screenHeight } = useWindowDimensions();
  
  // KEYBOARD HEIGHT STATE
  // track the current keyboard height
  // this updates when keyboard shows/hides and triggers layout animation
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // KEYBOARD EVENT LISTENERS
  // set up listeners for keyboard show/hide events
  // uses LayoutAnimation for perfect sync with keyboard
  // this makes the modal appear "glued" to the keyboard
  // IMPORTANT: runs on ALL keyboard changes, including when Alert dialogs show/hide
  useEffect(() => {
    if (!dynamicKeyboardHeight) return; // only listen if dynamicKeyboardHeight is enabled
    
    // keyboard show listener
    // this runs when the keyboard appears on screen
    // flow: keyboard appears → trigger LayoutAnimation → update state → modal animates perfectly with keyboard
    const keyboardWillShowListener = Keyboard.addListener(
      // use keyboardWillShow on iOS for smoother animation, keyboardDidShow on Android
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event: KeyboardEvent) => {
        // get the keyboard height and duration from the event
        const height = event.endCoordinates.height;
        const duration = event.duration || 250;
        
        console.log('Keyboard showing - height:', height, 'duration:', duration);
        
        // ALWAYS configure LayoutAnimation, even if triggered by Alert dialog
        // this prevents the modal from teleporting when Alert appears
        // the animation will play smoothly regardless of what triggered the keyboard change
        LayoutAnimation.configureNext({
          duration: duration,
          update: {
            type: LayoutAnimation.Types.keyboard, // use keyboard animation curve
            property: LayoutAnimation.Properties.opacity,
          },
          create: {
            type: LayoutAnimation.Types.keyboard,
            property: LayoutAnimation.Properties.opacity,
          },
        });
        
        // update state - LayoutAnimation handles the animation automatically
        setKeyboardHeight(height);
      }
    );
    
    // keyboard hide listener
    // this runs when the keyboard disappears from screen
    // flow: keyboard dismisses → trigger LayoutAnimation → update state → modal animates down with keyboard
    const keyboardWillHideListener = Keyboard.addListener(
      // use keyboardWillHide on iOS for smoother animation, keyboardDidHide on Android
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event: KeyboardEvent) => {
        const duration = event.duration || 250;
        
        console.log('Keyboard hiding - duration:', duration);
        
        // ALWAYS configure LayoutAnimation, even if triggered by Alert dialog dismissal
        // this prevents the modal from teleporting when Alert dismisses
        LayoutAnimation.configureNext({
          duration: duration,
          update: {
            type: LayoutAnimation.Types.keyboard, // use keyboard animation curve
            property: LayoutAnimation.Properties.opacity,
          },
          delete: {
            type: LayoutAnimation.Types.keyboard,
            property: LayoutAnimation.Properties.opacity,
          },
        });
        
        // update state - LayoutAnimation handles the animation automatically
        setKeyboardHeight(0);
      }
    );
    
    // cleanup function
    // this removes the listeners when component unmounts to prevent memory leaks
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [dynamicKeyboardHeight]); // dependency array: re-run effect if dynamicKeyboardHeight changes
  
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
      {/* higher z-index than backdrop ensures modal appears on top */}
      <View
        style={[styles.modalContainer, { zIndex: 10001 }]}
        pointerEvents="box-none" // allow touches to pass through transparent areas
      >
        {/* wrapper for keyboard-aware positioning */}
        {/* modal is always anchored to screen bottom (bottom: 0) */}
        {/* internal padding adjusts for keyboard to keep content visible */}
        {/* uses LayoutAnimation for perfect sync with keyboard animation */}
        <View
          style={[
            {
              width: '100%',
              position: 'absolute',
              // always anchored to screen bottom
              bottom: 0,
            },
          ]}
        >
          {/* modal content container with rounded top corners */}
          {/* this has the same styling as DraggableModal */}
          {/* height is flexible - auto-sizes to content */}
          {/* paddingBottom creates whitespace equal to keyboard height */}
          {/* this keeps content visible above keyboard while modal stretches to screen bottom */}
          <View
            style={[
              styles.contentContainer,
              {
                // theme colors for modal background
                backgroundColor: backgroundColor || themeColors.background.elevated(),
                // rounded top corners (same as DraggableModal)
                borderTopLeftRadius: borderRadius,
                borderTopRightRadius: borderRadius,
                // use provided height or auto-size to content (no height = auto)
                // when dynamicKeyboardHeight=true, typically leave height undefined for auto-sizing
                height: height,
                // paddingBottom creates whitespace for keyboard + safe area
                // subtract bottomSectionHeight to account for fixed bottom sections
                // content stays above keyboard, background extends to screen bottom
                paddingBottom: dynamicKeyboardHeight 
                  ? keyboardHeight + insets.bottom - bottomSectionHeight
                  : insets.bottom,
              },
            ]}
          >
            {/* main modal content */}
            {/* no KeyboardAvoidingView - content does not adjust for keyboard */}
            {/* no header, no close buttons - just the content */}
            {children}
          </View>
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
  // invisible overlay behind the modal - catches taps but doesn't show visually
  // tapping this can dismiss the modal
  backdrop: {
    // absolute positioning to cover entire screen
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // transparent background - invisible but still tappable
    backgroundColor: 'transparent',
    // high z-index to ensure it covers everything including headers
    zIndex: 10000,
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
    
    // height is flexible - auto-sizes to content when not provided
    // if height prop is provided, uses that instead
    // height is applied inline in the component
  },
});

// DEFAULT EXPORT
// allows importing the component as: import KeyboardModal from './KeyboardModal'
// provides an alternative to the named export
export default KeyboardModal;

