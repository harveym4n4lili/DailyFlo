/**
 * Route content for /list-select — same presentation as date-select (root stack formSheet + liquid glass).
 * taskId: PATCH listId then update CreateTaskDraftContext.pickedListId.
 * habitId / forHabit: update CreateHabitDraftContext.pickedListId (+ PATCH on detail).
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import GlassView from 'expo-glass-effect/build/GlassView';
import { Ionicons } from '@expo/vector-icons';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { useCreateHabitDraft } from '@/app/habit/CreateHabitDraftContext';
import { useLists, useTasks, useHabits } from '@/store/hooks';
import { useAppDispatch } from '@/store';
import { updateTask } from '@/store/slices/tasks/tasksSlice';
import { updateHabit } from '@/store/slices/habits/habitsSlice';
import { MainCloseButton } from '@/components/ui/Button';
import { BrowseListSearchCard } from '@/components/ui/Card';
import { BrowseIcon, SFSymbolIcon } from '@/components/ui/Icon';
import { getTypographyStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import {
  ALERT_SHEET_CLOSE_TOP,
  ALERT_SHEET_HEADER_TRAILING_INSET,
  ALERT_SHEET_HORIZONTAL_INSET,
  ALERT_SHEET_SCROLL_PADDING_TOP,
} from './alertSheetChrome';
import {
  buildListSelectRows,
  formatListSelectMeta,
  type ListSelectRowModel,
} from './listSelectUtils';

const LIST_SELECT_HEADING_GAP = Paddings.listItemVertical + Paddings.groupedListHeaderContentGap;
const SEARCH_BAR_HEIGHT = 40;

export type ListSelectRow = { id: string | null; name: string };

export function ListSelectScreen() {
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const router = useGuardedRouter();
  const params = useLocalSearchParams<{ taskId?: string; habitId?: string; forHabit?: string }>();
  const taskIdForPersist =
    typeof params.taskId === 'string' && params.taskId.length > 0 ? params.taskId : undefined;
  const habitIdForDraft =
    typeof params.habitId === 'string' && params.habitId.length > 0 ? params.habitId : undefined;
  const forHabitDraft = params.forHabit === '1' || params.forHabit === 'true';
  const isHabitMode = Boolean(habitIdForDraft) || forHabitDraft;

  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const dispatch = useAppDispatch();
  const { draft: taskDraft, setDraft: setTaskDraft } = useCreateTaskDraft();
  const { draft: habitDraft, setDraft: setHabitDraft } = useCreateHabitDraft();
  const { lists: reduxLists, fetchLists } = useLists();
  const { tasks } = useTasks();
  const { allHabits, fetchAll } = useHabits();

  const [query, setQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      void fetchLists();
      void fetchAll();
    }, [fetchLists, fetchAll]),
  );

  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass ? 'transparent' : themeColors.background.secondary();

  const pickedListId = isHabitMode ? habitDraft.pickedListId : taskDraft.pickedListId;

  const rows = useMemo(
    () => buildListSelectRows(reduxLists, tasks, allHabits, isHabitMode, query),
    [reduxLists, tasks, allHabits, isHabitMode, query],
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handlePick = useCallback(
    async (id: string | null) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (isHabitMode) {
        if (habitIdForDraft) {
          try {
            await dispatch(
              updateHabit({
                id: habitIdForDraft,
                input: { listId: id === null ? null : id },
              }),
            ).unwrap();
          } catch (e) {
            console.error('ListSelectScreen: failed to persist habit listId', e);
            return;
          }
        }
        setHabitDraft({ pickedListId: id === null ? null : id });
        router.back();
        return;
      }

      if (taskIdForPersist) {
        try {
          await dispatch(
            updateTask({
              id: taskIdForPersist,
              updates: { id: taskIdForPersist, listId: id === null ? null : id },
            }),
          ).unwrap();
        } catch (e) {
          console.error('ListSelectScreen: failed to persist listId', e);
          return;
        }
      }
      setTaskDraft({ pickedListId: id === null ? null : id });
      router.back();
    },
    [
      dispatch,
      habitIdForDraft,
      isHabitMode,
      router,
      setHabitDraft,
      setTaskDraft,
      taskIdForPersist,
    ],
  );

  const renderRow = useCallback(
    ({ item, index }: { item: ListSelectRowModel; index: number }) => {
      const selected =
        item.id === null ? pickedListId === null : pickedListId === item.id;
      return (
        <BrowseListSearchCard
          name={item.name}
          metaText={formatListSelectMeta(item.taskCount, item.habitCount)}
          isSelected={selected}
          leadingIcon={item.leadingIcon}
          onPress={() => {
            void handlePick(item.id);
          }}
          isLastItem={index === rows.length - 1}
        />
      );
    },
    [handlePick, pickedListId, rows.length],
  );

  const searchField = (
    <Pressable
      style={[
        styles.searchInputWrap,
        {
          backgroundColor: useLiquidGlass
            ? themeColors.withOpacity(themeColors.background.elevated(), 0.55)
            : themeColors.background.elevated(),
        },
      ]}
      onPress={() => searchInputRef.current?.focus()}
    >
      <SFSymbolIcon
        name="magnifyingglass"
        size={18}
        color={themeColors.text.tertiary()}
        fallback={<BrowseIcon size={16} color={themeColors.text.tertiary()} />}
      />
      <TextInput
        ref={searchInputRef}
        value={query}
        onChangeText={setQuery}
        placeholder="Search lists"
        placeholderTextColor={themeColors.text.tertiary()}
        style={[styles.searchInput, { color: themeColors.text.primary() }]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.headerBlock, { paddingTop: ALERT_SHEET_SCROLL_PADDING_TOP }]}>
        <Text
          style={[
            getTypographyStyle('heading-3', typographyPlatform),
            styles.heading,
            {
              color: themeColors.text.primary(),
              paddingRight: ALERT_SHEET_HEADER_TRAILING_INSET,
            },
          ]}
          accessibilityRole="header"
          accessibilityLabel="Select list"
        >
          Select list
        </Text>
        {Platform.OS === 'ios' && useLiquidGlass ? (
          <GlassView
            style={styles.searchGlass}
            glassEffectStyle="clear"
            tintColor={themeColors.background.root() as string}
            isInteractive
          >
            {searchField}
          </GlassView>
        ) : (
          searchField
        )}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => (item.id === null ? 'default-bucket' : item.id)}
        renderItem={renderRow}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: Paddings.screen,
            paddingBottom: insets.bottom + Paddings.modalBottomExtra,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text
            style={[
              getTypographyStyle('body-medium', typographyPlatform),
              styles.emptyText,
              { color: themeColors.text.secondary() },
            ]}
          >
            No lists match your search.
          </Text>
        }
      />

      <View style={styles.headerOverlay} pointerEvents="box-none">
        <MainCloseButton
          onPress={handleClose}
          top={ALERT_SHEET_CLOSE_TOP}
          right={ALERT_SHEET_HORIZONTAL_INSET}
          iconEmphasis="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlock: {
    paddingHorizontal: ALERT_SHEET_HORIZONTAL_INSET,
    zIndex: 1,
  },
  heading: {
    marginBottom: LIST_SELECT_HEADING_GAP,
  },
  searchGlass: {
    borderRadius: 20,
    overflow: 'visible',
    marginBottom: 12,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: SEARCH_BAR_HEIGHT,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 0,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Paddings.section,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

export default ListSelectScreen;
