import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import GlassView from 'expo-glass-effect/build/GlassView';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useAppDispatch, store } from '@/store';
import { useLists, useTasks } from '@/store/hooks';
import { fetchTasks, updateTask, deleteTask } from '@/store/slices/tasks/tasksSlice';
import { MainCloseButton } from '@/components/ui/Button';
import { SFSymbolIcon, BrowseIcon } from '@/components/ui/Icon';
import { Paddings } from '@/constants/Paddings';
import {
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
} from '@/utils/recurrenceUtils';
import { Task, type List } from '@/types';
import {
  loadRecentSearches,
  loadRecentlyViewed,
  persistRecentSearches,
  persistRecentlyViewed,
  pushRecentSearch,
  pushRecentlyViewed,
  type RecentlyViewedEntry,
} from './browseSearchHistory';
import {
  BrowseSearchContent,
  DEFAULT_SEARCH_FILTER_CHIP_ID,
  filterListsForBrowseSearch,
  filterTasksByDescriptionForBrowseSearch,
  filterTasksByTitleForBrowseSearch,
  filterTasksForBrowseSearch,
} from '@/components/features/browse/BrowseSearchContent';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;

export default function BrowseSearchScreen() {
  const router = useGuardedRouter();
  const dispatch = useAppDispatch();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { width: windowWidth } = useWindowDimensions();
  const styles = createStyles(themeColors, typography, insets, headerHeight);
  const inputRef = useRef<TextInput>(null);
  const { lists, fetchLists, isLoading: listsLoading } = useLists();
  const { tasks, isLoading: tasksLoading } = useTasks();

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedEntry[]>([]);
  const [activeSearchFilterId, setActiveSearchFilterId] = useState<string>(DEFAULT_SEARCH_FILTER_CHIP_ID);
  const hasQuery = query.trim().length > 0;

  // no query = recent mode (chips hidden); typing auto-switches to top so first visible chip is selected
  useEffect(() => {
    if (hasQuery && activeSearchFilterId === DEFAULT_SEARCH_FILTER_CHIP_ID) {
      setActiveSearchFilterId('top');
      return;
    }
    if (!hasQuery && activeSearchFilterId !== DEFAULT_SEARCH_FILTER_CHIP_ID) {
      setActiveSearchFilterId(DEFAULT_SEARCH_FILTER_CHIP_ID);
    }
  }, [hasQuery, activeSearchFilterId]);

  // keep search scoped to this pushed screen so back resets state naturally
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [qs, rv] = await Promise.all([loadRecentSearches(), loadRecentlyViewed()]);
      if (!cancelled) {
        setRecentSearches(qs);
        setRecentlyViewed(rv);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        Keyboard.dismiss();
      };
    }, [])
  );

  const commitRecentSearch = useCallback((raw: string) => {
    setRecentSearches((prev) => {
      const next = pushRecentSearch(raw, prev);
      if (next === prev) return prev;
      void persistRecentSearches(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (activeSearchFilterId === 'task' || activeSearchFilterId === 'description' || activeSearchFilterId === 'top' || activeSearchFilterId === 'recent') {
      void dispatch(fetchTasks());
    }
    if (activeSearchFilterId === 'lists' || activeSearchFilterId === 'top' || activeSearchFilterId === 'recent') {
      void fetchLists();
    }
  }, [activeSearchFilterId, dispatch, fetchLists]);

  const taskSearchMatches = useMemo(() => (activeSearchFilterId === 'task' ? filterTasksForBrowseSearch(tasks, query) : []), [tasks, query, activeSearchFilterId]);
  const descriptionSearchMatches = useMemo(
    () => (activeSearchFilterId === 'description' ? filterTasksByDescriptionForBrowseSearch(tasks, query) : []),
    [tasks, query, activeSearchFilterId]
  );
  const listSearchMatches = useMemo(() => (activeSearchFilterId === 'lists' ? filterListsForBrowseSearch(lists, query) : []), [lists, query, activeSearchFilterId]);
  const topOrRecentTitleTasks = useMemo(
    () => (activeSearchFilterId === 'top' || activeSearchFilterId === 'recent' ? filterTasksByTitleForBrowseSearch(tasks, query) : []),
    [tasks, query, activeSearchFilterId]
  );
  const topOrRecentDescriptionTasks = useMemo(
    () => (activeSearchFilterId === 'top' || activeSearchFilterId === 'recent' ? filterTasksByDescriptionForBrowseSearch(tasks, query) : []),
    [tasks, query, activeSearchFilterId]
  );
  const topOrRecentListMatches = useMemo(
    () => (activeSearchFilterId === 'top' || activeSearchFilterId === 'recent' ? filterListsForBrowseSearch(lists, query) : []),
    [lists, query, activeSearchFilterId]
  );

  const browseSearchTaskTitleRightLabel = useCallback(
    (task: Task) => (task.listId ? lists.find((l) => l.id === task.listId)?.name ?? 'List' : 'Inbox'),
    [lists]
  );

  const handleRecentlyViewedPress = useCallback(
    (entry: RecentlyViewedEntry) => {
      setRecentlyViewed((prev) => {
        const next = pushRecentlyViewed(entry, prev);
        void persistRecentlyViewed(next);
        return next;
      });
      if (entry.kind === 'task') {
        router.push({ pathname: '/task/[taskId]', params: { taskId: entry.id } });
      } else {
        router.push(`/(tabs)/browse/list/${entry.id}` as any);
      }
    },
    [router]
  );

  const handleBrowseSearchTaskPress = useCallback(
    (task: Task) => {
      const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
      setRecentlyViewed((prev) => {
        const next = pushRecentlyViewed({ kind: 'task', id: baseId, label: task.title }, prev);
        void persistRecentlyViewed(next);
        return next;
      });
      router.push({
        pathname: '/task/[taskId]',
        params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) },
      });
    },
    [router]
  );

  const handleBrowseSearchTaskComplete = useCallback(
    (task: Task, targetCompleted?: boolean) => {
      const isCompleted = targetCompleted ?? !task.isCompleted;
      if (isExpandedRecurrenceId(task.id)) {
        const baseId = getBaseTaskId(task.id);
        const occurrenceDate = getOccurrenceDateFromId(task.id);
        if (!occurrenceDate) return;
        const tasksFromStore = store.getState().tasks.tasks;
        const baseTask = tasksFromStore.find((t) => t.id === baseId);
        if (!baseTask) return;
        const completions = baseTask.metadata?.recurrence_completions ?? [];
        const newCompletions = isCompleted ? [...completions, occurrenceDate] : completions.filter((d) => d !== occurrenceDate);
        dispatch(updateTask({ id: baseId, updates: { id: baseId, metadata: { ...baseTask.metadata, recurrence_completions: newCompletions } } }));
      } else {
        dispatch(updateTask({ id: task.id, updates: { id: task.id, isCompleted } }));
      }
    },
    [dispatch]
  );

  const handleBrowseSearchTaskEdit = useCallback((task: Task) => {
    handleBrowseSearchTaskPress(task);
  }, [handleBrowseSearchTaskPress]);

  const handleBrowseSearchTaskDelete = useCallback((task: Task) => {
    const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    dispatch(deleteTask(taskId));
  }, [dispatch]);

  const handleBrowseSearchListPress = useCallback(
    (list: List) => {
      setRecentlyViewed((prev) => {
        const next = pushRecentlyViewed({ kind: 'list', id: list.id, label: list.name }, prev);
        void persistRecentlyViewed(next);
        return next;
      });
      router.push(`/(tabs)/browse/list/${list.id}` as any);
    },
    [router]
  );

  const searchInput = (
    <Pressable
      style={[
        styles.searchInputWrap,
        Platform.OS === 'ios'
          ? { width: Math.min(360, Math.max(260, windowWidth - 82)), marginLeft: -0 }
          : null,
      ]}
      onPress={() => inputRef.current?.focus()}
    >
      <SFSymbolIcon
        name="magnifyingglass"
        size={18}
        color={themeColors.text.tertiary()}
        fallback={<BrowseIcon size={16} color={themeColors.text.tertiary()} />}
      />
      <TextInput
        ref={inputRef}
        value={query}
        onChangeText={setQuery}
        placeholder="Search"
        placeholderTextColor={themeColors.text.tertiary()}
        style={[styles.searchInput, { color: themeColors.text.primary() }]}
        returnKeyType="search"
        onSubmitEditing={() => commitRecentSearch(query)}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* keep chrome fade behind the top search toolbar area (search + close) in all search states */}
      <View pointerEvents="none" style={styles.topSectionAnchor}>
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
      </View>
      {Platform.OS === 'ios' ? (
        <>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.View>{searchInput}</Stack.Toolbar.View>
          </Stack.Toolbar>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              icon="xmark"
              onPress={() => router.back()}
              accessibilityLabel="Close"
              tintColor={themeColors.text.primary()}
            />
          </Stack.Toolbar>
        </>
      ) : (
        <View style={styles.androidTopRow}>
          <MainCloseButton layout="inline" onPress={() => router.back()} />
          <GlassView style={styles.androidSearchGlass} glassEffectStyle="clear" tintColor={themeColors.background.primary() as any} isInteractive>
            {searchInput}
          </GlassView>
        </View>
      )}
      <View style={styles.content}>
        <BrowseSearchContent
          query={query}
          setQuery={setQuery}
          activeSearchFilterId={activeSearchFilterId}
          onToggleFilter={setActiveSearchFilterId}
          tasks={tasks}
          lists={lists}
          tasksLoading={tasksLoading}
          listsLoading={listsLoading}
          recentSearches={recentSearches}
          recentlyViewed={recentlyViewed}
          taskSearchMatches={taskSearchMatches}
          descriptionSearchMatches={descriptionSearchMatches}
          listSearchMatches={listSearchMatches}
          topOrRecentTitleTasks={topOrRecentTitleTasks}
          topOrRecentDescriptionTasks={topOrRecentDescriptionTasks}
          topOrRecentListMatches={topOrRecentListMatches}
          browseSearchTaskTitleRightLabel={browseSearchTaskTitleRightLabel}
          handleRecentlyViewedPress={handleRecentlyViewedPress}
          handleBrowseSearchTaskPress={handleBrowseSearchTaskPress}
          handleBrowseSearchTaskComplete={handleBrowseSearchTaskComplete}
          handleBrowseSearchTaskEdit={handleBrowseSearchTaskEdit}
          handleBrowseSearchTaskDelete={handleBrowseSearchTaskDelete}
          handleBrowseSearchListPress={handleBrowseSearchListPress}
        />
      </View>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>,
  headerHeight: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background.primary(),
    },
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 0,
      overflow: 'hidden',
      height: insets.top + TOP_SECTION_ANCHOR_HEIGHT,
    },
    content: {
      flex: 1,
      // match browse stack top-section spacing pattern used by other screens.
      paddingTop:
        Platform.OS === 'ios'
          ? headerHeight + 8
          : insets.top + TOP_SECTION_ANCHOR_HEIGHT + 12,
    },
    searchInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: 'transparent',
      minWidth: 220,
      maxWidth: 260,
    },
    searchInput: {
      ...typography.getTextStyle('body-medium'),
      marginLeft: 8,
      flex: 1,
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    androidTopRow: {
      position: 'absolute',
      top: insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2,
      left: Paddings.screen,
      right: Paddings.screen,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    androidSearchGlass: {
      flex: 1,
      borderRadius: 20,
      overflow: 'visible',
    },
  });
