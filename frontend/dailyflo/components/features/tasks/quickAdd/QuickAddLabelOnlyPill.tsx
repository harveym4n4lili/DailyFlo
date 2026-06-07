// text-only chrome matching TaskQuickAddForm pills (radius, inset border, body-large) without a leading icon.

import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';

import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';

/** matches TaskQuickAddForm `QUICK_ADD_PILL_BORDER_WIDTH` so onboarding chips line up visually with quick add */
export const QUICK_ADD_PILL_BORDER_WIDTH = 1.25;

export type QuickAddPillChromeProps = {
  children: React.ReactNode;
  /**
   * `outlined` — quick-add hairline ring (default).
   * `primarySecondaryBlend` — solid elevated fill, no border.
   */
  variant?: 'outlined' | 'primarySecondaryBlend';
  blendSurfaceColor?: string;
  style?: import('react-native').ViewStyle;
};

/** non-pressable pill surface — same chrome as `QuickAddLabelOnlyPill` for custom inner content */
export function QuickAddPillChrome({
  children,
  variant = 'outlined',
  blendSurfaceColor,
  style,
}: QuickAddPillChromeProps) {
  const themeColors = useThemeColors();
  const isBlend = variant === 'primarySecondaryBlend';
  const surfaceColor = isBlend
    ? (blendSurfaceColor ?? themeColors.background.primarySecondaryBlend())
    : undefined;
  const borderColor = themeColors.border.secondary();

  return (
    <View style={[pillStyles.shell, style]}>
      {isBlend ? (
        <View
          pointerEvents="none"
          style={[pillStyles.ring, { backgroundColor: surfaceColor }]}
        />
      ) : (
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
      )}
      <View style={[pillStyles.inner, !isBlend && { backgroundColor: 'transparent' }]}>{children}</View>
    </View>
  );
}

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
  /**
   * iOS only: wrap the pill in expo-glass-effect (clear + primary tint) while keeping the same padding, radius, and variant paints.
   * Android/web unchanged — solid surfaces only.
   */
  useLiquidGlassOnIos?: boolean;
};

export function QuickAddLabelOnlyPill({
  label,
  onPress,
  accessibilityLabel = label,
  variant = 'outlined',
  blendSurfaceColor,
  blendLabelColor,
  useLiquidGlassOnIos = false,
}: QuickAddLabelOnlyPillProps) {
  const themeColors = useThemeColors();
  const isBlend = variant === 'primarySecondaryBlend';
  const textColor = isBlend ? (blendLabelColor ?? themeColors.text.primary()) : themeColors.interactive.active();
  const useGlass = useLiquidGlassOnIos && Platform.OS === 'ios';
  const glassTint = themeColors.background.primary();

  const pillBody = (
    <QuickAddPillChrome
      variant={variant}
      blendSurfaceColor={blendSurfaceColor}
      style={useGlass ? pillStyles.glassChromeHost : undefined}
    >
      <Text style={[pillStyles.label, getTextStyle('body-large'), { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </QuickAddPillChrome>
  );

  return (
    <Pressable
      style={[pillStyles.tapZone, useGlass && pillStyles.tapZoneGlass]}
      onPress={onPress}
      hitSlop={{ top: Paddings.touchTarget, bottom: Paddings.touchTarget, left: Paddings.touchTarget, right: Paddings.touchTarget }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {useGlass ? (
        // bleed slot: glass draws past layout bounds without shifting sibling pill spacing
        <View style={pillStyles.glassBleedSlot}>
          <GlassView
            style={pillStyles.glassShell}
            glassEffectStyle="clear"
            tintColor={glassTint as any}
            isInteractive
          >
            {pillBody}
          </GlassView>
        </View>
      ) : (
        pillBody
      )}
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
  tapZoneGlass: {
    overflow: 'visible',
  },
  glassBleedSlot: {
    margin: -Paddings.liquidGlassBleed,
    padding: Paddings.liquidGlassBleed,
    overflow: 'visible',
    alignSelf: 'flex-start',
  },
  shell: {
    alignSelf: 'flex-start',
    borderRadius: Paddings.formDataPillRadius,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  // ios liquid glass — same outer size as shell; blend wash sits on the glass instead of painting the whole View
  glassShell: {
    alignSelf: 'flex-start',
    borderRadius: Paddings.formDataPillRadius,
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  glassBlendWash: {
    borderWidth: 0,
  },
  glassChromeHost: {
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
