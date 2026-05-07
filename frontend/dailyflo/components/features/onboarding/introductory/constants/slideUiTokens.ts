/**
 * intro funnel — one token row per pager page (background + text/dot/button colors).
 * order must match textValues titles/captions + ScrollView children.
 */

import type { IntroSlideUiConfig } from './types';

export const INTRO_PAGE_SLIDE_UI: readonly IntroSlideUiConfig[] = [
  {
    background: 'plant:800',
    titleColor: 'plant:300',
    titleHighlightColor: 'plant:300',
    captionColor: 'secondary',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:700',
  },
  {
    background: 'moss:800',
    titleColor: 'moss:400',
    titleHighlightColor: 'moss:400',
    captionColor: 'secondary',
    dotIndicatorColor: 'moss:600',
    continueButtonBackground: 'moss:600',
    continueButtonIcon: 'moss:700',
  },
  {
    background: 'sage:800',
    titleColor: 'sage:300',
    titleHighlightColor: 'sage:300',
    captionColor: 'secondary',
    dotIndicatorColor: 'sage:400',
    continueButtonBackground: 'sage:700',
    continueButtonIcon: 'sage:500',
  },
  {
    background: 'plant:800',
    titleColor: 'plant:300',
    titleHighlightColor: 'plant:300',
    captionColor: 'secondary',
    dotIndicatorColor: 'plant:600',
    continueButtonBackground: 'plant:500',
    continueButtonIcon: 'plant:700',
  },
];
