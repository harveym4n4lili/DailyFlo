/**
 * SettingsScheduleSelectContext
 *
 * passes wake/sleep picker state from settings into nested browse stack sheets (liquid glass on ios).
 * stack routes cannot carry callbacks in params — same pattern as PlannerMonthSelectContext.
 *
 * flow:
 * 1. settings row tap → openScheduleTimeSelect(payload) then router.push wake-time-select | sleep-time-select
 * 2. sheet mounts → consumeScheduleTimeSelect() returns payload once
 * 3. save → PATCH preferences, router.back()
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ScheduleTimeKind = 'wake' | 'sleep';

export type ScheduleTimeSelectPayload = {
  kind: ScheduleTimeKind;
  /** initial value for the native time spinner */
  draftTime: Date;
  wakeTime: string;
  sleepTime: string;
};

type ContextValue = {
  openScheduleTimeSelect: (payload: ScheduleTimeSelectPayload) => void;
  consumeScheduleTimeSelect: () => ScheduleTimeSelectPayload | null;
};

const SettingsScheduleSelectContext = createContext<ContextValue | null>(null);

export function SettingsScheduleSelectProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<ScheduleTimeSelectPayload | null>(null);
  const payloadRef = useRef<ScheduleTimeSelectPayload | null>(null);

  const openScheduleTimeSelect = useCallback((next: ScheduleTimeSelectPayload) => {
    payloadRef.current = next;
    setPayload(next);
  }, []);

  const consumeScheduleTimeSelect = useCallback((): ScheduleTimeSelectPayload | null => {
    const current = payloadRef.current ?? payload;
    payloadRef.current = null;
    setPayload(null);
    return current;
  }, [payload]);

  const value: ContextValue = { openScheduleTimeSelect, consumeScheduleTimeSelect };

  return (
    <SettingsScheduleSelectContext.Provider value={value}>
      {children}
    </SettingsScheduleSelectContext.Provider>
  );
}

export function useSettingsScheduleTimeSelect(): ContextValue {
  const ctx = useContext(SettingsScheduleSelectContext);
  if (!ctx) {
    throw new Error('useSettingsScheduleTimeSelect must be used within SettingsScheduleSelectProvider');
  }
  return ctx;
}
