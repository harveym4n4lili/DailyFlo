/**
 * habits tab body — today's due habits list with summary header.
 */

import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Platform, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { ScreenContainer } from '@/components/index';
import { ScreenHeaderActions } from '@/components/ui';
import { HabitsTodayList } from './HabitsTodayList';
import { useHabits } from '@/store/hooks';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';

// row = toolbar buttons; anchor = full blur band height — same as browse/productivity tab chrome
const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;

export function HabitsScreenContent() {
  const insets = useSafeAreaInsets();
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const { todayHabits, todaySummary, isTodayLoading, todayError, fetchToday } = useHabits();

  const openHabitDetail = useCallback(
    (habitId: string) => {
      router.push(`/(tabs)/habits/${habitId}` as any);
    },
    [router],
  );

  useFocusEffect(
    useCallback(() => {
      void fetchToday();
    }, [fetchToday]),
  );

  const styles = useMemo(() => createStyles(insets), [insets]);

  return (
    <>
      <View
        style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ANCHOR_HEIGHT }]}
        pointerEvents="box-none"
      >
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <View style={styles.topSectionCloseButton} pointerEvents="none" />
          {Platform.OS === 'android' ? (
            <ScreenHeaderActions variant="dashboard" style={styles.topSectionContextButton} tint="primary" />
          ) : null}
        </View>
      </View>

      <ScreenContainer
        scrollable={false}
        paddingHorizontal={0}
        safeAreaTop={false}
        safeAreaBottom={false}
        paddingVertical={0}
      >
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
              summary={todaySummary}
              isLoading={isTodayLoading}
              error={todayError}
              onOpenDetail={openHabitDetail}
            />
          </View>
        </ScrollView>
      </ScreenContainer>
    </>
  );
}

const createStyles = (insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: 'transparent',
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
      // productivity + browse: list starts below insets.top + 64 blur band
      paddingTop: insets.top + TOP_SECTION_ANCHOR_HEIGHT,
      paddingHorizontal: Paddings.screen,
      paddingBottom: Paddings.scrollBottomExtra + Paddings.contentVertical,
    },
    contentSection: {
      marginTop: Paddings.sectionCompact,
      marginBottom: Paddings.sectionCompact,
    },
  });
