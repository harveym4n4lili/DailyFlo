/**
 * questionnaire headline stack — opacity crossfade driven by `blendProgressAnim` (fractional page index 0…n−1).
 * uses the same `crossfadeInputRange(…, pageWidth: 1, …)` math as intro `IntroScrollCrossfadeTitleLayer` + scrollX/pageWidth.
 */

import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';

import {
  ONBOARDING_SLIDES_CAPTION_TEXT_STYLE,
  ONBOARDING_SLIDES_FIXED_HEADLINE_OVERLAY_HEIGHT,
  ONBOARDING_SLIDES_PAGE_CAPTIONS,
  ONBOARDING_SLIDES_PAGE_SLIDE_UI,
  ONBOARDING_SLIDES_PAGE_TITLES,
  ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE,
  ONBOARDING_SLIDES_SUBTEXT_AREA_HEIGHT,
  ONBOARDING_SLIDES_TITLE_AREA_HEIGHT,
  ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP,
} from '../constants';
import { resolveOnboardingSlidesTextColor } from '../onboardingSlidesThemeResolvers';
import { crossfadeInputRange, crossfadeOutputRange, splitIntroTitleHighlight } from '../../introductory/scrollTransition';

export type OnboardingQuestionnaireHeadlineCrossfadeProps = {
  blendProgressAnim: Animated.Value;
};

export function OnboardingQuestionnaireHeadlineCrossfade({
  blendProgressAnim,
}: OnboardingQuestionnaireHeadlineCrossfadeProps) {
  const themeColors = useThemeColors();
  const count = ONBOARDING_SLIDES_PAGE_TITLES.length;

  return (
    <View style={styles.stack} pointerEvents="none">
      {ONBOARDING_SLIDES_PAGE_TITLES.map((titleConfig, i) => {
        const slideUi = ONBOARDING_SLIDES_PAGE_SLIDE_UI[i];
        if (!slideUi) {
          return null;
        }
        const opacity = blendProgressAnim.interpolate({
          inputRange: crossfadeInputRange(i, 1, count),
          outputRange: crossfadeOutputRange(i, count),
          extrapolate: 'clamp',
        });
        const parts = splitIntroTitleHighlight(titleConfig.title, titleConfig.highlight?.text);
        const titleColor = resolveOnboardingSlidesTextColor(themeColors, slideUi.titleColor);
        const highlightColor = resolveOnboardingSlidesTextColor(
          themeColors,
          slideUi.titleHighlightColor ?? slideUi.titleColor,
        );
        const captionColor = resolveOnboardingSlidesTextColor(themeColors, slideUi.captionColor);
        const caption = ONBOARDING_SLIDES_PAGE_CAPTIONS[i] ?? '';

        return (
          <Animated.View
            key={i}
            style={[styles.layer, { opacity }]}
            accessibilityRole="header"
            accessibilityLabel={
              caption ? `${titleConfig.title}. ${caption}` : titleConfig.title
            }
          >
            <View style={styles.titleBlock}>
              <Text
                style={[
                  ONBOARDING_SLIDES_PAGE_TITLE_TEXT_STYLE,
                  { color: titleColor },
                  titleConfig.titleStyle,
                ]}
              >
                {parts.before}
                {parts.match !== '' ? (
                  <Text style={[titleConfig.highlight?.style, { color: highlightColor }]}>{parts.match}</Text>
                ) : null}
                {parts.after}
              </Text>
            </View>
            <View style={[styles.subtextBlock, { marginTop: ONBOARDING_SLIDES_TITLE_SUBTEXT_GAP }]}>
              {caption.length > 0 ? (
                <Text
                  style={[ONBOARDING_SLIDES_CAPTION_TEXT_STYLE, { color: captionColor, lineHeight: 24 }]}
                  numberOfLines={4}
                >
                  {caption}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// headline matches shell horizontal inset — parent `OnboardingSlidesShell` already pads; layer is full width of content
const styles = StyleSheet.create({
  stack: {
    minHeight: ONBOARDING_SLIDES_FIXED_HEADLINE_OVERLAY_HEIGHT,
    position: 'relative',
    width: '100%',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  titleBlock: {
    minHeight: ONBOARDING_SLIDES_TITLE_AREA_HEIGHT,
    justifyContent: 'flex-start',
  },
  subtextBlock: {
    minHeight: ONBOARDING_SLIDES_SUBTEXT_AREA_HEIGHT,
    justifyContent: 'flex-start',
  },
});
