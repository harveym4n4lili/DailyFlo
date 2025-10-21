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
  routineType: 'once' as RoutineType,
  listId: undefined,
  alerts: [],
};

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
      values.icon !== undefined ||
      (values.alerts && values.alerts.length > 0) ||
      values.time !== undefined ||
      values.duration !== undefined
    );
  }, [values]);

  // COMPONENT RENDER
  // delegates everything to TaskCreationContent
  return (
    <TaskCreationContent
      visible={visible}
      values={values}
      onChange={onChange}
      onClose={onClose}
      hasChanges={hasChanges}
    />
  );
}

export default TaskCreationModal;
