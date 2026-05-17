/**
 * auth landing funnel — typescript shapes + theme/brand token unions shared by slide ui tokens.
 */

import {
  PlantBrandColors,
  ThemeColors,
  getMarpleBrandColor,
  getMossBrandColor,
  getPlantBrandColor,
  getSageBrandColor,
} from '@/constants/ColorPalette';

// color keys align with `useThemeColors().text[variant]()` / ThemeColors.light.text
export type IntroThemeTextColorKey = keyof typeof ThemeColors.light.text;

// same pattern for backgrounds
export type IntroThemeBackgroundColorKey = keyof typeof ThemeColors.light.background;

export type IntroBrandColorShade = keyof typeof PlantBrandColors;

// `resolveBrandStyleToken` maps these to hex (`brand:` and `plant:` both use the plant ramp).
export type IntroBrandStyleToken =
  | `brand:${IntroBrandColorShade}`
  | `plant:${IntroBrandColorShade}`
  | `sage:${IntroBrandColorShade}`
  | `marple:${IntroBrandColorShade}`
  | `moss:${IntroBrandColorShade}`;

export type IntroBrandBackgroundToken = IntroBrandStyleToken;
export type IntroBrandTextToken = IntroBrandStyleToken;

export type IntroSlideBackgroundColor = IntroThemeBackgroundColorKey | IntroBrandBackgroundToken;
export type IntroSlideTextColor = IntroThemeTextColorKey | IntroBrandTextToken;

export type IntroThemeTextInvertedColorKey = Extract<IntroThemeTextColorKey, `inverted${string}`>;
export type IntroThemeBackgroundInvertedColorKey = Extract<
  IntroThemeBackgroundColorKey,
  `inverted${string}`
>;

/** background.inverted* names — picking dark bands / elevated cards */
export const AUTH_THEME_BACKGROUND_INVERTED_KEYS = [
  'invertedPrimary',
  'invertedSecondary',
  'invertedTertiary',
  'invertedElevated',
] as const satisfies readonly IntroThemeBackgroundInvertedColorKey[];

/** text.inverted* — use on inverted backgrounds */
export const AUTH_THEME_TEXT_INVERTED_KEYS = [
  'invertedPrimary',
  'invertedSecondary',
  'invertedTertiary',
  'invertedDisabled',
] as const satisfies readonly IntroThemeTextInvertedColorKey[];

export type IntroPrimaryButtonColorKey = keyof typeof ThemeColors.light.primaryButton;
export type IntroThemeInteractiveColorKey = keyof typeof ThemeColors.light.interactive;

export type IntroContinueButtonColorToken =
  | IntroPrimaryButtonColorKey
  | IntroThemeInteractiveColorKey
  | IntroSlideTextColor
  | IntroThemeBackgroundColorKey
  | string;

/** direct brand hex accents for illustration layers — not theme slots. */
export const AUTH_BRAND_COLORS = {
  plant: {
    accent: getPlantBrandColor(500),
    soft: getPlantBrandColor(200),
  },
  sage: {
    accent: getSageBrandColor(500),
    soft: getSageBrandColor(200),
  },
  marple: {
    accent: getMarpleBrandColor(500),
    soft: getMarpleBrandColor(200),
  },
  moss: {
    accent: getMossBrandColor(500),
    soft: getMossBrandColor(200),
  },
} as const;

/** single-row landing screen palette — lives in slideUiTokens.ts (wordmark typography/color: authLandingDailyFloTitle.ts) */
export type AuthSlideUiConfig = {
  background: IntroSlideBackgroundColor;
  continueButtonBackground: IntroContinueButtonColorToken;
  /** optional — landing route uses `background` for FAB icon stroke so it always matches the page surface */
  continueButtonIcon?: IntroContinueButtonColorToken;
};
