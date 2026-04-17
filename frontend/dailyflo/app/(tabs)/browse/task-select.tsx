/**
 * ios: single browse-stack route for task multi-select (inbox or list detail) so native toolbars animate on push.
 * params: source=inbox | list, listId when source=list — set by IosDashboardOverflowToolbar from the parent screen.
 * android: not used (browse inbox/list keep in-place selection until a header/menu entry exists).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { IosTaskSelectionBottomToolbar } from '@/components/navigation/IosTaskSelectionBottomToolbar';
import { IosTaskSelectionCloseStackToolbar } from '@/components/navigation/IosTaskSelectionCloseStackToolbar';
import { IosTaskSelectionSelectAllStackToolbar } from '@/components/navigation/IosTaskSelectionSelectAllStackToolbar';
import { ListCard } from '@/components/ui/card';
import { Paddings } from '@/constants/Paddings';
import { browseScrollPaddingTop } from '@/constants/browseScrollPaddingTop';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import { useUI, useLists } from '@/store/hooks';
import { useAppDispatch, store } from '@/store';
import { updateTask, deleteTask, transformApiTaskToTask } from '@/store/slices/tasks/tasksSlice';
import tasksApi from '@/services/api/tasks';
import listsApi from '@/services/api/lists';
import { Task } from '@/types';
import {
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
} from '@/utils/recurrenceUtils';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;
const SCROLL_THRESHOLD = 16;

function normParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default function BrowseTaskSelectScreen() {
  const router = useRouter();
  const raw = useLocalSearchParams<{ source?: string | string[]; listId?: string | string[] }>();
  const source = normParam(raw.source);
  const listId = normParam(raw.listId);

  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(typography, insets), [typography, insets]);
  const dispatch = useAppDispatch();
  const { selection, toggleItemSelection, selectAllItems, clearSelection, enterSelectionMode, exitSelectionMode } =
    useUI();
  const { lists, fetchLists } = useLists();

  const [inboxTasks, setInboxTasks] = useState<Task[]>([]);
  const [listTasks, setListTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(
    () => (listId ? lists.find((l) => l.id === listId) : undefined),
    [lists, listId],
  );
  const headerTitle = source === 'list' ? list?.name ?? 'List' : 'Inbox';

  const tasks = source === 'list' ? listTasks : inboxTasks;

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rawRows = await tasksApi.fetchInboxTasks();
      setInboxTasks(rawRows.map((row) => transformApiTaskToTask(row)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load inbox');
      setInboxTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (source === 'list') {
        void fetchLists();
      }
    }, [source, fetchLists]),
  );

  useEffect(() => {
    if (source !== 'list' || !listId) {
      setListTasks([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const rawRows = await listsApi.fetchTasksForList(listId);
        if (cancelled) return;
        setListTasks(rawRows.map((row) => transformApiTaskToTask(row)));
      } catch {
        if (!cancelled) {
          setError('Could not load list tasks');
          setListTasks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, listId]);

  useFocusEffect(
    useCallback(() => {
      if (source === 'inbox') {
        void loadInbox();
      }
    }, [source, loadInbox]),
  );

  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    enterSelectionMode('tasks');
    return () => exitSelectionMode();
  }, [enterSelectionMode, exitSelectionMode]);

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

  const bigHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SCROLL_THRESHOLD], [1, 0], Extrapolation.CLAMP),
  }));

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
    [router],
  );

  const handleTaskComplete = useCallback(
    (task: Task, targetCompleted?: boolean) => {
      const isCompleted = targetCompleted ?? !task.isCompleted;
      if (source === 'list') {
        setListTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  isCompleted,
                  completedAt: isCompleted ? new Date().toISOString() : null,
                }
              : t,
          ),
        );
        return;
      }
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
              }),
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
              }),
            ).unwrap();
            void loadInbox();
          } catch {
            void loadInbox();
          }
        })();
      }
    },
    [dispatch, loadInbox, inboxTasks, source],
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
    [router],
  );

  const handleTaskDelete = useCallback(
    (task: Task) => {
      if (source === 'list') {
        setListTasks((prev) => prev.filter((t) => t.id !== task.id));
        return;
      }
      const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      void (async () => {
        try {
          await dispatch(deleteTask(taskId)).unwrap();
        } finally {
          void loadInbox();
        }
      })();
    },
    [dispatch, loadInbox, source],
  );

  const isSelectionMode = selection.isSelectionMode && selection.selectionType === 'tasks';

  const eligibleIds = useMemo(
    () => tasks.filter((t) => !t.isCompleted && !t.softDeleted).map((t) => t.id),
    [tasks],
  );
  const allEligibleSelected =
    eligibleIds.length > 0 && eligibleIds.every((id) => selection.selectedItems.includes(id));

  const handleSelectAll = useCallback(() => {
    if (!isSelectionMode) return;
    if (allEligibleSelected) {
      clearSelection();
    } else {
      selectAllItems(eligibleIds);
    }
  }, [isSelectionMode, allEligibleSelected, eligibleIds, selectAllItems, clearSelection]);

  if (Platform.OS !== 'ios') {
    return null;
  }

  if (source !== 'inbox' && source !== 'list') {
    return null;
  }

  if (source === 'list' && !listId) {
    return null;
  }

  return (
    <>
      <IosTaskSelectionCloseStackToolbar dismissWithRouterBack />
      <IosTaskSelectionSelectAllStackToolbar
        onPress={handleSelectAll}
        allEligibleSelected={allEligibleSelected}
      />
      <IosTaskSelectionBottomToolbar />
      <View style={{ flex: 1 }}>
        <View style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ANCHOR_HEIGHT }]}>
          <BlurView tint={themeColors.isDark ? 'dark' : 'light'} intensity={1} style={StyleSheet.absoluteFill} />
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
              <Text style={[styles.miniHeaderText, { color: themeColors.text.primary() }]} numberOfLines={1}>
                {headerTitle}
              </Text>
            </Animated.View>
          </View>
        </View>

        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
                {headerTitle}
              </Text>
            </Animated.View>
            {error ? (
              <Text style={[styles.mutedLead, { color: themeColors.text.tertiary() }]}>{error}</Text>
            ) : null}
            {source === 'list' && !list ? (
              <Text style={[styles.mutedLead, { color: themeColors.text.tertiary() }]}>
                This list could not be found. Go back and pick another list.
              </Text>
            ) : null}
          </View>

          {loading && tasks.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={themeColors.text.tertiary()} />
            </View>
          ) : source === 'list' && !list ? null : (
            <ListCard
              key={source === 'inbox' ? 'browse-inbox-select' : `browse-list-select-${listId}`}
              {...LIST_CARD_TASK_ROW_PRESET_TODAY}
              tasks={tasks}
              groupBy="routine"
              sortBy="createdAt"
              sortDirection="desc"
              selectionMode={isSelectionMode}
              selectedTaskIds={selection.selectedItems}
              onToggleTaskSelection={isSelectionMode ? toggleItemSelection : undefined}
              hideCompletedTasks
              onTaskPress={handleTaskPress}
              onTaskComplete={handleTaskComplete}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              paddingHorizontal={Paddings.screen}
              emptyMessage={source === 'inbox' ? 'Inbox is empty.' : 'No tasks in this list yet.'}
              loading={loading && tasks.length > 0}
              scrollEnabled={false}
              disableInitialLayoutTransition
            />
          )}

          <View style={styles.bottomSpacer} />
        </Animated.ScrollView>
      </View>
    </>
  );
}

const createStyles = (typography: ReturnType<typeof useTypography>, insets: ReturnType<typeof useSafeAreaInsets>) =>
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
      // extra space above native bottom Stack.Toolbar on ios task-select
      height: 280,
    },
  });
