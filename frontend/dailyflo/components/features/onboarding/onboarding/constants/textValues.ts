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
      text: 'wake',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
    },
  },
  {
    title: 'What time do you sleep?',
    highlight: {
      text: 'sleep',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
    },
  },
  {
    title: 'Are you making a task or a habit?',
    highlight: {
      text: 'habit',
      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,
    },
  },
];

export const ONBOARDING_SLIDES_PAGE_CAPTIONS: readonly string[] = [
  'A couple of quick choices help DailyFlo line up your day with how you actually work.',
  "We'll anchor your timeline around when your morning usually begins.",
  'Wind-down time keeps evening blocks and reminders feeling realistic.',
  'Tasks are one-off to-dos; habits are things you want to repeat — you can tune both anytime.',
];

/** bottom CTA — same label every step; screen readers still get the longer a11y hint on the last step. */
export const ONBOARDING_SLIDES_CONTINUE_LABEL = 'Continue';

export const ONBOARDING_SLIDES_PAGE_COUNT = ONBOARDING_SLIDES_PAGE_TITLES.length;
