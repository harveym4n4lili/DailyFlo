import React from 'react';
import { ScrollView, Text, StyleSheet, Platform } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

// native tabs: expo docs recommend ScrollView (not FlatList) for minimize-on-scroll — https://docs.expo.dev/router/advanced/native-tabs/
// folder name `test` must match NativeTabs.Trigger name="test" in (tabs)/_layout.tsx
export default function TabMinimizeTestScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const lines = Array.from({ length: 120 }, (_, i) => i);

  return (
    <ScrollView
      style={styles.scroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator
      keyboardShouldPersistTaps="handled"
      // ios: scroll view participates in safe area + tab bar inset so minimizeBehavior can track scroll
      contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined}
      contentContainerStyle={styles.content}
    >
      <Text style={[typography.getTextStyle('heading-3'), { color: themeColors.text.primary(), marginBottom: 8 }]}>
        Tab minimize test
      </Text>
      <Text style={[typography.getTextStyle('body-small'), { color: themeColors.text.tertiary(), marginBottom: 20 }]}>
        Scroll down — with minimizeBehavior onScrollDown (iOS), the system tab bar should shrink. Long list below.
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
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
});
