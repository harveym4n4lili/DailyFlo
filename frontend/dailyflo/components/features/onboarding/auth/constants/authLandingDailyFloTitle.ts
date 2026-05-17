/**
 * single edit point for the auth landing “DailyFlo” wordmark — copy + color tokens (type metrics: `TextStyles['auth-landing-title']`; face: **Satoshi** via `getSatoshiTypographyStyle` in `@/constants/Typography`).
 *
 * color: `colorToken` is resolved at runtime via `resolveIntroTextColor` (theme slots like `primary` / `secondary`, or brand strings like `plant:700` — see `IntroSlideTextColor` in ./types).
 * wordmark svg plate + accents: `AUTH_LANDING_WORDMARK_MARK_COLOR_TOKEN` (`IntroContinueButtonColorToken` — see ./types).
 * “DailyFlo” headline fill: `AUTH_LANDING_DAILYFLO_TITLE_COLOR_TOKEN` (`IntroSlideTextColor` — see ./types.ts).
 */

import { CHECKBOX_SIZE_TASK_VIEW } from '@/constants/Checkbox';
import { Paddings } from '@/constants/Paddings';

import type { IntroContinueButtonColorToken, IntroSlideTextColor } from './types';

/** wordmark row: svg app mark + title — `AUTH_LANDING_WORDMARK_ICON_SIZE` is width/height in px */
export const AUTH_LANDING_WORDMARK_ICON_SIZE = CHECKBOX_SIZE_TASK_VIEW + 16;

/**
 * plate + accent fills on the landing wordmark svg — any `IntroContinueButtonColorToken` (brand ramps like `'marple:600'`, or `fill`, … — see ./types.ts).
 * edit this only; not tied to `AUTH_PAGE_SLIDE_UI` / continue FAB.
 */
export const AUTH_LANDING_WORDMARK_MARK_COLOR_TOKEN: IntroContinueButtonColorToken = 'marple:500';

/**
 * rounded wrapper around landing svg — fraction of side (iOS app-icon squircle uses ~22.37%).
 * final px: `round(size * ratio)` in `AuthLandingPage`.
 */
export const AUTH_LANDING_WORDMARK_APP_ICON_RADIUS_RATIO = 0.2237;

/** gap between app icon and title — `Paddings.groupedListIconTextSpacing` (icon↔label rhythm; tighter than slide header section gap) */
export const AUTH_LANDING_WORDMARK_ICON_TITLE_GAP = Paddings.groupedListIconTextSpacing;

/**
 * headline text color — any `IntroSlideTextColor` (theme keys like `primary`, or brand tokens like `marple:700` — see ./types.ts).
 * resolved with `resolveIntroTextColor` in `AuthLandingPage`.
 */
export const AUTH_LANDING_DAILYFLO_TITLE_COLOR_TOKEN: IntroSlideTextColor = 'marple:500';

export const AUTH_LANDING_DAILYFLO_TITLE = {
  title: 'dailyflo',
  colorToken: AUTH_LANDING_DAILYFLO_TITLE_COLOR_TOKEN,
};
