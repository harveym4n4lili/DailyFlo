import React from 'react';
import { View, ScrollView, Text, Platform, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

// dev tab: scrollview-only (no flatlist) so native tabs minimize can be tested per expo native-tabs docs
// route segment is the folder name `minimizeTest` — must match NativeTabs.Trigger name in (tabs)/_layout.tsx
export default function MinimizeTestScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const lines = Array.from({ length: 100 }, (_, i) => i);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        // ios: lets the scroll view participate in safe area / tab bar edge coordination (pairs with minimizeBehavior on NativeTabs)
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={[typography.getTextStyle('heading-3'), { color: themeColors.text.primary(), marginBottom: 8 }]}>
          Minimize test
        </Text>
        <Text style={[typography.getTextStyle('body-small'), { color: themeColors.text.tertiary(), marginBottom: 20 }]}>
          Scroll down — tab uses minimizeBehavior=&quot;onScrollDown&quot;. Long list below so the view always scrolls.
        </Text>
        {lines.map((i) => (
          <Text
            key={i}
            style={[typography.getTextStyle('body-large'), { color: themeColors.text.primary(), paddingVertical: 10 }]}
          >
            Row {i + 1}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48 },
});
