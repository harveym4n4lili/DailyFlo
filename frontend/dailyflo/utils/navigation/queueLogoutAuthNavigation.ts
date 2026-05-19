/**
 * Runs after successful `logoutUser` thunk cleanup (tokens, redux, onboarding flag).
 * Uses expo-router's global `router` + `routingQueue` (flushed from root `_layout.tsx`) —
 * avoids chaining navigation off `useRouter()` while the settings route unmounts.
 */
import { InteractionManager } from 'react-native';

import type { Href } from 'expo-router';
import { router } from 'expo-router';

const TODAY_HREF = '/(tabs)/today' as Href;
const ONBOARDING_AUTH_HREF = '/(onboarding)/auth' as Href;

/** same shape as cold-start onboarding in `app/_layout.tsx` — stagger replace vs push onto separate interaction ticks */
export function queueNavigateToTodayThenAuthLanding(): void {
  void new Promise((resolve) => setTimeout(resolve, 120)).then(() => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        router.replace(TODAY_HREF);
        InteractionManager.runAfterInteractions(() => {
          requestAnimationFrame(() => {
            router.push(ONBOARDING_AUTH_HREF);
          });
        });
      });
    });
  });
}
