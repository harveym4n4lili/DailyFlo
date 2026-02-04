/**
 * TaskCreationModal
 *
 * When visible, redirects to the create-task Stack screen and calls onClose.
 * Used by Planner/Search (or any caller that still uses this component).
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';

export interface TaskCreationModalProps {
  visible: boolean;
  onClose: () => void;
  initialValues?: Partial<TaskFormValues>;
}

export function TaskCreationModal({ visible, onClose, initialValues }: TaskCreationModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      onClose();
      router.push({
        pathname: '/create-task',
        params: initialValues?.dueDate ? { dueDate: initialValues.dueDate } : undefined,
      });
    }
  }, [visible, onClose, router, initialValues?.dueDate]);

  return null;
}

export default TaskCreationModal;
