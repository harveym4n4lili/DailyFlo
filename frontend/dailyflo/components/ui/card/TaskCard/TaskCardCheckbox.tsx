/**
 * TaskCardCheckbox - completion checkbox for TaskCard with optimistic ui.
 * Shows tick immediately on tap, syncs to backend after CHECKBOX_SYNC_DELAY_MS.
 * Parent uses onDisplayChange to get displayCompleted for card styling.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task } from '@/types';
import { Checkbox, CHECKBOX_SIZE_DEFAULT } from '@/components/ui/button';
import { CHECKBOX_SYNC_DELAY_MS } from '@/constants/Checkbox';

export interface TaskCardCheckboxProps {
  task: Task;
  onComplete?: (task: Task, targetCompleted?: boolean) => void;
  onDisplayChange?: (displayCompleted: boolean) => void;
}

export default function TaskCardCheckbox({
  task,
  onComplete,
  onDisplayChange,
}: TaskCardCheckboxProps) {
  const [optimisticCompleted, setOptimisticCompleted] = useState<boolean | null>(null);
  const displayCompleted = optimisticCompleted ?? task.isCompleted;

  // notify parent when display value changes (for card styling)
  useEffect(() => {
    onDisplayChange?.(displayCompleted);
  }, [displayCompleted, onDisplayChange]);

  // clear optimistic when backend catches up
  useEffect(() => {
    if (optimisticCompleted !== null && task.isCompleted === optimisticCompleted) {
      setOptimisticCompleted(null);
    }
  }, [task.isCompleted, optimisticCompleted]);

  // reset when task changes (e.g. list reuse)
  const prevTaskIdRef = useRef(task.id);
  useEffect(() => {
    if (prevTaskIdRef.current !== task.id) {
      prevTaskIdRef.current = task.id;
      setOptimisticCompleted(null);
    }
  }, [task.id]);

  const dispatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTargetRef = useRef<boolean | null>(null);
  const taskRef = useRef(task);
  const onCompleteRef = useRef(onComplete);
  taskRef.current = task;
  onCompleteRef.current = onComplete;

  useEffect(() => () => {
    if (dispatchTimeoutRef.current) clearTimeout(dispatchTimeoutRef.current);
    if (pendingTargetRef.current !== null && onCompleteRef.current) {
      onCompleteRef.current(taskRef.current, pendingTargetRef.current);
    }
  }, []);

  const handleCheckboxComplete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = !displayCompleted;
    setOptimisticCompleted(target);
    pendingTargetRef.current = target;

    if (dispatchTimeoutRef.current) clearTimeout(dispatchTimeoutRef.current);
    dispatchTimeoutRef.current = setTimeout(() => {
      dispatchTimeoutRef.current = null;
      pendingTargetRef.current = null;
      onComplete?.(task, target);
    }, CHECKBOX_SYNC_DELAY_MS);
  }, [onComplete, task, displayCompleted]);

  return (
    <View style={{ width: CHECKBOX_SIZE_DEFAULT, height: CHECKBOX_SIZE_DEFAULT, marginRight: 12, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', zIndex: 1 }}>
      <Checkbox
        checked={displayCompleted}
        onPress={onComplete ? handleCheckboxComplete : undefined}
        expandTapArea
      />
    </View>
  );
}
