/**
 * ios: pushed planner sibling — native stack animates selection Stack.Toolbar items.
 * redux enter/exit is tied to mount so auxiliary routes (e.g. date-select) do not clear selection (same as today/select).
 */

import React, { useEffect, useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { useUI } from '@/store/hooks';
import { IosTaskSelectionBottomToolbar } from '@/components/navigation/IosTaskSelectionBottomToolbar';
import { PlannerTabContent } from './PlannerTabContent';

export default function PlannerSelectScreen() {
  const navigation = useNavigation();
  const { enterSelectionMode, exitSelectionMode } = useUI();

  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    enterSelectionMode('tasks');
    return () => exitSelectionMode();
  }, [enterSelectionMode, exitSelectionMode]);

  useLayoutEffect(() => {
    if (Platform.OS !== 'ios') return;
    navigation.setOptions({
      headerTitle: 'Select tasks',
    });
  }, [navigation]);

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <>
      <IosTaskSelectionBottomToolbar variant="planner" />
      <PlannerTabContent mode="select" />
    </>
  );
}
