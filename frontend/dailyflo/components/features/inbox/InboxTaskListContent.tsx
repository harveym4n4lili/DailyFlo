/**
 * shared inbox task list — used by browse/inbox push screen and the inbox tab root.
 * fetches GET /tasks/inbox/ on focus; ListCard handles complete/delete via redux thunks.
 *
 * tab-root mirrors TodayScreenContent: ListCard owns scroll + top inset (paddingTop 64, scrollPastTopInset).
 * browse-stack keeps outer ScrollView for back-button push chrome.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContainer } from '@/components/index';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton, SelectionCloseButton, SelectAllButton } from '@/components/ui/Button';
import { ScreenHeaderActions } from '@/components/ui';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { IosTaskSelectionCloseStackToolbar } from '@/components/navigation/IosTaskSelectionCloseStackToolbar';
import { IosTaskSelectionSelectAllStackToolbar } from '@/components/navigation/IosTaskSelectionSelectAllStackToolbar';
import { ListCard } from '@/components/ui/Card';
import { Paddings } from '@/constants/Paddings';
import { browseScrollPaddingTop } from '@/constants/browseScrollPaddingTop';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import { mapTodayDisplayPrefsToListCard } from '@/components/features/display/displayPreferenceMappers';
import { useUI } from '@/store/hooks';
import { useAppDispatch, useAppSelector, store } from '@/store';
import { updateTask, deleteTask, transformApiTaskToTask } from '@/store/slices/tasks/tasksSlice';
import tasksApi from '@/services/api/tasks';
import { Task } from '@/types';
import {
  getCachedInboxTasks,
  setCachedInboxTasks,
} from '@/components/features/inbox/inboxTasksSessionCache';
import {
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
} from '@/utils/recurrenceUtils';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;
const MINI_HEADER_SCROLL_THRESHOLD = 48;
const BROWSE_BIG_HEADER_SCROLL_THRESHOLD = 16;

export type InboxScreenChromeVariant = 'browse-stack' | 'tab-root';
export type InboxTaskListContentMode = 'index' | 'select';

export type InboxTaskListContentProps = {
  /** browse-stack shows back chrome; tab-root is a main navbar destination */
  chromeVariant?: InboxScreenChromeVariant;
  /** select = ios pushed route; index = normal tab root (or browse) */
  mode?: InboxTaskListContentMode;
};

export function InboxTaskListContent({
  chromeVariant = 'browse-stack',
  mode = 'index',
}: InboxTaskListContentProps) {
  const isBrowseStack = chromeVariant === 'browse-stack';
  const isSelectRoute = mode === 'select';
  const router = useGuardedRouter();
  const openDisplaySettings = useCallback(() => {
    router.push('/(tabs)/inbox/display' as any);
  }, [router]);
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const {
    selection,
    toggleItemSelection,
    exitSelectionMode,
    selectAllItems,
    clearSelection,
  } = useUI();

  const isTaskSelectionActive =
    selection.isSelectionMode && selection.selectionType === 'tasks';
  const androidInPlaceSelection = Platform.OS === 'android' && isTaskSelectionActive;
  const listSelectionMode = isBrowseStack
    ? Platform.OS === 'android' && isTaskSelectionActive
    : isSelectRoute || androidInPlaceSelection;

  const [inboxTasks, setInboxTasks] = useState<Task[]>(() => getCachedInboxTasks());
  const [loading, setLoading] = useState(() => getCachedInboxTasks().length === 0);
  const [error, setError] = useState<string | null>(null);

  const inboxDisplayPrefs = useAppSelector(
    (state) => state.auth.user?.preferences?.displayPreferences?.inbox
  );
  const inboxListDisplayProps = useMemo(
    () => mapTodayDisplayPrefsToListCard(inboxDisplayPrefs),
    [inboxDisplayPrefs]
  );

  const loadInbox = useCallback(async () => {
    setError(null);
    if (inboxTasks.length === 0) {
      setLoading(true);
    }
    try {
      const raw = await tasksApi.fetchInboxTasks();
      const nextTasks = raw.map((row) => transformApiTaskToTask(row));
      setCachedInboxTasks(nextTasks);
      setInboxTasks(nextTasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load inbox');
      setInboxTasks([]);
      setCachedInboxTasks([]);
    } finally {
      setLoading(false);
    }
  }, [inboxTasks.length]);

  useFocusEffect(
    useCallback(() => {
      void loadInbox();
    }, [loadInbox])
  );

  const scrollY = useSharedValue(0);
  const miniHeaderOpacity = useSharedValue(0);

  // mirror TodayScreenContent — keep scroll + blur header aligned when select route mounts or data settles
  useEffect(() => {
    if (!loading) {
      scrollY.value = 0;
      miniHeaderOpacity.value = 0;
    }
  }, [loading, scrollY, miniHeaderOpacity]);

  useEffect(() => {
    if (!isSelectRoute) return;
    scrollY.value = 0;
    miniHeaderOpacity.value = 0;
  }, [isSelectRoute, scrollY, miniHeaderOpacity]);

  const miniHeaderScrollThreshold = isBrowseStack
    ? BROWSE_BIG_HEADER_SCROLL_THRESHOLD
    : MINI_HEADER_SCROLL_THRESHOLD;

  useAnimatedReaction(
    () => scrollY.value > miniHeaderScrollThreshold,
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
    opacity: interpolate(
      scrollY.value,
      [0, BROWSE_BIG_HEADER_SCROLL_THRESHOLD],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const tabRootStyles = useMemo(
    () => createTabRootStyles(typography, insets),
    [typography, insets]
  );
  const browseStyles = useMemo(
    () => createBrowseStyles(typography, insets),
    [typography, insets]
  );

  const handleTaskPress = useCallback(
    (task: Task) => {
      const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      const occurrenceDate = isExpandedRecurrenceId(task.id)
        ? getOccurrenceDateFromId(task.id)
        : undefined;
      router.push({
        pathname: '/task/[taskId]',
        params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) },
      } as any);
    },
    [router]
  );

  const handleTaskComplete = useCallback(
    (task: Task, targetCompleted?: boolean) => {
      const isCompleted = targetCompleted ?? !task.isCompleted;
      if (isExpandedRecurrenceId(task.id)) {
        const baseId = getBaseTaskId(task.id);
        const occurrenceDate = getOccurrenceDateFromId(task.id);
        if (!occurrenceDate) return;
        const tasksFromStore = store.getState().tasks.tasks;
        const baseTask =
          tasksFromStore.find((t) => t.id === baseId) ?? inboxTasks.find((t) => t.id === baseId);
        if (!baseTask) return;
        const completions = baseTask.metadata?.recurrence_completions ?? [];
        const newCompletions = isCompleted
          ? [...completions, occurrenceDate]
          : completions.filter((d) => d !== occurrenceDate);
        void (async () => {
          try {
            await dispatch(
              updateTask({
                id: baseId,
                updates: {
                  id: baseId,
                  metadata: { ...baseTask.metadata, recurrence_completions: newCompletions },
                },
              })
            ).unwrap();
            void loadInbox();
          } catch {
            void loadInbox();
          }
        })();
      } else {
        void (async () => {
          try {
            await dispatch(
              updateTask({
                id: task.id,
                updates: { id: task.id, isCompleted },
              })
            ).unwrap();
            void loadInbox();
          } catch {
            void loadInbox();
          }
        })();
      }
    },
    [dispatch, loadInbox, inboxTasks]
  );

  const handleTaskEdit = useCallback(
    (task: Task) => {
      const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      const occurrenceDate = isExpandedRecurrenceId(task.id)
        ? getOccurrenceDateFromId(task.id)
        : undefined;
      router.push({
        pathname: '/task/[taskId]',
        params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) },
      } as any);
    },
    [router]
  );

  const handleTaskDelete = useCallback(
    (task: Task) => {
      const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      void (async () => {
        try {
          await dispatch(deleteTask(taskId)).unwrap();
        } finally {
          void loadInbox();
        }
      })();
    },
    [dispatch, loadInbox]
  );

  const closeButtonScale = useSharedValue(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    closeButtonScale.value = withSpring(androidInPlaceSelection ? 1 : 0, {
      damping: 45,
      stiffness: 600,
    });
  }, [androidInPlaceSelection, closeButtonScale]);

  const handleCloseButtonPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeButtonScale.value = withTiming(0, { duration: 150 });
    setTimeout(exitSelectionMode, 90);
  }, [closeButtonScale, exitSelectionMode]);

  const closeButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeButtonScale.value }],
  }));

  const eligibleInboxTaskIds = useMemo(
    () =>
      inboxTasks
        .filter((t) => !t.isCompleted && !t.softDeleted)
        .map((t) => t.id),
    [inboxTasks]
  );

  const allEligibleSelected =
    eligibleInboxTaskIds.length > 0 &&
    eligibleInboxTaskIds.every((id) => selection.selectedItems.includes(id));
  const selectAllLabel = allEligibleSelected ? 'Deselect all' : 'Select all';

  const handleSelectAllInbox = useCallback(() => {
    if (!listSelectionMode) return;
    if (allEligibleSelected) {
      clearSelection();
    } else {
      selectAllItems(eligibleInboxTaskIds);
    }
  }, [
    listSelectionMode,
    allEligibleSelected,
    eligibleInboxTaskIds,
    selectAllItems,
    clearSelection,
  ]);

  const miniHeaderLabel = listSelectionMode
    ? `${selection.selectedItems.length} selected`
    : 'Inbox';

  const listCardCommonProps = {
    ...LIST_CARD_TASK_ROW_PRESET_TODAY,
    tasks: inboxTasks,
    groupBy: 'routine' as const,
    sortBy: inboxListDisplayProps.sortBy,
    sortDirection: inboxListDisplayProps.sortDirection,
    selectionMode: listSelectionMode,
    selectedTaskIds: selection.selectedItems,
    onToggleTaskSelection: listSelectionMode ? toggleItemSelection : undefined,
    hideCompletedTasks: inboxListDisplayProps.hideCompletedTasks,
    onTaskPress: handleTaskPress,
    onTaskComplete: handleTaskComplete,
    onTaskEdit: handleTaskEdit,
    onTaskDelete: handleTaskDelete,
    paddingHorizontal: Paddings.screen,
    emptyMessage: 'Inbox is empty.',
  };

  const topBlurGradientColors = themeColors.isDark
    ? [
        themeColors.withOpacity(themeColors.background.primary(), 0.55),
        themeColors.withOpacity(themeColors.background.primary(), 0),
      ]
    : [themeColors.background.primary(), themeColors.withOpacity(themeColors.background.primary(), 0)];

  const renderTopSectionChrome = (styles: ReturnType<typeof createTabRootStyles>) => (
    <View style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ANCHOR_HEIGHT }]}>
      <BlurView
        tint={themeColors.isDark ? 'dark' : 'light'}
        intensity={1}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={topBlurGradientColors}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.topSectionRow} pointerEvents="box-none">
        {Platform.OS === 'android' && !isBrowseStack ? (
          <AnimatedReanimated.View
            style={[styles.topSectionCloseButton, closeButtonAnimatedStyle]}
            pointerEvents={androidInPlaceSelection ? 'auto' : 'none'}
          >
            <SelectionCloseButton onPress={handleCloseButtonPress} />
          </AnimatedReanimated.View>
        ) : (
          <View style={styles.topSectionCloseButton} pointerEvents="none" />
        )}
        <AnimatedReanimated.View style={[styles.miniHeader, miniHeaderStyle]} pointerEvents="none">
          <Text style={[styles.miniHeaderText, { color: themeColors.text.primary() }]}>
            {miniHeaderLabel}
          </Text>
        </AnimatedReanimated.View>
        {androidInPlaceSelection && !isBrowseStack ? (
          <SelectAllButton
            onPress={handleSelectAllInbox}
            label={selectAllLabel}
            style={styles.topSectionSelectAllButton}
          />
        ) : Platform.OS === 'android' && !isBrowseStack ? (
          <ScreenHeaderActions
            variant="dashboard"
            onDashboardPress={openDisplaySettings}
            style={styles.topSectionContextButton}
            tint="primary"
          />
        ) : isBrowseStack && Platform.OS === 'android' ? (
          <ScreenHeaderActions
            variant="dashboard"
            style={styles.topSectionContextButton}
            tint="primary"
          />
        ) : null}
      </View>
    </View>
  );

  if (!isBrowseStack) {
    return (
      <>
        {isSelectRoute && Platform.OS === 'ios' ? (
          <>
            <IosTaskSelectionCloseStackToolbar dismissWithRouterBack />
            <IosTaskSelectionSelectAllStackToolbar
              onPress={handleSelectAllInbox}
              allEligibleSelected={allEligibleSelected}
            />
          </>
        ) : null}
        <View style={{ flex: 1 }}>
          <ScreenContainer
            scrollable={false}
            paddingHorizontal={0}
            paddingVertical={0}
            safeAreaTop={false}
            safeAreaBottom={false}
            backgroundColor="transparent"
          >
            {error && inboxTasks.length === 0 ? (
              <Text style={[tabRootStyles.errorText, { color: semanticColors.error() }]}>
                {error}
              </Text>
            ) : (
              <ListCard
                key={isSelectRoute ? 'tab-inbox-select' : 'tab-inbox'}
                {...listCardCommonProps}
                loading={loading && inboxTasks.length === 0}
                scrollYSharedValue={scrollY}
                showsVerticalScrollIndicator
                paddingTop={TOP_SECTION_ANCHOR_HEIGHT}
                scrollPastTopInset
                bigTodayHeader
                bigHeaderLabel="Inbox"
                scrollEnabled
                paddingBottom={
                  isSelectRoute && Platform.OS === 'ios' ? 56 + 28 + insets.bottom : undefined
                }
              />
            )}
          </ScreenContainer>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: themeColors.background.primary(), zIndex: -1 },
            ]}
            pointerEvents="none"
          />
          {renderTopSectionChrome(tabRootStyles)}
        </View>
      </>
    );
  }

  const backButtonTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;

  return (
    <>
      {Platform.OS === 'ios' ? <IosBrowseBackStackToolbar /> : null}
      <IosDashboardOverflowToolbar hidden={Platform.OS === 'android' && isTaskSelectionActive} />
      <View style={{ flex: 1 }}>
        {renderTopSectionChrome(browseStyles)}

        {Platform.OS === 'android' ? (
          <View style={browseStyles.backButtonContainer} pointerEvents="box-none">
            <MainBackButton
              onPress={() => router.back()}
              top={backButtonTop}
              left={Paddings.screen}
            />
          </View>
        ) : null}

        <AnimatedReanimated.ScrollView
          style={browseStyles.scrollView}
          contentContainerStyle={browseStyles.scrollContent}
          contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={browseStyles.paddedHorizontal}>
            <AnimatedReanimated.View style={bigHeaderStyle}>
              <Text style={[browseStyles.bigHeader, { color: themeColors.text.primary() }]}>
                Inbox
              </Text>
            </AnimatedReanimated.View>
            {error ? (
              <Text style={[browseStyles.mutedLead, { color: themeColors.text.tertiary() }]}>
                {error}
              </Text>
            ) : null}
          </View>

          {loading && inboxTasks.length === 0 ? (
            <View style={browseStyles.loadingWrap}>
              <ActivityIndicator color={themeColors.text.tertiary()} />
            </View>
          ) : (
            <ListCard
              key="browse-inbox"
              {...listCardCommonProps}
              scrollEnabled={false}
              disableInitialLayoutTransition
            />
          )}

          <View style={browseStyles.bottomSpacer} />
        </AnimatedReanimated.ScrollView>
      </View>
    </>
  );
}

const createTabRootStyles = (
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
      paddingHorizontal: Paddings.screen,
    },
    topSectionCloseButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
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
    topSectionSelectAllButton: {
      marginLeft: 'auto',
      alignSelf: 'center',
    },
    miniHeader: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniHeaderText: {
      ...typography.getTextStyle('heading-3'),
    },
    errorText: {
      ...typography.getTextStyle('body-large'),
      marginTop: 20,
      textAlign: 'center',
    },
  });

const createBrowseStyles = (
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
    topSectionCloseButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
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
    loadingWrap: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    bottomSpacer: {
      height: 200,
    },
  });
