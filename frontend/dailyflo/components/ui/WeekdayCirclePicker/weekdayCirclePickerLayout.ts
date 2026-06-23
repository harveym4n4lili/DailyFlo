/**
 * layout tokens for WeekdayCirclePicker — mirrors duration slider row height + inner horizontal pad.
 */

import { Paddings } from '@/constants/Paddings';
import { FontWeight, getTextStyle } from '@/constants/Typography';
import {
  ONBOARDING_DURATION_SLIDER_THUMB_HEIGHT_PX,
  ONBOARDING_DURATION_SLIDER_TRACK_HEIGHT_PX,
} from '@/components/features/onboarding/onboarding/constants/pagerLayout';
import type { TextStyle } from 'react-native';

/** row height — same 52px band as duration slider (circles centered inside) */
export const WEEKDAY_PICKER_TRACK_HEIGHT = ONBOARDING_DURATION_SLIDER_TRACK_HEIGHT_PX;

/** circle diameter — same as duration slider thumb height (44px) */
export const WEEKDAY_PICKER_CIRCLE_SIZE = ONBOARDING_DURATION_SLIDER_THUMB_HEIGHT_PX;

/** horizontal breathing room inside the grouped card — same as slider `innerPad` */
export const WEEKDAY_PICKER_INNER_PAD_HORIZONTAL = Paddings.touchTargetSmall;

/** day letter style — body-medium + semibold */
export const WEEKDAY_CIRCLE_PICKER_LETTER_TEXT_STYLE: TextStyle = {
  ...getTextStyle('body-medium'),
  fontWeight: FontWeight.semibold,
  textAlign: 'center',
  includeFontPadding: false,
};
