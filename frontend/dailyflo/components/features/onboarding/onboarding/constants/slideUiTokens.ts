/**
 * questionnaire — one token row per step (order matches `textValues` titles/captions).
 *
 * theme words vs brand ramps:
 * - `primary` / `secondary` on backgrounds, borders, text = app theme slots (not plant/moss/sage).
 * - `plant:500`, `moss:600`, `sage:300`, … = explicit ramps from ColorPalette (same strings as intro).
 *
 * progress bar: use a light brand shade for the unfilled track and a stronger shade for fill
 * (resolver tries brand strings first, then theme.border.*, then theme text).
 */

import type { OnboardingSlidesSlideUiConfig } from './types';

export const ONBOARDING_SLIDES_PAGE_SLIDE_UI: readonly OnboardingSlidesSlideUiConfig[] = [
  {
    background: 'primary',
    titleColor: 'moss:800',
    titleHighlightColor: 'moss:800',
    captionColor: 'secondary',
    dotIndicatorColor: 'moss:600',
    continueButtonBackground: 'moss:800',
    continueButtonIcon: 'moss:200',
    progressBarTrack: 'secondary',
    progressBarFill: 'moss:500',
    headerBackIconColor: 'moss:800',
  },
  {
    background: 'primary',
    titleColor: 'sage:800',
    titleHighlightColor: 'sage:800',
    captionColor: 'secondary',
    dotIndicatorColor: 'sage:600',
    continueButtonBackground: 'sage:800',
    continueButtonIcon: 'sage:200',
    progressBarTrack: 'secondary',
    progressBarFill: 'sage:500',
    headerBackIconColor: 'sage:800',
  },
  {
    background: 'primary',
    titleColor: 'plant:800',
    titleHighlightColor: 'plant:800',
    captionColor: 'secondary',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:800',
    continueButtonIcon: 'plant:200',
    progressBarTrack: 'secondary',
    progressBarFill: 'plant:500',
    headerBackIconColor: 'plant:800',
  },
  {
    background: 'primary',
    titleColor: 'moss:800',
    titleHighlightColor: 'moss:800',
    captionColor: 'secondary',
    dotIndicatorColor: 'moss:600',
    continueButtonBackground: 'moss:800',
    continueButtonIcon: 'moss:200',
    progressBarTrack: 'secondary',
    progressBarFill: 'moss:500',
    headerBackIconColor: 'moss:800',
  },
];
