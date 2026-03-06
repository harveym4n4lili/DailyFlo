/**
 * PlannerMonthSelectContext
 *
 * Provides a way for the Planner screen to open the month-select stack screen
 * and receive the selected date back via a callback. Stack screens can't pass
 * callbacks through route params (they're not serializable), so we use this
 * context to pass initial date and onSelected from Planner to the month-select screen.
 *
 * Navigation is done by the Planner with router.push() – same as opening the task
 * screen (handleTaskPress -> router.push('/task/[taskId]')). The planner's
 * useRouter() is used for both; we only store the payload here for the
 * month-select screen to consume on mount.
 *
 * Flow:
 * 1. User taps month/year header -> Planner calls openMonthSelect(...) then router.push('/month-select')
 * 2. Context stores payload (initialDate, onSelected)
 * 3. Month-select screen mounts, consumeMonthSelect() returns payload
 * 4. User selects a date -> onSelected(date), router.back()
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type MonthSelectPayload = {
  initialDate: string;
  onSelected: (date: string) => void;
};

type ContextValue = {
  openMonthSelect: (initialDate: string, onSelected: (date: string) => void) => void;
  consumeMonthSelect: () => MonthSelectPayload | null;
};

const PlannerMonthSelectContext = createContext<ContextValue | null>(null);

export function PlannerMonthSelectProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<MonthSelectPayload | null>(null);
  const payloadRef = useRef<MonthSelectPayload | null>(null);

  const openMonthSelect = useCallback((initialDate: string, onSelected: (date: string) => void) => {
    const next = { initialDate, onSelected };
    payloadRef.current = next;
    setPayload(next);
    // navigation is done by the caller (Planner) with router.push('/month-select') – same as task screen
  }, []);

  const consumeMonthSelect = useCallback((): MonthSelectPayload | null => {
    const current = payloadRef.current ?? payload;
    payloadRef.current = null;
    setPayload(null);
    return current;
  }, [payload]);

  const value: ContextValue = { openMonthSelect, consumeMonthSelect };

  return (
    <PlannerMonthSelectContext.Provider value={value}>
      {children}
    </PlannerMonthSelectContext.Provider>
  );
}

export function usePlannerMonthSelect(): ContextValue {
  const ctx = useContext(PlannerMonthSelectContext);
  if (!ctx) {
    throw new Error('usePlannerMonthSelect must be used within PlannerMonthSelectProvider');
  }
  return ctx;
}
