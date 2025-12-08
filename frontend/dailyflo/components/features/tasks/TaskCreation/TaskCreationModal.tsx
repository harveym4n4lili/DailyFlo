/**
 * TaskCreationModal
 * 
 * Orchestrator for the task creation flow.
 * Handles state management, Redux integration, and backdrop rendering.
 * Delegates UI to TaskCreationContent component.
 */

// REACT IMPORTS
// react: core react library for building components
import React, { useState, useMemo, useEffect } from 'react';

// LAYOUT COMPONENTS IMPORTS
// Modal components: using composable approach with FullScreenModal
import { FullScreenModal } from '@/components/layout/ModalLayout';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useThemeColors } from '@/hooks/useColorPalette';
// useThemeColor: hook that provides the global theme color selected by the user
import { useThemeColor } from '@/hooks/useThemeColor';

// EXPO HAPTICS IMPORT
// provides haptic feedback for better user experience
import * as Haptics from 'expo-haptics';

// FEATURE COMPONENTS IMPORTS
// TaskCreationContent: the actual content and UI for task creation
import { TaskCreationContent } from './TaskCreationContent';

// STORE IMPORTS
// redux store hooks and actions for state management
import { useAppDispatch } from '@/store';
import { createTask } from '@/store/slices/tasks/tasksSlice';
import { useTasks } from '@/store/hooks';

// TYPES IMPORTS
// typescript types for type safety
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import type { PriorityLevel, RoutineType, CreateTaskInput, TaskColor } from '@/types';

// VALIDATION IMPORTS
// validateAll: function to validate all form fields and return errors
import { validateAll } from '@/components/forms/TaskForm/TaskValidation';

/**
 * Props for the TaskCreationModal component
 */
export interface TaskCreationModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Optional initial values for the form */
  initialValues?: Partial<TaskFormValues>;
}

// DEFAULT FORM VALUES
// these are the default values for a new task
// Note: color defaults to 'red' (theme color), but will be set dynamically in component
// TODO: Backend implementation - default task color will sync with theme color from user preferences
const getDefaults = (themeColor: TaskColor = 'red'): TaskFormValues => ({
  title: '',
  description: '',
  dueDate: new Date().toISOString(),
  priorityLevel: 3 as PriorityLevel,
  color: themeColor, // default to theme color (red by default)
  icon: 'code-slash', // default icon so there's always a selected value
  routineType: 'once' as RoutineType,
  listId: undefined,
  alerts: [],
});


/**
 * TaskCreationModal Component
 * 
 * Orchestrates the task creation flow.
 * Manages form state, change detection, and renders backdrop + content.
 */
export function TaskCreationModal({ 
  visible, 
  onClose,
  initialValues,
}: TaskCreationModalProps) {
  // CONSOLE DEBUGGING
  // console.log('🔍 TaskCreationModal - visible:', visible);
  
  // HOOKS
  const themeColors = useThemeColors();
  // get the global theme color selected by the user (default: red)
  // this is used as the default task color
  const { themeColor } = useThemeColor();
  
  // REDUX
  const dispatch = useAppDispatch();
  const { isCreating, createError } = useTasks();
  
  // FORM STATE
  // main form state that holds all task data
  // default task color is set to theme color (red by default)
  const [values, setValues] = useState<Partial<TaskFormValues>>({ 
    ...getDefaults(themeColor), 
    ...initialValues 
  });
  
  // PICKER VISIBILITY STATE
  // track if any form picker modal is visible for custom backdrop in TaskCreationContent
  const [isAnyPickerVisible, setIsAnyPickerVisible] = useState(false);

  // FORM CHANGE HANDLER
  // generic change handler for all form fields
  const onChange = <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  // CHANGE DETECTION
  // check if form has any changes from defaults
  const hasChanges = useMemo(() => {
    return (
      values.title?.trim() !== '' ||
      values.description?.trim() !== '' ||
      values.dueDate !== getDefaults(themeColor).dueDate ||
      values.color !== getDefaults(themeColor).color ||
      values.icon !== getDefaults(themeColor).icon ||
      (values.alerts && values.alerts.length > 0) ||
      values.time !== undefined ||
      values.duration !== undefined
    );
  }, [values, themeColor]);

  // CREATE TASK HANDLER
  // this function is called when user presses the create button
  // flow: validate form → transform to CreateTaskInput → dispatch createTask → handle success/error
  const handleCreate = async () => {
    // Step 1: Validate the form
    // validateAll checks all fields and returns an object with any errors
    const errors = validateAll(values as TaskFormValues);
    
    // If there are validation errors, don't proceed
    // The form should show these errors to the user
    if (Object.keys(errors).length > 0) {
      // console.log('Form validation errors:', errors);
      // TODO: Show validation errors to user (could use Alert or error state)
      return;
    }

    // Step 2: Transform form values to CreateTaskInput format
    // CreateTaskInput is the type expected by the Redux createTask action
    const taskData: CreateTaskInput = {
      title: values.title!.trim(), // title is required, so we know it exists after validation
      description: values.description?.trim() || undefined,
      icon: values.icon || undefined,
      time: values.time || undefined,
      duration: values.duration || undefined,
      dueDate: values.dueDate || undefined,
      priorityLevel: values.priorityLevel || 3,
      color: values.color || themeColor, // default to theme color if not specified
      routineType: values.routineType || 'once',
      listId: values.listId || undefined,
   
      // For now, we'll handle alerts/reminders separately if needed
      // The backend might need reminders created separately via a different endpoint
      metadata: {
        subtasks: [],
        reminders: [],
        notes: values.description?.trim() || undefined,
        tags: [],
      },
    };

    try {
      // Step 3: Dispatch the createTask action
      // This is a Redux async thunk that makes an API call and updates the store
      const result = await dispatch(createTask(taskData));
      
      // Step 4: Handle the result
      // createTask.fulfilled means the task was created successfully
      if (createTask.fulfilled.match(result)) {
        // console.log('Task created successfully:', result.payload);
        // Provide haptic feedback on successful task creation
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        // Close the modal on success
        onClose();
        // Reset form to defaults for next time
            setValues({ ...getDefaults(themeColor) });
      } else {
        // createTask.rejected means there was an error
        console.error('Failed to create task:', result.payload);
        // Error is already stored in createError from Redux state
      }
    } catch (error) {
      // Catch any unexpected errors
      console.error('Unexpected error creating task:', error);
    }
  };

  // COMPONENT RENDER
  // using composable approach: FullScreenModal with keyboard-aware content
  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      backgroundColor={themeColors.background.elevated()}
      showBackdrop={true}
      backdropDismiss={true}
    >
      <TaskCreationContent
        visible={visible}
        values={values}
        onChange={onChange}
        onClose={onClose}
        hasChanges={hasChanges}
        onPickerVisibilityChange={setIsAnyPickerVisible}
        onCreate={handleCreate}
        isCreating={isCreating}
        createError={createError}
      />
    </FullScreenModal>
  );
}

export default TaskCreationModal;
