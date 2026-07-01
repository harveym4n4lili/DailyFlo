/**
 * liquid tab strip + bottom fade sit above tab scenes; the overlay FAB must register here so it paints above that fade.
 * focused screens call setTabFabRegistration; blur cleanup sets null (FAB stays mounted, just hidden).
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export type TabFabRegistration = {
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
  /** optional shared opacity (e.g. hide FAB in selection mode) — animated inside TabFabOverlayLayer */
  fabOpacity?: SharedValue<number>;
  /** when true, the chrome zone ignores touches (e.g. FAB visually hidden) */
  pointerEventsBlocked?: boolean;
};

type TabFabOverlayContextValue = {
  registration: TabFabRegistration | null;
  setTabFabRegistration: (next: TabFabRegistration | null) => void;
};

const TabFabOverlayContext = createContext<TabFabOverlayContextValue | null>(null);

export function TabFabOverlayProvider({ children }: { children: React.ReactNode }) {
  const [registration, setRegistration] = useState<TabFabRegistration | null>(null);
  const setTabFabRegistration = useCallback((next: TabFabRegistration | null) => {
    setRegistration(next);
  }, []);
  const value = useMemo(
    () => ({ registration, setTabFabRegistration }),
    [registration, setTabFabRegistration]
  );
  return <TabFabOverlayContext.Provider value={value}>{children}</TabFabOverlayContext.Provider>;
}

export function useTabFabOverlay() {
  const ctx = useContext(TabFabOverlayContext);
  if (!ctx) {
    throw new Error('useTabFabOverlay must be used within TabFabOverlayProvider');
  }
  return ctx;
}
