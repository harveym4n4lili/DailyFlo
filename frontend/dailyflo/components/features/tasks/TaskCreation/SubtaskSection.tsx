/**
 * SubtaskSection Component
 * 
 * A component for managing subtasks within a task.
 * Provides an "Add Subtask" button interface.
 * 
 * Features:
 * - Header button with "Add Subtask" text and plus icon
 * - Placeholder for subtask list (to be implemented)
 * - Styling that matches the design system
 */

// REACT IMPORTS
// react: core react library for building components
import React from 'react';

// REACT NATIVE IMPORTS
// these are the building blocks from react native that we use to create the component
import {
  View,           // basic container component
  Text,           // text component for labels
  TouchableOpacity, // touchable component that provides press feedback
  StyleSheet,     // utility for creating optimized stylesheets
} from 'react-native';

// EXPO VECTOR ICONS IMPORT
// ionicons: provides the plus icon for the add subtask button
import { Ionicons } from '@expo/vector-icons';

// REACT NATIVE HOOKS IMPORT
// useColorScheme: hook to detect current theme (light/dark mode)
import { useColorScheme } from 'react-native';

// CONSTANTS IMPORTS
// import design system constants for consistent styling
import { ThemeColors } from '@/constants/ColorPalette';
import { getTextStyle, getFontFamily } from '@/constants/Typography';

/**
 * Props interface for SubtaskSection component
 */
// TYPESCRIPT INTERFACE
// this defines what props can be passed to the subtask section component
// interfaces provide type safety and autocomplete in the IDE
interface SubtaskSectionProps {
  /**
   * Callback when "Add Subtask" button is pressed
   * This is where the parent component handles adding a new subtask
   */
  // onAddSubtask: function that gets called when user taps the add button
  // flow: user taps button → this function is called → parent handles adding subtask
  onAddSubtask?: () => void;
}

/**
 * SubtaskSection Component
 * 
 * Renders a subtask management interface with:
 * - "Add Subtask" button with plus icon
 * - Placeholder for subtask list (to be implemented in future)
 * - Styling matching the design system
 */
// COMPONENT DEFINITION
// this is the main subtask section component that gets exported and used in modals
// it's a functional component that receives props and returns JSX
// flow: parent renders component → component displays add button → user taps → onAddSubtask callback
export const SubtaskSection: React.FC<SubtaskSectionProps> = ({
  // DESTRUCTURING PROPS
  // we extract the props from the props object for easier access
  onAddSubtask,
}) => {
  // COLOR SCHEME DETECTION
  // get current color scheme (light/dark mode) from device settings
  // this allows the component to adapt to user's theme preference
  // flow: device provides color scheme → hook reads it → we use it to get theme colors
  const colorScheme = useColorScheme() || 'dark';
  
  // THEME COLORS
  // get theme colors based on current color scheme
  // this provides consistent colors from the design system
  const colors = ThemeColors[colorScheme];

  /**
   * Handle "Add Subtask" button press
   * Calls the parent callback for adding subtasks
   */
  // BUTTON PRESS HANDLER
  // this function runs when the user taps the "Add Subtask" button
  // flow: user taps button → this function is called → parent's onAddSubtask is called
  const handleAddSubtask = () => {
    console.log('Add Subtask button pressed');
    onAddSubtask?.();
  };

  // COMPONENT RENDER
  // this is what gets displayed on screen
  // flow: parent renders component → this JSX is rendered → user sees add subtask button
  return (
    <View style={styles.container}>
      {/* Header Button - "Add Subtask" - clickable area */}
      {/* this button allows users to add subtasks to the current task */}
      {/* flow: user taps → handleAddSubtask → parent handles adding subtask */}
      <TouchableOpacity
        style={[styles.headerButton, { 
          borderBottomColor: colors.border.primary,
        }]}
        onPress={handleAddSubtask}
        activeOpacity={0.7}
      >
        {/* Plus Icon - visual indicator for adding action */}
        <Ionicons
          name="add"
          size={20}
          color={colors.text.secondary}
          style={{ marginRight: 6 }}
        />
        
        {/* Header Text - "Add Subtask" label */}
        <Text style={[styles.headerText, { color: colors.text.secondary }]}>
          Add Subtask
        </Text>
      </TouchableOpacity>

      {/* TODO: Subtask list will be rendered here in future */}
      {/* Placeholder for subtask list component */}
      {/* When implemented, this will show a list of existing subtasks */}
      {/* with checkboxes and delete options */}
    </View>
  );
};

/**
 * Styles for SubtaskSection component
 * 
 * These styles create the appearance matching the design system:
 * - Header button with consistent spacing
 * - Plus icon aligned with text
 * - Proper spacing and typography throughout
 */
// STYLESHEET CREATION
// StyleSheet.create optimizes styles for better performance
// it validates styles and ensures they're only created once (not on every render)
// flow: component renders → styles are referenced → react native applies them to elements
const styles = StyleSheet.create({
  // MAIN CONTAINER STYLES
  // main container - holds all the component elements
  container: {
    // no flex: 1 to prevent layout issues
    // component sizes naturally to its content
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,

  },

  // HEADER BUTTON STYLES
  // header button - the "Add Subtask" button
  // styled to be clearly interactive with proper touch target size
  headerButton: {
    // FLEXBOX LAYOUT
    // arrange icon and text horizontally
    flexDirection: 'row',
    alignItems: 'center',         // center icon and text vertically
    justifyContent: 'flex-start', // align content to the left
    
    // SPACING
    paddingHorizontal: 20, // horizontal padding for touch area
    paddingVertical: 12,   // vertical padding for touch area (min 44px touch target)
    
    // BORDER
    //borderBottomWidth: 1, // subtle bottom border for separation
  },

  // HEADER TEXT STYLES
  // header text - "Add Subtask" text styling
  // uses design system typography for consistency
  headerText: {
    // design system text style for body text
    ...getTextStyle('body-large'),
    // platform-specific font family (SF Pro on iOS, Roboto on Android)
    fontFamily: getFontFamily('ios'),
    // semibold weight for emphasis
    fontWeight: '600',
  },
});

// DEFAULT EXPORT
// allows importing the component as: import SubtaskSection from './SubtaskSection'
// provides an alternative to the named export
export default SubtaskSection;

