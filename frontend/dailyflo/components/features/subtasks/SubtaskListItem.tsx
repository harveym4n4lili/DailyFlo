/**
 * SubtaskListItem Component
 * 
 * A component for displaying individual subtasks in the subtasks list.
 * Each subtask has a checkbox for completion status and can be toggled.
 * 
 * Features:
 * - Checkbox for completion status
 * - Subtask title/label
 * - Toggle completion on press
 */

// REACT IMPORTS
import React, { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, TextInput, View, Keyboard, Text, Pressable } from 'react-native';

// UI COMPONENTS IMPORTS
// GroupedListButton: button-style item for GroupedList
import { GroupedListButton } from '@/components/ui/List/GroupedList';

// EXPO VECTOR ICONS IMPORT
import { Ionicons } from '@expo/vector-icons';

// CUSTOM HOOKS IMPORTS
// useThemeColors: hook for accessing theme-aware colors
import { useThemeColors } from '@/hooks/useColorPalette';
// useTypography: hook for accessing typography system
import { useTypography } from '@/hooks/useTypography';

/**
 * Props interface for SubtaskListItem component
 */
export interface SubtaskListItemProps {
  /**
   * Unique identifier for the subtask
   */
  id: string;
  
  /**
   * Title/label of the subtask
   */
  title: string;
  
  /**
   * Whether the subtask is completed
   */
  isCompleted: boolean;
  
  /**
   * Callback when the subtask is pressed (to toggle completion)
   */
  onPress: () => void;
  
  /**
   * Callback when the delete button (X icon) is pressed
   */
  onDelete: () => void;
  
  /**
   * Whether the subtask is in edit mode (newly created)
   */
  isEditing?: boolean;
  
  /**
   * Callback when the subtask title changes
   */
  onTitleChange?: (title: string) => void;
  
  /**
   * Callback when editing is finished (on blur)
   */
  onFinishEditing?: () => void;
  
  /**
   * Whether the subtask is disabled
   */
  disabled?: boolean;
}

/**
 * SubtaskListItem Component
 * 
 * Renders a single subtask item with a checkbox and title.
 * The entire item is pressable to toggle completion status.
 */
export const SubtaskListItem: React.FC<SubtaskListItemProps> = ({
  id,
  title,
  isCompleted,
  onPress,
  onDelete,
  isEditing = false,
  onTitleChange,
  onFinishEditing,
  disabled = false,
}) => {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();
  const typography = useTypography();
  
  // local state for editing
  const [isLocalEditing, setIsLocalEditing] = useState(isEditing);
  const [editTitle, setEditTitle] = useState(title);
  const textInputRef = useRef<TextInput>(null);

  // auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing || isLocalEditing) {
      // small delay to ensure the component is rendered
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [isEditing, isLocalEditing]);

  // sync local title with prop title
  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  // determine checkbox icon based on completion status
  const checkboxIcon = isCompleted ? 'checkmark-circle' : 'ellipse-outline';
  const checkboxColor = isCompleted 
    ? themeColors.text.primary() 
    : themeColors.text.tertiary();

  // handle delete button press - prevent event propagation to avoid toggling completion
  const handleDeletePress = (e: any) => {
    e.stopPropagation(); // prevent the onPress from firing
    onDelete();
  };

  // handle text input change
  const handleTextChange = (text: string) => {
    setEditTitle(text);
    onTitleChange?.(text);
  };

  // handle text input blur - finish editing and dismiss keyboard
  const handleBlur = () => {
    setIsLocalEditing(false);
    onFinishEditing?.();
    Keyboard.dismiss(); // dismiss keyboard when tapping outside
  };
  
  // handle done button press - finish editing and dismiss keyboard
  const handleSubmitEditing = () => {
    setIsLocalEditing(false);
    onFinishEditing?.();
    Keyboard.dismiss(); // dismiss keyboard when done is pressed
  };

  // handle label press - enter edit mode (only if not completed)
  const handleLabelPress = () => {
    if (!isLocalEditing && !isCompleted) {
      setIsLocalEditing(true);
    }
    // if completed, do nothing (can't edit completed subtasks)
  };

  // when editing, render custom layout with TextInput in label area
  if (isLocalEditing || isEditing) {
    return (
      <View
        style={{
          paddingHorizontal: 16, // match horizontal padding of grouped list items in elevated container
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* checkbox icon on the left */}
        <Ionicons
          name={checkboxIcon}
          size={20}
          color={checkboxColor}
          style={{ marginRight: 12 }}
        />

        {/* middle section: TextInput and close button */}
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* TextInput for editing - wraps behind close button */}
          <TextInput
            ref={textInputRef}
            value={editTitle}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmitEditing}
            placeholder="Subtask name"
            placeholderTextColor={themeColors.text.tertiary()}
            returnKeyType="done" // show "Done" button on keyboard
            blurOnSubmit={true} // dismiss keyboard when done is pressed
            style={{
              ...typography.getTextStyle('body-large'),
              color: themeColors.text.primary(),
              flex: 1,
              padding: 0,
              margin: 0,
              minHeight: 20,
              marginRight: 8, // space before close button
            }}
            multiline={true}
            autoFocus={true}
            selectTextOnFocus={true}
          />

          {/* X icon on the right for deleting the subtask */}
          <TouchableOpacity
            onPress={handleDeletePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={20}
              color={themeColors.text.tertiary()}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // normal display mode
  // use custom layout to match edit mode positioning exactly
  return (
    <View
      style={{
        paddingHorizontal: 16, // match horizontal padding of grouped list items in elevated container
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* checkbox icon on the left - pressable to toggle completion */}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={checkboxIcon}
          size={20}
          color={checkboxColor}
          style={{ marginRight: 12 }}
        />
      </TouchableOpacity>

      {/* middle section: label and close button */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* label text - pressable to enter edit mode, wraps behind close button */}
        <Pressable
          onPress={handleLabelPress}
          disabled={disabled || isCompleted}
          style={{ flex: 1, marginRight: 8 }}
        >
          <Text
            style={{
              ...typography.getTextStyle('body-large'),
              // use lighter color if title is empty, otherwise use normal color
              color: !title || title.trim() === ''
                ? themeColors.text.tertiary() // lighter color for empty text
                : isCompleted 
                  ? themeColors.text.tertiary() 
                  : themeColors.text.primary(),
              textDecorationLine: isCompleted ? 'line-through' : 'none',
            }}
            numberOfLines={0} // allow wrapping
          >
            {title || 'New subtask'} {/* show "New subtask" when empty */}
          </Text>
        </Pressable>

        {/* X icon on the right for deleting the subtask */}
        <TouchableOpacity
          onPress={handleDeletePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close"
            size={20}
            color={themeColors.text.tertiary()}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SubtaskListItem;

