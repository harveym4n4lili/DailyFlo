// static “example day” filler under the editable task row — fills scroll space in the agenda body so onboarding shows what a populated day might look like (no taps, no persisted state).

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';

import { ONBOARDING_TASK_TITLE_SURFACE_RADIUS } from '../constants/pagerLayout';
import type { OnboardingSlidesSlideTextColor } from '../constants/types';
import {
  ONBOARDING_TASK_AGENDA_EXAMPLE_LINES,
  ONBOARDING_TASK_AGENDA_EXAMPLE_SECTION_TITLE,
} from '../constants/textValues';
import { ONBOARDING_SLIDES_CAPTION_TEXT_STYLE } from '../constants/typography';
import { resolveOnboardingSlidesTextColor } from '../onboardingSlidesThemeResolvers';

const TITLE_SEMANTIC: OnboardingSlidesSlideTextColor = 'primary';
const LINE_SEMANTIC: OnboardingSlidesSlideTextColor = 'secondary';

export function OnboardingTaskAgendaExamplePreview() {
  const themeColors = useThemeColors();
  const titleColor = resolveOnboardingSlidesTextColor(themeColors, TITLE_SEMANTIC);
  const lineColor = resolveOnboardingSlidesTextColor(themeColors, LINE_SEMANTIC);

  return (
    <View
      accessibilityRole="none"
      accessibilityLabel={`${ONBOARDING_TASK_AGENDA_EXAMPLE_SECTION_TITLE} preview`}
      style={[
        styles.surface,
        {
          backgroundColor: themeColors.background.primarySecondaryBlend(),
          borderColor: themeColors.border.secondary(),
        },
      ]}
    >
      <Text style={[ONBOARDING_SLIDES_CAPTION_TEXT_STYLE, styles.sectionTitle, { color: titleColor }]}>
        {ONBOARDING_TASK_AGENDA_EXAMPLE_SECTION_TITLE}
      </Text>
      {ONBOARDING_TASK_AGENDA_EXAMPLE_LINES.map((line: string, index: number) => (
        <Text
          key={index}
          style={[
            ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
            index > 0 && styles.lineGap,
            { color: lineColor },
          ]}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    width: '100%',
    borderRadius: ONBOARDING_TASK_TITLE_SURFACE_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Paddings.card,
    paddingVertical: Paddings.card,
  },
  sectionTitle: {
    marginBottom: Paddings.touchTargetSmall,
    fontWeight: '600',
  },
  lineGap: {
    marginTop: Paddings.touchTargetSmall,
  },
});
