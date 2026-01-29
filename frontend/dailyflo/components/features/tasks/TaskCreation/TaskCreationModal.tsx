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
import { WrappedFullScreenModal } from '@/components/layout/ModalLayout';

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
import type { PriorityLevel, RoutineType, CreateTaskInput, TaskColor, Subtask as TaskSubtask } from '@/types';

// SUBTASKS IMPORTS
// Subtask type for local state management
import type { Subtask } from '@/components/features/subtasks';

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
  
  // RESET FORM WHEN MODAL OPENS
  // when the modal becomes visible, reset form values to defaults merged with initialValues
  // this ensures that when user opens the modal from planner screen, it uses the currently selected date
  // flow: modal opens (visible becomes true) → useEffect runs → form resets with current initialValues
  useEffect(() => {
    if (visible) {
      // reset form values to defaults merged with current initialValues
      // this allows the modal to always use the latest selectedDate when opened from planner
      setValues({ 
        ...getDefaults(themeColor), 
        ...initialValues 
      });
      // also reset subtasks when modal opens for a fresh start
      setSubtasks([]);
    }
  }, [visible, initialValues, themeColor]);
  
  // PICKER VISIBILITY STATE
  // track if any form picker modal is visible for custom backdrop in TaskCreationContent
  const [isAnyPickerVisible, setIsAnyPickerVisible] = useState(false);

  // SUBTASKS STATE
  // manage list of subtasks - each subtask has id, title, and completion status
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  // FORM CHANGE HANDLER
  // generic change handler for all form fields
  const onChange = <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  // SUBTASKS HANDLERS
  // handle creating a new subtask
  const handleCreateSubtask = () => {
    // generate unique ID for new subtask
    const newSubtaskId = `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // create new subtask with default title and editing mode enabled
    const newSubtask: Subtask = {
      id: newSubtaskId,
      title: '', // empty title to start
      isCompleted: false,
      isEditing: true, // start in edit mode
    };
    
    // add new subtask to the list
    setSubtasks(prev => [...prev, newSubtask]);
  };
  
  // handle subtask title change
  const handleSubtaskTitleChange = (subtaskId: string, newTitle: string) => {
    setSubtasks(prev =>
      prev.map(subtask =>
        subtask.id === subtaskId
          ? { ...subtask, title: newTitle }
          : subtask
      )
    );
  };
  
  // handle finish editing subtask
  const handleSubtaskFinishEditing = (subtaskId: string) => {
    setSubtasks(prev =>
      prev.map(subtask =>
        subtask.id === subtaskId
          ? { ...subtask, isEditing: false }
          : subtask
      )
    );
  };
  
  // handle subtask toggle (complete/incomplete)
  const handleSubtaskToggle = (subtaskId: string) => {
    setSubtasks(prev =>
      prev.map(subtask =>
        subtask.id === subtaskId
          ? { ...subtask, isCompleted: !subtask.isCompleted }
          : subtask
      )
    );
  };
  
  // handle subtask delete
  const handleSubtaskDelete = (subtaskId: string) => {
    setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskId));
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
      values.duration !== undefined ||
      subtasks.length > 0 // include subtasks in change detection
    );
  }, [values, themeColor, subtasks]);

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
    
    // convert local Subtask format to TaskSubtask format (with sortOrder)
    // sortOrder is the index in the array
    const taskSubtasks: TaskSubtask[] = subtasks.map((st, index) => ({
      id: st.id,
      title: st.title,
      isCompleted: st.isCompleted,
      sortOrder: index,
    }));
    
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
   
      // include subtasks and reminders in metadata
      metadata: {
        subtasks: taskSubtasks, // save subtasks with sortOrder
        reminders: [], // TODO: convert alerts to reminders when implemented
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
        // Reset subtasks to empty array for next time
        setSubtasks([]);
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
  // using composable approach: WrappedFullScreenModal with keyboard-aware content
  return (
    <WrappedFullScreenModal
      visible={visible}
      onClose={onClose}
      backgroundColor={themeColors.background.primarySecondaryBlend()}
      showBackdrop={true}
      backdropDismiss={true}
      fullScreen={true}
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
        subtasks={subtasks}
        onSubtaskToggle={handleSubtaskToggle}
        onSubtaskDelete={handleSubtaskDelete}
        onSubtaskTitleChange={handleSubtaskTitleChange}
        onSubtaskFinishEditing={handleSubtaskFinishEditing}
        onCreateSubtask={handleCreateSubtask}
      />
    </WrappedFullScreenModal>
  );
}

export default TaskCreationModal;
