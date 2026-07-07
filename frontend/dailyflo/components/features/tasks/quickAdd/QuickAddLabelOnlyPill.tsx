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
  /** stretch inner content to shell width — full-width footer pills */
  stretchContent?: boolean;
  /** outlined ring color override — e.g. brand 500 proposal type chip */
  borderColor?: import('react-native').ColorValue;
  /** outlined inner fill — e.g. background.primary() behind label */
  innerBackgroundColor?: string;
  /** `compact` — smaller radius + padding for inline badges */
  size?: 'default' | 'compact' | 'badge';
};

const COMPACT_PILL_RADIUS = 12;
const COMPACT_PILL_PADDING = {
  paddingVertical: Paddings.touchTargetSmall,
  paddingHorizontal: 8,
} as const;

/** proposal type chip on session cards — roomier than compact + icon + label row */
const BADGE_PILL_RADIUS = 14;
const BADGE_PILL_PADDING = {
  paddingVertical: 6,
  paddingHorizontal: 10,
} as const;
const BADGE_PILL_INNER_GAP = 6;

/** non-pressable pill surface — same chrome as `QuickAddLabelOnlyPill` for custom inner content */
export function QuickAddPillChrome({
  children,
  variant = 'outlined',
  blendSurfaceColor,
  style,
  stretchContent = false,
  borderColor,
  innerBackgroundColor,
  size = 'default',
}: QuickAddPillChromeProps) {
  const themeColors = useThemeColors();
  const isBlend = variant === 'primarySecondaryBlend';
  const isCompact = size === 'compact';
  const isBadge = size === 'badge';
  const shellRadius = isBadge
    ? BADGE_PILL_RADIUS
    : isCompact
      ? COMPACT_PILL_RADIUS
      : Paddings.formDataPillRadius;
  const surfaceColor = isBlend
    ? (blendSurfaceColor ?? themeColors.background.primarySecondaryBlend())
    : undefined;
  const ringBorderColor = borderColor ?? themeColors.border.secondary();
  // filled outlined pills — border + bg on shell so the inner layer does not paint over the ring
  const useFilledOutline = !isBlend && innerBackgroundColor != null;

  return (
    <View
      style={[
        pillStyles.shell,
        { borderRadius: shellRadius },
        useFilledOutline && {
          borderWidth: QUICK_ADD_PILL_BORDER_WIDTH,
          borderColor: ringBorderColor,
          backgroundColor: innerBackgroundColor,
        },
        style,
      ]}
    >
      {!useFilledOutline && isBlend ? (
        <View
          pointerEvents="none"
          style={[pillStyles.ring, { borderRadius: shellRadius, backgroundColor: surfaceColor }]}
        />
      ) : null}
      {!useFilledOutline && !isBlend ? (
        <View
          pointerEvents="none"
          style={[
            pillStyles.ring,
            {
              borderRadius: shellRadius,
              borderWidth: QUICK_ADD_PILL_BORDER_WIDTH,
              borderColor: ringBorderColor,
            },
          ]}
        />
      ) : null}
      <View
        style={[
          pillStyles.inner,
          isBadge ? BADGE_PILL_PADDING : isCompact ? COMPACT_PILL_PADDING : undefined,
          isBadge && pillStyles.innerBadge,
          stretchContent && pillStyles.innerStretch,
          !isBlend && !useFilledOutline && {
            backgroundColor: innerBackgroundColor ?? 'transparent',
          },
          useFilledOutline && { backgroundColor: 'transparent' },
        ]}
      >
        {children}
      </View>
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
  /** stretch pill to parent width — session Accept All / Start new footer */
  fullWidth?: boolean;
  disabled?: boolean;
};

export function QuickAddLabelOnlyPill({
  label,
  onPress,
  accessibilityLabel = label,
  variant = 'outlined',
  blendSurfaceColor,
  blendLabelColor,
  useLiquidGlassOnIos = false,
  fullWidth = false,
  disabled = false,
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
      stretchContent={fullWidth}
      style={[
        useGlass ? pillStyles.glassChromeHost : undefined,
        fullWidth ? pillStyles.fullWidthChrome : undefined,
      ]}
    >
      <Text
        style={[
          pillStyles.label,
          fullWidth ? pillStyles.fullWidthLabel : undefined,
          getTextStyle('body-large'),
          { color: textColor },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </QuickAddPillChrome>
  );

  return (
    <Pressable
      style={[
        pillStyles.tapZone,
        fullWidth ? pillStyles.tapZoneFullWidth : undefined,
        useGlass && pillStyles.tapZoneGlass,
        disabled ? pillStyles.tapZoneDisabled : undefined,
      ]}
      onPress={onPress}
      disabled={disabled}
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
  tapZoneFullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  tapZoneDisabled: {
    opacity: 0.65,
  },
  fullWidthChrome: {
    alignSelf: 'stretch',
    width: '100%',
  },
  fullWidthLabel: {
    alignSelf: 'stretch',
    textAlign: 'center',
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
  innerStretch: {
    alignSelf: 'stretch',
    width: '100%',
    justifyContent: 'center',
  },
  innerBadge: {
    gap: BADGE_PILL_INNER_GAP,
  },
  label: {},
});
