/**
 * habits tab body — today's due habits list.
 * canvas matches browse: background.root() + blur/gradient top band.
 */

import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Platform, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useAuthSessionReady } from '@/hooks/useAuthSessionReady';
import { ScreenHeaderActions } from '@/components/ui';
import { HabitsTodayList } from './HabitsTodayList';
import { useHabits } from '@/store/hooks';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { flushAllPendingHabitIncrementSyncs } from '@/utils/pendingHabitIncrementSyncRegistry';

// row = toolbar buttons; anchor = full blur band height — same as browse tab chrome
const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;

export function HabitsScreenContent() {
  const insets = useSafeAreaInsets();
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const authSessionReady = useAuthSessionReady();
  const { todayHabits, isTodayLoading, todayError, fetchToday } = useHabits();

  const openHabitDetail = useCallback(
    (habitId: string) => {
      router.push(`/(tabs)/habits/${habitId}` as any);
    },
    [router],
  );

  useFocusEffect(
    useCallback(() => {
      if (!authSessionReady) return () => undefined;
      void fetchToday();
      return () => flushAllPendingHabitIncrementSyncs();
    }, [fetchToday, authSessionReady]),
  );

  const styles = useMemo(() => createStyles(themeColors, insets), [themeColors, insets]);

  return (
    <View style={styles.container}>
      <View
        style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ANCHOR_HEIGHT }]}
        pointerEvents="box-none"
      >
        <BlurView
          tint={themeColors.isDark ? 'dark' : 'light'}
          intensity={1}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LinearGradient
          colors={[themeColors.background.root(), themeColors.withOpacity(themeColors.background.root(), 0)]}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <View style={styles.topSectionCloseButton} pointerEvents="none" />
          {Platform.OS === 'android' ? (
            <ScreenHeaderActions variant="dashboard" style={styles.topSectionContextButton} tint="primary" />
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isTodayLoading}
            onRefresh={() => void fetchToday()}
            tintColor={themeColors.text.secondary()}
          />
        }
      >
        <View style={styles.contentSection}>
          <HabitsTodayList
            habits={todayHabits}
            isLoading={isTodayLoading}
            error={todayError}
            onOpenDetail={openHabitDetail}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  insets: ReturnType<typeof useSafeAreaInsets>,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background.root(),
    },
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
      justifyContent: 'flex-end',
      paddingHorizontal: Paddings.screen,
    },
    topSectionCloseButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 'auto',
    },
    topSectionContextButton: {
      backgroundColor: 'primary',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: insets.top + TOP_SECTION_ANCHOR_HEIGHT,
      paddingHorizontal: Paddings.screen,
      paddingBottom: Paddings.scrollBottomExtra + Paddings.contentVertical,
    },
    contentSection: {
      marginTop: Paddings.sectionCompact,
      marginBottom: Paddings.sectionCompact,
    },
  });
