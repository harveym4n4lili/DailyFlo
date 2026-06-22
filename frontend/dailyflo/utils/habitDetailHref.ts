/**
 * builds the expo-router href for opening a habit detail sheet (root /habit/[habitId] formSheet).
 * use this from habits tab, today section, etc. so every entry point lands on the same modal route.
 */

import type { Href } from 'expo-router';

export function habitDetailHref(habitId: string): Href {
  return {
    pathname: '/habit/[habitId]',
    params: { habitId },
  } as Href;
}
