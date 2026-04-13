/**
 * when the liquid tab chrome is enabled, the bottom fade sits in (tabs)/_layout above NativeTabs,
 * so FABs drawn inside a tab screen paint underneath. screens call setTabFabRegistration while focused;
 * TabFabOverlayLayer (same layout, higher z-index) renders the FAB above the fade.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';

export type TabFabRegistration = {
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
  /** optional reanimated opacity (e.g. hide FAB in selection mode) */
  wrapperStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
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
