/**
 * questionnaire funnel — baked TextStyles; slides merge theme colors where needed.
 */

import { Platform } from 'react-native';

import { getOnboardingTextStyle, type Platform as TypographyPlatform } from '@/constants/Typography';

import type { OnboardingSlidesSlideTextColor } from './types';

const ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM = Platform.OS as TypographyPlatform;

export const ONBOARDING_SLIDES_SKIP_TEXT_STYLE = getOnboardingTextStyle(
  'body-large',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

export const ONBOARDING_SLIDES_SKIP_TEXT_COLOR: OnboardingSlidesSlideTextColor = 'secondary';

export const ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE = getOnboardingTextStyle(
  'heading-1',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

export const ONBOARDING_SLIDES_CAPTION_TEXT_STYLE = getOnboardingTextStyle(
  'body-large',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

/** primary CTA label — same onboarding rounded/system stack as titles (`Typography.getOnboardingTextStyle`). */
export const ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE = getOnboardingTextStyle(
  'button-primary',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);
