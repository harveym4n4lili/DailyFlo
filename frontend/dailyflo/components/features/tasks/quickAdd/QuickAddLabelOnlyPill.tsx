// text-only chrome matching TaskQuickAddForm pills (radius, inset border, body-large) without a leading icon.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';

/** matches TaskQuickAddForm `QUICK_ADD_PILL_BORDER_WIDTH` so onboarding chips line up visually with quick add */
export const QUICK_ADD_PILL_BORDER_WIDTH = 1.25;

export type QuickAddLabelOnlyPillProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  /**
   * `outlined` — quick-add style (hairline ring, transparent fill).
   * `primarySecondaryBlend` — solid fill, no border. Defaults to `primarySecondaryBlend` theme surfaces; optional `blendSurfaceColor` / `blendLabelColor` override (e.g. questionnaire slide–blended brand paints).
   */
  variant?: 'outlined' | 'primarySecondaryBlend';
  /** only applies when `variant === 'primarySecondaryBlend'` */
  blendSurfaceColor?: string;
  /** only applies when `variant === 'primarySecondaryBlend'` */
  blendLabelColor?: string;
};

export function QuickAddLabelOnlyPill({
  label,
  onPress,
  accessibilityLabel = label,
  variant = 'outlined',
  blendSurfaceColor,
  blendLabelColor,
}: QuickAddLabelOnlyPillProps) {
  const themeColors = useThemeColors();
  const defaultBlendFill = themeColors.background.primarySecondaryBlend();
  const isBlend = variant === 'primarySecondaryBlend';
  const surfaceColor = isBlend ? (blendSurfaceColor ?? defaultBlendFill) : undefined;
  const textColor = isBlend ? (blendLabelColor ?? themeColors.text.primary()) : themeColors.interactive.active();
  const borderColor = themeColors.border.secondary();

  return (
    <Pressable
      style={pillStyles.tapZone}
      onPress={onPress}
      hitSlop={{ top: Paddings.touchTarget, bottom: Paddings.touchTarget, left: Paddings.touchTarget, right: Paddings.touchTarget }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[pillStyles.shell, isBlend ? { backgroundColor: surfaceColor } : null]}>
        {!isBlend ? (
          <View
            pointerEvents="none"
            style={[
              pillStyles.ring,
              {
                borderWidth: QUICK_ADD_PILL_BORDER_WIDTH,
                borderColor,
              },
            ]}
          />
        ) : null}
        <View style={[pillStyles.inner, !isBlend && { backgroundColor: 'transparent' }]}>
          <Text style={[pillStyles.label, getTextStyle('body-large'), { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const pillStyles = StyleSheet.create({
  tapZone: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
  },
  shell: {
    alignSelf: 'flex-start',
    borderRadius: Paddings.formDataPillRadius,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Paddings.formDataPillRadius,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: Paddings.formDataPillVertical,
    paddingHorizontal: Paddings.formDataPillHorizontal,
  },
  label: {},
});
