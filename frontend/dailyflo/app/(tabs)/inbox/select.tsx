/**
 * ios: pushed sibling of inbox index — native stack animates Stack.Toolbar items.
 * enter/exit selection is tied to this screen’s mount (not focus) so pickers on top do not clear redux.
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useUI } from '@/store/hooks';
import { IosTaskSelectionBottomToolbar } from '@/components/navigation/IosTaskSelectionBottomToolbar';
import { InboxTaskListContent } from '@/components/features/inbox/InboxTaskListContent';

export default function InboxSelectScreen() {
  const { enterSelectionMode, exitSelectionMode } = useUI();

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
      <IosTaskSelectionBottomToolbar />
      <InboxTaskListContent chromeVariant="tab-root" mode="select" />
    </>
  );
}
