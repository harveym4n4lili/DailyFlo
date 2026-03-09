/**
 * TimelineCheckbox - completion checkbox for TimelineItem with optimistic ui.
 * Shows tick immediately on tap, syncs to backend after CHECKBOX_SYNC_DELAY_MS.
 * Parent uses onDisplayChange to get displayCompleted for title styling.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task } from '@/types';
import { Checkbox, CHECKBOX_SIZE_DEFAULT } from '@/components/ui/button';
import { CHECKBOX_SYNC_DELAY_MS } from '@/constants/Checkbox';
import { registerPendingCheckboxSync, unregisterPendingCheckboxSync } from '@/utils/pendingCheckboxSyncRegistry';

export interface TimelineCheckboxProps {
  task: Task;
  onTaskComplete?: (task: Task, targetCompleted?: boolean) => void;
  onTaskCompleteImmediate?: (task: Task, targetCompleted?: boolean) => void;
  onDisplayChange?: (displayCompleted: boolean) => void;
  /** when true: checkbox toggles selection; same instance animates shape on enter/exit */
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function TimelineCheckbox({
  task,
  onTaskComplete,
  onTaskCompleteImmediate,
  onDisplayChange,
  selectionMode = false,
  isSelected = false,
  onSelect,
}: TimelineCheckboxProps) {
  const [optimisticCompleted, setOptimisticCompleted] = useState<boolean | null>(null);
  const displayCompleted = optimisticCompleted ?? task.isCompleted;

  useEffect(() => {
    onDisplayChange?.(displayCompleted);
  }, [displayCompleted, onDisplayChange]);

  useEffect(() => {
    if (optimisticCompleted !== null && task.isCompleted === optimisticCompleted) {
      setOptimisticCompleted(null);
    }
  }, [task.isCompleted, optimisticCompleted]);

  const dispatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTargetRef = useRef<boolean | null>(null);
  const pendingExecuteRef = useRef<(() => void) | null>(null);
  const taskRef = useRef(task);
  const onTaskCompleteRef = useRef(onTaskComplete);
  taskRef.current = task;
  onTaskCompleteRef.current = onTaskComplete;

  useEffect(() => () => {
    if (pendingExecuteRef.current) unregisterPendingCheckboxSync(pendingExecuteRef.current);
    if (dispatchTimeoutRef.current) clearTimeout(dispatchTimeoutRef.current);
    if (pendingTargetRef.current !== null && onTaskCompleteRef.current) {
      onTaskCompleteRef.current(taskRef.current, pendingTargetRef.current);
    }
  }, []);

  const prevTaskIdRef = useRef(task.id);
  useEffect(() => {
    if (prevTaskIdRef.current !== task.id) {
      prevTaskIdRef.current = task.id;
      setOptimisticCompleted(null);
    }
  }, [task.id]);

  const handleCheckboxComplete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = !displayCompleted;
    setOptimisticCompleted(target);
    pendingTargetRef.current = target;

    onTaskCompleteImmediate?.(task, target);

    if (dispatchTimeoutRef.current) clearTimeout(dispatchTimeoutRef.current);

    const executeSync = () => {
      unregisterPendingCheckboxSync(executeSync);
      pendingExecuteRef.current = null;
      if (dispatchTimeoutRef.current) {
        clearTimeout(dispatchTimeoutRef.current);
        dispatchTimeoutRef.current = null;
      }
      pendingTargetRef.current = null;
      onTaskComplete?.(task, target);
    };

    pendingExecuteRef.current = executeSync;
    dispatchTimeoutRef.current = setTimeout(executeSync, CHECKBOX_SYNC_DELAY_MS);
    registerPendingCheckboxSync(executeSync);
  }, [onTaskComplete, onTaskCompleteImmediate, task, displayCompleted]);

  // single Checkbox: selection mode toggles selection; completion mode marks complete
  // selectionMode prop drives shape animation (circle <-> square) on enter/exit
  const checked = selectionMode ? isSelected : displayCompleted;
  const handlePress = selectionMode ? onSelect : (onTaskComplete ? handleCheckboxComplete : undefined);

  return (
    <View style={{ width: CHECKBOX_SIZE_DEFAULT, height: CHECKBOX_SIZE_DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
      <Checkbox
        checked={checked}
        onPress={handlePress}
        expandTapArea
        selectionMode={selectionMode}
      />
    </View>
  );
}
