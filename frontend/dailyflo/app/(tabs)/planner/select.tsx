/**
 * ios: pushed planner sibling — native stack animates selection Stack.Toolbar items.
 * redux enter/exit is tied to focus so popping clears checkboxes (same contract as today/select).
 */

import React, { useCallback, useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useUI } from '@/store/hooks';
import { PlannerTabContent } from './PlannerTabContent';

export default function PlannerSelectScreen() {
  const navigation = useNavigation();
  const { enterSelectionMode, exitSelectionMode } = useUI();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'ios') return undefined;
      enterSelectionMode('tasks');
      return () => exitSelectionMode();
    }, [enterSelectionMode, exitSelectionMode]),
  );

  useLayoutEffect(() => {
    if (Platform.OS !== 'ios') return;
    navigation.setOptions({
      headerTitle: 'Select tasks',
    });
  }, [navigation]);

  if (Platform.OS !== 'ios') {
    return null;
  }

  return <PlannerTabContent mode="select" />;
}
