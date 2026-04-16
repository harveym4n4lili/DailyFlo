/**
 * ios: pushed sibling of today index — native stack animates Stack.Toolbar items.
 * enter/exit selection is tied to this screen’s focus so redux clears when you pop.
 */

import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useUI } from '@/store/hooks';
import { TodayScreenContent } from './TodayScreenContent';

export default function TodaySelectScreen() {
  const { enterSelectionMode, exitSelectionMode } = useUI();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'ios') return undefined;
      enterSelectionMode('tasks');
      return () => exitSelectionMode();
    }, [enterSelectionMode, exitSelectionMode])
  );

  if (Platform.OS !== 'ios') {
    return null;
  }

  return <TodayScreenContent mode="select" />;
}
