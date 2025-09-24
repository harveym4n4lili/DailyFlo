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
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
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
  const swipeThreshold = 100; // pixels
  
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
    
    // format date based on how close it is
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date < today) {
      return `Overdue (${date.toLocaleDateString()})`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // helper function to get due date text color based on urgency
  const getDueDateColor = (dueDate: string | null): string => {
    if (!dueDate) return themeColors.text.tertiary();
    
    const date = new Date(dueDate);
    const today = new Date();
    
    // set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return semanticColors.error(); // red for overdue
    } else if (date.getTime() === today.getTime()) {
      return '#FF6B35'; // orange for today
    } else {
      return themeColors.text.tertiary(); // gray for future dates
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
  // checkboxBorderColor: changes border color of the checkbox when touched
  const colorIndicatorBackground = isPressed.interpolate({
    inputRange: [0, 1], // touch state (0 = not touched, 1 = touched)
    outputRange: [taskColor, themeColors.background.elevated()], // normal color to card background when touched
    extrapolate: 'clamp', // prevent values outside the input range
  });
  
  const checkboxBorderColor = isPressed.interpolate({
    inputRange: [0, 1], // touch state (0 = not touched, 1 = touched)
    outputRange: [themeColors.border.primary(), themeColors.background.elevated()], // normal border to card background when touched
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
        // swipe left (negative translationX) - call onSwipeLeft callback
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
          {/* colored rectangle indicator on the left - uses taskColor from getTaskColor helper */}
          <Animated.View 
            style={[
              styles.colorIndicator, 
              { 
                backgroundColor: colorIndicatorBackground // animated background color based on swipe distance
              }
            ]} 
          />
          {/* main card touchable area - applies conditional styles based on compact and completion state */}
          <TouchableOpacity
            style={[
              styles.card,
              compact && styles.compactCard, // conditionally applies compact padding when compact prop is true
              task.isCompleted && styles.completedCard, // conditionally applies transparent background when task is completed
            ]}
            onPress={() => onPress?.(task)} // calls onPress callback with task data when tapped
            activeOpacity={0.7} // provides visual feedback on press
          >
        {/* row container for main content layout */}
        <View style={styles.row}>
          {/* main content area containing all text elements */}
          <View style={styles.content}>
            {/* task title - conditionally applies strikethrough styling when completed */}
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
            
            {/* task description - conditionally rendered only if description exists and not in compact mode */}
            {task.description && !compact && (
              <Text 
                style={styles.description} 
                numberOfLines={2} // limits description to two lines
                ellipsizeMode="tail" // adds ellipsis at end if text overflows
              >
                {task.description}
              </Text>
            )}
            
            {/* task metadata container - holds category and due date information */}
            <View style={styles.metadata}>
              {/* category section - conditionally rendered only if showCategory prop is true */}
              {showCategory && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>List:</Text>
                  <Text style={styles.metadataValue}>
                    {task.listId ? 'In List' : 'Inbox'} {/* conditionally shows 'In List' or 'Inbox' based on listId */}
                  </Text>
                </View>
              )}
              
              {/* due date section - always rendered */}
              <View style={styles.bottomMetadata}>
                <View style={styles.metadataItem}>
                  {/* calendar icon with dynamic color based on due date urgency */}
                  <Ionicons 
                    name="calendar-outline" 
                    size={12} 
                    color={themeColors.text.tertiary()} 
                    style={[styles.metadataIcon, { color: getDueDateColor(task.dueDate) }]} // conditionally applies urgency color to icon
                  />
                  {/* due date text with dynamic color based on urgency */}
                  <Text style={[styles.metadataValue, { color: getDueDateColor(task.dueDate) }]}>
                    {formatDueDate(task.dueDate)} {/* formats due date using helper function */}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
          </TouchableOpacity>
          
          {/* checkbox positioned absolutely in top-right corner - conditionally styled based on completion state */}
          <Animated.View
            style={[
              styles.checkbox,
              task.isCompleted && styles.completedCheckbox, // conditionally applies green background when completed
              { borderColor: checkboxBorderColor } // animated border color based on swipe distance
            ]}
          >
            <TouchableOpacity
              style={styles.checkboxTouchable}
              onPress={() => onComplete?.(task)} // calls onComplete callback with task data when tapped
            >
              {/* checkmark - conditionally rendered only when task is completed */}
              {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </Animated.View>
          
          {/* bottom indicators container - positioned absolutely in bottom-right corner */}
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
    marginBottom: 12, // spacing between cards
  },

  // swipe container for animated swipe gestures
  swipeContainer: {
    flex: 1, // takes up remaining space in the row
    flexDirection: 'row', // horizontal layout for color indicator and card
    position: 'relative', // needed for absolute positioning of checkbox and indicators
  },

  // colored rectangle indicator on the left
  colorIndicator: {
    width: 4,
    backgroundColor: 'transparent', // will be overridden by task color
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  // main card container
  card: {
    flex: 1,
    backgroundColor: themeColors.background.elevated(), // use theme-aware elevated background
    borderTopRightRadius: 12, // rounded corners for modern card appearance
    borderBottomRightRadius: 12,
    padding: 16,
    paddingRight: 56, // add right padding to avoid overlap with checkbox (24px checkbox + 16px margin + 16px spacing)
    position: 'relative', // needed for absolute positioning of checkbox
  },


  // Row layout for left column and content
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },


  // Content area (all text and controls)
  content: {
    flex: 1,
  },
  
  // compact version for smaller displays
  compactCard: {
    padding: 12,
    paddingRight: 52, // add right padding for compact version too (24px checkbox + 16px margin + 12px spacing)
    marginBottom: 8,
  },
  
  // completed task styling
  completedCard: {
    backgroundColor: 'rgba(0,0,0,0)', // fully transparent background
  },
  
  // task title text styling
  // using typography system for consistent text styling
  title: {
    // use the heading-4 text style from typography system (16px, bold, satoshi font)
    ...typography.getTextStyle('heading-4'),
    // use theme-aware primary text color from color system
    color: themeColors.text.primary(),
    marginBottom: 4,
  },
  
  // completed title styling
  completedTitle: {
    textDecorationLine: 'line-through', // strikethrough for completed tasks
    color: themeColors.text.secondary(), // dimmed color for completed
  },
  
  // completion checkbox - positioned absolutely in top-right corner
  checkbox: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12, // circular checkbox
    borderWidth: 2,
    borderColor: themeColors.border.primary(), // theme-aware border color
    backgroundColor: 'transparent',
  },
  
  // touchable area inside the checkbox for tap handling
  checkboxTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 12, // circular touchable area
    justifyContent: 'center', // center checkmark
    alignItems: 'center', // center checkmark
  },
  
  // completed checkbox styling
  completedCheckbox: {
    backgroundColor: semanticColors.success(), // green background for completed
    borderColor: semanticColors.success(), // green border for completed
  },
  
  // checkmark styling
  checkmark: {
    color: 'white', // white checkmark
    fontSize: 12,
    fontWeight: 'bold',
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
    marginTop: 8,
  },
  
  // individual metadata item
  metadataItem: {
    flexDirection: 'row', // horizontal layout for label and value
    alignItems: 'center', // center align
  },
  
  // metadata label styling
  metadataLabel: {
    // use the body-medium text style from typography system (12px, regular, satoshi font)
    ...typography.getTextStyle('body-medium'),
    // use theme-aware tertiary text color from color system
    color: themeColors.text.tertiary(),
    marginRight: 4,
    fontWeight: '500',
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
    backgroundColor: themeColors.background.elevated(), // match card background
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
    ...typography.getTextStyle('body-medium'),
    // use theme-aware tertiary text color from color system
    color: themeColors.text.tertiary(),
    fontSize: 11, // slightly smaller than metadata value
  },
  
});
