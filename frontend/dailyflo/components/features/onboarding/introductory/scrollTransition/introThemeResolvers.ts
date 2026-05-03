/**
 * turns intro config tokens into real colors from `useThemeColors()` — keeps callers free of bracket lookups.
 */

import { useThemeColors } from '@/hooks/useColorPalette';

import type { IntroThemeBackgroundColorKey, IntroThemeTextColorKey } from '../constants';

export function resolveIntroTextColor(
  textColors: ReturnType<typeof useThemeColors>['text'],
  colorKey: IntroThemeTextColorKey,
): string {
  return textColors[colorKey]();
}

export function resolveIntroBackgroundColor(
  background: ReturnType<typeof useThemeColors>['background'],
  colorKey: IntroThemeBackgroundColorKey,
): string {
  return background[colorKey]();
}
