/**
 * intro funnel — baked TextStyles from Typography.ts; screens merge runtime theme colors on top.
 */

import { Platform } from 'react-native';

import { getOnboardingTextStyle, type Platform as TypographyPlatform } from '@/constants/Typography';

import type { IntroSlideTextColor } from './types';

const INTRO_TYPOGRAPHY_PLATFORM = Platform.OS as TypographyPlatform;

/** skip label — route merges color via resolveIntroTextColor */
export const INTRO_SKIP_TEXT_STYLE = getOnboardingTextStyle('body-large', INTRO_TYPOGRAPHY_PLATFORM);

export const INTRO_SKIP_TEXT_COLOR: IntroSlideTextColor = 'secondary';

/** crossfade title layer base — per-slide titleStyle from textValues merges after */
export const INTRO_CROSSFADE_TITLE_TEXT_STYLE = getOnboardingTextStyle('heading-1', INTRO_TYPOGRAPHY_PLATFORM);

export const INTRO_CAPTION_TEXT_STYLE = getOnboardingTextStyle('body-large', INTRO_TYPOGRAPHY_PLATFORM);
