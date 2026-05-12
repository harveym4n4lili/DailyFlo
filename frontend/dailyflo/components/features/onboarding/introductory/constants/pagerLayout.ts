/**
 * intro funnel — fixed headline block sizing + shared motion timing for dots/FAB.
 */

import { Paddings } from '@/constants/Paddings';

/**
 * space between transparent native header chrome and crossfade titles / shell body top.
 * tighter than `Paddings.screen` so headlines sit closer to dots/skip chrome while clearing `useHeaderHeight()`.
 */
export const INTRO_GAP_BELOW_HEADER = 0;

/** crossfade title stack — paired with INTRO_SUBTEXT_AREA_HEIGHT */
export const INTRO_TITLE_AREA_HEIGHT = 120;

export const INTRO_TITLE_SUBTEXT_GAP = Paddings.touchTarget;

/** stable caption block height when a slide has no caption */
export const INTRO_SUBTEXT_AREA_HEIGHT = 88;

/** spacer inside each swipe page — matches overlay crossfade stack */
export const INTRO_FIXED_HEADLINE_OVERLAY_HEIGHT =
  INTRO_TITLE_AREA_HEIGHT + INTRO_TITLE_SUBTEXT_GAP + INTRO_SUBTEXT_AREA_HEIGHT;

/** ms — easing lives on callers (OnboardingDotIndicator, etc.) */
export const INTRO_CONTROL_TRANSITION_MS = 320;
