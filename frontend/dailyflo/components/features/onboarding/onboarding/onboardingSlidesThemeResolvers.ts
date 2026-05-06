/**
 * maps questionnaire slide text tokens to `useThemeColors().text` — same rules as introductory `resolveIntroTextColor`.
 */

import { resolveBrandStyleToken } from '@/constants/ColorPalette';
import { useThemeColors } from '@/hooks/useColorPalette';

import type { OnboardingSlidesSlideTextColor } from './constants/onboardingSlidesConstants';

export function resolveOnboardingSlidesTextColor(
  themeColors: Pick<ReturnType<typeof useThemeColors>, 'text'>,
  colorKey: OnboardingSlidesSlideTextColor,
): string {
  if (typeof colorKey === 'string') {
    const fromBrand = resolveBrandStyleToken(colorKey);
    if (fromBrand !== null) return fromBrand;
  }
  return themeColors.text[colorKey as keyof typeof themeColors.text]();
}
