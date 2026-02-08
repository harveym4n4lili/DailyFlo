/**
 * CreateSubtaskButton Component
 *
 * A reusable button component for creating subtasks.
 * Uses TaskFormButton with clock icon (18px) and "Add subtask" label; icon and text use tertiary color.
 */

import React from 'react';
import { TaskFormButton } from '@/components/ui/List/GroupedList';
import { ClockIcon } from '@/components/ui/Icon';
import { useThemeColors } from '@/hooks/useColorPalette';

const ADD_SUBTASK_ICON_SIZE = 18;

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

export const CreateSubtaskButton: React.FC<CreateSubtaskButtonProps> = ({
  onPress,
  disabled = false,
}) => {
  const themeColors = useThemeColors();
  const tertiaryColor = themeColors.text.tertiary();

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <TaskFormButton
      iconComponent={<ClockIcon size={ADD_SUBTASK_ICON_SIZE} color={tertiaryColor} />}
      label="Add subtask"
      value=""
      onPress={handlePress}
      disabled={disabled}
      showChevron={false}
      customStyles={{
        container: {
          paddingVertical: 0,
          paddingHorizontal: 0,
        },
        label: {
          color: tertiaryColor,
          fontWeight: '700',
        },
      }}
    />
  );
};

export default CreateSubtaskButton;
