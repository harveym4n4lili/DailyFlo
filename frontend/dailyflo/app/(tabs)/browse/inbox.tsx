/**
 * Inbox — browse stack. Shows tasks with no list (inbox), not completed, not deleted.
 * GET /tasks/inbox/ returns the rows; ListCard groups recurring vs one-off like Today/list detail.
 * Complete/delete dispatch Redux thunks then refetch inbox so the list stays aligned with the server.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
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
import { MainBackButton } from '@/components/ui/button';
import { ScreenHeaderActions } from '@/components/ui';
import { ClockIcon } from '@/components/ui/icon';
import { ListCard } from '@/components/ui/card';
import { Paddings } from '@/constants/Paddings';
import { browseScrollPaddingTop } from '@/constants/browseScrollPaddingTop';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import { useUI } from '@/store/hooks';
import { useAppDispatch, store } from '@/store';
import { updateTask, deleteTask, transformApiTaskToTask } from '@/store/slices/tasks/tasksSlice';
import tasksApi from '@/services/api/tasks';
import { Task } from '@/types';
import {
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
} from '@/utils/recurrenceUtils';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;
const SCROLL_THRESHOLD = 16;

export default function InboxScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = createStyles(typography, insets);
  const dispatch = useAppDispatch();
  const { enterSelectionMode, selection, toggleItemSelection } = useUI();

  const [inboxTasks, setInboxTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // pull inbox slice from api whenever this screen is focused (after edits elsewhere too)
  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await tasksApi.fetchInboxTasks();
      setInboxTasks(raw.map((row) => transformApiTaskToTask(row)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load inbox');
      setInboxTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadInbox();
    }, [loadInbox])
  );

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

  const backButtonTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;

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
        // redux may not have this task yet if user never opened Today; fall back to inbox list
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

  const isSelectionMode = selection.isSelectionMode && selection.selectionType === 'tasks';

  return (
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
              Inbox
            </Text>
          </Animated.View>
          <ScreenHeaderActions
            variant="dashboard"
            contextMenuItems={[
              {
                id: 'activity-log',
                label: 'Activity log',
                iconComponent: (color: string) => <ClockIcon size={20} color={color} isSolid />,
                systemImage: 'clock.arrow.circlepath',
                onPress: () => router.push('/activity-log' as any),
              },
              {
                id: 'select-tasks',
                label: 'Select Tasks',
                systemImage: 'square.and.pencil',
                onPress: () => enterSelectionMode('tasks'),
              },
            ]}
            dropdownAnchorTopOffset={insets.top + TOP_SECTION_ROW_HEIGHT}
            dropdownAnchorRightOffset={24}
            style={styles.topSectionContextButton}
            tint="primary"
          />
        </View>
      </View>

      <View style={styles.backButtonContainer} pointerEvents="box-none">
        <MainBackButton
          onPress={() => router.back()}
          top={backButtonTop}
          left={Paddings.screen}
        />
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
            <Text style={[styles.bigHeader, { color: themeColors.text.primary() }]}>Inbox</Text>
          </Animated.View>
          {error ? (
            <Text style={[styles.mutedLead, { color: themeColors.text.tertiary() }]}>{error}</Text>
          ) : null}
        </View>

        {loading && inboxTasks.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={themeColors.text.tertiary()} />
          </View>
        ) : (
          <ListCard
            key="browse-inbox"
            {...LIST_CARD_TASK_ROW_PRESET_TODAY}
            tasks={inboxTasks}
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
            emptyMessage="Inbox is empty."
            loading={loading && inboxTasks.length > 0}
            scrollEnabled={false}
            disableInitialLayoutTransition
          />
        )}

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
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
    loadingWrap: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    bottomSpacer: {
      height: 200,
    },
  });
