/**
 * single-list view on the browse stack — opened when a My Lists pill is pressed.
 * layout matches inbox/completed (blur top, MainBackButton, big title + mini title on scroll).
 * top-right uses the same dashboard + ellipsis glass strip as Today (activity log, select tasks).
 *
 * ListCard + TaskCard are the same building blocks as Today; task row look comes from
 * LIST_CARD_TASK_ROW_PRESET_TODAY (constants/listCardTaskRowPreset.ts). Tasks load from
 * GET /lists/<id>/tasks/ (listsApi + transformApiTaskToTask). groupBy="routine" splits one-time vs recurring.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
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
import { MainBackButton } from '@/components/ui/button';
import { ScreenHeaderActions } from '@/components/ui';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { ListCard } from '@/components/ui/card';
import { Paddings } from '@/constants/Paddings';
import { browseScrollPaddingTop } from '@/constants/browseScrollPaddingTop';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import { useUI, useLists } from '@/store/hooks';
import { transformApiTaskToTask } from '@/store/slices/tasks/tasksSlice';
import listsApi from '@/services/api/lists';
import { Task } from '@/types';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;
const SCROLL_THRESHOLD = 16;

export default function BrowseListDetailScreen() {
  const router = useGuardedRouter();
  const params = useLocalSearchParams<{ listId: string | string[] }>();
  const listId = Array.isArray(params.listId) ? params.listId[0] : params.listId;

  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { selection, toggleItemSelection, selectAllItems, clearSelection } = useUI();
  const { lists, fetchLists } = useLists();

  useFocusEffect(
    useCallback(() => {
      void fetchLists();
    }, [fetchLists])
  );

  const list = useMemo(
    () => (listId ? lists.find((l) => l.id === listId) : undefined),
    [lists, listId]
  );
  const title = list?.name ?? 'List';

  const [listTasks, setListTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // GET /lists/<id>/tasks/ — same task shape as /tasks/
  useEffect(() => {
    if (!listId) {
      setListTasks([]);
      return;
    }
    let cancelled = false;
    setTasksLoading(true);
    (async () => {
      try {
        const raw = await listsApi.fetchTasksForList(listId);
        if (cancelled) return;
        setListTasks(raw.map((row) => transformApiTaskToTask(row)));
      } catch {
        if (!cancelled) setListTasks([]);
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listId]);

  const styles = useMemo(() => createStyles(typography, insets), [typography, insets]);

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

  const handleTaskPress = useCallback(
    (task: Task) => {
      // mock ids are not in redux; still opens task screen if you later wire real tasks
      router.push({ pathname: '/task/[taskId]', params: { taskId: task.id } } as any);
    },
    [router]
  );

  // local-only toggle so ListCard checkboxes work without hitting the API
  const handleTaskComplete = useCallback((task: Task, targetCompleted?: boolean) => {
    const isCompleted = targetCompleted ?? !task.isCompleted;
    setListTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              isCompleted,
              completedAt: isCompleted ? new Date().toISOString() : null,
            }
          : t
      )
    );
  }, []);

  const handleTaskEdit = useCallback(
    (task: Task) => {
      router.push({ pathname: '/task/[taskId]', params: { taskId: task.id } } as any);
    },
    [router]
  );

  const handleTaskDelete = useCallback((task: Task) => {
    setListTasks((prev) => prev.filter((t) => t.id !== task.id));
  }, []);

  const isSelectionMode = selection.isSelectionMode && selection.selectionType === 'tasks';
  const listSelectionMode = Platform.OS === 'android' && isSelectionMode;

  const eligibleListTaskIds = useMemo(
    () => listTasks.filter((t) => !t.isCompleted && !t.softDeleted).map((t) => t.id),
    [listTasks]
  );
  const allEligibleListSelected =
    eligibleListTaskIds.length > 0 &&
    eligibleListTaskIds.every((id) => selection.selectedItems.includes(id));

  const handleSelectAllList = useCallback(() => {
    if (!isSelectionMode) return;
    if (allEligibleListSelected) {
      clearSelection();
    } else {
      selectAllItems(eligibleListTaskIds);
    }
  }, [
    isSelectionMode,
    allEligibleListSelected,
    eligibleListTaskIds,
    selectAllItems,
    clearSelection,
  ]);

  return (
    <>
      {Platform.OS === 'ios' ? <IosBrowseBackStackToolbar /> : null}
      <IosDashboardOverflowToolbar hidden={listSelectionMode} />
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
            <Text
              style={[styles.miniHeaderText, { color: themeColors.text.primary() }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </Animated.View>
          {Platform.OS === 'android' ? (
            <ScreenHeaderActions variant="dashboard" style={styles.topSectionContextButton} tint="primary" />
          ) : null}
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
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.paddedHorizontal}>
          <Animated.View style={bigHeaderStyle}>
            <Text style={[styles.bigHeader, { color: themeColors.text.primary() }]} numberOfLines={2}>
              {title}
            </Text>
          </Animated.View>

          {!list ? (
            <Text style={[styles.mutedLead, { color: themeColors.text.tertiary() }]}>
              This list could not be found. Go back and pick another list.
            </Text>
          ) : null}
        </View>

        {/* same ListCard → TaskCard stack as Today; preset keeps row styling identical */}
        {list ? (
          <ListCard
            key={`browse-list-${listId}`}
            {...LIST_CARD_TASK_ROW_PRESET_TODAY}
            tasks={listTasks}
            groupBy="routine"
            sortBy="createdAt"
            sortDirection="desc"
            selectionMode={listSelectionMode}
            selectedTaskIds={selection.selectedItems}
            onToggleTaskSelection={listSelectionMode ? toggleItemSelection : undefined}
            hideCompletedTasks
            onTaskPress={handleTaskPress}
            onTaskComplete={handleTaskComplete}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            paddingHorizontal={Paddings.screen}
            emptyMessage="No tasks in this list yet."
            loading={tasksLoading}
            scrollEnabled={false}
            disableInitialLayoutTransition
          />
        ) : null}

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
    topSectionContextButton: {
      marginLeft: 'auto',
      alignSelf: 'center',
      backgroundColor: 'transparent',
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
    mutedLead: {
      ...typography.getTextStyle('body-large'),
      marginBottom: 16,
    },
    bottomSpacer: {
      height: 200,
    },
  });
