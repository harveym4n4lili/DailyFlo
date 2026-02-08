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
import { ParagraphIcon } from '@/components/ui/Icon';
import { useThemeColors } from '@/hooks/useColorPalette';

// import types
import type { TaskColor } from '@/types';

const DESCRIPTION_ICON_SIZE = 18;
const ICON_GAP = 8;
// fixed height so icon container doesn't grow with multiline description; icon centered inside
const ICON_CONTAINER_HEIGHT = 22;
// nudge icon down so it aligns with first line of placeholder text (input has top padding)
const ICON_TOP_OFFSET = 10;

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
  const themeColors = useThemeColors();

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
      <View style={styles.inputRow}>
        {/* paragraph icon always visible on the left */}
        <View style={styles.iconWrap}>
          <ParagraphIcon size={DESCRIPTION_ICON_SIZE} color={themeColors.text.tertiary()} />
        </View>
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
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: DESCRIPTION_ICON_SIZE,
    height: ICON_CONTAINER_HEIGHT,
    marginTop: ICON_TOP_OFFSET,
    marginRight: ICON_GAP,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    minWidth: 0,
  },
  descriptionInputPadding: {
    paddingBottom: 0,
    paddingLeft: 0,
  },
});

export default DescriptionSection;
