/**
 * achievements list — browse stack chrome (blur top band + title), liquid glass filter pill, redux fetch on focus.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useGamification } from '@/store/hooks';
import { MainBackButton } from '@/components/ui/Button';
import { Paddings } from '@/constants/Paddings';
import type { AchievementItem } from '@/types/api/gamification';
import { AchievementFilterPicker } from './AchievementFilterPicker';
import type { AchievementListFilter } from './achievementFilterTypes';
import { AchievementListItem } from './AchievementListItem';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;

export function AchievementsScreenContent() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(typography, insets), [typography, insets]);
  const { achievements, isAchievementsLoading, achievementsError, fetchAchievements } = useGamification();

  const [listFilter, setListFilter] = useState<AchievementListFilter>('all');

  useFocusEffect(
    useCallback(() => {
      void fetchAchievements();
    }, [fetchAchievements])
  );

  // client-side filter — API returns every achievement; pill picks unlocked vs all
  const visibleAchievements = useMemo((): AchievementItem[] => {
    if (listFilter === 'all') {
      return achievements;
    }
    return achievements.filter((item) => item.unlockedAt != null);
  }, [achievements, listFilter]);

  const backButtonTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background.primary() }]}>
      <View
        style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ANCHOR_HEIGHT }]}
      >
        <BlurView
          tint={themeColors.isDark ? 'dark' : 'light'}
          intensity={1}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            themeColors.background.primary(),
            themeColors.withOpacity(themeColors.background.primary(), 0),
          ]}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
          <View style={styles.topSectionTitleWrap} pointerEvents="none">
            <Text style={[styles.topSectionTitle, { color: themeColors.text.primary() }]}>
              Achievements
            </Text>
          </View>
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
        </View>
      </View>

      {Platform.OS === 'android' ? (
        <View style={styles.backButtonContainer} pointerEvents="box-none">
          <MainBackButton onPress={() => router.back()} top={backButtonTop} left={Paddings.screen} />
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.paddedHorizontal}>
          <View style={styles.filterPill}>
            <AchievementFilterPicker value={listFilter} onValueChange={setListFilter} />
          </View>

          {isAchievementsLoading && achievements.length === 0 ? (
            <ActivityIndicator color={themeColors.text.secondary()} />
          ) : null}
          {achievementsError ? (
            <Text style={{ color: themeColors.text.secondary() }}>{achievementsError}</Text>
          ) : null}
          {!isAchievementsLoading && !achievementsError && visibleAchievements.length === 0 ? (
            <Text
              style={[
                typography.getTextStyle('body-large'),
                styles.emptyCopy,
                { color: themeColors.text.secondary() },
              ]}
            >
              {listFilter === 'completed'
                ? 'No unlocked achievements yet.\nComplete tasks to earn your first trophy.'
                : 'No achievements to show.'}
            </Text>
          ) : null}
          {visibleAchievements.map((item) => (
            <AchievementListItem key={item.id} item={item} />
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
    screen: { flex: 1 },
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: 'hidden',
    },
    topSectionRow: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      height: TOP_SECTION_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Paddings.screen,
    },
    topSectionPlaceholder: {
      width: 44,
      height: 44,
    },
    topSectionTitleWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 56,
    },
    topSectionTitle: {
      ...typography.getTextStyle('heading-3'),
    },
    backButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: insets.top + TOP_SECTION_ROW_HEIGHT,
      zIndex: 11,
      overflow: 'visible',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      // clear blur header band, then a little air before the filter pill
      paddingTop: insets.top + TOP_SECTION_ANCHOR_HEIGHT,
      flexGrow: 1,
      gap: Paddings.formDataPillRowGap,
      paddingBottom: Paddings.scrollBottomExtra + Paddings.sectionCompact,
    },
    paddedHorizontal: {
      paddingHorizontal: Paddings.screen,
      gap: Paddings.formDataPillRowGap,
    },
    filterPill: {
      marginTop: Paddings.sectionCompact,
      marginBottom: Paddings.sectionCompact,
    },
    emptyCopy: {
      textAlign: 'center',
      marginTop: Paddings.contentVertical,
    },
    bottomSpacer: {
      height: 200,
    },
  });
