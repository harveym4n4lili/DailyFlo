/**
 * horizontal dots for onboarding / intro funnel — renders in native headerTitle (or anywhere).
 * pass total steps + current index; active dot uses primary text color, inactive uses muted.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';

const DOT_SIZE_ACTIVE = 8;
const DOT_SIZE_INACTIVE = 6;
const DOT_GAP = 8;

export type OnboardingDotIndicatorProps = {
  /** how many funnel steps total (pager length or stack metaphor) */
  totalSteps: number;
  /** 0-based index of the highlighted step */
  activeIndex: number;
};

export function OnboardingDotIndicator({ totalSteps, activeIndex }: OnboardingDotIndicatorProps) {
  const themeColors = useThemeColors();

  if (totalSteps <= 0) {
    return null;
  }

  const clamped = Math.min(Math.max(activeIndex, 0), totalSteps - 1);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 1,
        max: totalSteps,
        now: clamped + 1,
        text: `Step ${clamped + 1} of ${totalSteps}`,
      }}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const active = i === clamped;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: active ? DOT_SIZE_ACTIVE : DOT_SIZE_INACTIVE,
                height: active ? DOT_SIZE_ACTIVE : DOT_SIZE_INACTIVE,
                borderRadius: active ? DOT_SIZE_ACTIVE / 2 : DOT_SIZE_INACTIVE / 2,
                backgroundColor: active
                  ? themeColors.text.primary()
                  : themeColors.withOpacity(themeColors.text.tertiary(), 0.45),
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
