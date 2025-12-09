/**
 * TaskViewContent Component
 * 
 * The content and logic for the task view modal.
 * Displays task details and information.
 */

// REACT IMPORTS
// react: core react library for building components
import React, { useState, useRef, useEffect } from 'react';

// REACT NATIVE IMPORTS
// these are the building blocks from react native that we use to create the content
import {
  View,                      // basic container component
  Text,                      // text component for displaying text
  Pressable,                 // pressable component for interactive elements
  TextInput,                 // text input component for task title
  ScrollView,                // scrollable container for long content
  Animated,                  // animated api for button highlight animations
} from 'react-native';

// REACT NATIVE SAFE AREA CONTEXT IMPORT
// useSafeAreaInsets: hook that provides safe area insets for the device
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// LAYOUT COMPONENTS IMPORTS
// KeyboardAnchoredContainer: composable component for keyboard-aware positioning
// useKeyboardHeight: hook to track keyboard height for conditional visibility
import { KeyboardAnchoredContainer, useKeyboardHeight } from '@/components/layout/ScreenLayout';

// FEATURE COMPONENTS IMPORTS
// DescriptionSection: reusable description input component from task creation
// PickerButtonsSection: form picker buttons section from task creation
import { DescriptionSection, PickerButtonsSection } from '../TaskCreation/sections';

// CONSTANTS IMPORTS
// design system constants for styling
import { getTextStyle } from '@/constants/Typography';
import { TaskCategoryColors } from '@/constants/ColorPalette';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useThemeColors } from '@/hooks/useColorPalette';

// TYPES IMPORTS
// typescript types for type safety
import type { TaskColor, Task } from '@/types';

/**
 * Props for TaskViewContent component
 */
export interface TaskViewContentProps {
  /** Whether the content is visible */
  visible: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Task color for styling */
  taskColor: TaskColor;
  
  /** Task ID to display */
  taskId?: string;
  
  /** Task data (optional, if provided will be used for initial values) */
  task?: Task;
}

/**
 * TaskViewContent Component
 * 
 * Contains all the UI and logic for task view modal content.
 */
export const TaskViewContent: React.FC<TaskViewContentProps> = ({
  visible,
  onClose,
  taskColor,
  taskId,
  task,
}) => {
  // HOOKS
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  // get keyboard height to conditionally show/hide keyboard anchored section
  const keyboardHeight = useKeyboardHeight();

  // LOCAL STATE
  // track title and description values for editing
  // initialize with task data if available
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');

  // ANIMATION VALUES FOR PICKER BUTTONS
  // animated values for button highlight effects (same as TaskCreation)
  const iconButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const dateButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const timeButtonHighlightOpacity = useRef(new Animated.Value(0)).current;
  const alertsButtonHighlightOpacity = useRef(new Animated.Value(0)).current;

  // REFS
  // ref for title input to manage focus
  const titleInputRef = useRef<TextInput>(null);

  // FORM VALUES FOR PICKER BUTTONS
  // construct values object for PickerButtonsSection (same structure as TaskCreation)
  // convert null to undefined for dueDate and map reminders to alerts format
  const formValues = {
    title,
    description,
    color: task?.color || taskColor,
    icon: task?.icon,
    dueDate: task?.dueDate ?? undefined, // convert null to undefined
    time: task?.time,
    duration: task?.duration,
    // alerts in TaskFormValues is string[], but Task has TaskReminder[]
    // for now, use empty array or convert if needed (placeholder until alerts are implemented)
    alerts: [],
  };

  // UPDATE STATE WHEN TASK PROP CHANGES
  // when a different task is opened, update title and description to match
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
    }
  }, [task?.id]); // update when task ID changes (different task opened)

  // HANDLE CLOSE
  // function to handle closing the modal
  const handleClose = () => {
    onClose();
  };

  // HANDLE TITLE CHANGE
  // update title state when user types
  const handleTitleChange = (text: string) => {
    setTitle(text);
  };

  // HANDLE DESCRIPTION CHANGE
  // update description state when user types
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
  };

  // PICKER HANDLERS
  // placeholder handlers for picker buttons (will be implemented later)
  const handleShowIconColorPicker = () => {
    // TODO: implement icon/color picker
    console.log('Icon/Color picker clicked');
  };

  const handleShowDatePicker = () => {
    // TODO: implement date picker
    console.log('Date picker clicked');
  };

  const handleShowTimeDurationPicker = () => {
    // TODO: implement time/duration picker
    console.log('Time/Duration picker clicked');
  };

  const handleShowAlertsPicker = () => {
    // TODO: implement alerts picker
    console.log('Alerts picker clicked');
  };

  // check if keyboard is visible (keyboardHeight > 0)
  // keyboard anchored section should only be visible when keyboard is open
  const isKeyboardVisible = keyboardHeight > 0;

  return (
    <>
      {/* main content container with flex layout */}
      <View style={{ flex: 1 }}>
        {/* cancel button - absolutely positioned at top left */}
        {/* top position accounts for safe area inset */}
        {/* background uses task category color */}
        <Pressable
          onPress={handleClose}
          style={{
            position: 'absolute',
            top: 20 + insets.top, // add safe area top inset
            left: 16,
            zIndex: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: TaskCategoryColors[taskColor][500],
          }}
        >
          <Text style={{
            ...getTextStyle('button-secondary'),
            // use white text for contrast on colored backgrounds
            color: '#FFFFFF',
          }}>
            Cancel
          </Text>
        </Pressable>
        
        {/* main scrollable content wrapper */}
        {/* flex: 1 allows ScrollView to take available space */}
        {/* contentContainerStyle without flexGrow allows content to expand naturally */}
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ paddingBottom: 0 }}
        >
          {/* container wrapper - no padding, container touches absolute top edge */}
          {/* cancel button overlays on top of container */}
          <View
            style={{
              paddingBottom: 0,
            }}
          >
            {/* title and description container */}
            {/* full width container that wraps content with rounded bottom corners only */}
            {/* background color is a step lighter than primary (elevated) */}
            {/* container cuts off just below bottommost child */}
            {/* touches side and top edges, only bottom corners are rounded */}
            {/* inner content positioning matches TaskCreation modal */}
            <View
              style={{
                width: '100%',
                backgroundColor: themeColors.background.elevated(),
                borderTopLeftRadius: 0, // no top corner radius - touches top edge
                borderTopRightRadius: 0, // no top corner radius - touches top edge
                borderBottomLeftRadius: 36, // rounded bottom left corner
                borderBottomRightRadius: 36, // rounded bottom right corner
                padding: 16, // padding around content (sides and bottom)
                paddingTop: 80 + insets.top, // extra top padding to make room for cancel button + safe area (matches TaskCreation positioning)
                // paddingTop overrides the top part of padding: 16, so total top spacing is 80 + insets.top
                // container wraps content naturally (no fixed height)
                alignSelf: 'flex-start', // prevents stretching to full height
              }}
            >
              {/* title input */}
              {/* exact same styling as TaskCreation */}
              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={handleTitleChange}
                placeholder="e.g., Answering emails"
                placeholderTextColor={themeColors.background.lightOverlay()}
                selectionColor={TaskCategoryColors[taskColor][500]}
                style={{
                  ...getTextStyle('heading-2'),
                  color: themeColors.text.primary(),
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                }}
                returnKeyType="next"
              />

              {/* Task Description Section */}
              {/* exact same styling as TaskCreation */}
              {/* remove left padding by using negative margin to offset container padding */}
              <View 
                style={{ 
                  marginTop: 8,
                  marginLeft: -16, // offset container left padding
                  marginRight: -16, // offset container right padding to maintain full width
                  // allow this section to expand naturally based on content
                  // flexShrink: 0 prevents shrinking, no flexGrow to allow natural expansion
                  flexShrink: 0,
                }}
              >
                <DescriptionSection
                  description={description}
                  onDescriptionChange={handleDescriptionChange}
                  isEditing={true}
                  taskColor={taskColor}
                />
              </View>

              {/* Picker Buttons Section */}
              {/* copied from TaskCreation - positioned below description */}
              {/* contains color, date, time, and alerts picker buttons */}
              {/* remove horizontal padding by using negative margins to offset container padding */}
              <View 
                style={{ 
                  paddingTop: 16, 
                  paddingBottom: 8,
                  marginLeft: -16, // offset container left padding
                  marginRight: -16, // offset container right padding to maintain full width
                }}
              >
                <PickerButtonsSection
                  values={formValues}
                  iconButtonHighlightOpacity={iconButtonHighlightOpacity}
                  dateButtonHighlightOpacity={dateButtonHighlightOpacity}
                  timeButtonHighlightOpacity={timeButtonHighlightOpacity}
                  alertsButtonHighlightOpacity={alertsButtonHighlightOpacity}
                  onShowIconColorPicker={handleShowIconColorPicker}
                  onShowDatePicker={handleShowDatePicker}
                  onShowTimeDurationPicker={handleShowTimeDurationPicker}
                  onShowAlertsPicker={handleShowAlertsPicker}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* keyboard anchored section - reused from task creation */}
        {/* only visible when keyboard is open (keyboardHeight > 0) */}
        {/* contains action buttons that should stay above keyboard */}
        {isKeyboardVisible && (
          <KeyboardAnchoredContainer offset={64}>
            <View style={{
              borderTopWidth: 1,
              borderTopColor: themeColors.border.primary(),
              paddingVertical: 16,
              paddingHorizontal: 16,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              backgroundColor: themeColors.background.elevated(),
            }}>
              {/* placeholder for action buttons */}
              {/* can be extended with save/update buttons later */}
            </View>
          </KeyboardAnchoredContainer>
        )}
      </View>
    </>
  );
};

export default TaskViewContent;

