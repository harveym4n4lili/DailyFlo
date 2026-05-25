/**
 * maps questionnaire slide text tokens to `useThemeColors().text` — same rules as auth `resolveIntroTextColor`.
 */

import { resolveBrandStyleToken } from '@/constants/ColorPalette';
import { useThemeColors } from '@/hooks/useColorPalette';

import { lerpIntroHexColor } from '../auth/scrollTransition/introThemeResolvers';

import type {
  OnboardingSlidesBorderColorToken,
  OnboardingSlidesColorScope,
  OnboardingSlidesContinueButtonColorToken,
  OnboardingSlidesProgressTrackToken,
  OnboardingSlidesScopedProgressTrackColor,
  OnboardingSlidesScopedSlideColor,
  OnboardingSlidesSlideBackgroundColor,
  OnboardingSlidesSlideTextColor,
  OnboardingSlidesSlideUiColorInput,
  OnboardingSlidesSlideUiProgressTrackInput,
} from './constants/types';

/** full questionnaire theme handle — needed so scoped colors can call any resolver */
export type OnboardingSlideThemeColors = ReturnType<typeof useThemeColors>;

type ThemeColorsForContinuePaint = Pick<
  OnboardingSlideThemeColors,
  'primaryButton' | 'interactive' | 'text'
>;

type ThemeColorsForProgressTrack = Pick<OnboardingSlideThemeColors, 'border' | 'text' | 'background'>;

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

export function resolveOnboardingSlidesBorderColor(
  themeColors: Pick<ReturnType<typeof useThemeColors>, 'border'>,
  colorKey: OnboardingSlidesBorderColorToken,
): string {
  if (typeof colorKey === 'string') {
    const fromBrand = resolveBrandStyleToken(colorKey);
    if (fromBrand !== null) return fromBrand;
  }
  return themeColors.border[colorKey as keyof typeof themeColors.border]();
}

export function isOnboardingSlidesScopedSlideColor(v: unknown): v is OnboardingSlidesScopedSlideColor {
  if (typeof v !== 'object' || v === null) return false;
  if (!('scope' in v) || !('token' in v)) return false;
  const s = (v as { scope: unknown }).scope;
  return s === 'background' || s === 'text' || s === 'button' || s === 'border';
}

/** track row objects — four chrome scopes or `{ scope: 'track', token: 'primarySecondaryBlend' }` */
export function isOnboardingSlidesScopedProgressTrackColor(v: unknown): v is OnboardingSlidesScopedProgressTrackColor {
  if (typeof v !== 'object' || v === null || !('scope' in v) || !('token' in v)) return false;
  const o = v as { scope: unknown; token: unknown };
  if (o.scope === 'track') {
    return o.token === 'primarySecondaryBlend';
  }
  return isOnboardingSlidesScopedSlideColor(v);
}

/**
 * resolves a slide UI color — plain string uses `defaultScope`’s resolver; `{ scope, token }` picks background / text / button / border explicitly.
 */
export function resolveOnboardingSlidesSlideUiField(
  themeColors: OnboardingSlideThemeColors,
  input: OnboardingSlidesSlideUiColorInput,
  defaultScope: OnboardingSlidesColorScope,
): string {
  if (isOnboardingSlidesScopedSlideColor(input)) {
    switch (input.scope) {
      case 'background':
        return resolveOnboardingSlidesBackgroundColor(themeColors, input.token);
      case 'text':
        return resolveOnboardingSlidesTextColor(themeColors, input.token);
      case 'button':
        return resolveOnboardingSlidesContinueButtonPaint(themeColors, input.token);
      case 'border':
        return resolveOnboardingSlidesBorderColor(themeColors, input.token);
    }
  }
  switch (defaultScope) {
    case 'background':
      return resolveOnboardingSlidesBackgroundColor(themeColors, input as OnboardingSlidesSlideBackgroundColor);
    case 'text':
      return resolveOnboardingSlidesTextColor(themeColors, input as OnboardingSlidesSlideTextColor);
    case 'button':
      return resolveOnboardingSlidesContinueButtonPaint(
        themeColors,
        input as OnboardingSlidesContinueButtonColorToken,
      );
    case 'border':
      return resolveOnboardingSlidesBorderColor(themeColors, input as OnboardingSlidesBorderColorToken);
  }
}

export function resolveOnboardingSlidesSlideUiBackground(
  themeColors: OnboardingSlideThemeColors,
  input: OnboardingSlidesSlideUiColorInput,
): string {
  return resolveOnboardingSlidesSlideUiField(themeColors, input, 'background');
}

export function resolveOnboardingSlidesSlideUiText(
  themeColors: OnboardingSlideThemeColors,
  input: OnboardingSlidesSlideUiColorInput,
): string {
  return resolveOnboardingSlidesSlideUiField(themeColors, input, 'text');
}

export function resolveOnboardingSlidesSlideUiButton(
  themeColors: OnboardingSlideThemeColors,
  input: OnboardingSlidesSlideUiColorInput,
): string {
  return resolveOnboardingSlidesSlideUiField(themeColors, input, 'button');
}

/**
 * header progress track — `primarySecondaryBlend` / `{ scope: 'track', token: 'primarySecondaryBlend' }` lerps theme page backgrounds; scoped `{ scope, token }` uses the same resolver as other chrome; legacy plain strings keep border → text fallback.
 */
export function resolveOnboardingSlidesProgressTrackColor(
  themeColors: OnboardingSlideThemeColors,
  token: OnboardingSlidesSlideUiProgressTrackInput,
): string {
  if (isOnboardingSlidesScopedProgressTrackColor(token)) {
    if (token.scope === 'track') {
      const narrowTheme = themeColors as ThemeColorsForProgressTrack;
      // empty header segment — mid-tone between the two page background slots (same as intro questionnaire header)
      return lerpIntroHexColor(
        narrowTheme.background.primary(),
        narrowTheme.background.secondary(),
        0.5,
      );
    }
    return resolveOnboardingSlidesSlideUiField(themeColors, token, 'border');
  }
  const trackToken = token as OnboardingSlidesProgressTrackToken;
  const narrowTheme = themeColors as ThemeColorsForProgressTrack;

  if (trackToken === 'primarySecondaryBlend') {
    // legacy string — same lerp as `scope: 'track'`
    return lerpIntroHexColor(
      narrowTheme.background.primary(),
      narrowTheme.background.secondary(),
      0.5,
    );
  }
  if (typeof trackToken === 'string') {
    const fromBrand = resolveBrandStyleToken(trackToken);
    if (fromBrand !== null) return fromBrand;
  }
  const bk = trackToken as keyof typeof narrowTheme.border;
  if (bk in narrowTheme.border) {
    const fn = narrowTheme.border[bk];
    if (typeof fn === 'function') {
      return (fn as () => string)();
    }
  }
  return resolveOnboardingSlidesTextColor(narrowTheme, trackToken as OnboardingSlidesSlideTextColor);
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
