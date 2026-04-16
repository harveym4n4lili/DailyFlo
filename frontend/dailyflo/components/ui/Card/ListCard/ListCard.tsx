/**
 * ListCard Component
 * 
 * This component displays a list of tasks using TaskCard components.
 * It handles the layout and organization of multiple task cards,
 * grouping, sorting, and provides callback functions for task interactions.
 * 
 * This component demonstrates the composition pattern - it composes smaller components
 * (GroupHeader, EmptyState, LoadingState) and uses custom hooks for animation management.
 * 
 * This component demonstrates the flow from Redux store → ListCard → TaskCard → User interaction.
 */

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EllipsisIcon } from '@/components/ui/icon';

// enable layout animations on android for smooth group expansion animations
// this ensures android can use layout animations like ios does
if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// TYPES FOLDER IMPORTS - TypeScript type definitions
import { Task } from '@/types';

// import our TaskCard component
import { TaskCard } from '../TaskCard';

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { CHECKBOX_HIDE_DELAY_MS, TASK_HEIGHT_ESTIMATE } from '@/constants/Checkbox';

// import custom hooks for animation management
import { useGroupAnimations } from '@/hooks/useGroupAnimations';
import AnimatedReanimated, { useAnimatedStyle, useSharedValue, useAnimatedScrollHandler, runOnJS, interpolate, Extrapolation, FadeOut, FadeInUp, FadeOutUp, type SharedValue } from 'react-native-reanimated';
import { LAYOUT_TRANSITION_SPRING } from '@/constants/LayoutTransitions';

const AnimatedFlatList = AnimatedReanimated.createAnimatedComponent(FlatList);
import { DropdownList, DropdownListItem } from '@/components/ui/list';

// import sub-components
import GroupHeader from './GroupHeader';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';

// import utility functions for task grouping and sorting
import { groupTasks, sortTasks, sortGroupEntries, formatDateForGroup } from '@/utils/taskGrouping';
import { getListDisplayName } from '@/utils/listDisplayName';
import { useLists } from '@/store/hooks';

/**
 * Props interface for ListCard component
 * 
 * This defines what data the component needs to display a list of tasks
 * and what functions it can call when the user interacts with tasks.
 */
export interface ListCardProps {
  // array of tasks to display
  tasks: Task[];

  // callback functions for task interactions (passed down to TaskCard components)
  onTaskPress?: (task: Task) => void; // called when user taps a task card
  onTaskComplete?: (task: Task) => void; // called when user marks a task as complete
  onTaskEdit?: (task: Task) => void; // called when user wants to edit a task
  onTaskDelete?: (task: Task) => void; // called when user wants to delete a task

  // optional display options
  showCategory?: boolean; // whether to show category names in task cards
  compact?: boolean; // whether to use compact layout for task cards
  showIcon?: boolean; // whether to show task icon (default true)
  showIndicators?: boolean; // whether to show bottom-right list/routine indicators (default true)
  showMetadata?: boolean; // whether to show date/time/duration metadata (default true)
  metadataVariant?: 'default' | 'today'; // 'today' = time as "09:00 - 09:30", no "Today" text
  cardSpacing?: number; // spacing between task cards (default 20)
  showDashedSeparator?: boolean; // whether to show dashed separator below each card (default false)
  /** passed to TaskCard: solid rules on today / search, dashed elsewhere by default */
  taskRowSeparatorVariant?: 'dashed' | 'solid';
  separatorPaddingHorizontal?: number; // horizontal padding for separators to match list padding (defaults to paddingHorizontal)
  hideBackground?: boolean; // whether to hide task card backgrounds (default false)
  removeInnerPadding?: boolean; // whether to remove horizontal padding inside task cards (default false)
  /** today-style row: leaf + list / recurrence under title (passed to TaskCard) */
  showListRecurrenceRow?: boolean;
  /** when true with groupBy dueDate: today’s group (formatted date key) cannot collapse — no chevron, always expanded */
  lockTodayGroupExpanded?: boolean;
  /** ios: expo-glass-effect; android: rounded elevated fallback — rounded rows instead of flat + dashed rules */
  liquidGlass?: boolean;
  emptyMessage?: string; // message to show when no tasks are available
  loading?: boolean; // whether the list is currently loading

  // optional list configuration
  groupBy?: 'priority' | 'dueDate' | 'color' | 'allDay' | 'routine' | 'none'; // routine = one-time vs recurring (browse list detail); allDay = planner all-day bucket
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title'; // how to sort tasks
  sortDirection?: 'asc' | 'desc'; // sort direction

  // pull-to-refresh support
  onRefresh?: () => void; // called when user pulls to refresh
  refreshing?: boolean; // whether the list is currently refreshing

  // scroll event support
  onScroll?: (event: any) => void; // called when the list is scrolled
  scrollEventThrottle?: number; // throttle for scroll events

  // header support
  headerTitle?: string; // title to display in header
  headerSubtitle?: string; // subtitle to display in header
  
  // padding support
  paddingTop?: number; // top padding for the list container
  paddingHorizontal?: number; // horizontal padding for the list container
  paddingBottom?: number; // bottom padding (default: space for FAB; use smaller value when inside ScrollView)
  
  // dropdown menu support
  // array of menu items to display in the dropdown menu (shown as ellipse button in header)
  // if provided, an ellipse button will appear in the header to open the dropdown
  dropdownItems?: DropdownListItem[];
  
  // optional anchor position for the dropdown menu
  // controls where the menu appears relative to the trigger button
  dropdownAnchorPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  // optional offsets for dropdown positioning
  dropdownTopOffset?: number; // top offset for dropdown positioning
  dropdownRightOffset?: number; // right offset for dropdown positioning
  dropdownLeftOffset?: number; // left offset for dropdown positioning

  // optional handler for overdue group bulk reschedule (used on Today screen)
  // when provided, the "Overdue" group header will show a "Reschedule" action
  // that calls this handler with all tasks in the Overdue group
  onOverdueReschedule?: (tasks: Task[]) => void;

  // optional flag to hide the group header for today's date (used on Today screen)
  // when true, the group header that shows today's date will be hidden
  hideTodayHeader?: boolean;

  // optional big "Today" header at top of list (used on Today screen)
  // when true, renders a large "Today" title as the first element in the list header
  bigTodayHeader?: boolean;

  // when true, list content extends under top safe area (status bar) so user can scroll past it
  // use with safeAreaTop={false} on parent ScreenContainer - content starts below status bar
  // but can scroll up into that area without being cut off
  scrollPastTopInset?: boolean;

  // optional shared value for scroll offset - when provided with bigTodayHeader, Today header fades out on scroll
  scrollYSharedValue?: SharedValue<number>;

  // when false, disables internal scrolling - use when ListCard is inside another ScrollView (e.g. planner footer)
  scrollEnabled?: boolean;

  // when true, shows vertical scroll indicator on the right (default false)
  showsVerticalScrollIndicator?: boolean;

  // ios: forwarded to FlatList — 'automatic' lets uikit link scroll + safe area (needed for native tab bar minimize with NativeTabs)
  contentInsetAdjustmentBehavior?: 'automatic' | 'scrollableAxes' | 'never';

  // when true, completed tasks are hidden from the list - they disappear when checked (iOS-style)
  hideCompletedTasks?: boolean;

  // when true (default for Today), delays scroll-up and height shrink when tasks are hidden - smoother feel
  // when false (planner), runs immediately so parent layout animation can sync
  delayHeightChangeOnTaskComplete?: boolean;

  // when true, disables layout transition on initial mount so parent (e.g. timeline) doesn't slide up on load
  // used when ListCard is inside a scroll container (e.g. planner footer) to avoid Reanimated animating first layout
  disableInitialLayoutTransition?: boolean;

  // selection mode - when true, task cards show selection checkboxes and tap toggles selection
  // parent (e.g. Today/Planner screen) gets these from Redux via useUI(); ListCard receives them as props
  // and passes selectionMode, isSelected, onSelect down to each TaskCard
  selectionMode?: boolean;
  selectedTaskIds?: string[];
  onToggleTaskSelection?: (taskId: string) => void;
}

/**
 * ListCard Component
 * 
 * This is a container component that receives an array of tasks and displays them
 * using TaskCard components. It handles the layout, grouping, and sorting of tasks.
 * It doesn't directly interact with Redux - instead, it receives task data as props
 * and passes callback functions down to TaskCard components.
 */
export default function ListCard({
  tasks,
  onTaskPress,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  showCategory = false,
  compact = false,
  showIcon = true,
  showIndicators = true,
  showMetadata = true,
  metadataVariant,
  cardSpacing = 20,
  showDashedSeparator = false,
  taskRowSeparatorVariant = 'solid',
  separatorPaddingHorizontal,
  hideBackground = false,
  removeInnerPadding = false,
  showListRecurrenceRow = false,
  lockTodayGroupExpanded = false,
  liquidGlass = false,
  emptyMessage = 'No tasks available',
  loading = false,
  groupBy = 'none',
  sortBy = 'createdAt',
  sortDirection = 'desc',
  onRefresh,
  refreshing = false,
  onScroll,
  scrollEventThrottle = 16,
  headerTitle,
  headerSubtitle,
  paddingTop,
  paddingHorizontal = Paddings.screenSmall,
  paddingBottom,
  dropdownItems,
  dropdownAnchorPosition = 'top-right',
  dropdownTopOffset = 0,
  dropdownRightOffset = 20,
  dropdownLeftOffset = 20,
  onOverdueReschedule,
  hideTodayHeader = false,
  bigTodayHeader = false,
  scrollPastTopInset = false,
  scrollYSharedValue,
  scrollEnabled = true,
  showsVerticalScrollIndicator = false,
  hideCompletedTasks = false,
  delayHeightChangeOnTaskComplete = true,
  disableInitialLayoutTransition = false,
  selectionMode = false,
  selectedTaskIds = [],
  onToggleTaskSelection,
}: ListCardProps) {
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();

  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  const typography = useTypography();

  // SAFE AREA INSETS - Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();

  // use separatorPaddingHorizontal if provided, otherwise default to paddingHorizontal
  const finalSeparatorPaddingHorizontal = separatorPaddingHorizontal ?? paddingHorizontal;

  // DROPDOWN STATE - Controls the visibility of the dropdown menu
  // when dropdownItems are provided, this state manages whether the dropdown is visible
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  
  // FLATLIST REFS - Create refs for FlatList instances to control scroll position
  // using refs ensures each ListCard instance has independent scroll control
  const flatListRef = useRef<FlatList>(null);
  const groupedFlatListRef = useRef<FlatList>(null);
  const [minContentHeight, setMinContentHeight] = useState(0);
  // track scroll offset so we can scroll up by removed height when tasks disappear (hideCompletedTasks)
  const scrollOffsetRef = useRef(0);
  const prevVisibleCountRef = useRef(0);
  // track content/layout height for scroll clamp when groups collapse - prevents white space
  const contentHeightRef = useRef(0);
  const layoutHeightRef = useRef(0);
  // when grouped + scrollEnabled: shrink container height to content when collapsed (removes white space)
  const [listHeight, setListHeight] = useState<number | null>(null);

  // when disableInitialLayoutTransition is true, keep layout transition off for 2s so initial load doesn't slide timeline
  // after 2s enable it so header toggle collapse/expand animates smoothly (timeline slides with list)
  const [layoutTransitionEnabled, setLayoutTransitionEnabled] = useState(!disableInitialLayoutTransition);
  const layoutTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!disableInitialLayoutTransition) return;
    layoutTransitionTimeoutRef.current = setTimeout(() => {
      layoutTransitionTimeoutRef.current = null;
      setLayoutTransitionEnabled(true);
    }, 2000);
    return () => {
      if (layoutTransitionTimeoutRef.current) {
        clearTimeout(layoutTransitionTimeoutRef.current);
        layoutTransitionTimeoutRef.current = null;
      }
    };
  }, [disableInitialLayoutTransition]);
  
  // UNIQUE INSTANCE ID - Generate a unique ID for this ListCard instance
  // this ensures React treats each instance as completely separate
  const instanceId = useRef(Math.random().toString(36).substring(7)).current;
  
  // RESET SCROLL POSITION ON MOUNT - Ensure each ListCard starts at the top
  // this prevents scroll position from being shared between instances
  useEffect(() => {
    // reset scroll position to top when component mounts
    // small delay ensures FlatList is fully rendered before scrolling
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      groupedFlatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // RESET SCROLL POSITION AFTER REFRESH - Ensure scroll position resets after refresh completes
  // this prevents scroll position from accumulating between refresh cycles
  useEffect(() => {
    if (!refreshing) {
      // when refreshing becomes false, reset scroll position to top
      // small delay ensures refresh animation completes first
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        groupedFlatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [refreshing]);

  // create dynamic styles using the color palette system and typography system
  const styles = useMemo(
    () => createStyles(themeColors, semanticColors, typography, insets, paddingTop, paddingHorizontal, paddingBottom, scrollPastTopInset),
    [themeColors, semanticColors, typography, insets, paddingTop, paddingHorizontal, paddingBottom, scrollPastTopInset]
  );

  // use custom hooks for animation management
  const {
    collapsedGroups,
    toggleGroupCollapse,
    getAnimatedValuesForGroup,
    isGroupCollapsed,
  } = useGroupAnimations();


  // when hideCompletedTasks: hide completed tasks (local + redux). optimistically hide on tap so we don't wait for redux
  const [locallyCompletedIds, setLocallyCompletedIds] = useState<Set<string>>(() => new Set());
  // tracks tasks that user just checked and are waiting for timeout before we hide them
  // this prevents redux completion updates from hiding the row too early.
  const [pendingHideIds, setPendingHideIds] = useState<Set<string>>(() => new Set());
  // ref updated synchronously on check - avoids race where parent re-renders (from Redux) before our setState commits
  const pendingHideIdsRef = useRef<Set<string>>(new Set());
  // cache pending task snapshots so row can stay visible during delay even if upstream task list updates immediately
  const [pendingHideTaskById, setPendingHideTaskById] = useState<Record<string, Task>>({});
  const hideTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => () => {
    Object.values(hideTimeoutRef.current).forEach(clearTimeout);
    hideTimeoutRef.current = {};
  }, []);

  // sync with redux: if a task was unchecked elsewhere (e.g. Planner), remove from locallyCompletedIds so it reappears
  useEffect(() => {
    if (!hideCompletedTasks || (locallyCompletedIds.size === 0 && pendingHideIds.size === 0)) return;
    const stillCompleted = new Set<string>();
    const stillPending = new Set<string>();
    locallyCompletedIds.forEach((id) => {
      const task = tasks.find((t) => t.id === id);
      if (task?.isCompleted) stillCompleted.add(id);
    });
    pendingHideIds.forEach((id) => {
      const task = tasks.find((t) => t.id === id);
      // keep pending id when task is missing from current source list; timeout still controls final hide.
      if (!task || task.isCompleted) stillPending.add(id);
    });
    if (stillCompleted.size !== locallyCompletedIds.size) {
      setLocallyCompletedIds(stillCompleted);
    }
    if (stillPending.size !== pendingHideIds.size) {
      setPendingHideIds(stillPending);
    }
  }, [tasks, hideCompletedTasks, locallyCompletedIds, pendingHideIds]);

  // prune cached pending task snapshots when ids are no longer pending.
  useEffect(() => {
    setPendingHideTaskById((prev) => {
      const next: Record<string, Task> = {};
      pendingHideIds.forEach((id) => {
        if (prev[id]) next[id] = prev[id];
      });
      return next;
    });
  }, [pendingHideIds]);

  const visibleTasks = useMemo(() => {
    if (!hideCompletedTasks) return tasks;
    // use ref for pending ids so we see updates synchronously even if parent re-renders before our setState commits
    const pendingIds = pendingHideIdsRef.current;
    const baseVisibleTasks = tasks.filter((t) => {
      // keep rows visible while pending hide timeout, even if redux already set isCompleted=true.
      const completionAllowsVisible = !t.isCompleted || pendingHideIds.has(t.id) || pendingIds.has(t.id);
      return completionAllowsVisible && !locallyCompletedIds.has(t.id);
    });
    // if upstream data no longer includes a pending task yet, keep rendering cached copy until timeout ends.
    const allPendingIds = new Set([...pendingHideIds, ...pendingIds]);
    const missingPendingTasks = Array.from(allPendingIds)
      .filter((id) => !baseVisibleTasks.some((t) => t.id === id))
      .map((id) => pendingHideTaskById[id])
      .filter((t): t is Task => !!t);
    return [...baseVisibleTasks, ...missingPendingTasks];
  }, [tasks, hideCompletedTasks, locallyCompletedIds, pendingHideIds, pendingHideTaskById]);

  const handleTaskCompleteImmediate = useCallback(
    (task: Task, targetCompleted?: boolean) => {
      if (!hideCompletedTasks) return;
      if (targetCompleted === false) {
        if (hideTimeoutRef.current[task.id]) {
          clearTimeout(hideTimeoutRef.current[task.id]);
          delete hideTimeoutRef.current[task.id];
        }
        pendingHideIdsRef.current.delete(task.id);
        setPendingHideIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
        setLocallyCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
        setPendingHideTaskById((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
      } else {
        // add to ref synchronously so visibleTasks sees it even if parent re-renders before setState commits
        pendingHideIdsRef.current.add(task.id);
        setPendingHideIds((prev) => new Set(prev).add(task.id));
        setPendingHideTaskById((prev) => ({ ...prev, [task.id]: task }));
        hideTimeoutRef.current[task.id] = setTimeout(() => {
          delete hideTimeoutRef.current[task.id];
          pendingHideIdsRef.current.delete(task.id);
          setPendingHideIds((prev) => {
            const next = new Set(prev);
            next.delete(task.id);
            return next;
          });
          setLocallyCompletedIds((prev) => new Set(prev).add(task.id));
          setPendingHideTaskById((prev) => {
            const next = { ...prev };
            delete next[task.id];
            return next;
          });
        }, CHECKBOX_HIDE_DELAY_MS);
      }
    },
    [hideCompletedTasks]
  );

  const handleTaskComplete = useCallback(
    (task: Task, targetCompleted?: boolean) => {
      // when hideCompletedTasks: delay Redux sync so our setState (pendingHideIds) commits before parent re-renders
      // otherwise parent can pass new tasks before we've marked the task pending, and it disappears immediately
      if (hideCompletedTasks) {
        setTimeout(() => onTaskComplete?.(task, targetCompleted), 50);
      } else {
        onTaskComplete?.(task, targetCompleted);
      }
    },
    [onTaskComplete, hideCompletedTasks]
  );

  // process and organize tasks based on grouping and sorting options
  const processedTasks = useMemo(() => {
    return sortTasks(visibleTasks, sortBy, sortDirection);
  }, [visibleTasks, sortBy, sortDirection]);

  // group tasks if grouping is enabled
  const groupedTasks = useMemo(() => {
    return groupTasks(processedTasks, groupBy);
  }, [processedTasks, groupBy]);

  // sort groups: Today first, then Overdue, then others, Completed last
  const sortedGroupEntries = useMemo(() => {
    if (groupBy === 'none') return [];
    const entries = Object.entries(groupedTasks).filter(([, tasks]) => tasks.length > 0);
    return sortGroupEntries(entries);
  }, [groupedTasks, groupBy]);

  // matches group key for “today” when grouping by due date — used to hide collapse UI and keep section open
  const todayGroupKeyForLock = useMemo(() => {
    if (!lockTodayGroupExpanded || groupBy !== 'dueDate') return null;
    return formatDateForGroup(new Date());
  }, [lockTodayGroupExpanded, groupBy]);

  const handleGroupToggle = useCallback(
    (groupTitle: string) => {
      if (todayGroupKeyForLock && groupTitle === todayGroupKeyForLock) return;
      toggleGroupCollapse(groupTitle);
    },
    [todayGroupKeyForLock, toggleGroupCollapse],
  );

  // memoized render - stable ref so FlatList doesn't re-render all items when parent updates
  const renderTaskCard = useCallback<ListRenderItem<Task>>(
    ({ item: task, index }) => {
      const isLastItem = index === processedTasks.length - 1;
      const isFirstItem = index === 0;
      const isSelected = selectionMode && selectedTaskIds.includes(task.id);
      const card = (
          <TaskCard
            task={task}
            onPress={selectionMode && onToggleTaskSelection ? undefined : onTaskPress}
            onComplete={selectionMode ? undefined : handleTaskComplete}
            onCompleteImmediate={selectionMode ? undefined : handleTaskCompleteImmediate}
            onEdit={onTaskEdit}
            onDelete={onTaskDelete}
            showCategory={showCategory}
            compact={compact}
            showIcon={showIcon}
            showIndicators={showIndicators}
            showMetadata={showMetadata}
            metadataVariant={metadataVariant}
            cardSpacing={cardSpacing}
            showDashedSeparator={showDashedSeparator}
            taskRowSeparatorVariant={taskRowSeparatorVariant}
            separatorPaddingHorizontal={finalSeparatorPaddingHorizontal}
            hideBackground={hideBackground}
            removeInnerPadding={removeInnerPadding}
            showListRecurrenceRow={showListRecurrenceRow}
            liquidGlass={liquidGlass}
            isLastItem={isLastItem}
            isFirstItem={isFirstItem}
            selectionMode={selectionMode}
            isSelected={isSelected}
            onSelect={selectionMode && onToggleTaskSelection ? (t: Task, _selected?: boolean) => onToggleTaskSelection(t.id) : undefined}
          />
      );
      return hideCompletedTasks ? (
        <AnimatedReanimated.View layout={layoutTransitionEnabled ? LAYOUT_TRANSITION_SPRING : undefined} exiting={FadeOut.duration(200)}>
          {card}
        </AnimatedReanimated.View>
      ) : (
        card
      );
    },
    [
      processedTasks.length,
      hideCompletedTasks,
      onTaskPress,
      handleTaskComplete,
      handleTaskCompleteImmediate,
      onTaskEdit,
      onTaskDelete,
      showCategory,
      compact,
      showIcon,
      showIndicators,
      showMetadata,
      metadataVariant,
      cardSpacing,
      showDashedSeparator,
      taskRowSeparatorVariant,
      finalSeparatorPaddingHorizontal,
      hideBackground,
      removeInnerPadding,
      showListRecurrenceRow,
      liquidGlass,
      layoutTransitionEnabled,
      selectionMode,
      selectedTaskIds,
      onToggleTaskSelection,
    ]
  );

  // render group header with dropdown arrow for expand/collapse functionality
  const renderGroupHeader = (title: string, count: number, groupTasks: Task[]) => {
    // check if we should hide today's header - compare title with today's formatted date
    if (hideTodayHeader) {
      const today = new Date();
      const todayFormatted = formatDateForGroup(today);
      // if title matches today's formatted date, return null to hide the header
      if (title === todayFormatted) {
        return null;
      }
    }

    const isCollapsed = isGroupCollapsed(title);
    const isTodayGroupLocked = Boolean(todayGroupKeyForLock && title === todayGroupKeyForLock);
    const headerCollapsed = isTodayGroupLocked ? false : isCollapsed;
    const animatedValuesForGroup = getAnimatedValuesForGroup(title);

    // calculate arrow rotation animation - smoothly rotate arrow between down (expanded) and right (collapsed)
    const arrowRotation = animatedValuesForGroup.rotateValue.interpolate({
      inputRange: [0, 1], // 0 = collapsed (right), 1 = expanded (down)
      outputRange: ['-90deg', '0deg'], // collapsed: point right; expanded: point down
    });

    // determine if this group should show a secondary "Reschedule" action
    // we only show it for the Overdue group when a handler is provided
    const showSecondaryAction =
      title === 'Overdue' && typeof onOverdueReschedule === 'function';

    return (
      <GroupHeader
        title={title}
        count={count}
        isCollapsed={headerCollapsed}
        arrowRotation={arrowRotation}
        showSecondaryAction={showSecondaryAction}
        collapsible={!isTodayGroupLocked}
        onSecondaryActionPress={
          showSecondaryAction && onOverdueReschedule
            ? () => onOverdueReschedule(groupTasks)
            : undefined
        }
        onPress={() => handleGroupToggle(title)}
      />
    );
  };

  // handle dropdown button press - toggles dropdown menu visibility
  const handleDropdownButtonPress = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // fallback shared value when scrollY not provided - stays at 0 so header stays visible
  const fallbackScrollY = useSharedValue(0);
  const scrollY = scrollYSharedValue ?? fallbackScrollY;

  // track scroll offset in ref so we can scroll up by removed height when tasks disappear (hideCompletedTasks)
  const updateScrollOffsetRef = useCallback((y: number) => {
    scrollOffsetRef.current = y;
  }, []);

  // when scrollYSharedValue provided: animated scroll handler runs on UI thread; scrollY updates every event for smooth header fade
  const animatedScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      scrollY.value = y;
      runOnJS(updateScrollOffsetRef)(y);
      if (onScroll) runOnJS(onScroll)({ nativeEvent: e });
    },
    onEndDrag: (e) => {
      runOnJS(updateScrollOffsetRef)(e.contentOffset.y);
    },
    onMomentumEnd: (e) => {
      runOnJS(updateScrollOffsetRef)(e.contentOffset.y);
    },
  });
  // when no animated handler: wrap onScroll to also track scroll offset for scroll-up-after-hide
  const scrollHandlerWithOffsetTracking = useCallback((e: any) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
    onScroll?.(e);
  }, [onScroll]);
  const scrollHandler = scrollYSharedValue ? animatedScrollHandler : scrollHandlerWithOffsetTracking;

  // when hideCompletedTasks: keep content container from shrinking - use max height seen so content above doesn't teleport
  const handleContentSizeChange = useCallback(
    (_w: number, h: number) => {
      if (!hideCompletedTasks) return;
      setMinContentHeight((prev) => (h > prev ? h : prev));
    },
    [hideCompletedTasks]
  );

  // when grouped list collapses: shrink container to content height (removes white space)
  // Planner (scrollEnabled=false): always size to content - no viewport, embedded in ScrollView
  // Today (scrollEnabled=true): size to content when smaller than viewport, else fill
  // When Today content shrinks due to collapse (task count unchanged), shrink minContentHeight so no white-space scroll
  const handleGroupedContentSizeChange = useCallback(
    (_w: number, h: number) => {
      const prev = contentHeightRef.current;
      contentHeightRef.current = h;
      const layoutH = layoutHeightRef.current;
      if (!scrollEnabled) {
        // Planner: always size to content - list card height = collapsible header(s) + items only
        setListHeight(h);
      } else if (layoutH > 0) {
        // Today: shrink when content smaller than viewport, else fill
        setListHeight(h < layoutH ? h : null);
        // collapse (not task completion): task count unchanged so shrink minContentHeight - no white-space scroll
        if (prev > 0 && h < prev && visibleTasks.length === prevVisibleCountRef.current) {
          setMinContentHeight(h);
        }
      }
      // clamp scroll when content shrinks (Today only) so user can't scroll into white space
      if (scrollEnabled && prev > 0 && h < prev) {
        const maxScroll = Math.max(0, h - layoutH);
        const currentScroll = scrollOffsetRef.current;
        if (currentScroll > maxScroll) {
          groupedFlatListRef.current?.scrollToOffset({ offset: maxScroll, animated: false });
          scrollOffsetRef.current = maxScroll;
        }
      }
      // keep previous count for next time so we can tell collapse (count unchanged) vs task completion (count decreased)
      prevVisibleCountRef.current = visibleTasks.length;
    },
    [scrollEnabled, visibleTasks.length]
  );

  // combined handler for grouped list: hideCompletedTasks minHeight + collapse scroll clamp
  const handleGroupedListContentSizeChange = useCallback(
    (w: number, h: number) => {
      handleContentSizeChange(w, h);
      handleGroupedContentSizeChange(w, h);
    },
    [handleContentSizeChange, handleGroupedContentSizeChange]
  );

  // reset min height and list height when refreshing or list becomes empty
  useEffect(() => {
    if (refreshing || visibleTasks.length === 0) {
      setMinContentHeight(0);
      setListHeight(null);
    }
  }, [refreshing, visibleTasks.length]);

  // when hideCompletedTasks: scroll up by height of removed tasks so content doesn't jump
  // minContentHeight keeps container from shrinking during transition; we scroll up, then shrink so user can't scroll into white space
  const SCROLL_ANIMATION_MS = 350; // match typical scrollToOffset animated duration
  const scrollDelayMs = delayHeightChangeOnTaskComplete ? 50 : 0;
  const shrinkDelayMs = delayHeightChangeOnTaskComplete ? 50 + SCROLL_ANIMATION_MS : 0;
  useEffect(() => {
    if (!hideCompletedTasks || refreshing) return;
    const prev = prevVisibleCountRef.current;
    const curr = visibleTasks.length;
    prevVisibleCountRef.current = curr;
    if (prev > 0 && curr < prev) {
      const removedCount = prev - curr;
      const scrollUpBy = removedCount * TASK_HEIGHT_ESTIMATE;
      const targetOffset = Math.max(0, scrollOffsetRef.current - scrollUpBy);
      const listRef = groupBy === 'none' ? flatListRef : groupedFlatListRef;
      const scrollTimer = setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: targetOffset, animated: true });
      }, scrollDelayMs);
      const shrinkTimer = setTimeout(() => {
        setMinContentHeight((h) => Math.max(0, h - scrollUpBy));
      }, shrinkDelayMs);
      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(shrinkTimer);
      };
    }
  }, [hideCompletedTasks, visibleTasks.length, groupBy, refreshing, scrollDelayMs, shrinkDelayMs]);

  const contentContainerStyle = useMemo(
    () => [
      styles.listContainer,
      // only use minHeight when scrollable (Today) so task-completion scroll-up works; Planner must shrink on collapse
      hideCompletedTasks && minContentHeight > 0 && scrollEnabled && { minHeight: minContentHeight },
      // when grouped: no flexGrow so list height shrinks when groups collapse
      groupBy !== 'none' && { flexGrow: 0 },
    ].filter(Boolean),
    [styles.listContainer, hideCompletedTasks, minContentHeight, groupBy, scrollEnabled]
  );

  // animated style for Today header - fades out when scrollY passes 48px (uses reanimated for smooth 60fps)
  const bigTodayHeaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, 48],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  // render header component with optional big today header and dropdown button
  const renderHeader = () => {
    const hasStandardHeader = headerTitle || headerSubtitle || dropdownItems;
    if (!bigTodayHeader && !hasStandardHeader) return null;

    return (
      <View style={styles.listHeaderWrapper}>
        {/* big "Today" header - large typography at top when bigTodayHeader is true, fades on scroll; in selection mode shows "X selected" */}
        {bigTodayHeader && (
          <AnimatedReanimated.View style={bigTodayHeaderAnimatedStyle}>
            <Text style={styles.bigTodayHeader}>
              {selectionMode ? `${selectedTaskIds.length} selected` : 'Today'}
            </Text>
          </AnimatedReanimated.View>
        )}
        {/* standard header: title, subtitle, dropdown button */}
        {hasStandardHeader && (
          <View style={styles.headerContainer}>
            <View style={styles.headerTextContainer}>
              {headerTitle && <Text style={styles.headerTitle}>{headerTitle}</Text>}
              {headerSubtitle && <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>}
            </View>
            {dropdownItems && dropdownItems.length > 0 && (
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={handleDropdownButtonPress}
                activeOpacity={0.7}
              >
                <EllipsisIcon
                  size={20}
                  color={themeColors.text.primary()}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // show loading state if loading
  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState />
      </View>
    );
  }

  // show empty state if no tasks
  if (tasks.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState message={emptyMessage} />
      </View>
    );
  }

  // create refresh control for pull-to-refresh functionality
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#007AFF" // iOS blue color for pull-to-refresh indicator
    />
  ) : undefined;

  // render grouped or flat list
  if (groupBy === 'none') {
    // render flat list without grouping
    return (
      <View style={styles.container}>
        {/* dropdown list component - shown when dropdownItems are provided */}
        {dropdownItems && dropdownItems.length > 0 && (
          <DropdownList
            visible={isDropdownVisible}
            onClose={() => setIsDropdownVisible(false)}
            items={dropdownItems}
            anchorPosition={dropdownAnchorPosition}
            topOffset={dropdownTopOffset}
            rightOffset={dropdownRightOffset}
            leftOffset={dropdownLeftOffset}
          />
        )}
        <AnimatedFlatList
          ref={flatListRef as any}
          data={processedTasks}
          renderItem={renderTaskCard}
          keyExtractor={(task) => `${instanceId}-${task.id}`}
          itemLayoutAnimation={layoutTransitionEnabled && hideCompletedTasks ? LAYOUT_TRANSITION_SPRING : undefined}
          onContentSizeChange={hideCompletedTasks ? handleContentSizeChange : undefined}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentContainerStyle}
          refreshControl={refreshControl}
          onScroll={scrollHandler}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          ListHeaderComponent={renderHeader}
          scrollEnabled={scrollEnabled}
          removeClippedSubviews={!hideCompletedTasks}
          maxToRenderPerBatch={6}
          windowSize={7}
          initialNumToRender={8}
        />
      </View>
    );
  } else {
    // render grouped list using sortedGroupEntries (already computed above)
    // when listHeight is set and content is smaller than viewport, shrink container to remove white space
    const groupedContainerStyle = listHeight !== null
      ? [styles.container, { flex: undefined, height: listHeight }]
      : styles.container;
    return (
      <AnimatedReanimated.View layout={layoutTransitionEnabled ? LAYOUT_TRANSITION_SPRING : undefined} style={groupedContainerStyle}>
        {/* dropdown list component - shown when dropdownItems are provided */}
        {dropdownItems && dropdownItems.length > 0 && (
          <DropdownList
            visible={isDropdownVisible}
            onClose={() => setIsDropdownVisible(false)}
            items={dropdownItems}
            anchorPosition={dropdownAnchorPosition}
            topOffset={dropdownTopOffset}
            rightOffset={dropdownRightOffset}
            leftOffset={dropdownLeftOffset}
          />
        )}
        <AnimatedFlatList
          data={sortedGroupEntries}
          itemLayoutAnimation={layoutTransitionEnabled && (hideCompletedTasks || groupBy !== 'none') ? LAYOUT_TRANSITION_SPRING : undefined}
          onContentSizeChange={handleGroupedListContentSizeChange}
          onLayout={(e) => {
            layoutHeightRef.current = e.nativeEvent.layout.height;
            // re-evaluate height when layout is first measured (handles onLayout after onContentSizeChange)
            if (scrollEnabled && layoutHeightRef.current > 0) {
              const h = contentHeightRef.current;
              setListHeight(h > 0 && h < layoutHeightRef.current ? h : null);
            }
          }}
          renderItem={({ item: [groupTitle, groupTasks] }) => {
            const groupCollapsed = isGroupCollapsed(groupTitle);
            const isTodayGroupLocked =
              Boolean(todayGroupKeyForLock && groupTitle === todayGroupKeyForLock);
            const isCollapsed = isTodayGroupLocked ? false : groupCollapsed;
            return (
              <AnimatedReanimated.View layout={layoutTransitionEnabled ? LAYOUT_TRANSITION_SPRING : undefined} style={styles.group}>
                {renderGroupHeader(groupTitle, groupTasks.length, groupTasks as Task[])}
                {!isCollapsed && (
                  <AnimatedReanimated.View
                    entering={FadeInUp.duration(200)}
                    exiting={FadeOutUp.duration(200)}
                  >
                    <AnimatedFlatList
                      data={groupTasks}
                      scrollEnabled={false}
                      removeClippedSubviews={!hideCompletedTasks}
                      maxToRenderPerBatch={6}
                      initialNumToRender={6}
                      keyExtractor={(task) => task.id}
                      itemLayoutAnimation={layoutTransitionEnabled && hideCompletedTasks ? LAYOUT_TRANSITION_SPRING : undefined}
                      showsVerticalScrollIndicator={false}
                      renderItem={({ item: task, index }) => {
                        const isLastItem = index === groupTasks.length - 1;
                        const isFirstItem = index === 0;
                        const isSelected = selectionMode && selectedTaskIds.includes(task.id);
                        const card = (
                          <TaskCard
                            task={task}
                            onPress={selectionMode && onToggleTaskSelection ? undefined : onTaskPress}
                            onComplete={selectionMode ? undefined : handleTaskComplete}
                            onCompleteImmediate={selectionMode ? undefined : handleTaskCompleteImmediate}
                            onEdit={onTaskEdit}
                            onDelete={onTaskDelete}
                            showCategory={showCategory}
                            compact={compact}
                            showIcon={showIcon}
                            showIndicators={showIndicators}
                            showMetadata={showMetadata}
                            metadataVariant={metadataVariant}
                            cardSpacing={cardSpacing}
                            showDashedSeparator={showDashedSeparator}
                            taskRowSeparatorVariant={taskRowSeparatorVariant}
                            separatorPaddingHorizontal={finalSeparatorPaddingHorizontal}
                            hideBackground={hideBackground}
                            removeInnerPadding={removeInnerPadding}
                            showListRecurrenceRow={showListRecurrenceRow}
                            liquidGlass={liquidGlass}
                            isLastItem={isLastItem}
                            isFirstItem={isFirstItem}
                            selectionMode={selectionMode}
                            isSelected={isSelected}
                            onSelect={
                              selectionMode && onToggleTaskSelection
                                ? (t: Task, _selected?: boolean) => onToggleTaskSelection(t.id)
                                : undefined
                            }
                          />
                        );
                        return hideCompletedTasks ? (
                          <AnimatedReanimated.View
                            layout={layoutTransitionEnabled ? LAYOUT_TRANSITION_SPRING : undefined}
                            exiting={FadeOut.duration(200)}
                          >
                            {card}
                          </AnimatedReanimated.View>
                        ) : (
                          card
                        );
                      }}
                    />
                  </AnimatedReanimated.View>
                )}
              </AnimatedReanimated.View>
            );
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentContainerStyle}
          refreshControl={refreshControl}
          onScroll={scrollHandler}
          scrollEventThrottle={scrollEventThrottle}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          ListHeaderComponent={renderHeader}
          scrollEnabled={scrollEnabled}
          removeClippedSubviews={!hideCompletedTasks}
          maxToRenderPerBatch={5}
          windowSize={6}
          initialNumToRender={6}
        />
      </AnimatedReanimated.View>
    );
  }
}

// create dynamic styles using the color palette system and typography system
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  semanticColors: ReturnType<typeof useSemanticColors>,
  typography: ReturnType<typeof useTypography>,
  insets: { top: number; bottom: number; left: number; right: number },
  paddingTop?: number,
  paddingHorizontal?: number,
  paddingBottom?: number,
  scrollPastTopInset?: boolean
) =>
  StyleSheet.create({
    // --- LAYOUT STYLES ---
    container: {
      flex: 1, // take up available space
      // ensure container extends all the way to bottom of screen
      // this allows scroll view to stretch fully and show all tasks above navbar
    },

    // group container for grouped lists
    group: {
      marginBottom: 24, // space between groups
    },

    // wrapper for list header (big today + standard header)
    listHeaderWrapper: {
      marginBottom: 8,
    },
    // header text container for title and subtitle
    headerTextContainer: {
      flex: 1, // take up available space
    },

    // dropdown button styling (ellipse icon)
    dropdownButton: {
      width: 40, // button width for touch target
      height: 40, // button height for touch target
      justifyContent: 'center', // center icon vertically
      alignItems: 'center', // center icon horizontally
      marginLeft: 12, // space between text and button
    },

    // --- PADDING STYLES ---
    listContainer: {
      paddingTop: (paddingTop ?? 0) + (scrollPastTopInset ? insets.top : 0),
      paddingBottom: paddingBottom ?? 58 + 80 + 16 + insets.bottom + Paddings.scrollBottomExtra,
      paddingHorizontal: paddingHorizontal ?? Paddings.screenSmall,
      flexGrow: 1,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Paddings.card,
      paddingBottom: Paddings.card,
    },

    // --- TYPOGRAPHY STYLES ---
    bigTodayHeader: {
      ...typography.getTextStyle('heading-1'),
      color: themeColors.text.primary(),
      marginBottom: 8,
    },
    headerTitle: {
      ...typography.getTextStyle('heading-1'),
      color: themeColors.text.primary(),
    },
    headerSubtitle: {
      ...typography.getTextStyle('heading-4'),
      marginTop: 8,
      color: themeColors.text.secondary(),
    },
  });

