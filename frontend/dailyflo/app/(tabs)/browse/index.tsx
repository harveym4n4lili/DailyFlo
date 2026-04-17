/**
 * Browse Screen
 *
 * Search mode: `searchOpen` / `isBrowseSearchMode` — user tapped the search row; floating field docks, top chrome hides.
 * Search results/placeholder live in an **overlay** `ScrollView`; browse lists stay in a **persistent** `ScrollView` (never unmounted for search) so cold-load and post-search top spacing match — overlay scroll is inset with `top: browseListsPaddingTop + SEARCH_SCROLL_OVERLAY_TOP_INSET` so it does not cover the inbox row (full-screen overlay sat above browse z-index and blocked taps).
 * Idle “Search” pill is **position: absolute** at `idleSearchBarTop` so its Y matches `measuredRowTop` used in `floatingSearchBlockStyle` / lift — no measureInWindow drift.
 * On close tap, `exitingBrowseSearch` is set so lists/FAB and filter chips hide immediately while `searchOpen` stays true until the bar/chrome finish sliding down.
 * `browseModesLayout` — animated wrapper: translates scroll content by the same delta as the floating search bar (row → docked) so the body moves with the bar.
 * Filter chips render only when `isBrowseSearchMode`; they sit in the same absolutely positioned block as the bar so they stay directly under it while animating.
 * That block includes a `searchModeTopFade` layer (BlurView + LinearGradient) matching the main browse top chrome so scroll content fades underneath.
 * While search is open, `searchModeTopInsetFill` stays solid above the scroll through the exit animation; `searchModeTopFade` unmounts on close tap so blur/gradient don’t linger.
 * The floating pill width tracks `focusProgress`: clipped row starts full-width with cancel off-screen; narrowing reveals the cancel sliding in (reverse when exiting).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  TextInput,
  Keyboard,
  ScrollView,
  Pressable,
  useWindowDimensions,
  type TextStyle,
} from 'react-native';
import { useRouter, useFocusEffect, type Router } from 'expo-router';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import GlassView from 'expo-glass-effect/build/GlassView';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeaderActions } from '@/components/ui';
import { IosBrowseHomeStackToolbar } from '@/components/navigation/IosBrowseHomeStackToolbar';
import { FloatingActionButton, MainCloseButton, CHECKBOX_SIZE_DEFAULT } from '@/components/ui/button';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { SolidSeparator } from '@/components/ui/borders';
import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/list/GroupedList';
import { SFSymbolIcon, TickIcon, BrowseIcon, LeafIcon, PencilIcon, ClockIcon } from '@/components/ui/icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { LIST_CREATE_OPENED_FROM_BROWSE } from './navigationParams';
import {
  loadRecentSearches,
  loadRecentlyViewed,
  persistRecentSearches,
  persistRecentlyViewed,
  pushRecentSearch,
  pushRecentlyViewed,
  type RecentlyViewedEntry,
} from './browseSearchHistory';
import { useLists, useTasks } from '@/store/hooks';
import { useAppDispatch, store } from '@/store';
import { fetchTasks, updateTask, deleteTask } from '@/store/slices/tasks/tasksSlice';
import { Task, type List } from '@/types';
import { TaskCard, BrowseListSearchCard, BrowseDescriptionSearchCard } from '@/components/ui/card';
import { LIST_CARD_TASK_ROW_PRESET_TODAY } from '@/constants/listCardTaskRowPreset';
import {
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
} from '@/utils/recurrenceUtils';

const TOP_SECTION_ROW_HEIGHT = 48;
const FOCUS_ANIM_MS = 320;
// gap between search pill and cancel; included in FLOATING_ROW_CANCEL_RESERVE so width + translateX animations stay aligned
const SEARCH_TO_CANCEL_GAP = 16;
// matches MainCloseButton `inline`: 42 circle on iOS glass; wider text cancel on android/web fallback
const INLINE_CANCEL_TOUCH_SIZE = Platform.OS === 'ios' ? 42 : 76;
// horizontal space the cancel column needs when visible (gap + button width)
const FLOATING_ROW_CANCEL_RESERVE = SEARCH_TO_CANCEL_GAP + INLINE_CANCEL_TOUCH_SIZE;
// extra width on the floating block so the cancel’s glass/shadow isn’t clipped by the absolute layer
const FLOATING_SEARCH_BLOCK_WIDTH_BLEED = 8;
// height of the docked search row (matches searchTabInner minHeight) — used to stack filter chips below the bar
const FLOATING_SEARCH_BAR_ROW_HEIGHT = 44;
// non-search: gradient/blur band continues this far *below* the idle floating search bar into the list area (larger = longer fade)
const BROWSE_IDLE_TOP_BLUR_TAIL_PAST_PILL = TOP_SECTION_ROW_HEIGHT + (FLOATING_SEARCH_BAR_ROW_HEIGHT / 2);
// vertical space between docked search row and chip strip (also folded into fade height + scroll placeholder inset)
const SEARCH_BAR_TO_CHIPS_GAP = 16;
// keep in sync with styles.searchFilterChipInner + styles.searchFilterChipsContent (chip vertical padding + minHeight + row paddingBottom)
const SEARCH_FILTER_CHIP_PADDING_V = 8;
const SEARCH_FILTER_CHIP_MIN_HEIGHT = 36;
const SEARCH_FILTER_CHIPS_CONTENT_PADDING_BOTTOM = 10;
const SEARCH_CHIP_ROW_HEIGHT =
  SEARCH_FILTER_CHIP_PADDING_V * 2 +
  SEARCH_FILTER_CHIP_MIN_HEIGHT +
  SEARCH_FILTER_CHIPS_CONTENT_PADDING_BOTTOM;
// floating row uses minHeight 44; searchTabInner paddingVertical (pillVertical) sits *inside* that box — no extra add here
// scroll placeholder starts below full bar + gap + chip scroller (includes chip paddings + content paddingBottom)
const SEARCH_OVERLAY_TOP_CLEARANCE =
  FLOATING_SEARCH_BAR_ROW_HEIGHT + SEARCH_BAR_TO_CHIPS_GAP + SEARCH_CHIP_ROW_HEIGHT;
// first grouped row (inbox) ≈ this tall — search overlay must start below it or full-screen ScrollView steals taps (z-index above browse)
const SEARCH_SCROLL_OVERLAY_TOP_INSET = 56;
// blur strip behind bar + gap + chips + small bleed below chips for liquid-glass halo
const SEARCH_MODE_TOP_FADE_BLEED_BELOW_CHIPS = 28;
const SEARCH_MODE_TOP_FADE_HEIGHT =
  FLOATING_SEARCH_BAR_ROW_HEIGHT +
  SEARCH_BAR_TO_CHIPS_GAP +
  SEARCH_CHIP_ROW_HEIGHT +
  SEARCH_MODE_TOP_FADE_BLEED_BELOW_CHIPS;

// ios default is "automatic": system adds safe-area to scroll content insets ON TOP of our paddingTop (insets.top + …) — cold start looks like huge pill→list gap; remount after search often "fixes" because insets settle. we handle safe area only in layout math.
const iosScrollNoAutomaticSafeAreaInsets =
  Platform.OS === 'ios' ? ({ contentInsetAdjustmentBehavior: 'never' as const } as const) : {};

// filter chips: order is fixed; ids are for toggles until search api exists
const DEFAULT_SEARCH_FILTER_CHIP_ID = 'recent';
const SEARCH_FILTER_CHIPS: { id: string; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'top', label: 'Top' },
  { id: 'task', label: 'Task' },
  { id: 'description', label: 'Description' },
  { id: 'lists', label: 'Lists' },
];

const CHIP_COLOR_ANIM_MS = 260;

// higher score = better match; title beats description; earlier substring index in title wins (closest match)
function taskSearchRelevanceScore(task: Task, qLower: string): number {
  const title = task.title.toLowerCase();
  const desc = (task.description || '').toLowerCase();
  if (title === qLower) return 100_000;
  if (title.startsWith(qLower)) return 50_000 - title.length;
  const ti = title.indexOf(qLower);
  if (ti >= 0) return 40_000 - ti * 100 - title.length * 0.01;
  const di = desc.indexOf(qLower);
  if (di >= 0) return 20_000 - di * 50;
  return -1;
}

// redux tasks → ordered matches for browse search (task chip); empty query → no rows (caller shows hint)
function filterTasksForBrowseSearch(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const active = tasks.filter((t) => !t.softDeleted);
  return active
    .map((task) => ({ task, score: taskSearchRelevanceScore(task, q) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.task);
}

// top + recent: task rows are title matches only — description matches use BrowseDescriptionSearchCard below
function titleOnlySearchRelevanceScore(task: Task, qLower: string): number {
  const title = task.title.toLowerCase();
  if (title === qLower) return 100_000;
  if (title.startsWith(qLower)) return 50_000 - title.length;
  const ti = title.indexOf(qLower);
  if (ti >= 0) return 40_000 - ti * 100 - title.length * 0.01;
  return -1;
}

function filterTasksByTitleForBrowseSearch(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const active = tasks.filter((t) => !t.softDeleted);
  return active
    .map((task) => ({ task, score: titleOnlySearchRelevanceScore(task, q) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.task);
}

// description chip: tasks whose body text contains the query (title-only hits stay on Task chip)
function descriptionSearchRelevanceScore(task: Task, qLower: string): number {
  const desc = (task.description || '').toLowerCase();
  const di = desc.indexOf(qLower);
  if (di < 0) return -1;
  return 10_000 - di * 10;
}

function filterTasksByDescriptionForBrowseSearch(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const active = tasks.filter((t) => !t.softDeleted && (t.description || '').trim().length > 0);
  return active
    .map((task) => ({ task, score: descriptionSearchRelevanceScore(task, q) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.task);
}

// list name / description match for lists chip (same idea as task search)
function filterListsForBrowseSearch(lists: List[], query: string): List[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return lists.filter((list) => {
    const name = list.name.toLowerCase();
    const desc = (list.description ?? '').toLowerCase();
    return name.includes(q) || desc.includes(q);
  });
}

type BrowseSearchFilterChipStyles = {
  searchFilterChipGlass: object;
  searchFilterChipInner: object;
  searchFilterChipAndroid: object;
  searchFilterChipLabel: TextStyle;
};

// shared-value progress drives interpolateColor only — font size/weight stay fixed so chip width doesn’t shift neighbors in the row
function BrowseSearchFilterChip({
  chip,
  selected,
  onToggle,
  themeColors,
  styles,
}: {
  chip: { id: string; label: string };
  selected: boolean;
  onToggle: (id: string) => void;
  themeColors: ReturnType<typeof useThemeColors>;
  styles: BrowseSearchFilterChipStyles;
}) {
  const progress = useSharedValue(selected ? 1 : 0);
  const primaryTint = themeColors.background.primary();
  const selectedTint = themeColors.interactive.primary();
  const primaryText = themeColors.text.primary();
  const invertedText = themeColors.text.invertedPrimary();
  const pillIdle = themeColors.background.primarySecondaryBlend();
  const pillSelected = themeColors.interactive.primary();

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
    backgroundColor: interpolateColor(progress.value, [0, 1], [pillIdle, pillSelected]),
  }));

  const a11y = {
    accessibilityRole: 'button' as const,
    accessibilityState: { selected },
    accessibilityLabel: `${chip.label} filter`,
    accessibilityHint: selected
      ? 'Selected — double tap a different chip to change the filter'
      : 'Double tap to select this filter',
  };

  if (Platform.OS === 'ios') {
    return (
      <GlassView
        style={styles.searchFilterChipGlass}
        glassEffectStyle="clear"
        tintColor={primaryTint as any}
        isInteractive
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }, tintWashStyle]}
        />
        <Pressable onPress={() => onToggle(chip.id)} style={styles.searchFilterChipInner} {...a11y}>
          <Animated.Text style={[styles.searchFilterChipLabel, labelAnimStyle]}>{chip.label}</Animated.Text>
        </Pressable>
      </GlassView>
    );
  }

  return (
    <Pressable
      onPress={() => onToggle(chip.id)}
      style={({ pressed }) => [pressed && { opacity: 0.9 }]}
      {...a11y}
    >
      <Animated.View style={[styles.searchFilterChipAndroid, androidPillStyle]}>
        <Animated.Text style={[styles.searchFilterChipLabel, labelAnimStyle]}>{chip.label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// shared list column so browse scroll can wrap it in Animated (exit lift only) or plain View (idle — no hidden translateY)
function BrowseListsColumn({
  browseListsPaddingTop,
  styles,
  themeColors,
  router,
  sortedLists,
  isMyListsExpanded,
  setIsMyListsExpanded,
}: {
  browseListsPaddingTop: number;
  styles: ReturnType<typeof createStyles>;
  themeColors: ReturnType<typeof useThemeColors>;
  router: Router;
  sortedLists: { id: string; name: string; metadata?: { taskCount?: number }; sortOrder: number }[];
  isMyListsExpanded: boolean;
  setIsMyListsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <View style={[styles.browseListsContentWrapper, { paddingTop: browseListsPaddingTop }]}>
      <View style={styles.groupedListSection}>
        <GroupedList
          containerStyle={styles.listContainer}
          backgroundColor={themeColors.background.primarySecondaryBlend()}
          separatorColor={themeColors.border.primary()}
          separatorInsetRight={Paddings.groupedListContentHorizontal}
          separatorVariant="solid"
          borderRadius={24}
          minimalStyle={false}
          separatorConsiderIconColumn={true}
          iconColumnWidth={30}
        >
          <FormDetailButton
            key="inbox"
            iconComponent={
              <SFSymbolIcon
                name="tray.full"
                size={20}
                color={themeColors.text.primary()}
                fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
              />
            }
            label="Inbox"
            value=""
            onPress={() => router.push('/(tabs)/browse/inbox')}
            showChevron={false}
          />
          <FormDetailButton
            key="completed"
            iconComponent={
              <SFSymbolIcon
                name="checkmark.circle.fill"
                size={20}
                color={themeColors.text.primary()}
                fallback={<TickIcon size={18} color={themeColors.text.primary()} />}
              />
            }
            label="Completed"
            value=""
            onPress={() => router.push('/(tabs)/browse/completed')}
            showChevron={false}
          />
          <FormDetailButton
            key="tags"
            iconComponent={
              <SFSymbolIcon
                name="tag"
                size={20}
                color={themeColors.text.primary()}
                fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
              />
            }
            label="Tags"
            value=""
            onPress={() => router.push('/(tabs)/browse/tags')}
            showChevron={false}
          />
        </GroupedList>
      </View>

      <GroupedListHeader
        title="My Lists"
        showDropdownArrow
        isExpanded={isMyListsExpanded}
        onPress={() => setIsMyListsExpanded((prev) => !prev)}
        style={styles.myListsHeader}
      />

      {isMyListsExpanded && (
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOutUp.duration(200)}
          style={styles.listsPillsContainer}
        >
          <TouchableOpacity
            style={[styles.listPill, { backgroundColor: themeColors.background.primarySecondaryBlend() }]}
            onPress={() => router.push('/(tabs)/browse/manage-lists')}
            activeOpacity={0.7}
          >
            <PencilIcon size={20} color={themeColors.text.primary()} />
            <Text
              style={[styles.listPillName, styles.listPillNameBold, { color: themeColors.text.primary() }]}
              numberOfLines={1}
            >
              Manage Lists
            </Text>
          </TouchableOpacity>
          {sortedLists.map((list) => (
            <TouchableOpacity
              key={list.id}
              style={[styles.listPill, { backgroundColor: themeColors.background.primarySecondaryBlend() }]}
              onPress={() => router.push(`/(tabs)/browse/list/${list.id}` as any)}
              activeOpacity={0.7}
            >
              <LeafIcon size={20} color={themeColors.text.tertiary()} />
              <Text style={[styles.listPillName, { color: themeColors.text.primary() }]} numberOfLines={1}>
                {list.name}
              </Text>
              <View style={styles.listPillCountGap} />
              <Text style={[styles.listPillCount, { color: themeColors.text.secondary() }]}>
                {list.metadata?.taskCount ?? 0}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

export default function BrowseScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const styles = createStyles(themeColors, typography, insets);
  const { lists, fetchLists, isLoading: listsLoading } = useLists();
  const { tasks, isLoading: tasksLoading } = useTasks();

  const rootRef = useRef<View>(null);
  const floatingInputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedEntry[]>([]);
  // searchOpen: floating docked field + hidden idle row (true until close animation finishes)
  const [searchOpen, setSearchOpen] = useState(false);
  // exitingBrowseSearch: user tapped cancel/close — show browse lists/fab immediately while bar still slides
  const [exitingBrowseSearch, setExitingBrowseSearch] = useState(false);
  const isBrowseSearchMode = searchOpen;
  const showBrowseBodyContent = !searchOpen || exitingBrowseSearch;
  const { setTabFabRegistration } = useTabFabOverlay();
  useFocusEffect(
    useCallback(() => {
      if (!USE_CUSTOM_LIQUID_TAB_BAR) return undefined;
      if (!showBrowseBodyContent) {
        setTabFabRegistration(null);
        return () => setTabFabRegistration(null);
      }
      setTabFabRegistration({
        onPress: () =>
          router.push({
            pathname: '/(tabs)/browse/list-create' as any,
            params: { openedFrom: LIST_CREATE_OPENED_FROM_BROWSE },
          }),
        accessibilityLabel: 'Create new list',
        accessibilityHint: 'Opens the new list screen',
      });
      return () => setTabFabRegistration(null);
    }, [showBrowseBodyContent, router, setTabFabRegistration]),
  );
  const searchOpenRef = useRef(false);
  const closeAnimatingRef = useRef(false);

  useEffect(() => {
    searchOpenRef.current = searchOpen;
  }, [searchOpen]);

  const dockedSearchTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;
  const horizontalPadding = Paddings.screen;
  const floatingRowWidth = windowWidth - horizontalPadding * 2;

  // fixed Y for idle pill + animation anchor (same as old scroll-row top): aligns with floating bar interpolate(measuredRowTop → dockedSearchTop)
  const idleSearchBarTop = insets.top + TOP_SECTION_ROW_HEIGHT + 12;
  // blur/gradient chrome covers settings row + gap + pill + tail so fade continues past the idle bar (non-search); search open uses same slide distance so the whole band clears
  const topChromeHeight =
    idleSearchBarTop + FLOATING_SEARCH_BAR_ROW_HEIGHT + BROWSE_IDLE_TOP_BLUR_TAIL_PAST_PILL;
  const topChromeSlideDistance = topChromeHeight;
  // first list row starts below the absolute pill + same gap as former searchAnchor marginBottom
  const browseListsPaddingTop =
    FLOATING_SEARCH_BAR_ROW_HEIGHT + Paddings.screen;
  // search overlay scroll must not cover inbox row (same y as first grouped row) — full-screen overlay sat z-index above browse and blocked taps
  const searchScrollOverlayTop = browseListsPaddingTop + SEARCH_SCROLL_OVERLAY_TOP_INSET;
  // inner padding so first search line still clears docked bar + chips after overlay frame is pushed down
  const searchScrollContentPaddingTop = Math.max(
    Paddings.touchTargetSmall,
    dockedSearchTop + SEARCH_OVERLAY_TOP_CLEARANCE - searchScrollOverlayTop
  );

  const focusProgress = useSharedValue(0);
  const measuredRowTop = useSharedValue(idleSearchBarTop);

  // keep anchor in sync with safe-area when not in search mode so open/close math matches layout
  useEffect(() => {
    if (!searchOpen) {
      measuredRowTop.value = idleSearchBarTop;
    }
  }, [idleSearchBarTop, searchOpen, measuredRowTop]);

  useFocusEffect(
    useCallback(() => {
      void fetchLists();
    }, [fetchLists])
  );

  // load persisted recent searches + recently viewed (asyncstorage)
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

  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => a.sortOrder - b.sortOrder),
    [lists]
  );

  const [isMyListsExpanded, setIsMyListsExpanded] = useState(true);
  // exactly one chip is always selected; resets to Recent when search closes or opens
  const [activeSearchFilterId, setActiveSearchFilterId] = useState<string>(DEFAULT_SEARCH_FILTER_CHIP_ID);

  const toggleSearchFilterChip = useCallback((id: string) => {
    setActiveSearchFilterId((prev) => (prev === id ? prev : id));
  }, []);

  // load tasks when user searches by task or description so redux has rows to filter (same source as Today)
  useEffect(() => {
    if (searchOpen && (activeSearchFilterId === 'task' || activeSearchFilterId === 'description')) {
      void dispatch(fetchTasks());
    }
  }, [searchOpen, activeSearchFilterId, dispatch]);

  // lists chip: same api as my lists column
  useEffect(() => {
    if (searchOpen && activeSearchFilterId === 'lists') {
      void fetchLists();
    }
  }, [searchOpen, activeSearchFilterId, fetchLists]);

  // recent + top: need tasks + lists for TaskCard / BrowseListSearchCard / history
  useEffect(() => {
    if (searchOpen && (activeSearchFilterId === 'recent' || activeSearchFilterId === 'top')) {
      void dispatch(fetchTasks());
      void fetchLists();
    }
  }, [searchOpen, activeSearchFilterId, dispatch, fetchLists]);

  const taskSearchMatches = useMemo(
    () =>
      activeSearchFilterId === 'task' ? filterTasksForBrowseSearch(tasks, query) : [],
    [tasks, query, activeSearchFilterId]
  );

  const descriptionSearchMatches = useMemo(
    () =>
      activeSearchFilterId === 'description' ? filterTasksByDescriptionForBrowseSearch(tasks, query) : [],
    [tasks, query, activeSearchFilterId]
  );

  const listSearchMatches = useMemo(
    () => (activeSearchFilterId === 'lists' ? filterListsForBrowseSearch(lists, query) : []),
    [lists, query, activeSearchFilterId]
  );

  // top + recent: same three buckets — title tasks, description notes, lists (when query non-empty on recent, show these too)
  const topOrRecentTitleTasks = useMemo(
    () =>
      activeSearchFilterId === 'top' || activeSearchFilterId === 'recent'
        ? filterTasksByTitleForBrowseSearch(tasks, query)
        : [],
    [tasks, query, activeSearchFilterId]
  );

  const topOrRecentDescriptionTasks = useMemo(
    () =>
      activeSearchFilterId === 'top' || activeSearchFilterId === 'recent'
        ? filterTasksByDescriptionForBrowseSearch(tasks, query)
        : [],
    [tasks, query, activeSearchFilterId]
  );

  const topOrRecentListMatches = useMemo(
    () =>
      activeSearchFilterId === 'top' || activeSearchFilterId === 'recent'
        ? filterListsForBrowseSearch(lists, query)
        : [],
    [lists, query, activeSearchFilterId]
  );

  // trim + dedupe recent queries; called on open search, cancel, keyboard search
  const commitRecentSearch = useCallback((raw: string) => {
    setRecentSearches((prev) => {
      const next = pushRecentSearch(raw, prev);
      if (next === prev) return prev;
      void persistRecentSearches(next);
      return next;
    });
  }, []);

  // task row right column: inbox vs list name — same typography slot as time range on TaskCard
  const browseSearchTaskTitleRightLabel = useCallback(
    (task: Task) =>
      task.listId ? lists.find((l) => l.id === task.listId)?.name ?? 'List' : 'Inbox',
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
        const newCompletions = isCompleted
          ? [...completions, occurrenceDate]
          : completions.filter((d) => d !== occurrenceDate);
        dispatch(
          updateTask({
            id: baseId,
            updates: {
              id: baseId,
              metadata: { ...baseTask.metadata, recurrence_completions: newCompletions },
            },
          })
        );
      } else {
        dispatch(updateTask({ id: task.id, updates: { id: task.id, isCompleted } }));
      }
    },
    [dispatch]
  );

  const handleBrowseSearchTaskEdit = useCallback(
    (task: Task) => {
      handleBrowseSearchTaskPress(task);
    },
    [handleBrowseSearchTaskPress]
  );

  const handleBrowseSearchTaskDelete = useCallback(
    (task: Task) => {
      const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
      dispatch(deleteTask(taskId));
    },
    [dispatch]
  );

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

  const openSearch = useCallback(() => {
    commitRecentSearch(query);
    // absolute idle bar uses idleSearchBarTop — snapshot that value for the floating bar + scroll lift (same as pre-absolute measure path)
    measuredRowTop.value = idleSearchBarTop;
    setExitingBrowseSearch(false);
    setSearchOpen(true);
  }, [commitRecentSearch, query, idleSearchBarTop, measuredRowTop]);

  const finishCloseSearch = useCallback(() => {
    closeAnimatingRef.current = false;
    setSearchOpen(false);
    setExitingBrowseSearch(false);
    setActiveSearchFilterId(DEFAULT_SEARCH_FILTER_CHIP_ID);
    // hard-zero so browse scroll never keeps a stale translateY after exit (fixes pill→Inbox gap vs cold start)
    focusProgress.value = 0;
  }, [focusProgress]);

  const closeSearch = useCallback(() => {
    if (!searchOpenRef.current || closeAnimatingRef.current) return;
    closeAnimatingRef.current = true;
    Keyboard.dismiss();
    // clear field on exit tap so placeholder returns immediately; don’t wait for close animation end
    setQuery('');
    // swap scroll body back to lists right away; keep searchOpen true so idle row stays hidden until bar finishes
    setExitingBrowseSearch(true);
    // do not update measuredRowTop here while focusProgress is still 1 — that changes `lift` in
    // browseModesLayoutStyle instantly and the bar/content jump instead of animating down.
    // exit uses the same measuredRowTop from open (idleSearchBarTop when bar is absolute).
    focusProgress.value = withTiming(
      0,
      { duration: FOCUS_ANIM_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finishCloseSearch)();
      }
    );
  }, [commitRecentSearch, query, finishCloseSearch, focusProgress]);

  useEffect(() => {
    if (!searchOpen) return;
    focusProgress.value = 0;
    focusProgress.value = withTiming(1, {
      duration: FOCUS_ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
    const t = requestAnimationFrame(() => {
      floatingInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [searchOpen, focusProgress]);

  // when browse is the only mode again, guarantee lift transform is cleared (covers edge cases where reanimated leaves epsilon or remount order differs from cold load)
  useEffect(() => {
    if (!searchOpen && !exitingBrowseSearch) {
      focusProgress.value = 0;
    }
  }, [searchOpen, exitingBrowseSearch, focusProgress]);

  const topChromeStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          focusProgress.value,
          [0, 1],
          [0, -topChromeSlideDistance],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  // overflow visible so glass/hitSlop aren’t clipped; cancel translateX hides it at progress 0 (same distance as reserve) then slides in with the narrowing pill
  const floatingSearchRowLayoutStyle = useAnimatedStyle(() => ({
    width: floatingRowWidth + FLOATING_SEARCH_BLOCK_WIDTH_BLEED,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: FLOATING_SEARCH_BAR_ROW_HEIGHT,
    overflow: 'visible',
  }));

  const floatingCancelSlideStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          focusProgress.value,
          [0, 1],
          [FLOATING_ROW_CANCEL_RESERVE, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const floatingSearchPillWidthStyle = useAnimatedStyle(() => ({
    width: interpolate(
      focusProgress.value,
      [0, 1],
      [floatingRowWidth, floatingRowWidth - FLOATING_ROW_CANCEL_RESERVE],
      Extrapolation.CLAMP
    ),
    minWidth: 0,
  }));

  // whole block (search row + filter chips) moves with focusProgress so chips stay glued under the bar
  const floatingSearchBlockStyle = useAnimatedStyle(() => {
    const top = interpolate(
      focusProgress.value,
      [0, 1],
      [measuredRowTop.value, dockedSearchTop],
      Extrapolation.CLAMP
    );
    return {
      position: 'absolute' as const,
      top,
      left: horizontalPadding,
      width: floatingRowWidth + FLOATING_SEARCH_BLOCK_WIDTH_BLEED,
      overflow: 'visible',
      zIndex: 22,
    };
  });

  // lifts scroll content with the search bar: same distance the bar moves up (measured row y → docked y)
  const browseModesLayoutStyle = useAnimatedStyle(() => {
    const lift = measuredRowTop.value - dockedSearchTop;
    return {
      transform: [
        {
          translateY: interpolate(focusProgress.value, [0, 1], [0, -lift], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const searchField = (
    <>
      <SFSymbolIcon
        name="magnifyingglass"
        size={20}
        color={themeColors.text.tertiary()}
        fallback={<BrowseIcon size={18} color={themeColors.text.tertiary()} />}
      />
      <TextInput
        ref={floatingInputRef}
        value={query}
        onChangeText={setQuery}
        placeholder="Search"
        // same as idle pill: tertiary for empty field; typed query uses primary() below
        placeholderTextColor={themeColors.text.tertiary()}
        style={[styles.searchInput, { color: themeColors.text.primary() }]}
        returnKeyType="search"
        onSubmitEditing={() => commitRecentSearch(query)}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </>
  );

  return (
    <>
      <IosBrowseHomeStackToolbar />
      <View ref={rootRef} style={{ flex: 1 }}>
      {/* box-none + blur none: tall chrome band must not steal taps meant for browse grouped list (inbox) behind it — only topSectionRow / settings stays interactive */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.topSectionAnchor, { height: topChromeHeight }, topChromeStyle]}
      >
        <BlurView
          tint={themeColors.isDark ? 'dark' : 'light'}
          intensity={1}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* three stops so fade reads through the pill row and keeps softening below it (top chrome height includes pill + BROWSE_IDLE_TOP_BLUR_TAIL_PAST_PILL) */}
        <LinearGradient
          colors={[
            themeColors.background.primary(),
            themeColors.withOpacity(themeColors.background.primary(), 0),
          ]}
          locations={[0.4,0.8]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {Platform.OS === 'android' ? (
          <View style={styles.topSectionRow} pointerEvents="box-none">
            <View style={styles.topSectionPlaceholder} pointerEvents="none" />
            <ScreenHeaderActions
              variant="browse"
              onSettingsPress={() => router.push('/(tabs)/browse/settings')}
              style={styles.topSectionContextButton}
              tint="primary"
            />
          </View>
        ) : null}
      </Animated.View>

      {/* browse scroll stays mounted (opacity off during full search) so ios/android don’t remeasure a new scroll view — fixes pill→list gap differing cold vs after search */}
      <View style={styles.browseScrollStack}>
        <ScrollView
          {...iosScrollNoAutomaticSafeAreaInsets}
          style={[styles.mainScroll, !showBrowseBodyContent && styles.browseScrollHidden]}
          pointerEvents="auto"
          contentContainerStyle={styles.scrollContentContainerBrowse}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          {/* lift transform only while exit animation runs — idle browse uses a plain View so no hidden translateY vs cold load */}
          {exitingBrowseSearch ? (
            <Animated.View style={[styles.browseModesLayoutBrowse, browseModesLayoutStyle]}>
              <BrowseListsColumn
                browseListsPaddingTop={browseListsPaddingTop}
                styles={styles}
                themeColors={themeColors}
                router={router}
                sortedLists={sortedLists}
                isMyListsExpanded={isMyListsExpanded}
                setIsMyListsExpanded={setIsMyListsExpanded}
              />
            </Animated.View>
          ) : (
            <View style={styles.browseModesLayoutBrowse}>
              <BrowseListsColumn
                browseListsPaddingTop={browseListsPaddingTop}
                styles={styles}
                themeColors={themeColors}
                router={router}
                sortedLists={sortedLists}
                isMyListsExpanded={isMyListsExpanded}
                setIsMyListsExpanded={setIsMyListsExpanded}
              />
            </View>
          )}
        </ScrollView>

        {isBrowseSearchMode && !exitingBrowseSearch ? (
          <ScrollView
            {...iosScrollNoAutomaticSafeAreaInsets}
            style={[styles.mainScroll, styles.searchScrollOverlay, { top: searchScrollOverlayTop }]}
            contentContainerStyle={styles.searchScrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            <Animated.View style={[styles.browseModesLayout, styles.browseModesLayoutSearchOverlay, browseModesLayoutStyle]}>
              <View style={[styles.contentWrapper, styles.contentWrapperSearchOverlay]}>
                <View
                  style={[styles.browseSearchContent, { paddingTop: searchScrollContentPaddingTop }]}
                  accessibilityRole="summary"
                  accessibilityLabel={
                    activeSearchFilterId === 'recent'
                      ? 'Recent: saved terms, recently viewed, and live title/description/list matches while you type.'
                      : activeSearchFilterId === 'top'
                        ? 'Top search: tasks (title), matching descriptions, and lists.'
                        : activeSearchFilterId === 'task'
                          ? 'Task search: results update as you type.'
                          : activeSearchFilterId === 'description'
                            ? 'Description search: tasks whose notes match your query.'
                            : activeSearchFilterId === 'lists'
                              ? 'List search: matching lists by name or description.'
                              : 'Search: choose a filter chip.'
                  }
                >
                  {activeSearchFilterId === 'recent' ? (
                    <>
                      <GroupedListHeader title="Recent searches" />
                      {recentSearches.length === 0 ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          Search terms you submit or cancel with appear here (up to four).
                        </Text>
                      ) : (
                        <View style={styles.recentSearchRows}>
                          {recentSearches.map((q, i) => (
                            <Pressable
                              key={`${q}-${i}`}
                              onPress={() => setQuery(q)}
                              style={[styles.recentSearchRow, i < recentSearches.length - 1 && styles.recentSearchRowSpacing]}
                            >
                              <SFSymbolIcon
                                name="clock.arrow.circlepath"
                                size={20}
                                color={themeColors.text.tertiary()}
                                fallback={<ClockIcon size={18} color={themeColors.text.tertiary()} />}
                              />
                              <Text
                                style={[styles.recentSearchRowText, { color: themeColors.text.primary() }]}
                                numberOfLines={2}
                              >
                                {q}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                      <GroupedListHeader title="Recently viewed" style={styles.myListsHeader} />
                      {recentlyViewed.length === 0 ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          Tasks and lists you open from search appear here (up to six).
                        </Text>
                      ) : (
                        <View style={styles.recentlyViewedBlocks}>
                          {recentlyViewed.map((entry, i) => {
                            const isLast = i === recentlyViewed.length - 1;
                            if (entry.kind === 'task') {
                              const task = tasks.find((t) => t.id === entry.id);
                              if (task) {
                                return (
                                  <View key={`task:${entry.id}`}>
                                    <TaskCard
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
                                  </View>
                                );
                              }
                              return (
                                <View key={`task:${entry.id}`}>
                                  <Pressable
                                    onPress={() => handleRecentlyViewedPress(entry)}
                                    style={styles.recentSearchRow}
                                  >
                                    <SFSymbolIcon
                                      name="clock.arrow.circlepath"
                                      size={20}
                                      color={themeColors.text.tertiary()}
                                      fallback={<ClockIcon size={18} color={themeColors.text.tertiary()} />}
                                    />
                                    <Text
                                      style={[styles.recentSearchRowText, { color: themeColors.text.secondary() }]}
                                      numberOfLines={2}
                                    >
                                      {entry.label}
                                    </Text>
                                  </Pressable>
                                  {!isLast ? (
                                    <SolidSeparator
                                      paddingLeft={CHECKBOX_SIZE_DEFAULT + 12}
                                      paddingRight={0}
                                    />
                                  ) : null}
                                </View>
                              );
                            }
                            const list = lists.find((l) => l.id === entry.id);
                            return (
                              <View key={`list:${entry.id}`}>
                                <BrowseListSearchCard
                                  name={list?.name ?? entry.label}
                                  onPress={() => handleRecentlyViewedPress(entry)}
                                  isLastItem={isLast}
                                  separatorPaddingHorizontal={Paddings.screen}
                                  cardSpacing={0}
                                />
                              </View>
                            );
                          })}
                        </View>
                      )}
                      {/* recent tab: while query is set, show same title / description / list matches as Top */}
                      {query.trim() !== '' ? (
                        <>
                          {(tasksLoading && tasks.length === 0) || (listsLoading && lists.length === 0) ? (
                            <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                              Loading…
                            </Text>
                          ) : topOrRecentTitleTasks.length === 0 &&
                            topOrRecentDescriptionTasks.length === 0 &&
                            topOrRecentListMatches.length === 0 ? (
                            <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                              No tasks, descriptions, or lists match “{query.trim()}”.
                            </Text>
                          ) : (
                            <>
                              {topOrRecentTitleTasks.length > 0 ? (
                                <>
                                  <GroupedListHeader title="Tasks" style={styles.myListsHeader} />
                                  {topOrRecentTitleTasks.map((task, i) => (
                                    <TaskCard
                                      key={`recent-top:${task.id}`}
                                      task={task}
                                      {...LIST_CARD_TASK_ROW_PRESET_TODAY}
                                      titleRightLabel={browseSearchTaskTitleRightLabel(task)}
                                      titleRightShowLeaf
                                      onPress={handleBrowseSearchTaskPress}
                                      onComplete={handleBrowseSearchTaskComplete}
                                      onEdit={handleBrowseSearchTaskEdit}
                                      onDelete={handleBrowseSearchTaskDelete}
                                      isFirstItem={i === 0}
                                      isLastItem={
                                        i === topOrRecentTitleTasks.length - 1 &&
                                        topOrRecentDescriptionTasks.length === 0 &&
                                        topOrRecentListMatches.length === 0
                                      }
                                      separatorPaddingHorizontal={Paddings.screen}
                                    />
                                  ))}
                                </>
                              ) : null}
                              {topOrRecentDescriptionTasks.length > 0 ? (
                                <>
                                  <GroupedListHeader title="Descriptions" style={styles.myListsHeader} />
                                  {topOrRecentDescriptionTasks.map((task, i) => (
                                    <BrowseDescriptionSearchCard
                                      key={`recent-desc:${task.id}`}
                                      descriptionText={(task.description || '').trim()}
                                      taskTitle={task.title}
                                      query={query}
                                      listOrInboxLabel={browseSearchTaskTitleRightLabel(task)}
                                      onPress={() => handleBrowseSearchTaskPress(task)}
                                      isLastItem={
                                        i === topOrRecentDescriptionTasks.length - 1 &&
                                        topOrRecentListMatches.length === 0
                                      }
                                      separatorPaddingHorizontal={Paddings.screen}
                                      cardSpacing={0}
                                    />
                                  ))}
                                </>
                              ) : null}
                              {topOrRecentListMatches.length > 0 ? (
                                <>
                                  <GroupedListHeader title="Lists" style={styles.myListsHeader} />
                                  {topOrRecentListMatches.map((list, i) => (
                                    <BrowseListSearchCard
                                      key={`recent-list:${list.id}`}
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
                          )}
                        </>
                      ) : null}
                    </>
                  ) : activeSearchFilterId === 'top' ? (
                    <>
                      {(tasksLoading && tasks.length === 0) || (listsLoading && lists.length === 0) ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          Loading…
                        </Text>
                      ) : query.trim() === '' ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          Type to search tasks (by title), descriptions, and lists together.
                        </Text>
                      ) : topOrRecentTitleTasks.length === 0 &&
                        topOrRecentDescriptionTasks.length === 0 &&
                        topOrRecentListMatches.length === 0 ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          No tasks, descriptions, or lists match “{query.trim()}”.
                        </Text>
                      ) : (
                        <>
                          {topOrRecentTitleTasks.length > 0 ? (
                            <>
                              <GroupedListHeader title="Tasks" />
                              {topOrRecentTitleTasks.map((task, i) => (
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
                                  isLastItem={
                                    i === topOrRecentTitleTasks.length - 1 &&
                                    topOrRecentDescriptionTasks.length === 0 &&
                                    topOrRecentListMatches.length === 0
                                  }
                                  separatorPaddingHorizontal={Paddings.screen}
                                />
                              ))}
                            </>
                          ) : null}
                          {topOrRecentDescriptionTasks.length > 0 ? (
                            <>
                              <GroupedListHeader
                                title="Descriptions"
                                style={
                                  topOrRecentTitleTasks.length > 0 ? styles.myListsHeader : undefined
                                }
                              />
                              {topOrRecentDescriptionTasks.map((task, i) => (
                                <BrowseDescriptionSearchCard
                                  key={`desc:${task.id}`}
                                  descriptionText={(task.description || '').trim()}
                                  taskTitle={task.title}
                                  query={query}
                                  listOrInboxLabel={browseSearchTaskTitleRightLabel(task)}
                                  onPress={() => handleBrowseSearchTaskPress(task)}
                                  isLastItem={
                                    i === topOrRecentDescriptionTasks.length - 1 &&
                                    topOrRecentListMatches.length === 0
                                  }
                                  separatorPaddingHorizontal={Paddings.screen}
                                  cardSpacing={0}
                                />
                              ))}
                            </>
                          ) : null}
                          {topOrRecentListMatches.length > 0 ? (
                            <>
                              <GroupedListHeader
                                title="Lists"
                                style={
                                  topOrRecentTitleTasks.length > 0 || topOrRecentDescriptionTasks.length > 0
                                    ? styles.myListsHeader
                                    : undefined
                                }
                              />
                              {topOrRecentListMatches.map((list, i) => (
                                <BrowseListSearchCard
                                  key={list.id}
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
                      )}
                    </>
                  ) : activeSearchFilterId === 'task' ? (
                    <>
                      {/* task chip: filter redux tasks on every keystroke; rows use same TaskCard preset as Today/list */}
                      {tasksLoading && tasks.length === 0 ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          Loading tasks…
                        </Text>
                      ) : query.trim() === '' ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          Type to search tasks by title or description.
                        </Text>
                      ) : taskSearchMatches.length === 0 ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          No tasks match “{query.trim()}”.
                        </Text>
                      ) : (
                        taskSearchMatches.map((task, i) => (
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
                      )}
                    </>
                  ) : activeSearchFilterId === 'description' ? (
                    <>
                      {/* description chip: paragraph row — matched text in body, task title below, leaf+list like task search */}
                      {tasksLoading && tasks.length === 0 ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          Loading tasks…
                        </Text>
                      ) : query.trim() === '' ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          Type to search task descriptions and notes.
                        </Text>
                      ) : descriptionSearchMatches.length === 0 ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          No descriptions match “{query.trim()}”.
                        </Text>
                      ) : (
                        descriptionSearchMatches.map((task, i) => (
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
                      )}
                    </>
                  ) : activeSearchFilterId === 'lists' ? (
                    <>
                      {/* lists chip: BrowseListSearchCard mirrors TaskCard — leaf in checkbox slot, title + “List” */}
                      {listsLoading && lists.length === 0 ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          Loading lists…
                        </Text>
                      ) : query.trim() === '' ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          Type to search lists by name or description.
                        </Text>
                      ) : listSearchMatches.length === 0 ? (
                        <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                          No lists match “{query.trim()}”.
                        </Text>
                      ) : (
                        listSearchMatches.map((list, i) => (
                          <BrowseListSearchCard
                            key={list.id}
                            name={list.name}
                            onPress={() => handleBrowseSearchListPress(list)}
                            isLastItem={i === listSearchMatches.length - 1}
                            separatorPaddingHorizontal={Paddings.screen}
                            cardSpacing={0}
                          />
                        ))
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={[styles.searchModeHeadline, { color: themeColors.text.primary() }]}>
                        Search tasks & lists
                      </Text>
                      <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                        Type in the field above. Use Top to search tasks and lists at once, or Task / Lists for one kind
                        only; other filters will follow.
                      </Text>
                      <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                        Scroll the chip row horizontally for Recent, Top, Task, Description, and Lists — only one filter
                        stays selected at a time.
                      </Text>
                      <Text style={[styles.searchModeHint, { color: themeColors.text.tertiary() }]}>
                        Tip: tap Cancel or the close control to leave search and return to Inbox, Completed, Tags, and
                        My Lists.
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        ) : null}
      </View>

      {/* idle pill fixed in window space — measuredRowTop === idleSearchBarTop so floating bar anim matches without layout measure */}
      {showBrowseBodyContent ? (
        <View
          style={[styles.searchIdleAbsolute, { top: idleSearchBarTop }]}
          pointerEvents="box-none"
        >
          <View
            style={[styles.searchIdleWrap, isBrowseSearchMode && styles.searchIdleHidden]}
            pointerEvents={isBrowseSearchMode ? 'none' : 'auto'}
            accessibilityElementsHidden={isBrowseSearchMode}
            importantForAccessibility={isBrowseSearchMode ? 'no-hide-descendants' : 'auto'}
          >
            {Platform.OS === 'ios' ? (
              <GlassView
                style={styles.searchTab}
                glassEffectStyle="clear"
                tintColor={themeColors.background.primary() as any}
                isInteractive
              >
                <Pressable onPress={openSearch} style={styles.searchTabInner}>
                  <SFSymbolIcon
                    name="magnifyingglass"
                    size={20}
                    color={themeColors.text.tertiary()}
                    fallback={<BrowseIcon size={18} color={themeColors.text.tertiary()} />}
                  />
                  <Text style={[styles.searchTabLabel, { color: themeColors.text.tertiary() }]}>Search</Text>
                </Pressable>
              </GlassView>
            ) : (
              <TouchableOpacity
                style={[styles.searchTab, styles.searchTabAndroid, { backgroundColor: themeColors.background.primary() }]}
                onPress={openSearch}
                activeOpacity={0.7}
              >
                <SFSymbolIcon
                  name="magnifyingglass"
                  size={20}
                  color={themeColors.text.tertiary()}
                  fallback={<BrowseIcon size={18} color={themeColors.text.tertiary()} />}
                />
                <Text style={[styles.searchTabLabel, { color: themeColors.text.tertiary() }]}>Search</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : null}

      {/* solid header band while search chrome is slid away — stays through exit anim so scroll doesn’t bleed into insets */}
      {isBrowseSearchMode ? <View style={styles.searchModeTopInsetFill} pointerEvents="none" /> : null}

      {isBrowseSearchMode ? (
        <Animated.View
          style={[floatingSearchBlockStyle, Platform.OS === 'android' && { elevation: 16 }]}
        >
          {/* unmount on close tap with chips so blur/gradient don’t linger while the bar animates down */}
          {!exitingBrowseSearch ? (
            <View style={styles.searchModeTopFade} pointerEvents="none">
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
          ) : null}
          <View style={styles.searchModeFloatingForeground} pointerEvents="box-none">
            <Animated.View style={floatingSearchRowLayoutStyle}>
              <Animated.View style={[floatingSearchPillWidthStyle, styles.floatingSearchPillSlot]}>
                {Platform.OS === 'ios' ? (
                  <GlassView
                    style={[styles.searchTabFloating, styles.floatingSearchPillFill]}
                    glassEffectStyle="clear"
                    tintColor={themeColors.background.primary() as any}
                    isInteractive
                  >
                    <View style={styles.searchTabInner}>{searchField}</View>
                  </GlassView>
                ) : (
                  <View
                    style={[
                      styles.searchTabFloating,
                      styles.searchTabAndroid,
                      styles.floatingSearchPillFill,
                      { backgroundColor: themeColors.background.primary() },
                    ]}
                  >
                    {searchField}
                  </View>
                )}
              </Animated.View>
              <Animated.View
                style={[
                  styles.floatingCancelSlot,
                  { marginLeft: SEARCH_TO_CANCEL_GAP },
                  floatingCancelSlideStyle,
                ]}
              >
                <MainCloseButton layout="inline" onPress={closeSearch} />
              </Animated.View>
            </Animated.View>
            {/* chips hide on the same tap as close (exitingBrowseSearch) so only the bar animates down */}
            {!exitingBrowseSearch ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                removeClippedSubviews={false}
                style={[
                  styles.searchFilterChipsScroll,
                  // full-bleed strip: cancel parent’s screen inset so the scroll view hits physical edges
                  { marginLeft: -horizontalPadding, width: windowWidth, overflow: 'visible' },
                ]}
                contentContainerStyle={styles.searchFilterChipsContent}
              >
                {SEARCH_FILTER_CHIPS.map((chip) => (
                  <BrowseSearchFilterChip
                    key={chip.id}
                    chip={chip}
                    selected={activeSearchFilterId === chip.id}
                    onToggle={toggleSearchFilterChip}
                    themeColors={themeColors}
                    styles={styles}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      {!USE_CUSTOM_LIQUID_TAB_BAR && showBrowseBodyContent ? (
        <View style={[fabChromeZoneStyle, { zIndex: 20 }]}>
          <FloatingActionButton
            onPress={() =>
              router.push({
                pathname: '/(tabs)/browse/list-create' as any,
                params: { openedFrom: LIST_CREATE_OPENED_FROM_BROWSE },
              })
            }
            accessibilityLabel="Create new list"
            accessibilityHint="Opens the new list screen"
          />
        </View>
      ) : null}
    </View>
    </>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
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
      justifyContent: 'flex-end',
      paddingHorizontal: Paddings.screen,
    },
    topSectionPlaceholder: {
      width: 44,
      height: 44,
      marginRight: 'auto',
    },
    topSectionContextButton: {
      marginLeft: 'auto',
      alignSelf: 'center',
      backgroundColor: 'transparent',
    },
    browseScrollStack: {
      flex: 1,
      // default relative so searchScrollOverlay absolute fill is bounded to tab body
      position: 'relative',
    },
    mainScroll: {
      flex: 1,
      zIndex: 1,
    },
    // hides lists under search overlay without unmounting — keeps one native scroll metrics path for grouped lists
    browseScrollHidden: {
      opacity: 0,
    },
    // full-area search scroll above browse; only mounted while search is active (exit swaps back to browse-only chrome)
    searchScrollOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 3,
    },
    // absolute idle pill — same horizontal inset as scroll lists (contentWrapper)
    searchIdleAbsolute: {
      position: 'absolute',
      left: Paddings.screen,
      right: Paddings.screen,
      zIndex: 15,
    },
    searchModeTopInsetFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9,
      height: insets.top + TOP_SECTION_ROW_HEIGHT,
      backgroundColor: themeColors.background.primary(),
    },
    searchModeTopFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: SEARCH_MODE_TOP_FADE_HEIGHT,
      zIndex: 0,
      overflow: 'visible',
    },
    searchModeFloatingForeground: {
      zIndex: 1,
    },
    scrollContentContainer: {
      flexGrow: 1,
    },
    // search overlay: don’t stretch content to full viewport so touches below short results fall through to browse (box-none on ScrollView)
    searchScrollContentContainer: {
      flexGrow: 0,
    },
    // browse lists only: don’t grow content to fill viewport — avoids different vertical distribution after search scroll remount vs first load
    scrollContentContainerBrowse: {
      flexGrow: 0,
    },
    browseModesLayout: {
      flexGrow: 1,
      alignSelf: 'stretch',
    },
    browseModesLayoutSearchOverlay: {
      flexGrow: 0,
    },
    contentWrapperSearchOverlay: {
      flex: 0,
    },
    browseModesLayoutBrowse: {
      alignSelf: 'stretch',
    },
    contentWrapper: {
      flex: 1,
      paddingTop: insets.top + TOP_SECTION_ROW_HEIGHT + 12, // DO NOT CHANGE THIS FOR NOW
      paddingBottom: 120,
      paddingHorizontal: Paddings.screen,
      backgroundColor: themeColors.background.primary(),
      overflow: 'visible',
    },
    // browse lists only: paddingTop applied inline (below absolute search row); no flex:1 so scroll height follows content
    browseListsContentWrapper: {
      
      paddingBottom: 120,
      paddingHorizontal: Paddings.screen,
      backgroundColor: themeColors.background.primary(),
      overflow: 'visible',
    },
    searchIdleWrap: {
      alignSelf: 'stretch',
    },
    searchIdleHidden: {
      opacity: 0,
    },
    searchTab: {
      borderRadius: 20,
      overflow: 'visible',
    },
    searchTabInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      paddingVertical: Paddings.pillVertical,
      minHeight: 44,
    },
    searchTabLabel: {
      ...typography.getTextStyle('body-large'),
      marginLeft: Paddings.groupedListIconTextSpacing,
    },
    searchTabAndroid: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      paddingVertical: Paddings.pillVertical,
      minHeight: 44,
    },
    floatingSearchPillSlot: {
      minWidth: 0,
    },
    floatingSearchPillFill: {
      width: '100%',
    },
    floatingCancelSlot: {
      width: INLINE_CANCEL_TOUCH_SIZE,
      minWidth: INLINE_CANCEL_TOUCH_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
    // horizontal-only chip strip; overflow visible + removeClippedSubviews false so liquid glass can extend past chip bounds
    searchFilterChipsScroll: {
      marginTop: SEARCH_BAR_TO_CHIPS_GAP,
      flexGrow: 0,
      overflow: 'visible',
    },
    searchFilterChipsContent: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'center',
      gap: 16,
      paddingTop: 0,
      paddingBottom: 10,
      // inset lives on scroll content, not the scroll view — aligns first chip with search field above
      paddingLeft: Paddings.screen,
      paddingRight: Paddings.screen,
    },
    searchFilterChipGlass: {
      borderRadius: 20,
      overflow: 'visible',
    },
    searchFilterChipInner: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchFilterChipAndroid: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 36,
      borderRadius: 20,
      overflow: 'visible',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // fixed metrics for all states so selected vs idle doesn’t resize the pill and nudge sibling chips
    searchFilterChipLabel: {
      ...typography.getTextStyle('body-medium'),
      fontWeight: '600',
    },
    searchTabFloating: {
      borderRadius: 20,
      overflow: 'visible',
    },
    searchInput: {
      ...typography.getTextStyle('body-large'),
      flex: 1,
      marginLeft: Paddings.groupedListIconTextSpacing,
      padding: 0,
      backgroundColor: 'transparent',
    },
    myListsHeader: {
      marginTop: 24,
    },
    browseSearchContent: {
      flexGrow: 1,
      minHeight: 120,
      paddingTop: Paddings.touchTargetSmall,
      // temporary: extra space so search placeholder scrolls on short screens; trim when real results list ships
      paddingBottom: 480,
    },
    searchModeHeadline: {
      ...typography.getTextStyle('body-large'),
      fontWeight: '600',
      marginBottom: 12,
    },
    searchModeBody: {
      ...typography.getTextStyle('body-medium'),
      marginBottom: 14,
      lineHeight: 22,
    },
    searchModeHint: {
      ...typography.getTextStyle('body-small'),
      marginTop: 8,
      lineHeight: 20,
    },
    recentSearchRows: {
      alignSelf: 'stretch',
    },
    recentSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: Paddings.touchTargetSmall,
    },
    recentSearchRowSpacing: {
      marginBottom: 4,
    },
    recentSearchRowText: {
      ...typography.getTextStyle('body-large'),
      flex: 1,
      marginLeft: Paddings.groupedListIconTextSpacing,
    },
    recentlyViewedBlocks: {
      alignSelf: 'stretch',
    },
    groupedListSection: {
      paddingTop: 0,
    },
    listContainer: {
      marginVertical: 0,
    },
    listsPillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingTop: Paddings.groupedListHeaderContentGap,
    },
    listPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      paddingVertical: Paddings.pillVertical,
      borderRadius: 24,
      minHeight: 44,
    },
    listPillName: {
      ...typography.getTextStyle('body-large'),
      marginLeft: Paddings.groupedListIconTextSpacing,
    },
    listPillNameBold: {
      fontWeight: '700',
    },
    listPillCountGap: {
      width: 12,
    },
    listPillCount: {
      ...typography.getTextStyle('body-large'),
    },
  });
