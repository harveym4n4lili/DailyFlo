/**
 * CreateSubtaskButton Component
 *
 * A reusable button component for creating subtasks.
 * Uses FormDetailButton with clock icon (18px) and "Add subtask" label; icon and text use tertiary color.
 */

import React from 'react';
import { FormDetailButton } from '@/components/ui/list/GroupedList';
import { ClockIcon } from '@/components/ui/icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';

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
    <FormDetailButton
      iconComponent={<ClockIcon size={ADD_SUBTASK_ICON_SIZE} color={tertiaryColor} />}
      label="Add subtask"
      value=""
      onPress={handlePress}
      disabled={disabled}
      showChevron={false}
      customStyles={{
        container: {
          paddingVertical: Paddings.none,
          paddingHorizontal: Paddings.none,
        },
        label: {
          color: tertiaryColor,
        },
      }}
    />
  );
};

export default CreateSubtaskButton;
