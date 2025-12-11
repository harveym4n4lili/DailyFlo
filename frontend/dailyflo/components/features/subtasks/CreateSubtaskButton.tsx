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
      icon="add" // full plus icon (not outlined)
      label="Create Subtask"
      value="" // empty value since this is an action button
      onPress={handlePress}
      disabled={disabled}
      showChevron={false} // hide the right arrow icon
      customStyles={{
        // container style - match padding of list section in elevated container
        // list section uses padding: 16 (from firstSectionWrapper/listSection styles)
        // GroupedListButton default is paddingVertical: 12, so we override to match
        container: {
          paddingVertical: 16, // match list section vertical padding in elevated container
        },
        // make text and icon a step lighter and set font weight to 700 (bold)
        label: {
          color: themeColors.text.secondary(), // use secondary text color (one step lighter)
          fontWeight: '700', // bold font weight for emphasis
        },
        icon: {
          color: themeColors.text.secondary(), // use secondary text color for icon (one step lighter)
        },
      }}
    />
  );
};

export default CreateSubtaskButton;

