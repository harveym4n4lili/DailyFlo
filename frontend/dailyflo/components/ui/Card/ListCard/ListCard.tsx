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

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem, RefreshControl, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

// import custom hooks for animation management
import { useGroupAnimations } from '@/hooks/useGroupAnimations';
import { useTaskCardAnimations } from '@/hooks/useTaskCardAnimations';
import AnimatedReanimated, { useAnimatedStyle, useSharedValue, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated';

// import utility functions for task grouping and sorting
import { groupTasks, sortTasks, sortGroupEntries, formatDateForGroup } from '@/utils/taskGrouping';

// import dropdown list component for header actions menu
import { DropdownList, DropdownListItem } from '@/components/ui/list';

// import sub-components
import GroupHeader from './GroupHeader';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';

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

  // swipe gesture callback functions (passed down to TaskCard components)
  onTaskSwipeLeft?: (task: Task) => void; // called when user swipes left on a task card
  onTaskSwipeRight?: (task: Task) => void; // called when user swipes right on a task card

  // optional display options
  showCategory?: boolean; // whether to show category names in task cards
  compact?: boolean; // whether to use compact layout for task cards
  showIcon?: boolean; // whether to show task icon (default true)
  showIndicators?: boolean; // whether to show bottom-right list/routine indicators (default true)
  showMetadata?: boolean; // whether to show date/time/duration metadata (default true)
  metadataVariant?: 'default' | 'today'; // 'today' = time as "09:00 - 09:30", no "Today" text
  cardSpacing?: number; // spacing between task cards (default 20)
  showDashedSeparator?: boolean; // whether to show dashed separator below each card (default false)
  separatorPaddingHorizontal?: number; // horizontal padding for separators to match list padding (defaults to paddingHorizontal)
  hideBackground?: boolean; // whether to hide task card backgrounds (default false)
  removeInnerPadding?: boolean; // whether to remove horizontal padding inside task cards (default false)
  checkboxSize?: number; // size of the checkbox in task cards (default 24)
  emptyMessage?: string; // message to show when no tasks are available
  loading?: boolean; // whether the list is currently loading

  // optional list configuration
  groupBy?: 'priority' | 'dueDate' | 'color' | 'none'; // how to group tasks
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
  onTaskSwipeLeft,
  onTaskSwipeRight,
  showCategory = false,
  compact = false,
  showIcon = true,
  showIndicators = true,
  showMetadata = true,
  metadataVariant,
  cardSpacing = 20,
  showDashedSeparator = false,
  separatorPaddingHorizontal,
  hideBackground = false,
  removeInnerPadding = false,
  checkboxSize = 18,
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
    () => createStyles(themeColors, semanticColors, typography, insets, paddingTop, paddingHorizontal, scrollPastTopInset),
    [themeColors, semanticColors, typography, insets, paddingTop, paddingHorizontal, scrollPastTopInset]
  );

  // use custom hooks for animation management
  const {
    collapsedGroups,
    toggleGroupCollapse,
    getAnimatedValuesForGroup,
    isGroupCollapsed,
  } = useGroupAnimations();

  const { getTaskCardAnimation, markGroupExpanding } = useTaskCardAnimations();

  // process and organize tasks based on grouping and sorting options
  const processedTasks = useMemo(() => {
    return sortTasks(tasks, sortBy, sortDirection);
  }, [tasks, sortBy, sortDirection]);

  // group tasks if grouping is enabled
  const groupedTasks = useMemo(() => {
    return groupTasks(processedTasks, groupBy);
  }, [processedTasks, groupBy]);

  // sort groups: Today first, then Overdue, then others, Completed last
  // this must be called unconditionally (before the if/else) to follow Rules of Hooks
  const sortedGroupEntries = useMemo(() => {
    // only sort if grouping is enabled, otherwise return empty array
    if (groupBy === 'none') {
      return [];
    }
    return sortGroupEntries(Object.entries(groupedTasks));
  }, [groupedTasks, groupBy]);

  // handle group toggle with animation tracking
  const handleGroupToggle = (groupTitle: string) => {
    const wasCollapsed = isGroupCollapsed(groupTitle);
    toggleGroupCollapse(groupTitle);

    // if expanding, mark group as expanding so task cards animate
    if (wasCollapsed) {
      markGroupExpanding(groupTitle);
    }
  };

  // render individual task card with smooth fade-in and scale animation for expansion
  const renderTaskCard: ListRenderItem<Task> = ({ item: task, index }) => {
    const { opacityValue, scaleValue } = getTaskCardAnimation(task.id, index || 0);
    // check if this is the last item in the list
    const isLastItem = index === processedTasks.length - 1;
    // check if this is the first item in the list
    const isFirstItem = index === 0;

    return (
      <Animated.View
        style={{
          opacity: opacityValue, // apply fade animation based on animated value
          transform: [{ scale: scaleValue }], // apply scale animation for subtle zoom effect
        }}
      >
        <TaskCard
          task={task}
          onPress={onTaskPress}
          onComplete={onTaskComplete}
          onEdit={onTaskEdit}
          onDelete={onTaskDelete}
          onSwipeLeft={onTaskSwipeLeft}
          onSwipeRight={onTaskSwipeRight}
          showCategory={showCategory}
          compact={compact}
          showIcon={showIcon}
          showIndicators={showIndicators}
          showMetadata={showMetadata}
          metadataVariant={metadataVariant}
          cardSpacing={cardSpacing}
          showDashedSeparator={showDashedSeparator}
          separatorPaddingHorizontal={finalSeparatorPaddingHorizontal}
          hideBackground={hideBackground}
          removeInnerPadding={removeInnerPadding}
          checkboxSize={checkboxSize}
          isLastItem={isLastItem}
          isFirstItem={isFirstItem}
        />
      </Animated.View>
    );
  };

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
    const animatedValuesForGroup = getAnimatedValuesForGroup(title);

    // calculate arrow rotation animation - smoothly rotate arrow between down (expanded) and right (collapsed)
    const arrowRotation = animatedValuesForGroup.rotateValue.interpolate({
      inputRange: [0, 1], // input range: 0 = collapsed (right pointing), 1 = expanded (down pointing)
      outputRange: ['90deg', '0deg'], // output range: rotate from 90 degrees (right) to 0 degrees (down) for arrow transition
    });

    // determine if this group should show a secondary "Reschedule" action
    // we only show it for the Overdue group when a handler is provided
    const showSecondaryAction =
      title === 'Overdue' && typeof onOverdueReschedule === 'function';

    return (
      <GroupHeader
        title={title}
        count={count}
        isCollapsed={isCollapsed}
        arrowRotation={arrowRotation}
        showSecondaryAction={showSecondaryAction}
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
        {/* big "Today" header - large typography at top when bigTodayHeader is true, fades on scroll */}
        {bigTodayHeader && (
          <AnimatedReanimated.View style={bigTodayHeaderAnimatedStyle}>
            <Text style={styles.bigTodayHeader}>Today</Text>
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
                <Ionicons
                  name="ellipsis-horizontal"
                  size={24}
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
        <FlatList
          ref={flatListRef}
          data={processedTasks}
          renderItem={renderTaskCard}
          keyExtractor={(task) => `${instanceId}-${task.id}`} // add instance ID to ensure unique keys
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={refreshControl}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          ListHeaderComponent={renderHeader}
          // prevent scroll position restoration between instances
          maintainVisibleContentPosition={null}
        />
      </View>
    );
  } else {
    // render grouped list using sortedGroupEntries (already computed above)
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
        <FlatList
          data={sortedGroupEntries}
          renderItem={({ item: [groupTitle, groupTasks] }) => {
            const isCollapsed = isGroupCollapsed(groupTitle);

            // create a local render function for tasks that knows which group they belong to
            const renderTaskCardForGroup: ListRenderItem<Task> = ({ item: task, index }) => {
              const { opacityValue, scaleValue } = getTaskCardAnimation(
                task.id,
                index || 0,
                groupTitle
              );
              // check if this is the last item in the group
              const isLastItem = index === groupTasks.length - 1;
              // check if this is the first item in the group
              const isFirstItem = index === 0;

              return (
                <Animated.View
                  style={{
                    opacity: opacityValue, // apply fade animation based on animated value
                    transform: [{ scale: scaleValue }], // apply scale animation for subtle zoom effect
                  }}
                >
                  <TaskCard
                    task={task}
                    onPress={onTaskPress}
                    onComplete={onTaskComplete}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                    onSwipeLeft={onTaskSwipeLeft}
                    onSwipeRight={onTaskSwipeRight}
                    showCategory={showCategory}
                    compact={compact}
                    showIcon={showIcon}
                    showIndicators={showIndicators}
                    showMetadata={showMetadata}
                    metadataVariant={metadataVariant}
                    cardSpacing={cardSpacing}
                    showDashedSeparator={showDashedSeparator}
                    separatorPaddingHorizontal={finalSeparatorPaddingHorizontal}
                    hideBackground={hideBackground}
                    removeInnerPadding={removeInnerPadding}
                    checkboxSize={checkboxSize}
                    isLastItem={isLastItem}
                    isFirstItem={isFirstItem}
                  />
                </Animated.View>
              );
            };

            return (
              <View style={styles.group}>
                {renderGroupHeader(groupTitle, groupTasks.length, groupTasks as Task[])}
                {/* conditionally render tasks based on collapse state */}
                {!isCollapsed && (
                  <FlatList
                    data={groupTasks}
                    renderItem={renderTaskCardForGroup}
                    keyExtractor={(task) => task.id}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false} // disable scrolling for nested lists
                  />
                )}
              </View>
            );
          }}
          ref={groupedFlatListRef}
          keyExtractor={([groupTitle]) => `${instanceId}-${groupTitle}`} // add instance ID to ensure unique keys
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={refreshControl}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          ListHeaderComponent={renderHeader}
          // prevent scroll position restoration between instances
          maintainVisibleContentPosition={null}
        />
      </View>
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
      paddingBottom: 58 + 80 + 16 + insets.bottom + Paddings.scrollBottomExtra,
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

