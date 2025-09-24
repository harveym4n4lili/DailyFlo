/**
 * TaskList Component
 * 
 * This component displays a list of tasks using TaskCard components.
 * It handles the layout and organization of multiple task cards,
 * and provides callback functions for task interactions.
 * 
 * This component demonstrates the flow from Redux store → TaskList → TaskCard → User interaction.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem } from 'react-native';

// TYPES FOLDER IMPORTS - TypeScript type definitions
// The types folder contains all TypeScript interfaces and type definitions
import { Task } from '@/types';
// Task: Main interface for task objects (from types/common/Task.ts)

// import our TaskCard component
import TaskCard, { TaskCardProps } from './TaskCard';

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

/**
 * Props interface for TaskList component
 * 
 * This defines what data the component needs to display a list of tasks
 * and what functions it can call when the user interacts with tasks.
 */
export interface ListCardProps {
  // array of tasks to display
  tasks: Task[];
  
  // callback functions for task interactions (passed down to TaskCard components)
  onTaskPress?: (task: Task) => void;        // called when user taps a task card
  onTaskComplete?: (task: Task) => void;     // called when user marks a task as complete
  onTaskEdit?: (task: Task) => void;         // called when user wants to edit a task
  onTaskDelete?: (task: Task) => void;       // called when user wants to delete a task
  
  // optional display options
  showCategory?: boolean;                    // whether to show category names in task cards
  compact?: boolean;                         // whether to use compact layout for task cards
  emptyMessage?: string;                     // message to show when no tasks are available
  loading?: boolean;                         // whether the list is currently loading
  
  // optional list configuration
  groupBy?: 'priority' | 'dueDate' | 'color' | 'none'; // how to group tasks
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title'; // how to sort tasks
  sortDirection?: 'asc' | 'desc';            // sort direction
}

/**
 * TaskList Component
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
  emptyMessage = 'No tasks available',
  loading = false,
  groupBy = 'none',
  sortBy = 'createdAt',
  sortDirection = 'desc',
}: ListCardProps) {
  
  // COLOR PALETTE USAGE - Getting theme-aware colors
  // useThemeColors: Hook that provides theme-aware colors (background, text, borders, etc.)
  // useSemanticColors: Hook that provides semantic colors (success, error, warning, info)
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  
  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  // useTypography: Hook that provides typography styles, font families, and text utilities
  const typography = useTypography();
  
  // create dynamic styles using the color palette system and typography system
  // we pass typography to the createStyles function so it can use typography styles
  const styles = useMemo(() => createStyles(themeColors, semanticColors, typography), [themeColors, semanticColors, typography]);
  
  // process and organize tasks based on grouping and sorting options
  const processedTasks = useMemo(() => {
    let processed = [...tasks]; // create a copy to avoid mutating the original array
    
    // sort tasks based on sortBy and sortDirection
    processed.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      // get the values to compare based on the sort field
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'priority':
          aValue = a.priorityLevel;
          bValue = b.priorityLevel;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }
      
      // compare values based on sort direction
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return processed;
  }, [tasks, sortBy, sortDirection]);
  
  // group tasks if grouping is enabled
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': processedTasks };
    }
    
    const groups: Record<string, Task[]> = {};
    
    processedTasks.forEach(task => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'priority':
          groupKey = `Priority ${task.priorityLevel}`;
          break;
        case 'dueDate':
          if (!task.dueDate) {
            groupKey = 'No Due Date';
          } else {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (dueDate.toDateString() === today.toDateString()) {
              groupKey = 'Today';
            } else if (dueDate.toDateString() === tomorrow.toDateString()) {
              groupKey = 'Tomorrow';
            } else if (dueDate < today) {
              groupKey = 'Overdue';
            } else {
              groupKey = dueDate.toLocaleDateString();
            }
          }
          break;
        case 'color':
          groupKey = task.color.charAt(0).toUpperCase() + task.color.slice(1);
          break;
        default:
          groupKey = 'All Tasks';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });
    
    return groups;
  }, [processedTasks, groupBy]);
  
  // render individual task card
  const renderTaskCard: ListRenderItem<Task> = ({ item: task }) => (
    <TaskCard
      task={task}
      onPress={onTaskPress}
      onComplete={onTaskComplete}
      onEdit={onTaskEdit}
      onDelete={onTaskDelete}
      showCategory={showCategory}
      compact={compact}
    />
  );
  
  // render group header
  const renderGroupHeader = (title: string, count: number) => (
    <View style={styles.groupHeader}>
      <Text style={styles.groupTitle}>{title}</Text>
      <Text style={styles.groupCount}>({count})</Text>
    </View>
  );
  
  // render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyMessage}>{emptyMessage}</Text>
    </View>
  );
  
  // render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <Text style={styles.loadingMessage}>Loading tasks...</Text>
    </View>
  );
  
  // show loading state if loading
  if (loading) {
    return (
      <View style={styles.container}>
        {renderLoadingState()}
      </View>
    );
  }
  
  // show empty state if no tasks
  if (tasks.length === 0) {
    return (
      <View style={styles.container}>
        {renderEmptyState()}
      </View>
    );
  }
  
  // render grouped or flat list
  if (groupBy === 'none') {
    // render flat list without grouping
    return (
      <View style={styles.container}>
        <FlatList
          data={processedTasks}
          renderItem={renderTaskCard}
          keyExtractor={(task) => task.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    );
  } else {
    // render grouped list
    return (
      <View style={styles.container}>
        <FlatList
          data={Object.entries(groupedTasks)}
          renderItem={({ item: [groupTitle, groupTasks] }) => (
            <View style={styles.group}>
              {renderGroupHeader(groupTitle, groupTasks.length)}
              <FlatList
                data={groupTasks}
                renderItem={renderTaskCard}
                keyExtractor={(task) => task.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false} // disable scrolling for nested lists
              />
            </View>
          )}
          keyExtractor={([groupTitle]) => groupTitle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    );
  }
}

// create dynamic styles using the color palette system and typography system
// this function combines colors and typography to create consistent styling
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>, 
  semanticColors: ReturnType<typeof useSemanticColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // main container
  container: {
    flex: 1, // take up available space
  },
  
  // list container for proper spacing
  listContainer: {
    paddingBottom: 20, // bottom padding for better scrolling
    paddingTop: 20, 
  },
  
  // group container for grouped lists
  group: {
    marginBottom: 20, // space between groups
  },
  
  // group header styling
  groupHeader: {
    flexDirection: 'row', // horizontal layout
    alignItems: 'center', // center align
    marginBottom: 12, // space between header and tasks
    paddingHorizontal: 4, // slight padding for alignment
  },
  
  // group title text styling
  // using typography system for consistent text styling
  groupTitle: {
    // use the heading-3 text style from typography system (18px, bold, satoshi font)
    ...typography.getTextStyle('heading-3'),
    // use theme-aware primary text color from color system
    color: themeColors.text.primary(),
    marginRight: 8, // space between title and count
  },
  
  // group count text styling
  // using typography system for consistent text styling
  groupCount: {
    // use the body-large text style from typography system (14px, regular, satoshi font)
    ...typography.getTextStyle('body-large'),
    // use theme-aware tertiary text color from color system
    color: themeColors.text.tertiary(),
    fontWeight: '500',
  },
  
  // empty state container
  emptyState: {
    flex: 1, // take up available space
    justifyContent: 'center', // center vertically
    alignItems: 'center', // center horizontally
    paddingHorizontal: 32, // horizontal padding
    paddingVertical: 64, // vertical padding
  },
  
  // empty message text styling
  // using typography system for consistent text styling
  emptyMessage: {
    // use the heading-3 text style from typography system (18px, bold, satoshi font)
    ...typography.getTextStyle('heading-3'),
    // use theme-aware secondary text color from color system
    color: themeColors.text.secondary(),
    textAlign: 'center', // center the text
    lineHeight: 24, // better readability
  },
  
  // loading state container
  loadingState: {
    flex: 1, // take up available space
    justifyContent: 'center', // center vertically
    alignItems: 'center', // center horizontally
    paddingHorizontal: 32, // horizontal padding
    paddingVertical: 64, // vertical padding
  },
  
  // loading message text styling
  // using typography system for consistent text styling
  loadingMessage: {
    // use the body-large text style from typography system (14px, regular, satoshi font)
    ...typography.getTextStyle('body-large'),
    // use theme-aware secondary text color from color system
    color: themeColors.text.secondary(),
    textAlign: 'center', // center the text
  },
});
