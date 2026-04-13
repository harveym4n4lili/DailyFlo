/**
 * when a root Stack modal (task, pickers, etc.) is focused, liquid tab chrome must unmount — it uses a very high z-index
 * and can sit above native formSheets so the sheet looks blank. we compute suppression in root _layout from the same
 * global route info as usePathname/useSegments so every child (including (tabs)/_layout) agrees without fragile getParent().
 */

import React from 'react';
import { usePathname, useSegments } from 'expo-router';

/** must match Stack.Screen `name` values in app/_layout.tsx for routes that cover the tab bar */
const ROOT_STACK_MODAL_ROUTE_NAMES = new Set([
  'task-create',
  'task',
  'activity-log',
  'date-select',
  'time-duration-select',
  'alert-select',
  'list-select',
]);

function isRootStackModalPath(pathname: string | undefined): boolean {
  if (!pathname) return false;
  const head = pathname.split('/').filter(Boolean)[0];
  return ROOT_STACK_MODAL_ROUTE_NAMES.has(head);
}

const TabChromeSuppressContext = React.createContext(false);

export function TabChromeSuppressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = useSegments();
  const suppressed =
    isRootStackModalPath(pathname) ||
    segments.some((s) => ROOT_STACK_MODAL_ROUTE_NAMES.has(s));

  return (
    <TabChromeSuppressContext.Provider value={suppressed}>{children}</TabChromeSuppressContext.Provider>
  );
}

export function useTabChromeSuppressed(): boolean {
  return React.useContext(TabChromeSuppressContext);
}
