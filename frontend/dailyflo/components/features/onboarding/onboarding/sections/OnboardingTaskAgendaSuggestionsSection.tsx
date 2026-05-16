// suggestion chips — sparkles + title; two stacked horizontal ScrollViews (first/second half of labels) with edge bleed; smaller gap between chips than between rows.

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';

import {
  ONBOARDING_TASK_AGENDA_INNER_HORIZONTAL_PAD,
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_BASE_BOTTOM_GAP,
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_INTER_ROW_GAP,
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_ROW_GAP,
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_TITLE_CHIP_GAP,
} from '../constants/pagerLayout';
import {
  ONBOARDING_TASK_AGENDA_SUGGESTION_PILLS,
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE,
} from '../constants/slideUiTokens';
import { ONBOARDING_SLIDES_CAPTION_TEXT_STYLE } from '../constants/typography';
import type { OnboardingSlidesSlideTextColor } from '../constants/types';
import { resolveOnboardingSlidesTextColor } from '../onboardingSlidesThemeResolvers';
import { OnboardingTaskAgendaSuggestionRow } from '../ui';

const TITLE_SEMANTIC: OnboardingSlidesSlideTextColor = 'primary';

export type OnboardingTaskAgendaSuggestionBrandChrome = {
  /** blended `taskAgendaBody.taskTitleInput` or `titleColor` — matches main task field + suggestion labels */
  taskTitleInputColor: string;
  /** blended `taskAgendaBody.suggestionsSectionTitle` or `titleColor` */
  sectionTitleColor: string;
  /** blended `taskAgendaBody.pencilIcon` or `captionColor` — only the main task title row uses this; suggestion chips omit the pencil */
  pencilIconColor: string;
  /** blended `continueButtonBackground` per step (task branch uses `plant:500`) — selected pill border + sparkles, not global `primaryButton` */
  selectedSlideBrandColor: string;
  /** blended `continueButtonIcon` — same as full-width continue label / circular chevron color */
  selectedSlideBrandIconColor: string;
};

export type OnboardingTaskAgendaSuggestionsSectionProps = {
  /**
   * heading above chip rows — usually from `pageSlideUi[i].taskAgendaBody.suggestionsSectionHeading` (`slideUiTokens` for task agenda).
   */
  sectionTitle?: string;
  suggestionLabels?: readonly string[];
  /** current task title — drives sparkles emphasis on the matching suggestion chip */
  activeTitle: string;
  onPickSuggestion: (label: string) => void;
  brandChrome?: OnboardingTaskAgendaSuggestionBrandChrome;
};

function titlesMatch(a: string, b: string): boolean {
  return a.trim() === b.trim();
}

/** split labels evenly for two sideways rows — first row takes the extra item when count is odd */
function splitSuggestionLabels(labels: readonly string[]): [readonly string[], readonly string[]] {
  if (labels.length === 0) {
    return [[], []];
  }
  const mid = Math.ceil(labels.length / 2);
  return [labels.slice(0, mid), labels.slice(mid)];
}

export function OnboardingTaskAgendaSuggestionsSection({
  sectionTitle = ONBOARDING_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE,
  suggestionLabels = ONBOARDING_TASK_AGENDA_SUGGESTION_PILLS,
  activeTitle,
  onPickSuggestion,
  brandChrome,
}: OnboardingTaskAgendaSuggestionsSectionProps) {
  const themeColors = useThemeColors();
  const titleColor = brandChrome?.sectionTitleColor ?? resolveOnboardingSlidesTextColor(themeColors, TITLE_SEMANTIC);
  const rowTitleColor = brandChrome?.taskTitleInputColor ?? themeColors.text.primary();
  // selected chip accent follows slide continue FAB (`plant:500` on task-branch steps); fallback if section ever mounts without chrome
  const selectedBrandColor = brandChrome?.selectedSlideBrandColor ?? themeColors.primaryButton.fill();
  const [firstRowLabels, secondRowLabels] = useMemo(
    () => splitSuggestionLabels(suggestionLabels),
    [suggestionLabels],
  );

  return (
    <View style={styles.sectionRoot} accessibilityRole="none" accessibilityLabel="Suggested task titles">
      <Text style={[ONBOARDING_SLIDES_CAPTION_TEXT_STYLE, styles.sectionTitle, { color: titleColor }]}>
        {sectionTitle}
      </Text>
      {/* one bleed wrapper; two independent horizontal scrolls so each row scrolls on its own (nested in the agenda vertical scroll on android) */}
      <View style={styles.chipScrollBleed}>
        {firstRowLabels.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            contentContainerStyle={styles.chipScrollContent}
          >
            {firstRowLabels.map((label, index) => (
              <OnboardingTaskAgendaSuggestionRow
                key={`r0-${label}-${index}`}
                label={label}
                selected={titlesMatch(activeTitle, label)}
                onSelect={() => onPickSuggestion(label)}
                titleTextColor={rowTitleColor}
                selectedBrandColor={selectedBrandColor}
              />
            ))}
          </ScrollView>
        ) : null}
        {secondRowLabels.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            contentContainerStyle={styles.chipScrollContent}
            style={firstRowLabels.length > 0 ? styles.chipScrollSecondRow : undefined}
          >
            {secondRowLabels.map((label, index) => (
              <OnboardingTaskAgendaSuggestionRow
                key={`r1-${label}-${index}`}
                label={label}
                selected={titlesMatch(activeTitle, label)}
                onSelect={() => onPickSuggestion(label)}
                titleTextColor={rowTitleColor}
                selectedBrandColor={selectedBrandColor}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRoot: {
    paddingBottom: ONBOARDING_TASK_AGENDA_SUGGESTIONS_BASE_BOTTOM_GAP,
  },
  sectionTitle: {
    marginBottom: ONBOARDING_TASK_AGENDA_SUGGESTIONS_TITLE_CHIP_GAP,
    fontWeight: '600',
  },
  chipScrollBleed: {
    marginHorizontal: -ONBOARDING_TASK_AGENDA_INNER_HORIZONTAL_PAD,
  },
  chipScrollSecondRow: {
    marginTop: ONBOARDING_TASK_AGENDA_SUGGESTIONS_INTER_ROW_GAP,
  },
  chipScrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: ONBOARDING_TASK_AGENDA_INNER_HORIZONTAL_PAD,
    paddingRight: ONBOARDING_TASK_AGENDA_INNER_HORIZONTAL_PAD,
    gap: ONBOARDING_TASK_AGENDA_SUGGESTIONS_ROW_GAP,
  },
});
