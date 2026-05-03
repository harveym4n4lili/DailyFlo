/**
 * horizontal dots for onboarding / intro funnel — renders in native headerTitle (or anywhere).
 * pass total steps + scroll progress; parent passes resolved `dotColor` so each intro slide can pick its own token.
 */

import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { INTRO_CONTROL_TRANSITION_MS } from '../constants';

const DOT_SIZE_ACTIVE = 8;
const DOT_SIZE_INACTIVE = 8;
const DOT_WIDTH_ACTIVE = 20;
const DOT_GAP = 8;
const DOT_FIRST_LOAD_OFFSET = 0.6;

export type OnboardingDotIndicatorProps = {
  /** how many intro slides total */
  totalSteps: number;
  /** fractional scroll position (0..N-1) so dot widths morph while dragging */
  activeProgress: number;
  /** resolved fill color (e.g. from `resolveIntroTextColor` + current slide’s `dotIndicatorColor`) */
  dotColor: string;
};

export function OnboardingDotIndicator({ totalSteps, activeProgress, dotColor }: OnboardingDotIndicatorProps) {
  // start slightly before current index so the first visible step animates in on first render.
  const animatedProgress = React.useRef(new Animated.Value(activeProgress - DOT_FIRST_LOAD_OFFSET)).current;

  const clamped =
    totalSteps <= 0 ? 0 : Math.min(Math.max(activeProgress, 0), totalSteps - 1);
  const activeStepNow = totalSteps <= 0 ? 0 : Math.round(clamped) + 1;

  // smooth scroll-driven progress slightly so the dot transition feels less abrupt.
  React.useEffect(() => {
    if (totalSteps <= 0) return;
    Animated.timing(animatedProgress, {
      toValue: clamped,
      duration: INTRO_CONTROL_TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width interpolation is layout-based
    }).start();
  }, [animatedProgress, clamped, totalSteps]);

  if (totalSteps <= 0) {
    return null;
  }

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 1,
        max: totalSteps,
        now: activeStepNow,
        text: `Step ${activeStepNow} of ${totalSteps}`,
      }}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        // avoid duplicate input ranges on edges (0 and last dot) so interpolation stays stable.
        const hasLeftNeighbor = i > 0;
        const hasRightNeighbor = i < totalSteps - 1;
        const inputRange = hasLeftNeighbor && hasRightNeighbor
          ? [i - 1, i, i + 1]
          : hasLeftNeighbor
            ? [i - 1, i]
            : hasRightNeighbor
              ? [i, i + 1]
              : [i];
        const widthOutputRange = hasLeftNeighbor && hasRightNeighbor
          ? [DOT_SIZE_INACTIVE, DOT_WIDTH_ACTIVE, DOT_SIZE_INACTIVE]
          : hasLeftNeighbor
            ? [DOT_SIZE_INACTIVE, DOT_WIDTH_ACTIVE]
            : hasRightNeighbor
              ? [DOT_WIDTH_ACTIVE, DOT_SIZE_INACTIVE]
              : [DOT_WIDTH_ACTIVE];
        const opacityOutputRange = hasLeftNeighbor && hasRightNeighbor
          ? [0.45, 1, 0.45]
          : hasLeftNeighbor
            ? [0.45, 1]
            : hasRightNeighbor
              ? [1, 0.45]
              : [1];
        const width = animatedProgress.interpolate({
          inputRange,
          outputRange: widthOutputRange,
          extrapolate: 'clamp',
        });
        const emphasisOpacity = animatedProgress.interpolate({
          inputRange,
          outputRange: opacityOutputRange,
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width,
                height: DOT_SIZE_ACTIVE,
                borderRadius: DOT_SIZE_ACTIVE / 2,
                backgroundColor: dotColor,
                opacity: emphasisOpacity,
              },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DOT_GAP,
  },
  dot: {},
});
