/**
 * auth landing — baked TextStyles from Typography.ts; screens merge runtime theme colors on top.
 */

import { Platform } from 'react-native';

import { getOnboardingTextStyle, type Platform as TypographyPlatform } from '@/constants/Typography';

const AUTH_TYPOGRAPHY_PLATFORM = Platform.OS as TypographyPlatform;

/** main brand headline on the auth landing screen — merged with AUTH_PAGE_TITLE.titleStyle + resolved titleColor */
export const AUTH_HEADLINE_TEXT_STYLE = getOnboardingTextStyle(
  'heading-1',
  AUTH_TYPOGRAPHY_PLATFORM,
);
