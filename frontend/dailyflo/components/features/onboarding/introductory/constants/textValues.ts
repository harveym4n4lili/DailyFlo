/**
 * intro funnel — user-visible strings + title typography overrides per slide.
 */

import type { IntroPageTitleConfig } from './types';

/** merges on top of INTRO_CROSSFADE_TITLE_TEXT_STYLE in IntroScrollCrossfadeTitleLayer */
export const INTRO_PAGE_TITLES: readonly IntroPageTitleConfig[] = [
  {
    title: 'Welcome to DailyFlo',
    titleStyle: {
      fontSize: 54,
      fontWeight: 400,
    },
    highlight: {
      text: 'DailyFlo',
      style: {
        fontWeight: 600,
      },
    },
  },
  {
    title: 'Your day on a Timeline',
    titleStyle: {
      fontSize: 54,
      fontWeight: 400,
    },
    highlight: {
      text: 'Timeline',
      style: {
        fontWeight: 600,
      },
    },
  },
  {
    title: 'Build habits \nwith flow',
    titleStyle: {
      fontSize: 54,
      fontWeight: 400,
    },
    highlight: {
      text: 'habits',
      style: {
        fontWeight: 600,
      },
    },
  },
  {
    title: 'Our Copilot, \nyour plan',
    titleStyle: {
      fontSize: 54,
      fontWeight: 400,
    },
    highlight: {
      text: 'Copilot',
      style: {
        fontWeight: 600,
      },
    },
  },
];

/** parallel to carousel pages — empty string means no caption line */
export const INTRO_PAGE_CAPTIONS: readonly string[] = [
  '',
  'See your whole day at a glance and stay focused on what matters most.',
  'Build routines that keep your progress steady every day.',
  '',
];

/** drives dots + pager length — keep aligned with INTRO_PAGE_SLIDE_UI */
export const ONBOARDING_INTRO_PAGE_COUNT = INTRO_PAGE_TITLES.length;
