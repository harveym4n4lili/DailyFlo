/**
 * quick-add pill with leading fill icon + label — same chrome as TaskQuickAddForm chip row.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';
import { QUICK_ADD_PILL_BORDER_WIDTH } from './QuickAddLabelOnlyPill';

const PILL_ICON_SIZE = Paddings.groupedListIconSize;

export type QuickAddIconPillProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  /**
   * `outlined` — quick-add hairline ring (default).
   * `primarySecondaryBlend` — solid fill, no border (e.g. FAB marple 500 + 600 icon/label).
   */
  variant?: 'outlined' | 'primarySecondaryBlend';
  /** only when `variant === 'primarySecondaryBlend'` */
  blendSurfaceColor?: string;
  /** defaults to interactive.active — same as quick-add empty chips */
  textColor?: string;
  disabled?: boolean;
};

function QuickAddIconPillChrome({
  icon,
  label,
  textColor,
  variant = 'outlined',
  blendSurfaceColor,
}: {
  icon: React.ReactNode;
  label: string;
  textColor: string;
  variant?: 'outlined' | 'primarySecondaryBlend';
  blendSurfaceColor?: string;
}) {
  const themeColors = useThemeColors();
  const isBlend = variant === 'primarySecondaryBlend';
  const surfaceColor = isBlend
    ? (blendSurfaceColor ?? themeColors.background.primarySecondaryBlend())
    : undefined;

  return (
    <View style={pillStyles.shell}>
      {isBlend ? (
        <View
          pointerEvents="none"
          style={[pillStyles.borderRing, { backgroundColor: surfaceColor, borderWidth: 0 }]}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[
            pillStyles.borderRing,
            {
              borderWidth: QUICK_ADD_PILL_BORDER_WIDTH,
              borderColor: themeColors.border.secondary(),
            },
          ]}
        />
      )}
      <View style={pillStyles.inner}>
        <View style={pillStyles.iconSlot}>{icon}</View>
        <Text style={[pillStyles.label, getTextStyle('body-large'), { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export function QuickAddIconPill({
  icon,
  label,
  onPress,
  accessibilityLabel = label,
  variant = 'outlined',
  blendSurfaceColor,
  textColor,
  disabled = false,
}: QuickAddIconPillProps) {
  const themeColors = useThemeColors();
  const isBlend = variant === 'primarySecondaryBlend';
  const labelColor = textColor ?? (isBlend ? themeColors.text.primary() : themeColors.interactive.active());

  return (
    <Pressable
      style={[pillStyles.tapZone, disabled ? pillStyles.tapZoneDisabled : undefined]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{
        top: Paddings.touchTarget,
        bottom: Paddings.touchTarget,
        left: Paddings.touchTarget,
        right: Paddings.touchTarget,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <QuickAddIconPillChrome
        icon={icon}
        label={label}
        textColor={labelColor}
        variant={variant}
        blendSurfaceColor={blendSurfaceColor}
      />
    </Pressable>
  );
}

export { PILL_ICON_SIZE as QUICK_ADD_ICON_PILL_ICON_SIZE };

const pillStyles = StyleSheet.create({
  tapZone: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 48,
  },
  tapZoneDisabled: {
    opacity: 0.65,
  },
  shell: {
    alignSelf: 'flex-start',
    borderRadius: Paddings.formDataPillRadius,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  borderRing: {
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
  iconSlot: {
    marginRight: Paddings.formDataPillIconGap,
  },
  label: {},
});
