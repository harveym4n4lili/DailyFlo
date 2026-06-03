/**
 * achievements list body — fetch via redux on focus; route file only adds stack toolbar.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useGamification } from '@/store/hooks';
import { MainBackButton } from '@/components/ui/Button';
import { Paddings } from '@/constants/Paddings';
import { browseScrollPaddingTop } from '@/constants/browseScrollPaddingTop';
import { AchievementListItem } from './AchievementListItem';

export function AchievementsScreenContent() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { achievements, isAchievementsLoading, achievementsError, fetchAchievements } = useGamification();

  useFocusEffect(
    useCallback(() => {
      void fetchAchievements();
    }, [fetchAchievements])
  );

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background.root() }]}>
      {Platform.OS === 'android' ? (
        <View style={[styles.androidHeader, { paddingTop: insets.top }]}>
          <MainBackButton />
          <Text style={[typography.getTextStyle('heading-3'), { color: themeColors.text.primary() }]}>
            Achievements
          </Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={{
          paddingTop: browseScrollPaddingTop(insets),
          paddingHorizontal: Paddings.screen,
          paddingBottom: Paddings.scrollBottomExtra + Paddings.sectionCompact,
          gap: Paddings.formDataPillRowGap,
        }}
      >
        {isAchievementsLoading && achievements.length === 0 ? (
          <ActivityIndicator color={themeColors.text.secondary()} />
        ) : null}
        {achievementsError ? (
          <Text style={{ color: themeColors.text.secondary() }}>{achievementsError}</Text>
        ) : null}
        {achievements.map((item) => (
          <AchievementListItem key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  androidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Paddings.screen,
    gap: Paddings.touchTarget,
    minHeight: 48,
  },
});
