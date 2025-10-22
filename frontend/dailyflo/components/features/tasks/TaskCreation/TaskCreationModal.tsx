/**
 * TaskCreationModal
 * 
 * Orchestrator for the task creation flow.
 * Handles state management, Redux integration, and backdrop rendering.
 * Delegates UI to TaskCreationContent component.
 */

// REACT IMPORTS
// react: core react library for building components
import React, { useState, useMemo } from 'react';

// LAYOUT COMPONENTS IMPORTS
// KeyboardModal: bottom sheet modal that appears with keyboard, no keyboard avoiding
// ModalBackdrop: reusable backdrop component that fades in/out
import { KeyboardModal, ModalBackdrop } from '@/components/layout/ModalLayout';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useThemeColors } from '@/hooks/useColorPalette';

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
import type { PriorityLevel, RoutineType } from '@/types';

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
const DEFAULTS: TaskFormValues = {
  title: '',
  description: '',
  dueDate: new Date().toISOString(),
  priorityLevel: 3 as PriorityLevel,
  color: 'blue',
  icon: 'star-outline', // default icon so there's always a selected value
  routineType: 'once' as RoutineType,
  listId: undefined,
  alerts: [],
};

// CONSTANTS
// padding for the bottom action section (with create button)
const BOTTOM_SECTION_PADDING_VERTICAL = 16;
const BOTTOM_SECTION_TOTAL_PADDING = BOTTOM_SECTION_PADDING_VERTICAL * 2; // top + bottom = 32px

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
  // HOOKS
  const themeColors = useThemeColors();
  
  // REDUX
  const dispatch = useAppDispatch();
  const { isCreating } = useTasks();
  
  // FORM STATE
  // main form state that holds all task data
  const [values, setValues] = useState<Partial<TaskFormValues>>({ 
    ...DEFAULTS, 
    ...initialValues 
  });

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
      values.dueDate !== DEFAULTS.dueDate ||
      values.color !== DEFAULTS.color ||
      values.icon !== DEFAULTS.icon ||
      (values.alerts && values.alerts.length > 0) ||
      values.time !== undefined ||
      values.duration !== undefined
    );
  }, [values]);

  // COMPONENT RENDER
  // now includes KeyboardModal wrapper at this level
  return (
    <>
      {/* Visual backdrop - non-tappable, just for darkening effect */}
      {/* shows only when task modal is visible, NOT when picker modals are open */}
      {/* KeyboardModal's transparent backdrop handles taps */}
      <ModalBackdrop 
        isVisible={visible}
        zIndex={9999}
      />

      {/* KeyboardModal - bottom sheet modal that appears with keyboard */}
      {/* showBackdrop=true: uses transparent backdrop to catch taps */}
      {/* backdropDismiss=true: tapping backdrop triggers onClose */}
      {/* bottomSectionHeight: accounts for bottom action section padding (32px) */}
      <KeyboardModal
        visible={visible}
        onClose={onClose}
        backgroundColor={themeColors.background.primary()}
        dynamicKeyboardHeight={true}
        showBackdrop={true}
        backdropDismiss={true}
        bottomSectionHeight={BOTTOM_SECTION_TOTAL_PADDING}
      >
        <TaskCreationContent
          visible={visible}
          values={values}
          onChange={onChange}
          onClose={onClose}
          hasChanges={hasChanges}
        />
      </KeyboardModal>
    </>
  );
}

export default TaskCreationModal;
