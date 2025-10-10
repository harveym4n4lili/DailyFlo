/**
 * TaskCreationModal
 * 
 * Full-screen modal for creating new tasks.
 * Multi-step flow orchestrator for task creation.
 * Currently implements Step 1 (TaskBasicInfo).
 */

import React, { useState } from 'react';
import { Modal } from 'react-native';
import { ModalContainer } from '@/components/layout/ModalLayout';
import { TaskBasicInfo } from './TaskBasicInfo';
import { useAppDispatch } from '@/store';
import { createTask } from '@/store/slices/tasks/tasksSlice';
import { useTasks } from '@/store/hooks';
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import type { PriorityLevel, RoutineType } from '@/types';

export interface TaskCreationModalProps {
  visible: boolean;
  onClose: () => void;
  initialValues?: Partial<TaskFormValues>;
}

const DEFAULTS: TaskFormValues = {
  title: '',
  description: '',
  dueDate: new Date().toISOString(),
  priorityLevel: 3 as PriorityLevel,
  color: 'blue',
  routineType: 'once' as RoutineType,
  listId: undefined,
};

export function TaskCreationModal({ 
  visible, 
  onClose,
  initialValues,
}: TaskCreationModalProps) {
  const dispatch = useAppDispatch();
  const { isCreating } = useTasks();
  
  // form state management
  const [values, setValues] = useState<Partial<TaskFormValues>>({ 
    ...DEFAULTS, 
    ...initialValues 
  });

  const onChange = <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  // handle successful task creation
  const handleTaskCreated = async () => {
    // TODO: Add validation before submitting
    await dispatch(createTask({
      title: values.title?.trim() || '',
      description: values.description?.trim() || '',
      dueDate: values.dueDate || undefined,
      priorityLevel: values.priorityLevel || 3,
      color: values.color || 'blue',
      routineType: values.routineType || 'once',
      listId: values.listId,
    } as any));
    
    console.log('✅ Task created successfully');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <ModalContainer
        presentationStyle="fullScreen"
        onClose={onClose}
        showCancelButton={true}
      >
        <TaskBasicInfo 
          values={values}
          onChange={onChange}
        />
      </ModalContainer>
    </Modal>
  );
}

export default TaskCreationModal;



