/**
 * auth landing — typography tokens + helpers (`constants/Typography.ts` still owns the underlying `TextStyles` keys).
 * tuning: change `AUTH_LANDING_SLOGAN_MIDDLE_TEXT_STYLE` / overrides below; satoshi headline lives in `@/constants/Typography` (`getAuthLandingPageTitleTextStyle`).
 */

import type { TextStyle } from 'react-native';
import { Platform } from 'react-native';

import {
  getOnboardingTextStyle,
  getTypographyStyle,
  type Platform as TypographyPlatform,
  type TextStyleName,
} from '@/constants/Typography';
/** resolved from `RNPlatform.OS` for modules that do not have a component `Platform` hook */
export const AUTH_LANDING_TYPOGRAPHY_PLATFORM = Platform.OS as TypographyPlatform;

/**
 * middle phrase — `TextStyles` key in `constants/Typography.ts` (`auth-landing-middle-custom`, `heading-2`, …).
 * `getAuthLandingSloganMiddleTextStyle` merges onboarding vs inter face, then applies overrides below.
 */
export const AUTH_LANDING_SLOGAN_MIDDLE_TEXT_STYLE: TextStyleName = 'auth-landing-middle-custom';

/**
 * merged after the resolved middle style (wins over token + resolver). keep `{}` when Typography alone is enough.
 */
export const AUTH_LANDING_SLOGAN_MIDDLE_STYLE_OVERRIDES: Partial<TextStyle> = {
  fontSize: 38,
};

/**
 * true → `getOnboardingTextStyle` (sf pro rounded stack — same as questionnaire titles).
 * false → `getTypographyStyle` (inter from `useFonts` — main app body stack).
 */
export const AUTH_LANDING_SLOGAN_MIDDLE_USE_ONBOARDING_FACE = true;

/** baked middle-line `TextStyle` for the current platform — use inside `useMemo` when the platform value is dynamic (e.g. web) */
export function getAuthLandingSloganMiddleTextStyle(platform: TypographyPlatform): TextStyle {
  const base = AUTH_LANDING_SLOGAN_MIDDLE_USE_ONBOARDING_FACE
    ? getOnboardingTextStyle(AUTH_LANDING_SLOGAN_MIDDLE_TEXT_STYLE, platform)
    : getTypographyStyle(AUTH_LANDING_SLOGAN_MIDDLE_TEXT_STYLE, platform);
  return { ...base, ...AUTH_LANDING_SLOGAN_MIDDLE_STYLE_OVERRIDES };
}
