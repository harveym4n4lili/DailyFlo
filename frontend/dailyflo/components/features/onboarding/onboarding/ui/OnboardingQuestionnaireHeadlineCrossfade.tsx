/**
 * questionnaire headline stack — opacity crossfade driven by `blendProgressAnim` (fractional page index 0…n−1).
 * uses the same `crossfadeInputRange(…, pageWidth: 1, …)` math as the former auth carousel title layer + scrollX/pageWidth.
 *
 * vertical size: no fixed title/subtext “area” constants — an invisible probe renders the heaviest slide so the stack gets intrinsic height while crossfade layers stay absolutely stacked.
 */

import React, { useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';

// import typography + pager tokens directly — avoids pulling the whole `constants` barrel (and `questionnaireSlideModel`) while this module loads; reduces HMR circular-init glitches
import { ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP } from '../constants/pagerLayout';
import {
  ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
  ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE,
} from '../constants/typography';
import type { OnboardingSlidesPageTitleConfig, OnboardingSlidesSlideUiConfig } from '../constants/types';
import { resolveOnboardingSlidesTextColor } from '../onboardingSlidesThemeResolvers';
import { crossfadeInputRange, crossfadeOutputRange, splitIntroTitleHighlight } from '../../auth/scrollTransition';

export type OnboardingQuestionnaireHeadlineCrossfadeProps = {
  blendProgressAnim: Animated.Value;
  pageTitles: readonly OnboardingSlidesPageTitleConfig[] | undefined;
  pageCaptions: readonly string[] | undefined;
  pageSlideUi: readonly OnboardingSlidesSlideUiConfig[] | undefined;
};

const EMPTY_TITLES: readonly OnboardingSlidesPageTitleConfig[] = [];
const EMPTY_CAPTIONS: readonly string[] = [];
const EMPTY_SLIDE_UI: readonly OnboardingSlidesSlideUiConfig[] = [];

/** pick one slide index to drive layout height — longest title+caption tends to need the most vertical room */
function questionnaireHeadlineHeightProbeIndex(
  pageTitles: readonly OnboardingSlidesPageTitleConfig[] | undefined,
  pageCaptions: readonly string[] | undefined,
): number {
  if (!pageTitles?.length) {
    return 0;
  }
  const caps = pageCaptions ?? EMPTY_CAPTIONS;
  let best = 0;
  let maxScore = -1;
  pageTitles.forEach((t, i) => {
    const cap = caps[i] ?? '';
    const score = t.title.length + cap.length * 2;
    if (score > maxScore) {
      maxScore = score;
      best = i;
    }
  });
  return best;
}

type HeadlineSlideBodyProps = {
  slideIndex: number;
  pageTitles: readonly OnboardingSlidesPageTitleConfig[];
  pageCaptions: readonly string[];
  pageSlideUi: readonly OnboardingSlidesSlideUiConfig[];
};

function QuestionnaireHeadlineSlideBody({
  slideIndex,
  pageTitles,
  pageCaptions,
  pageSlideUi,
}: HeadlineSlideBodyProps) {
  const themeColors = useThemeColors();
  const titleConfig = pageTitles[slideIndex];
  const slideUi = pageSlideUi[slideIndex];
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
  const caption = pageCaptions[slideIndex] ?? '';

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
  pageTitles,
  pageCaptions,
  pageSlideUi,
}: OnboardingQuestionnaireHeadlineCrossfadeProps) {
  const titles = pageTitles ?? EMPTY_TITLES;
  const captions = pageCaptions ?? EMPTY_CAPTIONS;
  const slideUiRows = pageSlideUi ?? EMPTY_SLIDE_UI;
  const count = titles.length;

  const probeIndex = useMemo(
    () => questionnaireHeadlineHeightProbeIndex(titles, captions),
    [titles, captions],
  );

  const accessibilityLabels = useMemo(
    () =>
      titles.map((titleConfig, i) => {
        const caption = captions[i] ?? '';
        return caption ? `${titleConfig.title}. ${caption}` : titleConfig.title;
      }),
    [captions, titles],
  );

  if (count === 0) {
    return <View style={styles.stack} pointerEvents="none" />;
  }

  return (
    <View style={styles.stack} pointerEvents="none">
      {/* invisible copy of the tallest slide — establishes stack height for absolutely positioned crossfade layers */}
      <View
        style={styles.heightProbe}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <QuestionnaireHeadlineSlideBody
          slideIndex={probeIndex}
          pageTitles={titles}
          pageCaptions={captions}
          pageSlideUi={slideUiRows}
        />
      </View>

      <View style={styles.crossfadeLayers} pointerEvents="none">
        {titles.map((_titleConfig, i) => {
          const slideUi = slideUiRows[i];
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
              <QuestionnaireHeadlineSlideBody
                slideIndex={i}
                pageTitles={titles}
                pageCaptions={captions}
                pageSlideUi={slideUiRows}
              />
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

// headline is full width of its parent column (shell pads by default; agenda scroll omits shell h pad and uses screen padding on the scroll body instead)
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
