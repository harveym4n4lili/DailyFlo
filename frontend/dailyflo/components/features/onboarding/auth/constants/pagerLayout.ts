/**
 * auth landing — spacing + non-color chrome sizing (questionnaire keeps similar layout-only values in `pagerLayout.ts`).
 */

import { CHECKBOX_SIZE_TASK_VIEW } from '@/constants/Checkbox';

/** aligns body top with questionnaire when both use the same gap constant */
export const AUTH_GAP_BELOW_HEADER = 0;

/** wordmark tile next to **to you.** — passed to `AuthLandingWordmarkIcon` */
export const AUTH_LANDING_WORDMARK_ICON_SIZE = CHECKBOX_SIZE_TASK_VIEW + 8;

export const AUTH_LANDING_WORDMARK_APP_ICON_RADIUS_RATIO = 0.2237;
