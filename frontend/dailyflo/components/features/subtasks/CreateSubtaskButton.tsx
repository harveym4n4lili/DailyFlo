/**
 * CreateSubtaskButton Component
 *
 * A reusable button component for creating subtasks.
 * Uses GroupedListButton for consistent styling with other sections.
 *
 * Features:
 * - GroupedListButton with plus icon on the left
 * - "Create Subtask" label
 * - Callback for handling subtask creation
 */

// REACT IMPORTS
import React from 'react';

// UI COMPONENTS IMPORTS
// GroupedListButton: button-style item for GroupedList
import { GroupedListButton } from '@/components/ui/List/GroupedList';

// CUSTOM HOOKS IMPORTS
// useThemeColors: hook for accessing theme-aware colors
import { useThemeColors } from '@/hooks/useColorPalette';

/**
 * Props interface for CreateSubtaskButton component
 */
export interface CreateSubtaskButtonProps {
  /**
   * Callback when the button is pressed
   * This is where the parent component handles creating a new subtask
   */
  onPress?: () => void;

  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
}

/**
 * CreateSubtaskButton Component
 *
 * Renders a GroupedListButton for creating subtasks.
 * The button displays a plus icon on the left and "Create Subtask" label.
 */
export const CreateSubtaskButton: React.FC<CreateSubtaskButtonProps> = ({
  onPress,
  disabled = false,
}) => {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();

  // handle button press - call parent callback
  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <GroupedListButton
      icon="add"
      label="Create Subtask"
      value=""
      onPress={handlePress}
      disabled={disabled}
      showChevron={false}
      customStyles={{
        container: {
          paddingVertical: 16,
        },
        label: {
          color: themeColors.text.secondary(),
          fontWeight: '700',
        },
        icon: {
          color: themeColors.text.secondary(),
        },
      }}
    />
  );
};

export default CreateSubtaskButton;
