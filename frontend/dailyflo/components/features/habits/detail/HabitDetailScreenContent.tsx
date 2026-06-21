/**
 * habit detail body — browse list-detail chrome (blur header, heading-1 title) + grouped sections.
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton } from '@/components/ui/Button';
import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/List/GroupedList';
import { Paddings } from '@/constants/Paddings';
import { flushAllPendingHabitIncrementSyncs } from '@/utils/pendingHabitIncrementSyncRegistry';
import { getTaskHabitTitleColor } from '@/utils/taskColors';
import { useHabits } from '@/store/hooks';
import { HabitBoardCard } from '../list/HabitBoardCard';
import type { HabitTodayItem } from '@/types/api/habits';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;
const SCROLL_THRESHOLD = 16;

type HabitDetailScreenContentProps = {
  habitId: string;
};

export function HabitDetailScreenContent({ habitId }: HabitDetailScreenContentProps) {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();
  const {
    detailHabit,
    detailStats,
    todayHabits,
    isDetailLoading,
    detailError,
    fetchHabit,
    fetchHabitStats,
    fetchToday,
    deleteHabit,
    clearHabitDetail,
  } = useHabits();

  useFocusEffect(
    useCallback(() => {
      void fetchToday();
      void fetchHabit(habitId);
      void fetchHabitStats(habitId);
      return () => {
        flushAllPendingHabitIncrementSyncs();
        clearHabitDetail();
      };
    }, [habitId, fetchToday, fetchHabit, fetchHabitStats, clearHabitDetail]),
  );

  const title = detailHabit?.title ?? 'Habit';
  const titleColor = useMemo(
    () => getTaskHabitTitleColor(detailHabit?.color ?? 'green'),
    [detailHabit?.color],
  );
  const deleteColor = semanticColors.error();

  const listGroupProps = useMemo(
    () => ({
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      separatorColor: themeColors.border.primary(),
      separatorInsetRight: Paddings.groupedListContentHorizontal,
      separatorVariant: 'solid' as const,
      borderRadius: 24,
      minimalStyle: false,
      separatorConsiderIconColumn: true,
      iconColumnWidth: 30,
      itemPadding: 'root' as const,
    }),
    [themeColors],
  );

  const styles = useMemo(() => createStyles(themeColors, typography, insets), [themeColors, typography, insets]);

  const scrollY = useSharedValue(0);
  const miniHeaderOpacity = useSharedValue(0);

  useAnimatedReaction(
    () => scrollY.value > SCROLL_THRESHOLD,
    (shouldShow) => {
      miniHeaderOpacity.value = withTiming(shouldShow ? 1 : 0, { duration: 200 });
    },
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const miniHeaderStyle = useAnimatedStyle(() => ({
    opacity: miniHeaderOpacity.value,
  }));

  const backButtonTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;

  const todayRow: HabitTodayItem | null = useMemo(() => {
    const fromToday = todayHabits.find((h) => h.id === habitId);
    if (fromToday) return fromToday;
    if (!detailHabit) return null;
    return {
      id: detailHabit.id,
      title: detailHabit.title,
      iconKey: detailHabit.iconKey,
      color: detailHabit.color,
      trackingType: detailHabit.trackingType,
      targetValue: detailHabit.targetValue,
      loggedValue: 0,
      unitLabel: detailHabit.unitLabel,
      isCompleteToday: false,
      currentStreak: detailStats?.currentStreak ?? 0,
      longestStreak: detailStats?.longestStreak ?? 0,
      frequencyType: detailHabit.frequencyType,
      reminderTime: detailHabit.reminderTime ?? '',
      heatmap: detailStats?.heatmap ?? { startDate: '', days: 365, completedDates: [], dayScores: {} },
    };
  }, [todayHabits, habitId, detailHabit, detailStats]);

  const handleEdit = useCallback(() => {
    router.push(`/(tabs)/habits/${habitId}/edit` as any);
  }, [router, habitId]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete habit', 'This habit will be removed from your lists.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteHabit(habitId);
              router.back();
            } catch (e) {
              Alert.alert('Could not delete', e instanceof Error ? e.message : 'Try again');
            }
          })();
        },
      },
    ]);
  }, [habitId, deleteHabit, router]);

  if (isDetailLoading && !detailHabit) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={themeColors.text.secondary()} />
      </View>
    );
  }

  if (detailError && !detailHabit) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.errorText, { color: themeColors.text.secondary() }]}>{detailError}</Text>
      </View>
    );
  }

  if (!detailHabit) return null;

  return (
    <View style={styles.screen}>
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
            themeColors.background.root(),
            themeColors.withOpacity(themeColors.background.root(), 0),
          ]}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
          <Animated.View style={[styles.miniHeader, miniHeaderStyle]} pointerEvents="none">
            <Text
              style={[styles.miniHeaderText, { color: titleColor }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </Animated.View>
        </View>
      </View>

      {Platform.OS === 'android' ? (
        <View style={styles.backButtonContainer} pointerEvents="box-none">
          <MainBackButton onPress={() => router.back()} top={backButtonTop} left={Paddings.screen} />
        </View>
      ) : null}

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.paddedHorizontal}>
          {detailStats ? (
            <HabitBoardCard
              title={title}
              color={detailHabit.color}
              currentStreak={detailStats.currentStreak}
              heatmap={detailStats.heatmap}
              habit={todayRow ?? undefined}
            />
          ) : (
            <View style={styles.statsLoading}>
              <ActivityIndicator color={themeColors.text.secondary()} />
            </View>
          )}
        </View>

        <View style={styles.paddedHorizontal}>
          <GroupedListHeader title="Manage" style={styles.manageHeader} />
          <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
            <FormDetailButton
              icon="create-outline"
              label="Edit habit"
              value=""
              onPress={handleEdit}
            />
            <FormDetailButton
              iconComponent={
                <Ionicons name="trash-outline" size={18} color={deleteColor} />
              }
              label="Delete habit"
              value=""
              onPress={handleDelete}
              showChevron={false}
              customStyles={{ label: { color: deleteColor } }}
            />
          </GroupedList>
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>,
) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: themeColors.background.root(),
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Paddings.screen,
    },
    errorText: {
      ...typography.getTextStyle('body-medium'),
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
      justifyContent: 'space-between',
      paddingHorizontal: Paddings.screen,
    },
    topSectionPlaceholder: {
      width: 44,
      height: 44,
    },
    miniHeader: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 56,
    },
    miniHeaderText: {
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
      // productivity pattern: scroll body starts below insets.top + 64 blur band (not browseScrollPaddingTop overlap)
      paddingTop: insets.top + TOP_SECTION_ANCHOR_HEIGHT,
      flexGrow: 1,
      gap: Paddings.formDataPillRowGap,
      paddingBottom: Paddings.scrollBottomExtra + Paddings.sectionCompact,
    },
    paddedHorizontal: {
      paddingHorizontal: Paddings.screen,
    },
    statsLoading: {
      paddingVertical: Paddings.section,
      alignItems: 'center',
    },
    listContainer: {
      marginVertical: 0,
    },
    manageHeader: {
      marginTop: Paddings.sectionCompact,
    },
    bottomSpacer: {
      height: 200,
    },
  });
