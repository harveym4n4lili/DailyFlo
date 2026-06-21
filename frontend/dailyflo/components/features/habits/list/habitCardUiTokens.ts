/**
 * habit card layout tokens — tweak ring + center plus icon on habit screen cards.
 */

import { Paddings } from '@/constants/Paddings';
import {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  type WithTimingConfig,
} from 'react-native-reanimated';

/** diameter (px) of the increment ring on HabitCard */
export const HABIT_CARD_RING_SIZE = 36;

/** ring arc stroke width (px) — track + progress circles */
export const HABIT_CARD_RING_STROKE_WIDTH = 3.75;

/** center plus icon size (px) */
export const HABIT_CARD_PLUS_ICON_SIZE = 16;

/** center tick icon size (px) when habit is complete — slightly larger than plus for legibility */
export const HABIT_CARD_TICK_ICON_SIZE = 20;

/** center plus icon stroke width (px) */
export const HABIT_CARD_PLUS_STROKE_WIDTH = 3.75;

/** simplified card — horizontal progress track under the title row */
export const HABIT_CARD_PROGRESS_BAR_HEIGHT = 8;

export const HABIT_CARD_PROGRESS_BAR_RADIUS = HABIT_CARD_PROGRESS_BAR_HEIGHT / 2;

/** space between header row and body (progress bar or heatmap) — matches grouped-list row rhythm */
export const HABIT_CARD_BODY_TOP_GAP = Paddings.listItemVertical;

/** space between progress bar / heatmap and the expand-minimize switch row */
export const HABIT_CARD_VARIANT_TOGGLE_MARGIN_TOP = Paddings.listItemVertical;

/** fade duration when switching heatmap ↔ simplified card form */
export const HABIT_CARD_VARIANT_FADE_MS = 100;

/** shared linear 200ms — body height, ring fade, layout transition, enter/exit */
export const HABIT_CARD_VARIANT_TIMING_CONFIG: WithTimingConfig = {
  duration: HABIT_CARD_VARIANT_FADE_MS,
  easing: Easing.linear,
};

export const HABIT_CARD_LAYOUT_TRANSITION = LinearTransition.duration(
  HABIT_CARD_VARIANT_FADE_MS,
);

export const HABIT_CARD_VARIANT_ENTERING = FadeIn.duration(
  HABIT_CARD_VARIANT_FADE_MS,
).easing(Easing.linear);

export const HABIT_CARD_VARIANT_EXITING = FadeOut.duration(
  HABIT_CARD_VARIANT_FADE_MS,
).easing(Easing.linear);
