/**
 * fixed headline stack (title + subtext) — scroll-driven opacity matches backgrounds; does not move horizontally.
 */

import React from 'react';
import { Animated, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';

import {
  INTRO_FIXED_HEADLINE_OVERLAY_HEIGHT,
  INTRO_SUBTEXT_AREA_HEIGHT,
  INTRO_TITLE_AREA_HEIGHT,
  INTRO_TITLE_SUBTEXT_GAP,
} from '../constants';
import type { IntroPageTitleConfig, IntroSlideUiConfig } from '../constants';
import {
  crossfadeInputRange,
  crossfadeOutputRange,
  resolveIntroTextColor,
  splitIntroTitleHighlight,
} from '../scrollTransition';

export type IntroScrollCrossfadeTitleLayerProps = {
  scrollX: Animated.Value;
  pageWidth: number;
  titleLayerTop: number;
  titleConfigs: readonly IntroPageTitleConfig[];
  captions: readonly string[];
  slideUiList: readonly IntroSlideUiConfig[];
  titleTypographyStyle: TextStyle;
  captionTypographyStyle: TextStyle;
};

export function IntroScrollCrossfadeTitleLayer({
  scrollX,
  pageWidth,
  titleLayerTop,
  titleConfigs,
  captions,
  slideUiList,
  titleTypographyStyle,
  captionTypographyStyle,
}: IntroScrollCrossfadeTitleLayerProps) {
  const themeColors = useThemeColors();
  const count = titleConfigs.length;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.headlineLayer,
        {
          top: titleLayerTop,
        },
      ]}
    >
      {titleConfigs.map((titleConfig, i) => {
        const slideUi = slideUiList[i];
        if (!slideUi) {
          return null;
        }
        const opacity = scrollX.interpolate({
          inputRange: crossfadeInputRange(i, pageWidth, count),
          outputRange: crossfadeOutputRange(i, count),
          extrapolate: 'clamp',
        });
        const parts = splitIntroTitleHighlight(titleConfig.title, titleConfig.highlight?.text);
        const titleColor = resolveIntroTextColor(themeColors.text, slideUi.titleColor);
        const highlightColor = resolveIntroTextColor(
          themeColors.text,
          slideUi.titleHighlightColor ?? slideUi.titleColor,
        );
        const captionColor = resolveIntroTextColor(themeColors.text, slideUi.captionColor);
        const caption = captions[i] ?? '';
        return (
          <Animated.View
            key={i}
            style={[styles.headlineItem, { opacity }]}
            accessibilityRole="header"
            accessibilityLabel={caption ? `${titleConfig.title}. ${caption}` : titleConfig.title}
          >
            <View style={styles.titleBlock}>
              <Text style={[titleTypographyStyle, { color: titleColor }, titleConfig.titleStyle]}>
                {parts.before}
                {parts.match ? (
                  <Text style={[titleConfig.highlight?.style, { color: highlightColor }]}>{parts.match}</Text>
                ) : null}
                {parts.after}
              </Text>
            </View>
            <View style={[styles.subtextBlock, { marginTop: INTRO_TITLE_SUBTEXT_GAP }]}>
              {caption.length > 0 ? (
                <Text
                  style={[captionTypographyStyle, { color: captionColor }]}
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

const styles = StyleSheet.create({
  headlineLayer: {
    position: 'absolute',
    left: Paddings.screen + 16,
    right: Paddings.screen + 16,
    height: INTRO_FIXED_HEADLINE_OVERLAY_HEIGHT,
    zIndex: 2,
  },
  headlineItem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  titleBlock: {
    minHeight: INTRO_TITLE_AREA_HEIGHT,
    justifyContent: 'flex-start',
  },
  subtextBlock: {
    minHeight: INTRO_SUBTEXT_AREA_HEIGHT,
    justifyContent: 'flex-start',
  },
});
