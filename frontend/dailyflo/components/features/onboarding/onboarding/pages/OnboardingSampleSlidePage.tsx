/**
 * sample page for onboarding questionnaire carousel — stacks shell + headline + demo card.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { splitIntroTitleHighlight } from '../../introductory';
import {
  ONBOARDING_SLIDES_PAGE_CAPTIONS,
  ONBOARDING_SLIDES_PAGE_TITLES,
  ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE,
  ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
} from '../constants';
import { OnboardingSlidesShell } from '../ui';
import { OnboardingSlideSampleContent } from '../sections';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';

export type OnboardingSampleSlidePageProps = {
  pageIndex?: number;
};

export function OnboardingSampleSlidePage({ pageIndex = 0 }: OnboardingSampleSlidePageProps) {
  const themeColors = useThemeColors();
  const titleConfig = ONBOARDING_SLIDES_PAGE_TITLES[pageIndex];
  const caption = ONBOARDING_SLIDES_PAGE_CAPTIONS[pageIndex] ?? '';

  // headline/caption typography from onboarding/constants/typography.ts (`getOnboardingTextStyle`)
  const baseTitleStyle = [
    ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE,
    { color: themeColors.text.primary(), marginBottom: caption ? Paddings.touchTargetSmall : Paddings.touchTarget },
    titleConfig?.titleStyle,
  ];

  const { before, match, after } = splitIntroTitleHighlight(
    titleConfig?.title ?? '',
    titleConfig?.highlight?.text,
  );

  return (
    <OnboardingSlidesShell>
      <View style={{ gap: Paddings.touchTarget, marginBottom: Paddings.touchTarget }}>
        <Text style={baseTitleStyle}>
          {before}
          {match !== '' ? (
            <Text style={[titleConfig?.highlight?.style]}>{match}</Text>
          ) : null}
          {after}
        </Text>
        {caption !== '' ? (
          <Text
            style={[
              ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
              { color: themeColors.text.secondary(), lineHeight: 24 },
            ]}
          >
            {caption}
          </Text>
        ) : null}
      </View>
      <OnboardingSlideSampleContent pageIndex={pageIndex} />
    </OnboardingSlidesShell>
  );
}
