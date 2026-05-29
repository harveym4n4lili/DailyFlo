/**
 * cold-start: push the user's first navbar tab when NativeTabs lands on Today,
 * and keep a full-screen overlay up until the primary tab is active (hides the Today flash).
 */

import { useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import { router, useSegments, type Href } from 'expo-router';

import { useAppSelector } from '@/store';
import type { NavTabKey } from '@/components/features/settings/navigation/navigationTabRegistry';
import {
  resolveNavTabOrderForBootstrap,
  resolvePrimaryNavTabHref,
} from '@/components/features/settings/navigation/navigationPreferenceUtils';
import { loadPersistedNavTabOrder } from '@/utils/navigation/navigationTabOrderStorage';

const PLANNER_NESTED_TAB_SEGMENTS = new Set(['month-select']);

function activeTabKeyFromSegments(
  segments: readonly string[],
  tabKeys: NavTabKey[],
): NavTabKey | undefined {
  const direct = tabKeys.find((k) => segments.includes(k));
  if (direct) return direct;
  if (segments.some((s) => PLANNER_NESTED_TAB_SEGMENTS.has(s))) return 'planner';
  return undefined;
}

export function usePrimaryTabColdStartNavigation() {
  const segments = useSegments();
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const navPrefs = useAppSelector((s) => s.auth.user?.preferences?.navigationPreferences);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const hasPushedRef = useRef(false);
  const cachedOrderRef = useRef<NavTabKey[] | null>(null);
  const [cacheReady, setCacheReady] = useState(false);
  // overlay is cold-start only — once bootstrap finishes, never block tab switches
  const [coldStartComplete, setColdStartComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadPersistedNavTabOrder(userId).then((order) => {
      if (cancelled) return;
      cachedOrderRef.current = order;
      setCacheReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const order = resolveNavTabOrderForBootstrap(navPrefs, cachedOrderRef.current);
  const primaryKey = order[0];
  const activeKey = activeTabKeyFromSegments(segments, order);

  useEffect(() => {
    if (coldStartComplete || isLoading || !cacheReady) return;

    if (!isAuthenticated || primaryKey === 'today') {
      setColdStartComplete(true);
      return;
    }

    if (activeKey === primaryKey) {
      setColdStartComplete(true);
    }
  }, [
    activeKey,
    cacheReady,
    coldStartComplete,
    isAuthenticated,
    isLoading,
    primaryKey,
  ]);

  // cover Today while auth loads or until the first navigation to the primary tab finishes
  const isBootOverlayVisible =
    !coldStartComplete &&
    (isLoading ||
      (isAuthenticated &&
        cacheReady &&
        primaryKey !== 'today' &&
        activeKey !== primaryKey));

  useEffect(() => {
    if (isLoading || !isAuthenticated || !cacheReady) return;

    const resolvedOrder = resolveNavTabOrderForBootstrap(navPrefs, cachedOrderRef.current);
    const resolvedPrimaryKey = resolvedOrder[0];
    const resolvedActiveKey = activeTabKeyFromSegments(segments, resolvedOrder);
    const primaryHref = resolvePrimaryNavTabHref(
      navPrefs?.tabOrder?.length ? navPrefs : { tabOrder: resolvedOrder },
    ) as Href;

    if (resolvedActiveKey === resolvedPrimaryKey) return;
    if (hasPushedRef.current) return;

    hasPushedRef.current = true;
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        router.push(primaryHref);
      });
    });
  }, [cacheReady, isAuthenticated, isLoading, navPrefs, primaryKey, segments]);

  return { isBootOverlayVisible };
}
