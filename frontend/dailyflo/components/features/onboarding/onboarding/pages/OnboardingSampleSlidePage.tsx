/**
 * sample page for onboarding questionnaire carousel — stacks shell + headline + demo card.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { splitIntroTitleHighlight } from '../../introductory';
import {
  ONBOARDING_SLIDES_PAGE_CAPTIONS,
  ONBOARDING_SLIDES_PAGE_TITLES,
} from '../constants';
import { OnboardingSlidesShell } from '../ui';
import { OnboardingSlideSampleContent } from '../sections';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export type OnboardingSampleSlidePageProps = {
  pageIndex?: number;
};

export function OnboardingSampleSlidePage({ pageIndex = 0 }: OnboardingSampleSlidePageProps) {
  const typography = useTypography();
  const themeColors = useThemeColors();
  const titleConfig = ONBOARDING_SLIDES_PAGE_TITLES[pageIndex];
  const caption = ONBOARDING_SLIDES_PAGE_CAPTIONS[pageIndex] ?? '';

  const baseTitleStyle = [
    typography.getTextStyle('heading-2'),
    { color: themeColors.text.primary(), marginBottom: caption ? 4 : 8 },
    titleConfig?.titleStyle,
  ];

  const { before, match, after } = splitIntroTitleHighlight(
    titleConfig?.title ?? '',
    titleConfig?.highlight?.text,
  );

  return (
    <OnboardingSlidesShell>
      <View style={{ gap: 8, marginBottom: 8 }}>
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
              typography.getTextStyle('body-large'),
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
