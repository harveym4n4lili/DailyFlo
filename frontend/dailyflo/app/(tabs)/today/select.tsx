/**
 * ios: pushed sibling of today index — native stack animates Stack.Toolbar items.
 * enter/exit selection is tied to this screen’s mount (not focus) so /date-select on top does not clear redux.
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useUI } from '@/store/hooks';
import { IosTaskSelectionBottomToolbar } from '@/components/navigation/IosTaskSelectionBottomToolbar';
import { TodayScreenContent } from './TodayScreenContent';

export default function TodaySelectScreen() {
  const { enterSelectionMode, exitSelectionMode } = useUI();

  // mount/unmount only — not useFocusEffect: opening root /date-select blurs this screen and would exit selection early
  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    enterSelectionMode('tasks');
    return () => exitSelectionMode();
  }, [enterSelectionMode, exitSelectionMode]);

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <>
      <IosTaskSelectionBottomToolbar variant="today" />
      <TodayScreenContent mode="select" />
    </>
  );
}
