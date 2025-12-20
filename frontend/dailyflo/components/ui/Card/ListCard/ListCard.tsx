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

import React, { useMemo, useState } from 'react';
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

// import custom hooks for animation management
import { useGroupAnimations } from '@/hooks/useGroupAnimations';
import { useTaskCardAnimations } from '@/hooks/useTaskCardAnimations';

// import utility functions for task grouping and sorting
import { groupTasks, sortTasks, sortGroupEntries } from '@/utils/taskGrouping';

// import dropdown list component for header actions menu
import { DropdownList, DropdownListItem } from '@/components/ui/List';

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
  dropdownItems,
  dropdownAnchorPosition = 'top-right',
  dropdownTopOffset = 0,
  dropdownRightOffset = 20,
  dropdownLeftOffset = 20,
}: ListCardProps) {
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();

  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  const typography = useTypography();

  // SAFE AREA INSETS - Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();

  // DROPDOWN STATE - Controls the visibility of the dropdown menu
  // when dropdownItems are provided, this state manages whether the dropdown is visible
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // create dynamic styles using the color palette system and typography system
  const styles = useMemo(
    () => createStyles(themeColors, semanticColors, typography, insets, paddingTop),
    [themeColors, semanticColors, typography, insets, paddingTop]
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
        />
      </Animated.View>
    );
  };

  // render group header with dropdown arrow for expand/collapse functionality
  const renderGroupHeader = (title: string, count: number) => {
    const isCollapsed = isGroupCollapsed(title);
    const animatedValuesForGroup = getAnimatedValuesForGroup(title);

    // calculate arrow rotation animation - smoothly rotate arrow between down (expanded) and right (collapsed)
    const arrowRotation = animatedValuesForGroup.rotateValue.interpolate({
      inputRange: [0, 1], // input range: 0 = collapsed (right pointing), 1 = expanded (down pointing)
      outputRange: ['90deg', '0deg'], // output range: rotate from 90 degrees (right) to 0 degrees (down) for arrow transition
    });

    return (
      <GroupHeader
        title={title}
        count={count}
        isCollapsed={isCollapsed}
        arrowRotation={arrowRotation}
        onPress={() => handleGroupToggle(title)}
      />
    );
  };

  // handle dropdown button press - toggles dropdown menu visibility
  const handleDropdownButtonPress = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // render header component with optional dropdown button
  const renderHeader = () => {
    if (!headerTitle && !headerSubtitle && !dropdownItems) return null;

    return (
      <View style={styles.headerContainer}>
        {/* header title and subtitle section */}
        <View style={styles.headerTextContainer}>
          {headerTitle && <Text style={styles.headerTitle}>{headerTitle}</Text>}
          {headerSubtitle && <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>}
        </View>
        
        {/* dropdown menu button (ellipse icon) - only shown if dropdownItems are provided */}
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
  // progressViewOffset accounts for contentInset top to ensure refresh indicator appears correctly
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#007AFF" // iOS blue color for pull-to-refresh indicator
      progressViewOffset={insets.top} // offset from top to account for contentInset
      style={{ paddingTop: 32 }}
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
          data={processedTasks}
          renderItem={renderTaskCard}
          keyExtractor={(task) => task.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={refreshControl}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          ListHeaderComponent={renderHeader}
          // contentInset allows scrolling past the top safe area insets
          // this ensures content can scroll all the way to the top without being cut off
          // the top inset creates extra scrollable space above the content
          contentInset={{ top: insets.top }}
          // initial scroll offset matches the position after refresh control completes
          // this ensures the header title doesn't touch the top edge initially
          contentOffset={{ x: 0, y: -insets.top }}
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
                  />
                </Animated.View>
              );
            };

            return (
              <View style={styles.group}>
                {renderGroupHeader(groupTitle, groupTasks.length)}
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
          keyExtractor={([groupTitle]) => groupTitle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={refreshControl}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          ListHeaderComponent={renderHeader}
          // contentInset allows scrolling past the top safe area insets
          // this ensures content can scroll all the way to the top without being cut off
          // the top inset creates extra scrollable space above the content
          contentInset={{ top: insets.top }}
          // initial scroll offset matches the position after refresh control completes
          // this ensures the header title doesn't touch the top edge initially
          contentOffset={{ x: 0, y: -insets.top }}
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
  paddingTop?: number
) =>
  StyleSheet.create({
    // main container
    container: {
      flex: 1, // take up available space
      // ensure container extends all the way to bottom of screen
      // this allows scroll view to stretch fully and show all tasks above navbar
    },

    // list container for proper spacing
    // extra bottom padding to allow scrolling tasks above the FAB
    listContainer: {
      paddingTop: paddingTop ?? 0, // top padding for list container (optional, defaults to 0)
      paddingBottom: 58 + 80 + 16 + insets.bottom + 40, // FAB height (58px) + navbar height (80px) + spacing (16px) + safe area bottom + extra space (40px)
      paddingHorizontal: 20, // horizontal padding for task cards
      // ensure content can scroll all the way to bottom of screen
      flexGrow: 1, // allow content to grow and fill available space
    },

    // group container for grouped lists
    group: {
      marginBottom: 16, // space between groups
    },

    // header container styling
    headerContainer: {
      flexDirection: 'row', // horizontal layout for title/subtitle and dropdown button
      alignItems: 'center', // center align vertically
      justifyContent: 'space-between', // space between text and button
      paddingTop: 16,
      paddingBottom: 16, // space between header and content
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

    // header title text styling
    // using typography system for consistent text styling
    headerTitle: {
      // use the heading-1 text style from typography system (36px, bold, satoshi font)
      ...typography.getTextStyle('heading-1'),
      // use theme-aware primary text color from color system
      color: themeColors.text.primary(),
    },

    // header subtitle text styling
    // using typography system for consistent text styling
    headerSubtitle: {
      // use the heading-4 text style from typography system (16px, bold, satoshi font)
      ...typography.getTextStyle('heading-4'),
      // add top margin for spacing from title
      marginTop: 8,
      // use theme-aware secondary text color from color system
      color: themeColors.text.secondary(),
    },
  });

