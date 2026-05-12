/**
 * questionnaire headline stack — opacity crossfade driven by `blendProgressAnim` (fractional page index 0…n−1).
 * uses the same `crossfadeInputRange(…, pageWidth: 1, …)` math as intro `IntroScrollCrossfadeTitleLayer` + scrollX/pageWidth.
 *
 * vertical size: no fixed title/subtext “area” constants — an invisible probe renders the heaviest slide so the stack gets intrinsic height while crossfade layers stay absolutely stacked.
 */

import React, { useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';

import {
  ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
  ONBOARDING_SLIDES_PAGE_CAPTIONS,
  ONBOARDING_SLIDES_PAGE_SLIDE_UI,
  ONBOARDING_SLIDES_PAGE_TITLES,
  ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE,
  ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP,
} from '../constants';
import { resolveOnboardingSlidesTextColor } from '../onboardingSlidesThemeResolvers';
import { crossfadeInputRange, crossfadeOutputRange, splitIntroTitleHighlight } from '../../introductory/scrollTransition';

export type OnboardingQuestionnaireHeadlineCrossfadeProps = {
  blendProgressAnim: Animated.Value;
};

/** pick one slide index to drive layout height — longest title+caption tends to need the most vertical room */
function questionnaireHeadlineHeightProbeIndex(): number {
  let best = 0;
  let maxScore = -1;
  ONBOARDING_SLIDES_PAGE_TITLES.forEach((t, i) => {
    const cap = ONBOARDING_SLIDES_PAGE_CAPTIONS[i] ?? '';
    const score = t.title.length + cap.length * 2;
    if (score > maxScore) {
      maxScore = score;
      best = i;
    }
  });
  return best;
}

const QUESTIONNAIRE_HEADLINE_HEIGHT_PROBE_INDEX = questionnaireHeadlineHeightProbeIndex();

type HeadlineSlideBodyProps = { slideIndex: number };

function QuestionnaireHeadlineSlideBody({ slideIndex }: HeadlineSlideBodyProps) {
  const themeColors = useThemeColors();
  const titleConfig = ONBOARDING_SLIDES_PAGE_TITLES[slideIndex];
  const slideUi = ONBOARDING_SLIDES_PAGE_SLIDE_UI[slideIndex];
  if (!titleConfig || !slideUi) {
    return null;
  }
  const parts = splitIntroTitleHighlight(titleConfig.title, titleConfig.highlight?.text);
  const titleColor = resolveOnboardingSlidesTextColor(themeColors, slideUi.titleColor);
  const highlightColor = resolveOnboardingSlidesTextColor(
    themeColors,
    slideUi.titleHighlightColor ?? slideUi.titleColor,
  );
  const captionColor = resolveOnboardingSlidesTextColor(themeColors, slideUi.captionColor);
  const caption = ONBOARDING_SLIDES_PAGE_CAPTIONS[slideIndex] ?? '';

  return (
    <View style={styles.layerGap}>
      <View style={styles.titleBlock}>
        <Text
          style={[ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE, { color: titleColor }, titleConfig.titleStyle]}
        >
          {parts.before}
          {parts.match !== '' ? (
            <Text style={[titleConfig.highlight?.style, { color: highlightColor }]}>{parts.match}</Text>
          ) : null}
          {parts.after}
        </Text>
      </View>
      <View style={styles.subtextBlock}>
        {caption.length > 0 ? (
          <Text
            style={[ONBOARDING_SLIDES_CAPTION_TEXT_STYLE, { color: captionColor, lineHeight: 24 }]}
            numberOfLines={4}
          >
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function OnboardingQuestionnaireHeadlineCrossfade({
  blendProgressAnim,
}: OnboardingQuestionnaireHeadlineCrossfadeProps) {
  const count = ONBOARDING_SLIDES_PAGE_TITLES.length;

  const accessibilityLabels = useMemo(
    () =>
      ONBOARDING_SLIDES_PAGE_TITLES.map((titleConfig, i) => {
        const caption = ONBOARDING_SLIDES_PAGE_CAPTIONS[i] ?? '';
        return caption ? `${titleConfig.title}. ${caption}` : titleConfig.title;
      }),
    [],
  );

  return (
    <View style={styles.stack} pointerEvents="none">
      {/* invisible copy of the tallest slide — establishes stack height for absolutely positioned crossfade layers */}
      <View
        style={styles.heightProbe}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <QuestionnaireHeadlineSlideBody slideIndex={QUESTIONNAIRE_HEADLINE_HEIGHT_PROBE_INDEX} />
      </View>

      <View style={styles.crossfadeLayers} pointerEvents="none">
        {ONBOARDING_SLIDES_PAGE_TITLES.map((_titleConfig, i) => {
          const slideUi = ONBOARDING_SLIDES_PAGE_SLIDE_UI[i];
          if (!slideUi) {
            return null;
          }
          const opacity = blendProgressAnim.interpolate({
            inputRange: crossfadeInputRange(i, 1, count),
            outputRange: crossfadeOutputRange(i, count),
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[styles.layer, { opacity }]}
              accessibilityRole="header"
              accessibilityLabel={accessibilityLabels[i]}
            >
              <QuestionnaireHeadlineSlideBody slideIndex={i} />
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

// headline matches shell horizontal inset — parent `OnboardingSlidesShell` already pads; layer is full width of content
const styles = StyleSheet.create({
  stack: {
    position: 'relative',
    width: '100%',
  },
  heightProbe: {
    opacity: 0,
  },
  crossfadeLayers: {
    ...StyleSheet.absoluteFillObject,
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  layerGap: {
    gap: ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP,
  },
  titleBlock: {
    justifyContent: 'flex-start',
  },
  subtextBlock: {
    justifyContent: 'flex-start',
  },
});
