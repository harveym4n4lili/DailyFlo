/**
 * questionnaire funnel — titles/captions per slide (merged onto typography.ts headline styles).
 */

import type { TextStyle } from 'react-native';

import { FontWeight } from '@/constants/Typography';

import type { OnboardingSlidesPageTitleConfig } from './types';

const ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE: TextStyle = {
  fontWeight: FontWeight.bold,
};

export const ONBOARDING_SLIDES_PAGE_TITLES: readonly OnboardingSlidesPageTitleConfig[] = [
  {
    title: 'Start planning your day...',
    highlight: {
      text: 'planning',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
    },
  },
  {
    title: 'What time do you wake up?',
    highlight: {
      text: 'wake up',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
    },
  },
  {
    title: 'When do you go to sleep?',
    highlight: {
      text: 'go to sleep?',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
    },
  },
  {
    title: 'Pick your next step.',
    highlight: {
      text: 'habit',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
    },
  },
];

export const ONBOARDING_SLIDES_PAGE_CAPTIONS: readonly string[] = [
  'Just a few steps to get you started.',
  "DailyFlo will anchor your timeline around your mornings.",
  'Having a sleep schedule helps your body and mind.',
  '',
];

/** bottom CTA — same label every step; screen readers still get the longer a11y hint on the last step. */
export const ONBOARDING_SLIDES_CONTINUE_LABEL = 'Continue';

export const ONBOARDING_SLIDES_PAGE_COUNT = ONBOARDING_SLIDES_PAGE_TITLES.length;

/** wake question slide — matches order of `ONBOARDING_SLIDES_PAGE_TITLES` */
export const ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX = 1;
/** sleep question slide */
export const ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX = 2;
