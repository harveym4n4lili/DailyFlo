/**
 * measured height of the liquid-glass custom tab strip (when native tabs are hidden) —
 * FloatingActionButton reads this so its circle matches that height.
 */

import React from 'react';

type CustomTabNavMetricsValue = {
  measuredNavBarHeight: number | null;
  setMeasuredNavBarHeight: (h: number | null) => void;
};

const CustomTabNavMetricsContext = React.createContext<CustomTabNavMetricsValue | null>(null);

export function CustomTabNavMetricsProvider({ children }: { children: React.ReactNode }) {
  const [measuredNavBarHeight, setMeasuredNavBarHeight] = React.useState<number | null>(null);
  const value = React.useMemo(
    () => ({ measuredNavBarHeight, setMeasuredNavBarHeight }),
    [measuredNavBarHeight]
  );
  return (
    <CustomTabNavMetricsContext.Provider value={value}>{children}</CustomTabNavMetricsContext.Provider>
  );
}

/** returns null height when provider missing (e.g. tests) — FAB falls back to default size */
export function useCustomTabNavMetrics(): CustomTabNavMetricsValue {
  const ctx = React.useContext(CustomTabNavMetricsContext);
  if (!ctx) {
    return {
      measuredNavBarHeight: null,
      setMeasuredNavBarHeight: () => {},
    };
  }
  return ctx;
}
