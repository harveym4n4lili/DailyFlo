/**
 * DescriptionSection Component
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
  StyleSheet,
} from 'react-native';

// import custom components
import { CustomTextInput } from '@/components/ui/TextInput';

// import types
import type { TaskColor } from '@/types';

/**
 * Props interface for DescriptionSection component
 */
export interface DescriptionSectionProps {
  /** Current description text */
  description?: string;
  /** Callback when description changes */
  onDescriptionChange?: (description: string) => void;
  /** Whether the component is in edit mode */
  isEditing?: boolean;
  /** Task color for styling the text input cursor/stylus */
  taskColor?: TaskColor;
  /** Callback when description input is focused */
  onFocus?: () => void;
  /** Callback when description input is blurred */
  onBlur?: () => void;
}

/**
 * DescriptionSection Component
 * 
 * Renders a task description text area with:
 * - Multiline text input for additional notes
 * - Theme-aware styling matching the design system
 * - Character limit for description
 */
export const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  description = '',
  onDescriptionChange,
  isEditing = false,
  taskColor = 'blue',
  onFocus,
  onBlur,
}) => {
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

  return (
    <View style={styles.container}>
      {/* Custom Description Text Input */}
      {/* uses our custom iOS-style text input with full control over behavior */}
      {/* automatically handles keyboard visibility and cursor positioning */}
      {/* flow: user types → handleDescriptionChange updates state → parent callback is called */}
      <CustomTextInput
        value={localDescription}
        onChangeText={handleDescriptionChange}
        placeholder="Description"
        editable={isEditing}
        maxLength={500}
        taskColor={taskColor}
        multiline={true}
        containerStyle={styles.textInputContainer}
        inputStyle={styles.descriptionInputPadding}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
};

/**
 * Styles for DescriptionSection component
 * 
 * These styles create the appearance matching the design system:
 * - Custom text input container with proper spacing
 * - Uses our custom iOS-style text input component
 */
const styles = StyleSheet.create({
  // main container - holds the custom text input
  container: {
    // no flex: 1 to prevent layout issues
    // component sizes naturally to its content
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },

  // container style for the custom text input
  textInputContainer: {
    // additional styling can be added here if needed
    // the CustomTextInput handles most of its own styling
  },

  // overrides for the description input: no top, bottom or left padding inside the text area
  descriptionInputPadding: {
    paddingTop: 16,
    paddingBottom: 0,
    paddingLeft: 20,
  },
});

export default DescriptionSection;
