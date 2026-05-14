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
};

export function QuickAddLabelOnlyPill({
  label,
  onPress,
  accessibilityLabel = label,
}: QuickAddLabelOnlyPillProps) {
  const themeColors = useThemeColors();
  // same default label tone as unset quick-add filter chips (`pillChromeDefaultColor`)
  const textColor = themeColors.interactive.active();
  const borderColor = themeColors.border.secondary();

  return (
    <Pressable
      style={pillStyles.tapZone}
      onPress={onPress}
      hitSlop={{ top: Paddings.touchTarget, bottom: Paddings.touchTarget, left: Paddings.touchTarget, right: Paddings.touchTarget }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={pillStyles.shell}>
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
        <View style={[pillStyles.inner, { backgroundColor: 'transparent' }]}>
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
