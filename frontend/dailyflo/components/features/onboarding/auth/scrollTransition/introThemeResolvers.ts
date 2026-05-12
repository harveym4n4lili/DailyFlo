/**
 * turns intro config tokens into real colors from `useThemeColors()` — keeps callers free of bracket lookups.
 */

import { useThemeColors } from '@/hooks/useColorPalette';
import { resolveBrandStyleToken } from '@/constants/ColorPalette';

import type {
  IntroContinueButtonColorToken,
  IntroSlideBackgroundColor,
  IntroSlideTextColor,
} from '../constants';

// `brand:` / `plant:` / `sage:` / `moss:` strings (see `resolveBrandStyleToken` in ColorPalette) -> hex at parse time.

export function resolveIntroTextColor(
  themeColors: Pick<ReturnType<typeof useThemeColors>, 'text'>,
  colorKey: IntroSlideTextColor,
): string {
  if (typeof colorKey === 'string') {
    const fromBrand = resolveBrandStyleToken(colorKey);
    if (fromBrand !== null) return fromBrand;
  }
  return themeColors.text[colorKey as keyof typeof themeColors.text]();
}

export function resolveIntroBackgroundColor(
  themeColors: Pick<ReturnType<typeof useThemeColors>, 'background'>,
  colorKey: IntroSlideBackgroundColor,
): string {
  if (typeof colorKey === 'string') {
    const fromBrand = resolveBrandStyleToken(colorKey);
    if (fromBrand !== null) return fromBrand;
  }
  return themeColors.background[colorKey as keyof typeof themeColors.background]();
}

type ThemeColorsForContinuePaint = Pick<
  ReturnType<typeof useThemeColors>,
  'primaryButton' | 'interactive' | 'text'
>;

/**
 * continue FAB colors from intro constants —
 * `fill` / `icon` → `primaryButton`; other keys match `interactive.*` or `text.*` (e.g. `primary` → interactive primary);
 * otherwise treated as a literal (`#FFFFFF`, `rgb()`).
 */
export function resolveIntroContinueButtonPaint(
  themeColors: ThemeColorsForContinuePaint,
  value: IntroContinueButtonColorToken,
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

function parseHexRgb(s: string): { r: number; g: number; b: number } | null {
  const h = s.trim();
  if (!h.startsWith('#')) return null;
  const raw = h.slice(1);
  if (raw.length === 3) {
    return {
      r: parseInt(raw[0]! + raw[0]!, 16),
      g: parseInt(raw[1]! + raw[1]!, 16),
      b: parseInt(raw[2]! + raw[2]!, 16),
    };
  }
  if (raw.length === 6) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  if (raw.length === 8) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  return null;
}

/** linear rgb blend for #RGB / #RRGGBB — used while swiping between intro slides */
export function lerpIntroHexColor(from: string, to: string, t: number): string {
  const u = Math.min(Math.max(t, 0), 1);
  const a = parseHexRgb(from);
  const b = parseHexRgb(to);
  if (a && b) {
    const r = Math.round(a.r + (b.r - a.r) * u);
    const g = Math.round(a.g + (b.g - a.g) * u);
    const bl = Math.round(a.b + (b.b - a.b) * u);
    return `#${[r, g, bl].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  }
  return u < 0.5 ? from : to;
}

/** crossfade continue FAB fill + chevron from fractional carousel index (same units as `pageProgress`) */
export function blendIntroContinueButtonColors(
  pageProgress: number,
  fills: readonly string[],
  icons: readonly string[],
): { fill: string; icon: string } {
  const n = fills.length;
  if (n <= 0) return { fill: '', icon: '' };
  const maxPage = n - 1;
  const p = Math.min(Math.max(pageProgress, 0), maxPage);
  const i = Math.min(Math.floor(p), maxPage);
  const t = p - i;
  const j = Math.min(i + 1, maxPage);
  const u = i === j ? 0 : t;
  return {
    fill: lerpIntroHexColor(fills[i]!, fills[j]!, u),
    icon: lerpIntroHexColor(icons[i]!, icons[j]!, u),
  };
}
