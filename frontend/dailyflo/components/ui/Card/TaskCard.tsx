/**
 * TaskCard Component
 * 
 * This component displays an individual task in a card format.
 * It shows task information like title, description, due date, priority, and color.
 * It also provides basic interaction capabilities like completing tasks.
 * 
 * NEW FEATURE: Swipe Gestures
 * - Swipe left: triggers onSwipeLeft callback (e.g., for delete/archive actions)
 * - Swipe right: triggers onSwipeRight callback (e.g., for complete/edit actions)
 * - Swipe threshold: 100 pixels minimum distance to trigger action
 * - Smooth animations: card moves with finger and springs back to center
 * - Visual feedback: color indicator background and checkbox border change to card background during swipe
 * 
 * This component demonstrates the flow from Redux store → Component → User interaction.
 */

import React, { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

// TYPES FOLDER IMPORTS - TypeScript type definitions
// The types folder contains all TypeScript interfaces and type definitions
import { Task } from '@/types';
// Task: Main interface for task objects (from types/common/Task.ts)

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { getTaskCategoryColor } from '@/constants/ColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

/**
 * Props interface for TaskCard component
 * 
 * This defines what data the component needs to display a task
 * and what functions it can call when the user interacts with it.
 */
export interface TaskCardProps {
  // task data to display
  task: Task;
  
  // callback functions for user interactions
  onPress?: (task: Task) => void;           // called when user taps the card
  onComplete?: (task: Task) => void;        // called when user marks task as complete
  onEdit?: (task: Task) => void;            // called when user wants to edit task
  onDelete?: (task: Task) => void;          // called when user wants to delete task
  
  // swipe gesture callback functions
  onSwipeLeft?: (task: Task) => void;       // called when user swipes left on the card
  onSwipeRight?: (task: Task) => void;      // called when user swipes right on the card
  
  // optional display options
  showCategory?: boolean;                   // whether to show the list/category name
  compact?: boolean;                        // whether to use compact layout
}

/**
 * TaskCard Component
 * 
 * This is a presentational component that receives task data as props
 * and displays it in a styled card format. It doesn't directly interact
 * with Redux - instead, it calls callback functions that are passed down
 * from parent components that do handle Redux state.
 */
export default function TaskCard({
  task,
  onPress,
  onComplete,
  onEdit,
  onDelete,
  onSwipeLeft,
  onSwipeRight,
  showCategory = false,
  compact = false,
}: TaskCardProps) {
  
  // COLOR PALETTE USAGE - Getting theme-aware colors
  // useThemeColors: Hook that provides theme-aware colors (background, text, borders, etc.)
  // useSemanticColors: Hook that provides semantic colors (success, error, warning, info)
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  
  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  // useTypography: Hook that provides typography styles, font families, and text utilities
  const typography = useTypography();
  
  // SWIPE GESTURE STATE - Animation and gesture handling
  // translateX: controls horizontal movement of the card during swipe
  // swipeThreshold: minimum distance required to trigger a swipe action
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeThreshold = 60; // pixels - reduced for shorter activation
  
  // TOUCH STATE - Controls visual feedback when user touches the card
  // isPressed: tracks whether the user is currently touching the card
  const isPressed = useRef(new Animated.Value(0)).current;
  
  // create dynamic styles using the color palette system and typography system
  // we pass typography to the createStyles function so it can use typography styles
  const styles = useMemo(() => createStyles(themeColors, semanticColors, typography), [themeColors, semanticColors, typography]);
  
  // helper function to format the due date for display
  const formatDueDate = (dueDate: string | null): string => {
    if (!dueDate) return 'No due date';
    
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    // format date based on how close it is
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date < today) {
      // calculate days ago for overdue tasks
      const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return `${daysDiff} day${daysDiff === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // helper function to format date with time and duration tags
  // format: "Today • XX:XX • XX min" or variations based on what's available
  const formatDateWithTags = (dueDate: string | null, time?: string, duration?: number): string => {
    const dateText = formatDueDate(dueDate);
    const parts: string[] = [dateText];
    
    // add time if available (format: XX:XX)
    if (time) {
      parts.push(time);
    }
    
    // add duration if available (format: XX min)
    if (duration && duration > 0) {
      parts.push(`${duration} min`);
    }
    
    // join parts with bullet points
    return parts.join(' • ');
  };

  // helper function to get due date text color based on urgency
  // tertiary color for all dates except overdue (which is red)
  const getDueDateColor = (dueDate: string | null): string => {
    if (!dueDate) return themeColors.text.tertiary();
    
    const date = new Date(dueDate);
    const today = new Date();
    
    // set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return semanticColors.error(); // red for overdue
    } else {
      return themeColors.text.tertiary(); // tertiary color for all other dates (today, tomorrow, future)
    }
  };
  
  // helper function to get priority text and color
  const getPriorityInfo = (priority: number) => {
    switch (priority) {
      case 5: return { text: 'Critical', color: semanticColors.error() };
      case 4: return { text: 'High', color: '#FF6B35' };
      case 3: return { text: 'Medium', color: '#FFD93D' };
      case 2: return { text: 'Low', color: '#6BCF7F' };
      case 1: return { text: 'Minimal', color: themeColors.text.tertiary() };
      default: return { text: 'Unknown', color: themeColors.text.tertiary() };
    }
  };
  
  // helper function to get color styling for the task using color palette
  const getTaskColor = (color: string) => {
    // use the color palette system for consistent task colors
    // default to blue if color is not found in the palette
    try {
      return getTaskCategoryColor(color as any, 500);
    } catch {
      return getTaskCategoryColor('blue', 500);
    }
  };
  
  const priorityInfo = getPriorityInfo(task.priorityLevel);
  const taskColor = getTaskColor(task.color);

  // TOUCH-BASED ANIMATIONS - Create animated values for visual feedback when user touches the card
  // colorIndicatorBackground: changes background color of the color indicator when touched
  const colorIndicatorBackground = isPressed.interpolate({
    inputRange: [0, 1], // touch state (0 = not touched, 1 = touched)
    outputRange: [taskColor, themeColors.background.elevated()], // normal color to card background when touched
    extrapolate: 'clamp', // prevent values outside the input range
  });
  

  // SWIPE GESTURE HANDLERS - Functions that handle swipe gesture events and touch state
  // onGestureEvent: called continuously during the swipe gesture
  // onHandlerStateChange: called when the gesture starts, changes, or ends
  
  // handle continuous movement during swipe - updates translateX animation value
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true } // use native driver for better performance
  );
  
  // handle gesture state changes (start, end, cancel, etc.)
  const onHandlerStateChange = (event: any) => {
    const { state } = event.nativeEvent;
    
    // handle gesture start - animate touch state to pressed
    if (state === State.BEGAN) {
      Animated.timing(isPressed, {
        toValue: 1, // set to pressed state
        duration: 150, // smooth transition
        useNativeDriver: false, // color animations don't support native driver
      }).start();
    }
    
    // handle gesture end - reset both position and touch state
    if (state === State.END) {
      // get the final translation distance
      const { translationX } = event.nativeEvent;
      
      // determine if swipe threshold was met and in which direction
      if (Math.abs(translationX) > swipeThreshold) {
        // swipe left (negative translationX) - complete task directly (no confirmation)
        if (translationX < 0 && onSwipeLeft) {
          onSwipeLeft(task);
        }
        // swipe right (positive translationX) - call onSwipeRight callback
        else if (translationX > 0 && onSwipeRight) {
          onSwipeRight(task);
        }
      }
      
      // reset card position and touch state with smooth animations
      Animated.parallel([
        // reset card position to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100, // spring tension for smooth animation
          friction: 8,  // spring friction for natural feel
          overshootClamping: true,
        }),
        // reset touch state to not pressed
        Animated.timing(isPressed, {
          toValue: 0, // set to not pressed state
          duration: 150, // smooth transition
          useNativeDriver: false, // color animations don't support native driver
        })
      ]).start();
    }
    
    // handle gesture cancellation - reset touch state
    if (state === State.CANCELLED || state === State.FAILED) {
      Animated.timing(isPressed, {
        toValue: 0, // set to not pressed state
        duration: 150, // smooth transition
        useNativeDriver: false, // color animations don't support native driver
      }).start();
    }
  };

  return (
    <View style={styles.cardContainer}>
       {/* green background that appears when swiping left for complete */}
       <Animated.View
         style={[
           styles.swipeBackgroundLeft,
           {
             opacity: translateX.interpolate({
               inputRange: [-100, -5, 0, 100],
               outputRange: [1, 0.3, 0, 0],
               extrapolate: 'clamp',
             }),
           },
         ]}
       >
        {/* checkmark icon that stretches across the swipe area */}
        <Animated.View
          style={[
            styles.completeIconContainer,
             {
               opacity: translateX.interpolate({
                 inputRange: [-100, -5, 0, 100],
                 outputRange: [1, 0.3, 0, 0],
                 extrapolate: 'clamp',
               }),
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [-80, 0],
                    outputRange: [-20, 0], // stretch across the swipe area
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons 
            name="checkmark" 
            size={24} 
            color="white" 
          />
        </Animated.View>
      </Animated.View>
      
       {/* red background that appears when swiping right for delete */}
       <Animated.View
         style={[
           styles.swipeBackground,
           {
             opacity: translateX.interpolate({
               inputRange: [-100, 0, 5, 50],
               outputRange: [0, 0, 0.1, 1],
               extrapolate: 'clamp',
             }),
           },
         ]}
       >
        {/* delete icon that stretches across the swipe area */}
        <Animated.View
          style={[
            styles.deleteIconContainer,
             {
               opacity: translateX.interpolate({
                 inputRange: [-100, 0, 5, 100],
                 outputRange: [0, 0, 0.3, 1],
                 extrapolate: 'clamp',
               }),
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [0, 80],
                    outputRange: [0, 20], // stretch across the swipe area
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons 
            name="trash-outline" 
            size={24} 
            color="white" 
          />
        </Animated.View>
      </Animated.View>
      
      {/* swipe gesture handler - wraps the entire card to detect horizontal swipes */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent} // handles continuous swipe movement
        onHandlerStateChange={onHandlerStateChange} // handles swipe start/end events
        activeOffsetX={[-10, 10]} // horizontal movement threshold to activate gesture (no minDist needed)
      >
        {/* animated view that moves horizontally during swipe gestures */}
        <Animated.View
          style={[
            styles.swipeContainer, // container for swipeable content
            { transform: [{ translateX }] } // applies horizontal translation based on swipe
          ]}
        >
          {/* main card touchable area - applies conditional styles based on compact and completion state */}
          <TouchableOpacity
            style={[
              styles.card,
              compact && styles.compactCard, // conditionally applies compact padding when compact prop is true
              task.isCompleted && styles.completedCard, // conditionally applies transparent background when task is completed
            ]}
            onPress={() => onPress?.(task)} // calls onPress callback with task data when tapped
            activeOpacity={1} // prevent background opacity change
          >
        {/* row container for main content layout */}
        <Pressable
          style={({ pressed }) => [
            styles.row,
            { opacity: pressed ? 0.7 : 1 } // opacity feedback only for content
          ]}
          onPress={() => onPress?.(task)}
        >
          {/* task icon on the left - no circle, just icon in task color stroke */}
          {task.icon && (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={task.icon as any} 
                size={24} 
                color={taskColor} 
                style={styles.taskIcon}
              />
            </View>
          )}
          
          {/* main content area containing title and metadata */}
          <View style={styles.content}>
            {/* task title - conditionally applies strikethrough styling when completed */}
            {/* single line with ellipsis if it reaches second line */}
            <Text
              style={[
                styles.title,
                task.isCompleted && styles.completedTitle, // conditionally applies strikethrough and dimmed color when completed
              ]}
              numberOfLines={1} // limits title to single line
              ellipsizeMode="tail" // adds ellipsis at end if text overflows
            >
              {task.title}
            </Text>
            
            {/* task metadata container - holds category and due date information */}
            <View style={styles.metadata}>
              {/* category section - conditionally rendered only if showCategory prop is true */}
              {showCategory && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>List:</Text>
                  <Text style={[styles.metadataValue, { color: themeColors.text.tertiary() }]}>
                    {task.listId ? 'In List' : 'Inbox'} {/* conditionally shows 'In List' or 'Inbox' based on listId */}
                  </Text>
                </View>
              )}
              
              {/* due date section - always rendered */}
              <View style={styles.bottomMetadata}>
                <View style={styles.metadataItem}>
                  {/* due date text with time and duration tags - gray for all dates except overdue (red) */}
                  {/* format: "Today • XX:XX • XX min" or variations */}
                  {/* gray color for completed tasks, otherwise use getDueDateColor */}
                  <Text style={[
                    styles.metadataValue, 
                    { 
                      // use secondary text color for date/time/duration tags, but red if overdue
                      color: task.isCompleted 
                        ? themeColors.text.tertiary() 
                        : getDueDateColor(task.dueDate) // red if overdue, secondary otherwise
                    }
                  ]}>
                    {formatDateWithTags(task.dueDate, task.time, task.duration)} {/* formats date with time and duration tags */}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
          </TouchableOpacity>
          
          {/* completion indicator container - shows green tick icon when completed */}
          {task.isCompleted && (
            <View style={styles.completionIndicator}>
              <Ionicons 
                name="checkmark" 
                size={20} 
                color={semanticColors.success()} 
              />
            </View>
          )}
          
          {/* bottom indicators container - positioned absolutely in bottom-right corner */}
          {/* transparent background for all tasks, fully transparent for completed tasks */}
          <View style={styles.bottomIndicators}>
        {/* repeating indicator - conditionally rendered only when routine type is not 'once' */}
        {task.routineType !== 'once' && (
          <View style={styles.indicator}>
            {/* refresh icon for repeating tasks */}
            <Ionicons 
              name="refresh" 
              size={12} 
              color={themeColors.text.tertiary()} 
              style={styles.indicatorIcon}
            />
            {/* repeating frequency text - conditionally displays based on routine type */}
            <Text style={styles.indicatorText}>
              {task.routineType === 'daily' ? 'Daily' : 
               task.routineType === 'weekly' ? 'Weekly' : 
               task.routineType === 'monthly' ? 'Monthly' : ''}
            </Text>
          </View>
        )}
        
        {/* list indicator - always rendered */}
        <View style={styles.indicator}>
          {/* folder icon for list/inbox indication */}
          <Ionicons 
            name="folder-outline" 
            size={12} 
            color={themeColors.text.tertiary()} 
            style={styles.indicatorIcon}
          />
          {/* list/inbox text - conditionally shows 'List' or 'Inbox' based on listId */}
          <Text style={styles.indicatorText}>
            {task.listId ? 'List' : 'Inbox'}
          </Text>
        </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}
// create dynamic styles using the color palette system and typography system
// this function combines colors and typography to create consistent styling
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>, 
  semanticColors: ReturnType<typeof useSemanticColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // card container with color indicator
  cardContainer: {
    flexDirection: 'row',
    marginBottom: 20, // spacing between cards
    position: 'relative', // needed for absolute positioning of background
  },

  // green background that appears when swiping left for complete
  swipeBackgroundLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#34C759', // iOS green color for completion
    borderRadius: 20, // match card border radius
    justifyContent: 'center',
    alignItems: 'flex-end', // align to right side
    zIndex: 0, // behind the card content
  },

  // red background that appears when swiping right for delete
  swipeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF3B30', // iOS red color
    borderRadius: 20, // match card border radius
    justifyContent: 'center',
    alignItems: 'flex-start', // align to left side
    zIndex: 0, // behind the card content
  },

  // container for the complete icon
  completeIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // container for the delete icon
  deleteIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // swipe container for animated swipe gestures
  swipeContainer: {
    flex: 1, // takes up remaining space in the row
    flexDirection: 'row', // horizontal layout for card
    position: 'relative', // needed for absolute positioning of checkbox and indicators
    zIndex: 1, // above the background
  },

  // main card container
  card: {
    flex: 1,
    backgroundColor: themeColors.background.elevated(), // use theme-aware elevated background
    borderRadius: 20, // border radius of 20 for modern card appearance
    padding: 16,
    paddingRight: 56, // add right padding to avoid overlap with checkbox (24px checkbox + 16px margin + 16px spacing)
    position: 'relative', // needed for absolute positioning of checkbox
  },


  // Row layout for icon and content
  row: {
    flexDirection: 'row',
    alignItems: 'center', // center align icon and title vertically
  },
  
  // icon container on the left
  iconContainer: {
    marginRight: 16, // spacing between icon and title
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // task icon styling - no circle, just icon in task color stroke
  taskIcon: {
    // icon color is set via color prop in Ionicons component
  },


  // Content area (title only)
  content: {
    flex: 1,
    justifyContent: 'center', // center title vertically
  },
  
  // compact version for smaller displays
  compactCard: {
    padding: 12,
    paddingRight: 52, // add right padding for compact version too (24px checkbox + 16px margin + 12px spacing)
    marginBottom: 8,
  },
  
  // completed task styling
  completedCard: {
    backgroundColor: themeColors.background.primary(), // use primary background color (same as today screen)
  },
  
  // task title text styling
  // using typography system for consistent text styling
  title: {
    // use the heading-4 text style from typography system (16px, bold, satoshi font)
    ...typography.getTextStyle('heading-4'),
    // use theme-aware primary text color from color system
    color: themeColors.text.primary(),
    marginBottom: 2, // spacing between title and metadata (reduced for closer spacing)
  },
  
  // completed title styling
  completedTitle: {
    textDecorationLine: 'line-through', // strikethrough for completed tasks
    color: themeColors.text.secondary(), // dimmed color for completed
  },
  
  // completion indicator container - positioned absolutely in top-right corner
  // shows green tick icon when task is completed
  completionIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    justifyContent: 'center', // center checkmark icon
    alignItems: 'center', // center checkmark icon
  },

  
  // task description text styling
  // using typography system for consistent text styling
  description: {
    // use the body-large text style from typography system (14px, regular, satoshi font)
    ...typography.getTextStyle('body-large'),
    // use theme-aware secondary text color from color system
    color: themeColors.text.secondary(),
    lineHeight: 18, // better readability
  },
  
  // metadata container
  metadata: {
    flexDirection: 'column', // vertical layout for category and bottom metadata
    marginTop: 4, // spacing from title (reduced for closer spacing)
  },
  
  // individual metadata item
  metadataItem: {
    flexDirection: 'row', // horizontal layout for label and value
    alignItems: 'center', // center align
  },
  
  // metadata label styling
  metadataLabel: {
    // use the body-large text style from typography system (14px, regular, satoshi font)
    ...typography.getTextStyle('body-large'),
    // use theme-aware tertiary text color from color system
    color: themeColors.text.tertiary(),
    marginRight: 4,
    fontWeight: '900',
  },
  
  // metadata icon styling
  metadataIcon: {
    marginRight: 4,
  },
  
  // metadata value styling
  metadataValue: {
    // use the body-medium text style from typography system (12px, regular, satoshi font)
    ...typography.getTextStyle('body-medium'),
    // use theme-aware secondary text color from color system
    color: themeColors.text.secondary(),
    fontWeight: '900', // bold weight for heavier tags
  },
  
  // bottom metadata container (due date only)
  bottomMetadata: {
    flexDirection: 'row', // horizontal layout
    alignItems: 'center',
  },
  
  // bottom indicators container - positioned absolutely at bottom right
  bottomIndicators: {
    position: 'absolute',
    bottom: 14, // same padding as card
    right: 16, // same padding as card
    flexDirection: 'row', // horizontal layout for multiple indicators
    alignItems: 'center',
    gap: 8, // spacing between indicators
  },
  
  // individual indicator styling
  indicator: {
    flexDirection: 'row', // horizontal layout for icon and text
    alignItems: 'center',
    backgroundColor: 'transparent', // transparent background for all indicators
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  
  
  // indicator icon styling
  indicatorIcon: {
    marginRight: 4,
  },
  
  // indicator text styling
  indicatorText: {
    // use the body-medium text style from typography system (12px, regular, satoshi font)
    // match metadataValue styling exactly: same typography, font weight, and size
    ...typography.getTextStyle('body-medium'),
    // use tertiary text color for bottom right tags (Inbox, Weekly, etc.) - matches icon color
    color: themeColors.text.tertiary(),
    fontWeight: '900', // match metadataValue font weight
    // fontSize removed to match metadataValue (uses body-medium default size)
  },
  
});
