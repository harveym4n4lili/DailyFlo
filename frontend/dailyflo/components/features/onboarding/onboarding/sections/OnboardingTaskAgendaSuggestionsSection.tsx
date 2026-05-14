// horizontal suggestion chips styled like quick-add pills (two rows inside one sideways scroll — keeps rows aligned visually).
// top spacing comes from the parent (`taskAgendaSuggestionsLead` uses `ONBOARDING_TASK_AGENDA_SUGGESTIONS_GAP_BELOW_CARD`).

import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuickAddLabelOnlyPill } from '@/components/features/tasks/quickAdd';

import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';

import {
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_ROW_GAP,
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_TITLE_CHIP_GAP,
} from '../constants/pagerLayout';
import { ONBOARDING_SLIDES_CAPTION_TEXT_STYLE } from '../constants/typography';
import type { OnboardingSlidesSlideTextColor } from '../constants/types';
import { resolveOnboardingSlidesTextColor } from '../onboardingSlidesThemeResolvers';

const ONBOARDING_SUGGESTION_CAPTION_SEMANTIC: OnboardingSlidesSlideTextColor = 'secondary';

export type OnboardingTaskAgendaSuggestionsSectionProps = {
  introLabel: string;
  suggestionLabels: readonly string[];
  onPickSuggestion: (label: string) => void;
};

function splitAcrossTwoRows(list: readonly string[]): [string[], string[]] {
  if (list.length === 0) {
    return [[], []];
  }
  // first row owns the rounding-up half so uneven counts favor the top band (easier scanning)
  const midpoint = Math.ceil(list.length / 2);
  return [list.slice(0, midpoint).slice(), list.slice(midpoint).slice()];
}

export function OnboardingTaskAgendaSuggestionsSection({
  introLabel,
  suggestionLabels,
  onPickSuggestion,
}: OnboardingTaskAgendaSuggestionsSectionProps) {
  const themeColors = useThemeColors();
  const subtitleColor = resolveOnboardingSlidesTextColor(themeColors, ONBOARDING_SUGGESTION_CAPTION_SEMANTIC);
  const [rowA, rowB] = useMemo(() => splitAcrossTwoRows(suggestionLabels), [suggestionLabels]);

  const handlePick = useCallback(
    (label: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPickSuggestion(label);
    },
    [onPickSuggestion],
  );

  return (
    <View accessibilityRole="none" accessibilityLabel="Suggested task titles">
      <Text style={[ONBOARDING_SLIDES_CAPTION_TEXT_STYLE, styles.intro, { color: subtitleColor }]}>
        {introLabel}
      </Text>
      {/* one horizontal gesture for both stacked rows keeps them visually locked while widening past the gutter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        accessibilityRole="none"
        accessibilityLabel="Suggested task title chips — scroll sideways for more choices"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.scrollColumn}>
          <View style={styles.chipRow}>
            {rowA.map((label) => (
              <QuickAddLabelOnlyPill key={label} label={label} onPress={() => handlePick(label)} />
            ))}
          </View>
          {rowB.length > 0 ? (
            <View style={styles.secondRowSpacing}>
              <View style={styles.chipRow}>
                {rowB.map((label) => (
                  <QuickAddLabelOnlyPill key={label} label={label} onPress={() => handlePick(label)} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: ONBOARDING_TASK_AGENDA_SUGGESTIONS_TITLE_CHIP_GAP,
  },
  scrollContent: {
    flexDirection: 'column',
    // mirrors quick-add bleed: final chip clears the trimmed screen inset when horizontally parked
    paddingRight: Paddings.screen,
  },
  scrollColumn: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  secondRowSpacing: {
    marginTop: ONBOARDING_TASK_AGENDA_SUGGESTIONS_ROW_GAP,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    columnGap: Paddings.formDataPillRowGap,
  },
});
