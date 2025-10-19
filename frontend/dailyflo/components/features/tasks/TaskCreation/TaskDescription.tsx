/**
 * TaskDescription Component
 * 
 * This component provides a task description interface with a header button for adding subtasks
 * and a text area for additional notes. It matches the dark mode design from the wireframes.
 * 
 * Features:
 * - Header button with "Add Subtask" text and plus icon
 * - Placeholder for subtask list (not implemented yet)
 * - Description text area for notes, phone numbers, or links
 * - Dark mode styling that matches the design system
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

// import design system constants
import { ThemeColors } from '@/constants/ColorPalette';
import { getTextStyle, getFontFamily } from '@/constants/Typography';

/**
 * Props interface for TaskDescription component
 */
interface TaskDescriptionProps {
  /** Current description text */
  description?: string;
  /** Callback when description changes */
  onDescriptionChange?: (description: string) => void;
  /** Callback when "Add Subtask" button is pressed */
  onAddSubtask?: () => void;
  /** Whether the component is in edit mode */
  isEditing?: boolean;
}

/**
 * TaskDescription Component
 * 
 * Renders a task description interface with:
 * - Header button for adding subtasks (placeholder functionality)
 * - Description text area for additional notes
 * - Dark mode styling matching the design system
 */
export const TaskDescription: React.FC<TaskDescriptionProps> = ({
  description = '',
  onDescriptionChange,
  onAddSubtask,
  isEditing = false,
}) => {
  // get current color scheme (light/dark mode)
  const colorScheme = useColorScheme() || 'dark';
  
  // local state for description text
  const [localDescription, setLocalDescription] = useState(description);

  /**
   * Handle description text changes
   * Updates local state and calls the parent callback
   */
  const handleDescriptionChange = (text: string) => {
    setLocalDescription(text);
    onDescriptionChange?.(text);
  };

  /**
   * Handle "Add Subtask" button press
   * Calls the parent callback for adding subtasks
   */
  const handleAddSubtask = () => {
    onAddSubtask?.();
  };

  // get theme colors based on current color scheme
  const colors = ThemeColors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header Button - "Add Subtask" - styled like GroupedListItem */}
      <TouchableOpacity
        style={[styles.headerButton, { 
       
          borderBottomColor: colors.text.tertiary,
        }]}
        onPress={handleAddSubtask}
        activeOpacity={0.7}
      >
        {/* Plus Icon - styled like GroupedListItem icon */}
        <Ionicons
          name="add"
          size={20}
          color={colors.text.secondary}
          style={{ marginRight: 12 }}
        />
        
        {/* Header Text - styled like GroupedListItem label */}
        <Text style={[styles.headerText, { color: colors.text.secondary }]}>
          Add Subtask
        </Text>
      </TouchableOpacity>


      {/* Description Text Area */}
      <TextInput
        style={[
          styles.descriptionInput,
          {
            backgroundColor: colors.background.primary,
            color: colors.text.primary,
            borderColor: colors.border.primary,
          }
        ]}
        value={localDescription}
        onChangeText={handleDescriptionChange}
        placeholder="Add additional notes, phone numbers or links..."
        placeholderTextColor={colors.text.tertiary}
        multiline
        textAlignVertical="top"
        editable={isEditing}
        maxLength={500}
      />
    </View>
  );
};

/**
 * Styles for TaskDescription component
 * 
 * These styles create the dark mode appearance matching the design system:
 * - Header button with rounded top corners and elevated background
 * - Plus icon in a circular container
 * - Description text area with proper spacing and borders
 * - Consistent spacing and typography throughout
 */
const styles = StyleSheet.create({
  // main container - holds all the component elements
  container: {
    // removed flex: 1 to prevent layout issues
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },

  // header button - the "Add Subtask" button at the top (styled like GroupedListItem)
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // align content to the left
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 1, // small gap between header and content
    borderBottomWidth: 1, // add bottom border
  },

  // header text - "Add Subtask" text styling
  headerText: {
    ...getTextStyle('body-large'),
    fontFamily: getFontFamily('ios'),
    fontWeight: '600', // semibold weight for emphasis
  },

  // subtask placeholder - temporary placeholder for subtask list
  subtaskPlaceholder: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  // placeholder text - styling for the placeholder text
  placeholderText: {
    ...getTextStyle('body-medium'),
    fontFamily: getFontFamily('ios'),
    fontStyle: 'italic',
  },

  // description input - text area for additional notes
  descriptionInput: {
    ...getTextStyle('body-large'),
    fontFamily: getFontFamily('ios'),
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'top', // align text to top of input
  },
});

export default TaskDescription;
