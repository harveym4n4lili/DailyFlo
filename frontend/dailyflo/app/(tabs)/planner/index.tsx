
import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// import our custom layout components
import { ScreenContainer } from '@/components';
import { FloatingActionButton } from '@/components/ui/Button';
import { ModalBackdrop } from '@/components/layout/ModalLayout';
import { CalendarNavigationModal } from '@/components/features/calendar/modals';
import { WeekView } from '@/components/features/calendar/sections';
import { ListCard } from '@/components/ui/Card';
import { TaskViewModal } from '@/components/features/tasks';
import { TimelineView } from '@/components/features/timeline';

// import color palette system for consistent theming
import { useThemeColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

// safe area context for handling devices with notches/home indicators
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// redux store hooks for task management
import { useTasks } from '@/store/hooks';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchTasks, updateTask, deleteTask } from '@/store/slices/tasks/tasksSlice';

// types for tasks
import { Task, TaskColor } from '@/types';

export default function PlannerScreen() {
  // CALENDAR MODAL STATE - Controls the visibility of the calendar modal
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  
  // SELECTED DATE STATE - Currently selected date for calendar navigation
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // default to today's date as ISO string
    return new Date().toISOString();
  });
  
  // TASK DETAIL MODAL STATE - Controls the visibility of task detail modal
  const [isTaskDetailModalVisible, setIsTaskDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskColor, setSelectedTaskColor] = useState<TaskColor>('blue');
  
  // router: open create-task Stack screen from FAB (with optional dueDate from selected date)
  const router = useRouter();

  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();
  
  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  const typography = useTypography();
  
  // SAFE AREA INSETS - Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // REDUX STORE - Accessing task state from Redux store
  const dispatch = useAppDispatch();
  const { tasks, isLoading } = useTasks();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  
  // calculate border radius based on iOS version to match modal styling
  // iOS 15+ (liquid glass UI): uses 26px border radius for liquid glass UI design
  // iOS < 15 (pre-glass UI): uses smaller border radius (20px)
  // Android/web: uses default border radius (12px)
  const getModalBorderRadius = (): number => {
    if (Platform.OS !== 'ios') return 12; // Android/web default
    const version = Platform.Version as string;
    const majorVersion = typeof version === 'string' 
      ? parseInt(version.split('.')[0], 10) 
      : Math.floor(version as number);
    if (majorVersion >= 15) {
      return 50; // iOS 15+ liquid glass UI - 26px border radius
    } else if (majorVersion > 0) {
      return 20; // iOS < 15
    }
    return 12; // fallback
  };
  
  const modalBorderRadius = getModalBorderRadius();
  
  // create dynamic styles using the color palette system and typography system
  const styles = useMemo(() => createStyles(themeColors, typography, insets, modalBorderRadius), [themeColors, typography, insets, modalBorderRadius]);

  // CALENDAR HANDLERS
  // handle calendar modal close
  const handleCalendarClose = () => {
    setIsCalendarModalVisible(false);
  };

  // handle date selection from calendar modal or week view
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };
  
  // filter tasks for the selected date
  // useMemo ensures this calculation only runs when tasks or selectedDate changes
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    
    // convert selected date to date string for comparison (YYYY-MM-DD format)
    const selectedDateObj = new Date(selectedDate);
    const selectedDateString = selectedDateObj.toDateString(); // "Mon Jan 15 2024" format
    
    // filter tasks that match the selected date
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === selectedDateString;
    });
  }, [tasks, selectedDate]);
  
  // fetch tasks when component mounts or when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTasks());
    }
  }, [isAuthenticated, dispatch]);
  
  // TASK HANDLERS - Functions to handle task interactions
  // handle when user taps on a task card to view details
  const handleTaskPress = (task: Task) => {
    // provide medium haptic feedback when opening task detail 
    
    setSelectedTask(task);
    setSelectedTaskColor(task.color || 'blue');
    setIsTaskDetailModalVisible(true);
  };
  
  // handle closing the task detail modal
  const handleTaskDetailModalClose = () => {
    setIsTaskDetailModalVisible(false);
    // delay clearing selected task to allow modal close animation
    setTimeout(() => {
      setSelectedTask(null);
    }, 300);
  };
  
  // handle marking a task as complete/uncomplete
  // when completing a task, also completes all its subtasks
  // when uncompleting a task, also uncompletes all its subtasks
  const handleTaskComplete = async (task: Task) => {
    try {
      const newCompletionStatus = !task.isCompleted;
      
      // prepare updates object
      const updates: any = {
        id: task.id,
        isCompleted: newCompletionStatus,
      };
      
      // if task has subtasks, update all subtasks to match the task's completion status
      if (task.metadata?.subtasks && task.metadata.subtasks.length > 0) {
        // create updated subtasks array with all subtasks matching the task's completion status
        const updatedSubtasks = task.metadata.subtasks.map(subtask => ({
          ...subtask,
          isCompleted: newCompletionStatus, // match the task's new completion status
        }));
        
        // include updated subtasks in metadata
        updates.metadata = {
          ...task.metadata,
          subtasks: updatedSubtasks,
        };
      }
      
      // dispatch updateTask action to Redux store
      // this will trigger the async thunk that updates the task via API
      await dispatch(updateTask({ 
        id: task.id, 
        updates 
      })).unwrap();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };
  
  // handle editing a task (opens task detail modal)
  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setSelectedTaskColor(task.color || 'blue');
    setIsTaskDetailModalVisible(true);
  };
  
  // handle deleting a task
  const handleTaskDelete = async (task: Task) => {
    try {
      await dispatch(deleteTask(task.id)).unwrap();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };
  
  // handle swipe left gesture (complete task)
  const handleTaskSwipeLeft = async (task: Task) => {
    if (!task.isCompleted) {
      await handleTaskComplete(task);
    }
  };
  
  // handle swipe right gesture (delete task)
  const handleTaskSwipeRight = async (task: Task) => {
    await handleTaskDelete(task);
  };
  
  // handle refresh - reload tasks from server
  const handleRefresh = async () => {
    if (isAuthenticated) {
      await dispatch(fetchTasks());
    }
  };

  // handle when a task's time is changed via dragging on the timeline
  // updates the task's time and optionally duration
  const handleTaskTimeChange = async (taskId: string, newTime: string, newDuration?: number) => {
    try {
      // find the task to update
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // prepare update data with new time
      const updates: any = {
        id: taskId,
        time: newTime,
      };

      // include duration if provided
      if (newDuration !== undefined) {
        updates.duration = newDuration;
      }

      // dispatch updateTask action to Redux store
      // this will trigger the async thunk that updates the task via API
      await dispatch(updateTask({ id: taskId, updates })).unwrap();
    } catch (error) {
      console.error('Failed to update task time:', error);
    }
  };

  // render main content
  return (
    <View style={{ flex: 1 }}>

      <ScreenContainer 
        scrollable={false}
        paddingHorizontal={0}
        safeAreaTop={false}
        safeAreaBottom={false}
        paddingVertical={0}
      >
        {/* Week View - weekly calendar navigation */}
        <View style={styles.weekViewContainer}>
          <WeekView
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            onHeaderPress={() => setIsCalendarModalVisible(true)}
          />
        </View>
        
        {/* Content area with rounded top and left corners */}
        <View style={styles.contentContainer}>
          {/* TimelineView component displays tasks in a timeline format */}
          {/* shows tasks positioned at their scheduled times with drag functionality */}
          <TimelineView
            tasks={selectedDateTasks}
            onTaskTimeChange={handleTaskTimeChange}
            onTaskPress={handleTaskPress}
            onTaskComplete={handleTaskComplete}
            startHour={6}
            endHour={23}
            timeInterval={60}
          />
        </View>

        {/* Floating Action Button – opens create-task Stack screen with selected date pre-filled */}
        <FloatingActionButton
          onPress={() => {
            router.push({ pathname: '/create-task', params: { dueDate: selectedDate } });
          }}
          accessibilityLabel="Add new task"
          accessibilityHint="Double tap to create a new task"
        />
      </ScreenContainer>

      {/* separate backdrop that fades in independently behind the calendar modal */}
      <ModalBackdrop
        isVisible={isCalendarModalVisible}
        onPress={handleCalendarClose}
        zIndex={10000}
      />
      
      {/* separate backdrop that fades in independently behind the task detail modal */}
      <ModalBackdrop
        isVisible={isTaskDetailModalVisible}
        onPress={handleTaskDetailModalClose}
        zIndex={10000}
      />
      
      {/* Calendar Navigation Modal */}
      <CalendarNavigationModal
        visible={isCalendarModalVisible}
        selectedDate={selectedDate}
        onClose={handleCalendarClose}
        onSelectDate={handleDateSelect}
        title="Select Date"
      />
      
      {/* Task Detail Modal - displays task details using TaskViewModal */}
      <TaskViewModal
        visible={isTaskDetailModalVisible}
        onClose={handleTaskDetailModalClose}
        taskColor={selectedTaskColor}
        taskId={selectedTask?.id}
        task={selectedTask || undefined}
      />
      
    </View>
  );
}

// create dynamic styles using the color palette system and typography system
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>, 
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>,
  modalBorderRadius: number // border radius value that matches modal styling
) => StyleSheet.create({
  // week view container - positioned at top with safe area padding
  weekViewContainer: {
    paddingTop: insets.top,
    backgroundColor: themeColors.background.primary(),
  },

  // content container - styled with top border radius matching modal styling
  // uses conditional border radius based on iOS version to match DraggableModal appearance
  // has 8px spacing from screen edges on all sides
  // uses 1px border with primary border color matching task creation styling
  // uses primary secondary blend background color for subtle visual distinction
  contentContainer: {
    flex: 1,
    backgroundColor: themeColors.background.primarySecondaryBlend(), // primary secondary blend background color
    borderRadius: modalBorderRadius,
    borderWidth: 1, // 1px border matching task creation border width
    borderColor: themeColors.border.primary(), // border color matching task creation border color
    margin: 4, // 8px spacing from all screen edges
    paddingHorizontal: 0, // remove horizontal padding since ListCard handles its own padding
    paddingTop: 0, // top padding for content spacing
    overflow: 'hidden', // ensure content respects border radius
  },
});