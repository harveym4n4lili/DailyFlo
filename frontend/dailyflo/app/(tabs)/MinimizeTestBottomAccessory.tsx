import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

type Props = {
  /** lifted state: expo docs say BottomAccessory mounts twice (inline + regular) — keep shared state in the parent */
  dismissed: boolean;
  onDismiss: () => void;
};

// dev-only strip above the tab bar when the Test tab is focused — uses NativeTabs.BottomAccessory.usePlacement() (ios 26+ / sdk 55)
export function MinimizeTestBottomAccessory({ dismissed, onDismiss }: Props) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const placement = NativeTabs.BottomAccessory.usePlacement();

  if (dismissed) {
    return null;
  }

  const bg = themeColors.background.elevated();
  const border = themeColors.border.secondary();
  const textPrimary = themeColors.text.primary();
  const textTertiary = themeColors.text.tertiary();

  if (placement === 'inline') {
    return (
      <Pressable
        onPress={onDismiss}
        style={[styles.inlineWrap, { backgroundColor: bg, borderColor: border }]}
        accessibilityRole="button"
        accessibilityLabel="Dismiss minimize test hint"
      >
        <Text style={[typography.getTextStyle('body-small'), { color: textPrimary }]} numberOfLines={1}>
          Scroll ↓ · tab bar minimize
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.regularWrap, { backgroundColor: bg, borderColor: border }]}>
      <View style={styles.regularTextCol}>
        <Text style={[typography.getTextStyle('body-medium'), { color: textPrimary }]}>
          Minimize test
        </Text>
        <Text style={[typography.getTextStyle('body-small'), { color: textTertiary }]}>
          Native tab bar accessory (iOS 26+). Scroll the list to exercise minimizeBehavior.
        </Text>
      </View>
      <Pressable
        onPress={onDismiss}
        style={[styles.dismissBtn, { borderColor: border }]}
        accessibilityRole="button"
        accessibilityLabel="Dismiss hint"
      >
        <Text style={[typography.getTextStyle('button-secondary'), { color: textPrimary }]}>Dismiss</Text>
      </Pressable>
    </View>
  );
}

/** only render BottomAccessory on ios — api is UITabBar bottomAccessory (see expo native tabs docs) */
export function shouldShowBottomAccessory(): boolean {
  return Platform.OS === 'ios';
}

const styles = StyleSheet.create({
  inlineWrap: {
    marginHorizontal: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'center',
    maxWidth: '92%',
  },
  regularWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  regularTextCol: {
    flex: 1,
    gap: 4,
  },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
