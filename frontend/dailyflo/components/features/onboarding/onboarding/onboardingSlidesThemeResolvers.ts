/**
 * maps questionnaire slide text tokens to `useThemeColors().text` — same rules as auth `resolveIntroTextColor`.
 */

import { resolveBrandStyleToken } from '@/constants/ColorPalette';
import { useThemeColors } from '@/hooks/useColorPalette';

import { lerpIntroHexColor } from '../auth/scrollTransition/introThemeResolvers';

import type {
  OnboardingSlidesContinueButtonColorToken,
  OnboardingSlidesProgressTrackToken,
  OnboardingSlidesSlideBackgroundColor,
  OnboardingSlidesSlideTextColor,
} from './constants/types';

type ThemeColorsForContinuePaint = Pick<
  ReturnType<typeof useThemeColors>,
  'primaryButton' | 'interactive' | 'text'
>;

type ThemeColorsForProgressTrack = Pick<ReturnType<typeof useThemeColors>, 'border' | 'text'>;

/** page background — `plant:800` etc. via ColorPalette, or `primary` / `invertedPrimary` theme slots (same as auth landing). */
export function resolveOnboardingSlidesBackgroundColor(
  themeColors: Pick<ReturnType<typeof useThemeColors>, 'background'>,
  colorKey: OnboardingSlidesSlideBackgroundColor,
): string {
  if (typeof colorKey === 'string') {
    const fromBrand = resolveBrandStyleToken(colorKey);
    if (fromBrand !== null) return fromBrand;
  }
  return themeColors.background[colorKey as keyof typeof themeColors.background]();
}

/**
 * header progress track — brand strings first, then `theme.border.*`, then `resolveOnboardingSlidesTextColor`.
 */
export function resolveOnboardingSlidesProgressTrackColor(
  themeColors: ThemeColorsForProgressTrack,
  token: OnboardingSlidesProgressTrackToken,
): string {
  if (typeof token === 'string') {
    const fromBrand = resolveBrandStyleToken(token);
    if (fromBrand !== null) return fromBrand;
  }
  const bk = token as keyof typeof themeColors.border;
  if (bk in themeColors.border) {
    const fn = themeColors.border[bk];
    if (typeof fn === 'function') {
      return (fn as () => string)();
    }
  }
  return resolveOnboardingSlidesTextColor(themeColors, token as OnboardingSlidesSlideTextColor);
}

/**
 * continue FAB tokens from questionnaire slide rows — same resolution rules as auth `resolveIntroContinueButtonPaint`.
 */
export function resolveOnboardingSlidesContinueButtonPaint(
  themeColors: ThemeColorsForContinuePaint,
  value: OnboardingSlidesContinueButtonColorToken,
): string {
  if (typeof value === 'string') {
    const fromBrand = resolveBrandStyleToken(value);
    if (fromBrand !== null) return fromBrand;
  }
  if (value === 'fill' || value === 'icon') {
    return themeColors.primaryButton[value]();
  }
  const ik = value as keyof typeof themeColors.interactive;
  if (ik in themeColors.interactive) {
    const fn = themeColors.interactive[ik];
    if (typeof fn === 'function') {
      return (fn as () => string)();
    }
  }
  const tk = value as keyof typeof themeColors.text;
  if (tk in themeColors.text) {
    const fn = themeColors.text[tk];
    if (typeof fn === 'function') {
      return (fn as () => string)();
    }
  }
  return value;
}

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

/** rgb crossfade between adjacent slides — same math as intro `blendIntroContinueButtonColors` / scroll crossfade */
export function blendOnboardingSlidesColorAtProgress(
  pageProgress: number,
  colors: readonly string[],
): string {
  const n = colors.length;
  if (n <= 0) return '';
  const maxPage = n - 1;
  if (maxPage <= 0) return colors[0] ?? '';
  const p = Math.min(Math.max(pageProgress, 0), maxPage);
  const i = Math.min(Math.floor(p), maxPage);
  const t = p - i;
  const j = Math.min(i + 1, maxPage);
  const u = i === j ? 0 : t;
  return lerpIntroHexColor(colors[i]!, colors[j]!, u);
}
