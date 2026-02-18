/**
 * DuplicateTaskContext
 *
 * Holds task data when user taps "Duplicate" from the task view.
 * We store the current task's form values and subtasks here, then navigate to
 * task-create. The create screen reads this on mount, pre-fills the form, and clears it.
 *
 * This avoids creating the task on the backend first - user sees a pre-filled create
 * form and can edit before saving.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import type { Subtask } from '@/components/features/subtasks';

export interface DuplicateTaskData {
  values: Partial<TaskFormValues>;
  subtasks: Subtask[];
}

interface DuplicateTaskContextValue {
  /** Data to pre-fill when opening task-create from Duplicate (null when not duplicating) */
  duplicateData: DuplicateTaskData | null;
  /** Set duplicate data before navigating to task-create (called from task view) */
  setDuplicateData: (data: DuplicateTaskData | null) => void;
  /** Consume and clear duplicate data (called by task-create on mount) */
  consumeDuplicateData: () => DuplicateTaskData | null;
}

const DuplicateTaskContext = createContext<DuplicateTaskContextValue | null>(null);

export function DuplicateTaskProvider({ children }: { children: ReactNode }) {
  const [duplicateData, setDuplicateDataState] = useState<DuplicateTaskData | null>(null);

  const setDuplicateData = useCallback((data: DuplicateTaskData | null) => {
    setDuplicateDataState(data);
  }, []);

  // consumeDuplicateData: returns current data and clears it (task-create calls this on mount)
  const consumeDuplicateData = useCallback(() => {
    const data = duplicateData;
    setDuplicateDataState(null);
    return data;
  }, [duplicateData]);

  const value: DuplicateTaskContextValue = {
    duplicateData,
    setDuplicateData,
    consumeDuplicateData,
  };

  return (
    <DuplicateTaskContext.Provider value={value}>
      {children}
    </DuplicateTaskContext.Provider>
  );
}

export function useDuplicateTask() {
  const ctx = useContext(DuplicateTaskContext);
  if (!ctx) {
    throw new Error('useDuplicateTask must be used within DuplicateTaskProvider');
  }
  return ctx;
}
