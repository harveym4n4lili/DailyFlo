/**
 * questionnaire funnel — all baked slide `TextStyle`s live here; `slideUiTokens.ts` holds colors only.
 *
 * title line: `ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE_NAME` + `…_OVERRIDES` — `OnboardingQuestionnaireHeadlineCrossfade`.
 * highlight span shares title weight; color from `slideUi.titleHighlightColor`.
 */

import type { TextStyle } from 'react-native';
import { Platform } from 'react-native';

import {
  getOnboardingTextStyle,
  type Platform as TypographyPlatform,
  type TextStyleName,
} from '@/constants/Typography';

import type { OnboardingSlidesSlideTextColor } from './types';

const ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM = Platform.OS as TypographyPlatform;

export const ONBOARDING_SLIDES_SKIP_TEXT_STYLE = getOnboardingTextStyle(
  'body-large',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

export const ONBOARDING_SLIDES_SKIP_TEXT_COLOR: OnboardingSlidesSlideTextColor = 'secondary';

/**
 * which shared `TextStyles` token becomes slide titles (`getOnboardingTextStyle` → SF Pro Rounded on ios, etc.).
 * change to `'heading-2'`, `'heading-3'`, or any key in `constants/Typography` `TextStyles`.
 */
export const ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE_NAME: TextStyleName = 'heading-1';

/**
 * optional — merged on top of the resolved title style (fontSize, lineHeight, letterSpacing …) for funnel-only nudges.
 */
export const ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE_OVERRIDES: Partial<TextStyle> = {
  fontWeight: 600,
};

export const ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE = {
  ...getOnboardingTextStyle(ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE_NAME, ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM),
  ...ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE_OVERRIDES,
};

// accent substring uses the same heading token + same weight overrides as the title so only color differentiates it
export const ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_TEXT_STYLE_NAME: TextStyleName =
  ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE_NAME;

export const ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_TEXT_STYLE_OVERRIDES: Partial<TextStyle> = {
  ...ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE_OVERRIDES,
};

export const ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_TEXT_STYLE = {
  ...getOnboardingTextStyle(
    ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_TEXT_STYLE_NAME,
    ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
  ),
  ...ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_TEXT_STYLE_OVERRIDES,
};

export const ONBOARDING_SLIDES_CAPTION_TEXT_STYLE = getOnboardingTextStyle(
  'body-large',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

/** caption under questionnaire titles — same face as `CAPTION_TEXT_STYLE` + fixed line height for headline stack */
export const ONBOARDING_SLIDES_HEADLINE_CAPTION_TEXT_STYLE: TextStyle = {
  ...ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
  lineHeight: 24,
};

/** native time wheel row numerals — tabular alignment + funnel size */
export const ONBOARDING_SLIDES_TIME_WHEEL_ROW_LABEL_TEXT_STYLE: TextStyle = {
  fontSize: 22,
  fontVariant: ['tabular-nums'],
};

/** habit/task picker cards — title line (color from `slideUi.nextStepChoiceCardTitleColor`) */
export const ONBOARDING_SLIDES_NEXT_STEP_CHOICE_CARD_TITLE_TEXT_STYLE = getOnboardingTextStyle(
  'heading-3',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

/** task agenda title `TextInput`, suggestion chip labels, habit goal single-line field */
export const ONBOARDING_SLIDES_TASK_AND_HABIT_FIELD_TITLE_TEXT_STYLE = getOnboardingTextStyle(
  'heading-4',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

/** habit frequency options — pressable label stack */
export const ONBOARDING_SLIDES_HABIT_FREQUENCY_OPTION_TEXT_STYLE = getOnboardingTextStyle(
  'body-large',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

/** “here are some suggestions” heading — slightly heavier than body captions */
export const ONBOARDING_SLIDES_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE_TEXT_STYLE: TextStyle = {
  ...ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
  fontWeight: '600',
};

/** duration rail + thumb labels — glass slider on task branch */
export const ONBOARDING_SLIDES_DURATION_RAIL_TEXT_STYLE = getOnboardingTextStyle(
  'body-small',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);
export const ONBOARDING_SLIDES_DURATION_PILL_TEXT_STYLE = getOnboardingTextStyle(
  'body-medium',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

/** finish-slide planner preview — free-time row copy (`OnboardingPlannerTimeline`; colors still from theme) */
export const ONBOARDING_SLIDES_PLANNER_FREE_TIME_BODY_TEXT_STYLE = getOnboardingTextStyle(
  'body-small',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);

/** primary CTA label — same onboarding rounded/system stack as titles (`Typography.getOnboardingTextStyle`). */
export const ONBOARDING_SLIDES_CONTINUE_BUTTON_TEXT_STYLE = getOnboardingTextStyle(
  'button-primary',
  ONBOARDING_SLIDES_TYPOGRAPHY_PLATFORM,
);
