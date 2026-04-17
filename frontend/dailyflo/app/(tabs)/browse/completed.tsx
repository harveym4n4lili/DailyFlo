/**
 * Completed — browse stack. Activity log rows filtered to completed only.
 * Top chrome + scroll spacing match inbox.tsx (same paddingTop, paddedHorizontal, miniHeader insets).
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { getFontFamilyWithWeight } from '@/constants/Typography';
import { MainBackButton } from '@/components/ui/button';
import { ScreenHeaderActions } from '@/components/ui';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { Paddings } from '@/constants/Paddings';
import { browseScrollPaddingTop } from '@/constants/browseScrollPaddingTop';
import { ActivityLog } from '@/types/common/ActivityLog';
import activityLogsApiService from '@/services/api/activityLogs';
import { groupLogsByDate, ActivityLogSection } from '@/components/features/activity-log';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;
const SCROLL_THRESHOLD = 16;

export default function CompletedScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = createStyles(typography, insets);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompletedLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await activityLogsApiService.fetchActivityLogs({ action_type: 'completed' });
      setLogs(data);
    } catch (e) {
      setLogs([]);
      setError(e instanceof Error ? e.message : 'Failed to load completed activity');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCompletedLogs();
    }, [loadCompletedLogs])
  );

  const sections = useMemo(() => groupLogsByDate(logs), [logs]);

  const scrollY = useSharedValue(0);
  const miniHeaderOpacity = useSharedValue(0);

  useAnimatedReaction(
    () => scrollY.value > SCROLL_THRESHOLD,
    (shouldShow) => {
      miniHeaderOpacity.value = withTiming(shouldShow ? 1 : 0, { duration: 200 });
    }
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const miniHeaderStyle = useAnimatedStyle(() => ({
    opacity: miniHeaderOpacity.value,
  }));

  const bigHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SCROLL_THRESHOLD], [1, 0], Extrapolation.CLAMP),
  }));

  // android: glass back in blur band; ios uses Stack.Toolbar chevron.left.
  const backButtonTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;

  const handleLogPress = useCallback(
    (log: ActivityLog) => {
      if (!log.taskId || log.actionType === 'deleted') return;
      router.push({
        pathname: '/task/[taskId]',
        params: {
          taskId: log.taskId,
          ...(log.occurrenceDate ? { occurrenceDate: log.occurrenceDate } : {}),
        },
      } as any);
    },
    [router]
  );

  const secondaryTextStyle = useMemo(
    () => ({
      ...typography.getTextStyle('body-large'),
      fontFamily: getFontFamilyWithWeight('regular'),
      color: themeColors.text.secondary(),
    }),
    [typography, themeColors]
  );

  return (
    <>
      <IosBrowseBackStackToolbar />
      <IosDashboardOverflowToolbar />
      <View style={{ flex: 1 }}>
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
          <Animated.View style={[styles.miniHeader, miniHeaderStyle]} pointerEvents="none">
            <Text style={[styles.miniHeaderText, { color: themeColors.text.primary() }]}>
              Completed
            </Text>
          </Animated.View>
          {Platform.OS === 'android' ? (
            <ScreenHeaderActions variant="dashboard" style={styles.topSectionContextButton} tint="primary" />
          ) : (
            <View style={styles.topSectionPlaceholder} pointerEvents="none" />
          )}
        </View>
      </View>

      {Platform.OS === 'android' ? (
        <View style={styles.backButtonContainer} pointerEvents="box-none">
          <MainBackButton
            onPress={() => router.back()}
            top={backButtonTop}
            left={Paddings.screen}
          />
        </View>
      ) : null}

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.paddedHorizontal}>
          <Animated.View style={bigHeaderStyle}>
            <Text style={[styles.bigHeader, { color: themeColors.text.primary() }]}>
              Completed
            </Text>
          </Animated.View>

          {isLoading && logs.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={themeColors.text.tertiary()} />
            </View>
          ) : error ? (
            <View style={styles.messageBlock}>
              <Text style={[secondaryTextStyle, styles.centerText]}>{error}</Text>
              <Pressable
                onPress={() => void loadCompletedLogs()}
                style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.85 }]}
              >
                <Text style={[typography.getTextStyle('body-large'), { color: themeColors.text.primary() }]}>
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : sections.length === 0 ? (
            <Text style={[secondaryTextStyle, styles.centerText, styles.emptyCopy]}>
              No completed tasks yet.{'\n'}When you check off a task, it will show up here.
            </Text>
          ) : (
            sections.map(({ dateKey, entries }) => (
              <ActivityLogSection
                key={dateKey}
                dateKey={dateKey}
                entries={entries}
                onLogPress={handleLogPress}
              />
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
      </View>
    </>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
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
    topSectionContextButton: {
      backgroundColor: 'primary',
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
      paddingTop: browseScrollPaddingTop(insets.top),
      flexGrow: 1,
    },
    paddedHorizontal: {
      paddingHorizontal: Paddings.screen,
    },
    bigHeader: {
      ...typography.getTextStyle('heading-1'),
      marginBottom: 8,
    },
    loadingWrap: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    messageBlock: {
      paddingVertical: 24,
      alignItems: 'center',
      gap: 16,
    },
    centerText: {
      textAlign: 'center',
    },
    emptyCopy: {
      marginTop: 8,
    },
    retryButton: {
      paddingVertical: Paddings.card,
      paddingHorizontal: Paddings.section,
    },
    bottomSpacer: {
      height: 200,
    },
  });
