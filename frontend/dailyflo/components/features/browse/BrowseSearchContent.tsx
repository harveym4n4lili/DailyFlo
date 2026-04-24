import React, { useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import GlassView from 'expo-glass-effect/build/GlassView';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { GroupedListHeader } from '@/components/ui/list/GroupedList';
import { SFSymbolIcon, ClockIcon } from '@/components/ui/icon';
import { TaskCard, BrowseDescriptionSearchCard, BrowseListSearchCard } from '@/components/ui/card';
import { SolidSeparator } from '@/components/ui/borders';
import { CHECKBOX_SIZE_DEFAULT } from '@/components/ui/button';
import { Paddings } from '@/constants/Paddings';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Task, type List } from '@/types';
import type { RecentlyViewedEntry } from '@/app/(tabs)/browse/browseSearchHistory';

const CHIP_COLOR_ANIM_MS = 260;
const SEARCH_CHIPS_OVERLAY_HEIGHT = 56;
export const DEFAULT_SEARCH_FILTER_CHIP_ID = 'recent';
export const SEARCH_FILTER_CHIPS: { id: string; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'task', label: 'Task' },
  { id: 'description', label: 'Description' },
  { id: 'lists', label: 'Lists' },
];

// title-first ranking keeps task results stable while typing
export function filterTasksForBrowseSearch(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const active = tasks.filter((t) => !t.softDeleted);
  return active
    .map((task) => {
      const title = task.title.toLowerCase();
      const desc = (task.description || '').toLowerCase();
      if (title === q) return { task, score: 100_000 };
      if (title.startsWith(q)) return { task, score: 50_000 - title.length };
      const titleIndex = title.indexOf(q);
      if (titleIndex >= 0) return { task, score: 40_000 - titleIndex * 100 - title.length * 0.01 };
      const descIndex = desc.indexOf(q);
      if (descIndex >= 0) return { task, score: 20_000 - descIndex * 50 };
      return { task, score: -1 };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.task);
}

// top/recent task rows only use title matches; description rows have their own card
export function filterTasksByTitleForBrowseSearch(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const active = tasks.filter((t) => !t.softDeleted);
  return active
    .map((task) => {
      const title = task.title.toLowerCase();
      if (title === q) return { task, score: 100_000 };
      if (title.startsWith(q)) return { task, score: 50_000 - title.length };
      const titleIndex = title.indexOf(q);
      if (titleIndex >= 0) return { task, score: 40_000 - titleIndex * 100 - title.length * 0.01 };
      return { task, score: -1 };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.task);
}

// description tab keeps note/body matches separate from title rows
export function filterTasksByDescriptionForBrowseSearch(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const active = tasks.filter((t) => !t.softDeleted && (t.description || '').trim().length > 0);
  return active
    .map((task) => {
      const desc = (task.description || '').toLowerCase();
      const descIndex = desc.indexOf(q);
      return { task, score: descIndex < 0 ? -1 : 10_000 - descIndex * 10 };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.task);
}

export function filterListsForBrowseSearch(lists: List[], query: string): List[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return lists.filter((list) => {
    const name = list.name.toLowerCase();
    const desc = (list.description ?? '').toLowerCase();
    return name.includes(q) || desc.includes(q);
  });
}

function BrowseSearchFilterChip({
  chip,
  selected,
  onToggle,
}: {
  chip: { id: string; label: string };
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);
  const progress = useSharedValue(selected ? 1 : 0);
  // cache theme colors on JS thread so worklets never call theme color functions directly
  // match selected chips to the same fill token the FAB uses
  const selectedTint = themeColors.primaryButton.fill();
  const primaryText = themeColors.text.primary();
  const invertedText = '#FFFFFF';
  const idlePill = themeColors.background.primarySecondaryBlend();

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: CHIP_COLOR_ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [selected, progress]);

  const tintWashStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['rgba(0,0,0,0)', selectedTint]),
  }));
  const labelAnimStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [primaryText, invertedText]),
  }));
  const androidPillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [idlePill, selectedTint]),
  }));

  if (Platform.OS === 'ios') {
    return (
      <GlassView style={styles.searchFilterChipGlass} glassEffectStyle="clear" tintColor={themeColors.background.primary() as any} isInteractive>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }, tintWashStyle]} />
        <Pressable onPress={() => onToggle(chip.id)} style={styles.searchFilterChipInner}>
          <Animated.Text style={[styles.searchFilterChipLabel, labelAnimStyle]}>{chip.label}</Animated.Text>
        </Pressable>
      </GlassView>
    );
  }

  return (
    <Pressable onPress={() => onToggle(chip.id)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
      <Animated.View style={[styles.searchFilterChipAndroid, androidPillStyle]}>
        <Animated.Text style={[styles.searchFilterChipLabel, labelAnimStyle]}>{chip.label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

type BrowseSearchContentProps = {
  query: string;
  setQuery: (value: string) => void;
  activeSearchFilterId: string;
  onToggleFilter: (id: string) => void;
  tasks: Task[];
  lists: List[];
  tasksLoading: boolean;
  listsLoading: boolean;
  recentSearches: string[];
  recentlyViewed: RecentlyViewedEntry[];
  taskSearchMatches: Task[];
  descriptionSearchMatches: Task[];
  listSearchMatches: List[];
  topOrRecentTitleTasks: Task[];
  topOrRecentDescriptionTasks: Task[];
  topOrRecentListMatches: List[];
  browseSearchTaskTitleRightLabel: (task: Task) => string;
  handleRecentlyViewedPress: (entry: RecentlyViewedEntry) => void;
  handleBrowseSearchTaskPress: (task: Task) => void;
  handleBrowseSearchTaskComplete: (task: Task, targetCompleted?: boolean) => void;
  handleBrowseSearchTaskEdit: (task: Task) => void;
  handleBrowseSearchTaskDelete: (task: Task) => void;
  handleBrowseSearchListPress: (list: List) => void;
};

export function BrowseSearchContent(props: BrowseSearchContentProps) {
  const {
    query,
    setQuery,
    activeSearchFilterId,
    onToggleFilter,
    tasks,
    lists,
    tasksLoading,
    listsLoading,
    recentSearches,
    recentlyViewed,
    taskSearchMatches,
    descriptionSearchMatches,
    listSearchMatches,
    topOrRecentTitleTasks,
    topOrRecentDescriptionTasks,
    topOrRecentListMatches,
    browseSearchTaskTitleRightLabel,
    handleRecentlyViewedPress,
    handleBrowseSearchTaskPress,
    handleBrowseSearchTaskComplete,
    handleBrowseSearchTaskEdit,
    handleBrowseSearchTaskDelete,
    handleBrowseSearchListPress,
  } = props;
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={[
          styles.resultsContent,
          query.trim().length > 0 ? styles.resultsContentWithChips : null,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {activeSearchFilterId === 'recent' ? (
          <>
            <GroupedListHeader title="Recent searches" />
            {recentSearches.length === 0 ? (
              <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>Search terms you submit appear here (up to four).</Text>
            ) : (
              <View>
                {recentSearches.map((q, i) => (
                  <Pressable key={`${q}-${i}`} onPress={() => setQuery(q)} style={[styles.recentSearchRow, i < recentSearches.length - 1 && styles.recentSearchRowSpacing]}>
                    <SFSymbolIcon name="clock.arrow.circlepath" size={20} color={themeColors.text.tertiary()} fallback={<ClockIcon size={18} color={themeColors.text.tertiary()} />} />
                    <Text style={[styles.recentSearchRowText, { color: themeColors.text.primary() }]} numberOfLines={2}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <GroupedListHeader title="Recently viewed" style={styles.groupHeaderGap} />
            {recentlyViewed.length === 0 ? (
              <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>Tasks and lists you open from search appear here (up to six).</Text>
            ) : (
              <View>
                {recentlyViewed.map((entry, i) => {
                  const isLast = i === recentlyViewed.length - 1;
                  if (entry.kind === 'task') {
                    const task = tasks.find((t) => t.id === entry.id);
                    if (task) {
                      return (
                        <TaskCard
                          key={`task:${entry.id}`}
                          task={task}
                          {...LIST_CARD_TASK_ROW_PRESET_TODAY}
                          titleRightLabel={browseSearchTaskTitleRightLabel(task)}
                          titleRightShowLeaf
                          onPress={handleBrowseSearchTaskPress}
                          onComplete={handleBrowseSearchTaskComplete}
                          onEdit={handleBrowseSearchTaskEdit}
                          onDelete={handleBrowseSearchTaskDelete}
                          isFirstItem={i === 0}
                          isLastItem={isLast}
                          separatorPaddingHorizontal={Paddings.screen}
                        />
                      );
                    }
                    return (
                      <View key={`task:${entry.id}`}>
                        <Pressable onPress={() => handleRecentlyViewedPress(entry)} style={styles.recentSearchRow}>
                          <SFSymbolIcon name="clock.arrow.circlepath" size={20} color={themeColors.text.tertiary()} fallback={<ClockIcon size={18} color={themeColors.text.tertiary()} />} />
                          <Text style={[styles.recentSearchRowText, { color: themeColors.text.secondary() }]} numberOfLines={2}>{entry.label}</Text>
                        </Pressable>
                        {!isLast ? <SolidSeparator paddingLeft={CHECKBOX_SIZE_DEFAULT + 12} paddingRight={0} /> : null}
                      </View>
                    );
                  }
                  return (
                    <BrowseListSearchCard
                      key={`list:${entry.id}`}
                      name={lists.find((l) => l.id === entry.id)?.name ?? entry.label}
                      onPress={() => handleRecentlyViewedPress(entry)}
                      isLastItem={isLast}
                      separatorPaddingHorizontal={Paddings.screen}
                      cardSpacing={0}
                    />
                  );
                })}
              </View>
            )}
          </>
        ) : null}

        {(activeSearchFilterId === 'top' || (activeSearchFilterId === 'recent' && query.trim() !== '')) ? (
          <>
            {(tasksLoading && tasks.length === 0) || (listsLoading && lists.length === 0) ? <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>Loading…</Text> : null}
            {query.trim() === '' && activeSearchFilterId === 'top' ? <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>Type to search tasks, descriptions, and lists together.</Text> : null}
            {query.trim() !== '' && topOrRecentTitleTasks.length === 0 && topOrRecentDescriptionTasks.length === 0 && topOrRecentListMatches.length === 0 ? (
              <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>No tasks, descriptions, or lists match “{query.trim()}”.</Text>
            ) : null}
            {topOrRecentTitleTasks.length > 0 ? (
              <>
                <GroupedListHeader title="Tasks" style={styles.groupHeaderGap} />
                {topOrRecentTitleTasks.map((task, i) => (
                  <TaskCard
                    key={`top:${task.id}`}
                    task={task}
                    {...LIST_CARD_TASK_ROW_PRESET_TODAY}
                    titleRightLabel={browseSearchTaskTitleRightLabel(task)}
                    titleRightShowLeaf
                    onPress={handleBrowseSearchTaskPress}
                    onComplete={handleBrowseSearchTaskComplete}
                    onEdit={handleBrowseSearchTaskEdit}
                    onDelete={handleBrowseSearchTaskDelete}
                    isFirstItem={i === 0}
                    isLastItem={i === topOrRecentTitleTasks.length - 1 && topOrRecentDescriptionTasks.length === 0 && topOrRecentListMatches.length === 0}
                    separatorPaddingHorizontal={Paddings.screen}
                  />
                ))}
              </>
            ) : null}
            {topOrRecentDescriptionTasks.length > 0 ? (
              <>
                <GroupedListHeader title="Descriptions" style={styles.groupHeaderGap} />
                {topOrRecentDescriptionTasks.map((task, i) => (
                  <BrowseDescriptionSearchCard
                    key={`desc:${task.id}`}
                    descriptionText={(task.description || '').trim()}
                    taskTitle={task.title}
                    query={query}
                    listOrInboxLabel={browseSearchTaskTitleRightLabel(task)}
                    onPress={() => handleBrowseSearchTaskPress(task)}
                    isLastItem={i === topOrRecentDescriptionTasks.length - 1 && topOrRecentListMatches.length === 0}
                    separatorPaddingHorizontal={Paddings.screen}
                    cardSpacing={0}
                  />
                ))}
              </>
            ) : null}
            {topOrRecentListMatches.length > 0 ? (
              <>
                <GroupedListHeader title="Lists" style={styles.groupHeaderGap} />
                {topOrRecentListMatches.map((list, i) => (
                  <BrowseListSearchCard
                    key={`list:${list.id}`}
                    name={list.name}
                    onPress={() => handleBrowseSearchListPress(list)}
                    isLastItem={i === topOrRecentListMatches.length - 1}
                    separatorPaddingHorizontal={Paddings.screen}
                    cardSpacing={0}
                  />
                ))}
              </>
            ) : null}
          </>
        ) : null}

        {activeSearchFilterId === 'task' ? (
          query.trim() === '' ? <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>Type to search tasks by title or description.</Text> : taskSearchMatches.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              {...LIST_CARD_TASK_ROW_PRESET_TODAY}
              titleRightLabel={browseSearchTaskTitleRightLabel(task)}
              titleRightShowLeaf
              onPress={handleBrowseSearchTaskPress}
              onComplete={handleBrowseSearchTaskComplete}
              onEdit={handleBrowseSearchTaskEdit}
              onDelete={handleBrowseSearchTaskDelete}
              isFirstItem={i === 0}
              isLastItem={i === taskSearchMatches.length - 1}
              separatorPaddingHorizontal={Paddings.screen}
            />
          ))
        ) : null}

        {activeSearchFilterId === 'description' ? (
          query.trim() === '' ? <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>Type to search task descriptions and notes.</Text> : descriptionSearchMatches.map((task, i) => (
            <BrowseDescriptionSearchCard
              key={task.id}
              descriptionText={(task.description || '').trim()}
              taskTitle={task.title}
              query={query}
              listOrInboxLabel={browseSearchTaskTitleRightLabel(task)}
              onPress={() => handleBrowseSearchTaskPress(task)}
              isLastItem={i === descriptionSearchMatches.length - 1}
              separatorPaddingHorizontal={Paddings.screen}
              cardSpacing={0}
            />
          ))
        ) : null}

        {activeSearchFilterId === 'lists' ? (
          query.trim() === '' ? <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>Type to search lists by name or description.</Text> : listSearchMatches.map((list, i) => (
            <BrowseListSearchCard
              key={list.id}
              name={list.name}
              onPress={() => handleBrowseSearchListPress(list)}
              isLastItem={i === listSearchMatches.length - 1}
              separatorPaddingHorizontal={Paddings.screen}
              cardSpacing={0}
            />
          ))
        ) : null}
      </ScrollView>
      {/* recent mode (empty query) hides chips; chips overlay the results so content scrolls behind chrome */}
      {query.trim().length > 0 ? (
        <View style={styles.searchFilterChromeWrap} pointerEvents="box-none">
          <View style={styles.searchFilterChromeFade} pointerEvents="none">
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
              locations={[0.35, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>
          <ScrollView
            horizontal
            style={styles.searchFilterChipsScroll}
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.searchFilterChipsContent}
          >
            {SEARCH_FILTER_CHIPS.map((chip) => (
              <BrowseSearchFilterChip key={chip.id} chip={chip} selected={activeSearchFilterId === chip.id} onToggle={onToggleFilter} />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) =>
  StyleSheet.create({
    container: { flex: 1 },
    // transparent wrapper so scrolling content stays visible behind chip strip
    searchFilterChromeWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: SEARCH_CHIPS_OVERLAY_HEIGHT,
      backgroundColor: 'transparent',
      zIndex: 3,
    },
    searchFilterChromeFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 0,
      overflow: 'visible',
      backgroundColor: 'transparent',
    },
    // keep the chip strip compact so it never expands and steals vertical space from results
    searchFilterChipsScroll: {
      flexGrow: 0,
      overflow: 'visible',
      backgroundColor: 'transparent',
      zIndex: 1,
    },
    searchFilterChipsContent: {
      gap: 16,
      paddingHorizontal: Paddings.screen,
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 8,
      overflow: 'visible',
      backgroundColor: 'transparent',
    },
    searchFilterChipGlass: {
      borderRadius: 20,
      overflow: 'visible',
      alignSelf: 'center',
    },
    searchFilterChipInner: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchFilterChipAndroid: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      minHeight: 32,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchFilterChipLabel: {
      ...typography.getTextStyle('body-medium'),
      fontWeight: '600',
    },
    resultsScroll: { flex: 1 },
    resultsContent: {
      paddingHorizontal: Paddings.screen,
      paddingTop: 0,
      paddingBottom: 240,
    },
    // reserve vertical room for overlay chips so first row is visible while content still scrolls behind fade
    resultsContentWithChips: {
      paddingTop: SEARCH_CHIPS_OVERLAY_HEIGHT,
    },
    searchModeBody: {
      ...typography.getTextStyle('body-medium'),
      marginBottom: 14,
      lineHeight: 22,
    },
    recentSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: Paddings.touchTargetSmall,
      backgroundColor: themeColors.background.primary(),
    },
    recentSearchRowSpacing: { marginBottom: 4 },
    recentSearchRowText: {
      ...typography.getTextStyle('body-large'),
      flex: 1,
      marginLeft: Paddings.groupedListIconTextSpacing,
    },
    groupHeaderGap: { marginTop: 24 },
  });
