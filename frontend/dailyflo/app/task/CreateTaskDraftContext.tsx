/**
 * CreateTaskDraftContext
 *
 * Holds the "picker" form fields (dueDate, time, duration, alerts, routineType, list destination) that are edited
 * on stack screens (date-select, time-duration-select, alert-select, list-select) so they stay
 * in sync with the main task form. list-select uses pickedListId: null = Inbox, string = list id,
 * undefined = not set from that sheet (use form local listId).
 */

import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

import type { RoutineType } from '@/types';
import { DEFAULT_NEW_TASK_ALERT_IDS } from '@/services/notifications/taskReminderConstants';
import { withoutEndAlertUnlessDuration } from '@/components/features/tasks/TaskScreen/modals/alertOptions';

export interface CreateTaskDraftSlice {
  dueDate: string | undefined;
  time: string | undefined;
  duration: number | undefined;
  alerts: string[];
  /** recurrence for quick-add / picker draft; defaults to once when omitted */
  routineType?: RoutineType;
  /**
   * from list-select sheet only: null = Inbox (no list), string = list id.
   * omit or undefined = merged values use form state listId until user opens list-select.
   */
  pickedListId?: string | null;
}

interface CreateTaskDraftContextValue {
  draft: CreateTaskDraftSlice;
  setDueDate: (date: string | undefined) => void;
  setTime: (time: string | undefined) => void;
  setDuration: (duration: number | undefined) => void;
  setAlerts: (alertIds: string[]) => void;
  /** Replace the whole draft slice (e.g. when index initializes from params) */
  setDraft: (slice: Partial<CreateTaskDraftSlice>) => void;
  /** Register callback for overdue reschedule - invoked when user selects date in date-select (before nav back) */
  registerOverdueReschedule: (onDateSelected: (date: string) => void) => void;
  /** Clear overdue reschedule callback (e.g. when user backs out without selecting) */
  clearOverdueReschedule: () => void;
}

const defaultDraft: CreateTaskDraftSlice = {
  dueDate: undefined,
  time: undefined,
  duration: undefined,
  alerts: [],
};

const CreateTaskDraftContext = createContext<CreateTaskDraftContextValue | null>(null);

export function CreateTaskDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<CreateTaskDraftSlice>(defaultDraft);
  const overdueRescheduleRef = useRef<((date: string) => void) | null>(null);

  const setDueDate = useCallback((date: string | undefined) => {
    if (date && overdueRescheduleRef.current) {
      const cb = overdueRescheduleRef.current;
      overdueRescheduleRef.current = null;
      cb(date);
    }
    setDraftState((prev) => {
      if (!date) {
        return { ...prev, dueDate: date, alerts: [] };
      }
      const shouldSeedDefault =
        Boolean(prev.time?.trim()) && (prev.alerts?.length ?? 0) === 0;
      return {
        ...prev,
        dueDate: date,
        alerts: shouldSeedDefault ? [...DEFAULT_NEW_TASK_ALERT_IDS] : prev.alerts,
      };
    });
  }, []);
  const setTime = useCallback((time: string | undefined) => {
    setDraftState((prev) => {
      if (!time?.trim()) {
        return { ...prev, time, alerts: [] };
      }
      const shouldSeedDefault =
        Boolean(prev.dueDate) && (prev.alerts?.length ?? 0) === 0;
      return {
        ...prev,
        time,
        alerts: shouldSeedDefault ? [...DEFAULT_NEW_TASK_ALERT_IDS] : prev.alerts,
      };
    });
  }, []);
  const setDuration = useCallback((duration: number | undefined) => {
    setDraftState((prev) => ({
      ...prev,
      duration,
      // end-of-task alert only valid when a length is set — drop it if user clears duration
      alerts: withoutEndAlertUnlessDuration(prev.alerts, duration),
    }));
  }, []);
  const setAlerts = useCallback((alertIds: string[]) => {
    setDraftState((prev) => ({ ...prev, alerts: alertIds }));
  }, []);
  const setDraft = useCallback((slice: Partial<CreateTaskDraftSlice>) => {
    setDraftState((prev) => ({ ...prev, ...slice }));
  }, []);

  const registerOverdueReschedule = useCallback((onDateSelected: (date: string) => void) => {
    overdueRescheduleRef.current = onDateSelected;
  }, []);

  const clearOverdueReschedule = useCallback(() => {
    overdueRescheduleRef.current = null;
  }, []);

  const value: CreateTaskDraftContextValue = {
    draft,
    setDueDate,
    setTime,
    setDuration,
    setAlerts,
    setDraft,
    registerOverdueReschedule,
    clearOverdueReschedule,
  };

  return (
    <CreateTaskDraftContext.Provider value={value}>
      {children}
    </CreateTaskDraftContext.Provider>
  );
}

export function useCreateTaskDraft() {
  const ctx = useContext(CreateTaskDraftContext);
  if (!ctx) {
    throw new Error('useCreateTaskDraft must be used within CreateTaskDraftProvider');
  }
  return ctx;
}
