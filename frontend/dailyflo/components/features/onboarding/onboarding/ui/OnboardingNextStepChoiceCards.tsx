/**
 * last questionnaire step — two cards styled like `TimelineItem` task rows (blend surface + timeline radius + padding).
 * each card: title (plant `heading-3`) + caption subtext + empty band ~160px tall for a future diagram slot.
 * single-select via parent state — selected card uses `background.tertiary()` instead of an outline.
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';

import type { OnboardingQuestionnaireNextStepChoice } from '../constants';
import {
  ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
  ONBOARDING_SLIDES_NEXT_STEP_CHOICE_CARD_TITLE_TEXT_STYLE,
} from '../constants/typography';

/** same corner radius as `TimelineItem` `combinedContainer` / `content` */
const TIMELINE_TASK_CARD_RADIUS = 24;

/** vertical band under copy — layout-only until real artwork ships */
const NEXT_STEP_CARD_DIAGRAM_PLACEHOLDER_HEIGHT = 160;

export type OnboardingNextStepChoiceCardsProps = {
  /** resolved from `pageSlideUi[nextStepIndex].nextStepChoiceCardTitleColor` */
  cardTitleColor: string;
  value: OnboardingQuestionnaireNextStepChoice;
  onChange: (next: OnboardingQuestionnaireNextStepChoice) => void;
};

const OPTIONS: readonly {
  id: OnboardingQuestionnaireNextStepChoice;
  label: string;
  subtext: string;
}[] = [
  {
    id: 'habit',
    label: 'Build a habit',
    subtext: 'Repeat small actions until they feel automatic.',
  },
  {
    id: 'task',
    label: 'Plan a task',
    subtext: 'Place something concrete on your timeline.',
  },
];

function ChoiceCard({
  label,
  subtext,
  selected,
  onPress,
  cardTitleColor,
}: {
  label: string;
  subtext: string;
  selected: boolean;
  onPress: () => void;
  cardTitleColor: string;
}) {
  const themeColors = useThemeColors();
  const titleStyle = [ONBOARDING_SLIDES_NEXT_STEP_CHOICE_CARD_TITLE_TEXT_STYLE, { color: cardTitleColor }];
  // onboarding caption stack — quieter than title; reads like slide body copy
  const subtextStyle = [ONBOARDING_SLIDES_CAPTION_TEXT_STYLE, { color: themeColors.text.secondary() }];

  // selected = tertiary surface only (no ring); unselected stays timeline-like blend
  const bg = selected
    ? themeColors.background.tertiary()
    : themeColors.background.primarySecondaryBlend();

  return (
    <View style={styles.cardWrap}>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel={`${label}. ${subtext}`}
        accessibilityState={{ selected }}
        onPress={() => {
          void Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: bg,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.cardInner}>
          <Text style={titleStyle} numberOfLines={2} ellipsizeMode="tail">
            {label}
          </Text>
          <Text style={[subtextStyle, styles.subtext]} numberOfLines={3}>
            {subtext}
          </Text>
          {/* holds vertical space so a diagram can drop in later without reflowing surrounding onboarding layout */}
          <View
            style={styles.diagramPlaceholder}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>
      </Pressable>
    </View>
  );
}

export function OnboardingNextStepChoiceCards({ cardTitleColor, value, onChange }: OnboardingNextStepChoiceCardsProps) {
  return (
    <View style={styles.column} accessibilityRole="radiogroup" accessibilityLabel="Pick your next step">
      {OPTIONS.map((opt) => (
        <ChoiceCard
          key={opt.id}
          label={opt.label}
          subtext={opt.subtext}
          selected={value === opt.id}
          cardTitleColor={cardTitleColor}
          onPress={() => onChange(opt.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    // vertical gap between cards — same token as screen horizontal padding (`Paddings.screen`)
    gap: Paddings.screen + 12,
    justifyContent: 'center',
    flex: 1,
  },
  cardWrap: {
    width: '100%',
  },
  card: {
    borderRadius: TIMELINE_TASK_CARD_RADIUS,
    paddingHorizontal: Paddings.card,
    paddingVertical: Paddings.listItemVertical,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    width: '100%',
  },
  cardInner: {
    width: '100%',
  },
  subtext: {
    marginTop: Paddings.touchTargetSmall,
  },
  diagramPlaceholder: {
    marginTop: Paddings.touchTargetSmall,
    height: NEXT_STEP_CARD_DIAGRAM_PLACEHOLDER_HEIGHT,
    width: '100%',
  },
});
