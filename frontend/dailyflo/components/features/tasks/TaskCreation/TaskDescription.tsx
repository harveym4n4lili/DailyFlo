/**
 * TaskDescription Component
 * 
 * This component provides a text area for task description/notes.
 * Separated from subtask functionality for better component organization.
 * 
 * Features:
 * - Description text area for notes, phone numbers, or links
 * - Multiline text input with character limit
 * - Theme-aware styling that matches the design system
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
} from 'react-native';
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
  /** Whether the component is in edit mode */
  isEditing?: boolean;
}

/**
 * TaskDescription Component
 * 
 * Renders a task description text area with:
 * - Multiline text input for additional notes
 * - Theme-aware styling matching the design system
 * - Character limit for description
 */
export const TaskDescription: React.FC<TaskDescriptionProps> = ({
  description = '',
  onDescriptionChange,
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

  // get theme colors based on current color scheme
  const colors = ThemeColors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Description Text Area */}
      {/* multiline text input for users to add additional task notes */}
      {/* flow: user types → handleDescriptionChange updates state → parent callback is called */}
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
 * These styles create the appearance matching the design system:
 * - Description text area with proper spacing
 * - Typography and font styling
 * - Theme-aware colors applied dynamically
 */
const styles = StyleSheet.create({
  // main container - holds the description text input
  container: {
    // no flex: 1 to prevent layout issues
    // component sizes naturally to its content
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },

  // description input - multiline text area for additional notes
  // uses heading-4 style for better readability
  descriptionInput: {
    // design system text style
    ...getTextStyle('heading-4'),
    // platform-specific font family
    fontFamily: getFontFamily('ios'),
    // spacing around text
    paddingHorizontal: 16,
    paddingVertical: 12,
    // align text to top of input for multiline
    textAlignVertical: 'top',
  },
});

export default TaskDescription;
