/**
 * mounted once under root `ThemeProvider` — no visible ui.
 *
 * why: cold start already runs `checkAuthStatus` in `app/_layout.tsx`; this listens for
 * `AppState` → `active` (user returns from background) and re-runs the same thunk so
 * securestore tokens + redux `auth` stay aligned without blocking the stack.
 */

import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { store } from '@/store';
import { checkAuthStatus } from '@/store/slices/auth/authSlice';
import { isAuthBootstrapComplete } from '@/utils/navigation/authBootstrapState';

export function AuthSessionGate() {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      // cold start already runs checkAuthStatus in _layout — skip until that finishes to avoid double refresh
      if (
        prev.match(/inactive|background/) &&
        nextState === 'active' &&
        isAuthBootstrapComplete()
      ) {
        void store.dispatch(checkAuthStatus());
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  return null;
}
