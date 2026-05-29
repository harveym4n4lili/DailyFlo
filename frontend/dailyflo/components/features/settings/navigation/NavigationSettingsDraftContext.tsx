/**
 * Shared draft state for navigation settings screens (Navigation + Tab Bar options).
 * Tab Bar options reads/writes draftOrder here so adds persist when the user slides back.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store';
import { patchUserNavigationPreferences } from '@/store/slices/auth/authSlice';

import { PINNED_NAV_TAB, type NavTabKey } from './navigationTabRegistry';
import {
  navTabOrdersEqual,
  normalizeNavTabOrder,
  resolveNavTabOrderFromPreferences,
} from './navigationPreferenceUtils';

type NavigationSettingsDraftContextValue = {
  draftOrder: NavTabKey[];
  setDraftOrder: React.Dispatch<React.SetStateAction<NavTabKey[]>>;
  committedOrder: NavTabKey[];
  setCommittedOrder: React.Dispatch<React.SetStateAction<NavTabKey[]>>;
  hasChanges: boolean;
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  /** append a tab key to the draft navbar order (Tab Bar options screen) */
  addTabToDraft: (key: NavTabKey) => void;
  /** persist draft to the server when leaving navigation settings — no-op if unchanged */
  saveDraftIfNeeded: () => Promise<boolean>;
  isSaving: boolean;
};

const NavigationSettingsDraftContext = createContext<NavigationSettingsDraftContextValue | null>(
  null
);

export function NavigationSettingsDraftProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const savedPrefs = useAppSelector((s) => s.auth.user?.preferences?.navigationPreferences);
  const isSaving = useAppSelector((s) => s.auth.isUpdatingProfile);
  const savedOrder = useMemo(
    () => resolveNavTabOrderFromPreferences(savedPrefs),
    [savedPrefs]
  );

  const [committedOrder, setCommittedOrder] = useState<NavTabKey[]>(savedOrder);
  const [draftOrder, setDraftOrder] = useState<NavTabKey[]>(savedOrder);
  const [isEditMode, setIsEditMode] = useState(false);
  // dedupe concurrent save calls (back button + swipe-back can fire together)
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);

  // hydrate from redux when saved prefs change (after a successful save or account switch)
  useEffect(() => {
    setCommittedOrder(savedOrder);
    setDraftOrder(savedOrder);
  }, [savedOrder]);

  const hasChanges = useMemo(
    () => !navTabOrdersEqual(draftOrder, committedOrder),
    [draftOrder, committedOrder]
  );

  const addTabToDraft = useCallback((key: NavTabKey) => {
    setDraftOrder((prev) => normalizeNavTabOrder([...prev, key]));
  }, []);

  const saveDraftIfNeeded = useCallback(async (): Promise<boolean> => {
    if (saveInFlightRef.current) {
      return saveInFlightRef.current;
    }

    const normalized = normalizeNavTabOrder(draftOrder);
    if (navTabOrdersEqual(normalized, committedOrder)) return true;

    const savePromise = (async (): Promise<boolean> => {
      try {
        await dispatch(
          patchUserNavigationPreferences({
            tabOrder: normalized,
            pinnedTab: PINNED_NAV_TAB,
          })
        ).unwrap();
        // mark draft as saved locally so hasChanges clears before redux re-renders
        setCommittedOrder(normalized);
        return true;
      } catch (err) {
        Alert.alert(
          'Could not save',
          typeof err === 'string' ? err : 'Navigation settings could not be saved. Try again.'
        );
        return false;
      } finally {
        saveInFlightRef.current = null;
      }
    })();

    saveInFlightRef.current = savePromise;
    return savePromise;
  }, [committedOrder, dispatch, draftOrder]);

  const value = useMemo(
    () => ({
      draftOrder,
      setDraftOrder,
      committedOrder,
      setCommittedOrder,
      hasChanges,
      isEditMode,
      setIsEditMode,
      addTabToDraft,
      saveDraftIfNeeded,
      isSaving,
    }),
    [
      addTabToDraft,
      committedOrder,
      draftOrder,
      hasChanges,
      isEditMode,
      isSaving,
      saveDraftIfNeeded,
    ]
  );

  return (
    <NavigationSettingsDraftContext.Provider value={value}>
      {children}
    </NavigationSettingsDraftContext.Provider>
  );
}

export function useNavigationSettingsDraft() {
  const ctx = useContext(NavigationSettingsDraftContext);
  if (!ctx) {
    throw new Error('useNavigationSettingsDraft must be used within NavigationSettingsDraftProvider');
  }
  return ctx;
}
