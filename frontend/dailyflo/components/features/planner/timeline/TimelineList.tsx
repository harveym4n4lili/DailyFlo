/**
 * TimelineList Component
 * 
 * Displays a list of tasks in timeline format with connecting vertical line.
 * Tasks are sorted: with time first (by time ascending), then without time (by dueDate).
 * 
 * This component manages the timeline layout, sorting, and provides callback
 * functions for task interactions. It doesn't directly interact with Redux -
 * instead, it receives task data as props and passes callback functions down
 * to TimelineTask components.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { ListRenderItem } from 'react-native';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// TYPES FOLDER IMPORTS - TypeScript type definitions
import { Task } from '@/types';

// import our TimelineTask component
import TimelineTask, { TimelineTaskProps } from './TimelineTask';

// import color palette system for consistent theming
import { useThemeColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

// import utility functions for timeline sorting and time calculations
import { sortTasksForTimeline, calculateTimeDifference, getSeparatorHeightForTimeDifference } from '@/utils/timelineHelpers';

// import sub-components
import EmptyState from '@/components/ui/Card/ListCard/EmptyState';
import LoadingState from '@/components/ui/Card/ListCard/LoadingState';

/**
 * Props interface for TimelineList component
 * 
 * This defines what data the component needs to display a timeline of tasks
 * and what functions it can call when the user interacts with tasks.
 */
export interface TimelineListProps {
  // array of tasks to display
  tasks: Task[];

  // callback functions for task interactions (passed down to TimelineTask components)
  onTaskPress?: (task: Task) => void; // called when user taps a task

  // optional display options
  emptyMessage?: string; // message to show when no tasks are available
  loading?: boolean; // whether the list is currently loading

  // pull-to-refresh support
  onRefresh?: () => void; // called when user pulls to refresh
  refreshing?: boolean; // whether the list is currently refreshing

  // scroll event support
  onScroll?: (event: any) => void; // called when the list is scrolled
  scrollEventThrottle?: number; // throttle for scroll events

  // padding options
  paddingTop?: number; // top padding for the list
  paddingHorizontal?: number; // horizontal padding for the list
}

/**
 * TimelineList Component
 * 
 * This is a container component that receives an array of tasks and displays them
 * using TimelineTask components. It handles the layout and sorting of tasks.
 * It doesn't directly interact with Redux - instead, it receives task data as props
 * and passes callback functions down to TimelineTask components.
 */
export default function TimelineList({
  tasks,
  onTaskPress,
  emptyMessage = 'No tasks available',
  loading = false,
  onRefresh,
  refreshing = false,
  onScroll,
  scrollEventThrottle = 16,
  paddingTop = 20,
  paddingHorizontal = 14,
}: TimelineListProps) {
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();

  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  const typography = useTypography();

  // SAFE AREA INSETS - Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();

  // FLATLIST REF - Create ref for FlatList instance to control scroll position
  const flatListRef = useRef<FlatList>(null);

  // UNIQUE INSTANCE ID - Generate a unique ID for this TimelineList instance
  // this ensures React treats each instance as completely separate
  const instanceId = useRef(Math.random().toString(36).substring(7)).current;
  
  // SEPARATOR INDEX REF - Track current separator index for dynamic line lengths
  const separatorIndexRef = useRef(0);

  // RESET SCROLL POSITION ON MOUNT - Ensure each TimelineList starts at the top
  // this prevents scroll position from being shared between instances
  useEffect(() => {
    // reset scroll position to top when component mounts
    // small delay ensures FlatList is fully rendered before scrolling
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
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
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [refreshing]);

  // SORT TASKS FOR TIMELINE - Sort tasks: with time first (by time), then without time (by dueDate)
  // useMemo ensures this calculation only runs when tasks change
  const sortedTasks = useMemo(() => {
    return sortTasksForTimeline(tasks);
  }, [tasks]);
  
  // CALCULATE SEPARATOR HEIGHTS - Calculate separator heights based on time differences
  // useMemo ensures this calculation only runs when sortedTasks change
  const separatorHeights = useMemo(() => {
    const heights: number[] = [];
    
    // calculate separator height for each gap between consecutive tasks
    for (let i = 0; i < sortedTasks.length - 1; i++) {
      const currentTask = sortedTasks[i];
      const nextTask = sortedTasks[i + 1];
      const timeDiffMinutes = calculateTimeDifference(currentTask, nextTask);
      
      // get separator height based on time difference
      const height = getSeparatorHeightForTimeDifference(timeDiffMinutes);
      heights.push(height);
    }
    
    // reset separator index when heights change
    separatorIndexRef.current = 0;
    
    return heights;
  }, [sortedTasks]);

  // CREATE REFRESH CONTROL - Pull-to-refresh support
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;

    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={themeColors.text.secondary()} // refresh spinner color (iOS)
        colors={[themeColors.text.secondary()]} // refresh spinner colors (Android)
      />
    );
  }, [refreshing, onRefresh, themeColors]);

  // RENDER TIMELINE TASK - Render individual timeline task item
  const renderTimelineTask: ListRenderItem<Task> = ({ item: task }) => {
    return (
      <TimelineTask
        task={task}
        onPress={onTaskPress}
      />
    );
  };

  // RENDER ITEM SEPARATOR - Render connecting line between task containers
  // Note: ItemSeparatorComponent doesn't receive item props, so we use a ref to track separator index
  const renderItemSeparator = () => {
    // get separator height for current separator using ref index
    const currentIndex = separatorIndexRef.current;
    const separatorHeight = separatorHeights[currentIndex] ?? 24; // default to 24px if index out of range
    
    // increment separator index for next render (wrap around if needed)
    separatorIndexRef.current = separatorHeights.length > 0 
      ? (currentIndex + 1) % separatorHeights.length 
      : 0;
    
    // calculate timeline line position (left edge of timeline line container)
    const timelineLineX = 0; // starts at left edge
    
    // render separator with connecting line that matches container color
    // the line connects the top of the next task container with the bottom of the previous task container
    // positioned at the same location as the timeline line in TimelineTask (left edge)
    return (
      <View
        style={{
          height: separatorHeight,
          position: 'relative',
        }}
      >
        {/* Connecting line - matches container background color, connects task containers */}
        <View
          style={{
            position: 'absolute',
            left: paddingHorizontal ?? 14, // match list padding to align with timeline line
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: themeColors.background.elevated(), // matches task container color
          }}
        />
      </View>
    );
  };

  // RENDER EMPTY STATE - Show empty message when no tasks
  const renderEmptyState = () => {
    if (loading) {
      return <LoadingState message="Loading tasks..." />;
    }
    return <EmptyState message={emptyMessage} />;
  };

  // create dynamic styles using the color palette system and typography system
  const styles = useMemo(() => createStyles(themeColors, typography, insets, paddingTop, paddingHorizontal), [themeColors, typography, insets, paddingTop, paddingHorizontal]);

  // show loading state if loading and no tasks
  if (loading && sortedTasks.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingState message="Loading tasks..." />
      </View>
    );
  }

  // render timeline list
  return (
    <View style={styles.container}>
      <FlatList
        data={sortedTasks}
        renderItem={renderTimelineTask}
        keyExtractor={(task) => `${instanceId}-${task.id}`} // add instance ID to ensure unique keys
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={sortedTasks.length > 1 ? renderItemSeparator : undefined} // render line connector between items
        ref={flatListRef}
        // prevent scroll position restoration between instances
        maintainVisibleContentPosition={null}
      />
    </View>
  );
}

// create dynamic styles using the color palette system and typography system
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: { top: number; bottom: number; left: number; right: number },
  paddingTop?: number,
  paddingHorizontal?: number
) =>
  StyleSheet.create({
    // main container
    container: {
      flex: 1, // take up available space
    },

    // list container for proper spacing
    // extra bottom padding to allow scrolling tasks above the FAB
    listContainer: {
      paddingTop: paddingTop ?? 0, // top padding for list container (optional, defaults to 0)
      paddingBottom: 58 + 80 + 16 + insets.bottom + 40, // FAB height (58px) + navbar height (80px) + spacing (16px) + safe area bottom + extra space (40px)
      paddingHorizontal: paddingHorizontal ?? 14, // horizontal padding for timeline items (optional, defaults to 14px)
      // ensure content can scroll all the way to bottom of screen
      flexGrow: 1, // allow content to grow and fill available space
    },
  });

