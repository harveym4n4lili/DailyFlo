
import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// import our custom layout components
import { ScreenContainer } from '@/components';
import { FloatingActionButton } from '@/components/ui/button';
import { ActionContextMenu } from '@/components/ui';
import { ClockIcon } from '@/components/ui/icon';
import { ModalBackdrop } from '@/components/layout/ModalLayout';
import { CalendarNavigationModal } from '@/components/features/calendar/modals';
import { WeekView } from '@/components/features/calendar/sections';
import { ListCard } from '@/components/ui/card';
import { TimelineView } from '@/components/features/timeline';

// import color palette system for consistent theming
import { useThemeColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

// safe area context for handling devices with notches/home indicators
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// redux store hooks for task management
import { useTasks, useUI } from '@/store/hooks';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchTasks, updateTask, deleteTask } from '@/store/slices/tasks/tasksSlice';

// types for tasks
import { Task, TaskColor } from '@/types';
import {
  expandTasksForDates,
  isExpandedRecurrenceId,
  getBaseTaskId,
  getOccurrenceDateFromId,
} from '@/utils/recurrenceUtils';

export default function PlannerScreen() {
  // CALENDAR MODAL STATE - Controls the visibility of the calendar modal
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  
  // SELECTED DATE STATE - Currently selected date for calendar navigation
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // default to today's date as ISO string
    return new Date().toISOString();
  });
  
  // TASK DETAIL MODAL STATE - Controls the visibility of task detail modal
  
  // router: open task Stack screen from FAB (with optional dueDate from selected date)
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
  const { enterSelectionMode } = useUI();
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
  
  // expand tasks for selected date: one-off + recurring occurrences that fall on selectedDate
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const selectedDateStr = new Date(selectedDate).toISOString().slice(0, 10);
    return expandTasksForDates(tasks, [selectedDateStr]);
  }, [tasks, selectedDate]);
  
  // fetch tasks when component mounts or when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTasks());
    }
  }, [isAuthenticated, dispatch]);
  
  // TASK HANDLERS - Functions to handle task interactions
  // handle when user taps on a task card - opens task screen in edit mode
  // for recurring occurrences, pass occurrenceDate so save can offer "this instance" vs "all"
  const handleTaskPress = (task: Task) => {
    const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
    router.push({ pathname: '/task/[taskId]', params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) } });
  };
  
  // handle marking a task as complete/uncomplete
  // for recurring occurrences (expanded id), update metadata.recurrence_completions on base task
  const handleTaskComplete = async (task: Task) => {
    try {
      if (isExpandedRecurrenceId(task.id)) {
        const baseId = getBaseTaskId(task.id);
        const occurrenceDate = getOccurrenceDateFromId(task.id);
        if (!occurrenceDate) return;
        const baseTask = tasks.find((t) => t.id === baseId);
        if (!baseTask) return;
        const completions = baseTask.metadata?.recurrence_completions ?? [];
        const newCompletions = task.isCompleted
          ? completions.filter((d) => d !== occurrenceDate)
          : [...completions, occurrenceDate];
        await dispatch(updateTask({
          id: baseId,
          updates: {
            id: baseId,
            metadata: { ...baseTask.metadata, recurrence_completions: newCompletions },
          },
        })).unwrap();
      } else {
        const newCompletionStatus = !task.isCompleted;
        const updates: any = { id: task.id, isCompleted: newCompletionStatus };
        if (task.metadata?.subtasks?.length) {
          updates.metadata = {
            ...task.metadata,
            subtasks: task.metadata.subtasks.map((s) => ({ ...s, isCompleted: newCompletionStatus })),
          };
        }
        await dispatch(updateTask({ id: task.id, updates })).unwrap();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };
  
  // handle editing a task - opens task screen in edit mode (same as task press)
  const handleTaskEdit = (task: Task) => {
    const baseId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    const occurrenceDate = isExpandedRecurrenceId(task.id) ? getOccurrenceDateFromId(task.id) : undefined;
    router.push({ pathname: '/task/[taskId]', params: { taskId: baseId, ...(occurrenceDate ? { occurrenceDate } : {}) } });
  };
  
  // handle deleting a task (for expanded recurring, delete base task)
  const handleTaskDelete = async (task: Task) => {
    const taskId = isExpandedRecurrenceId(task.id) ? getBaseTaskId(task.id) : task.id;
    try {
      await dispatch(deleteTask(taskId)).unwrap();
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
  // for expanded recurring tasks, update the base task
  const handleTaskTimeChange = async (taskId: string, newTime: string, newDuration?: number) => {
    try {
      const baseId = isExpandedRecurrenceId(taskId) ? getBaseTaskId(taskId) : taskId;
      const task = tasks.find((t) => t.id === baseId);
      if (!task) return;

      const updates: any = { id: baseId, time: newTime };
      if (newDuration !== undefined) updates.duration = newDuration;
      await dispatch(updateTask({ id: baseId, updates })).unwrap();
    } catch (error) {
      console.error('Failed to update task time:', error);
    }
  };

  // render main content
  return (
    <View style={{ flex: 1 }}>
      {/* top section - 48px row for context ellipse button; pointerEvents box-none so taps pass through to WeekView header */}
      <View style={[styles.topSectionAnchor, { height: insets.top + 48 }]} pointerEvents="box-none">
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <ActionContextMenu
            items={[
              { id: 'activity-log', label: 'Activity log', iconComponent: (color: string) => <ClockIcon size={20} color={color} isSolid />, systemImage: 'clock.arrow.circlepath', onPress: () => { /* TODO: open activity log */ } },
              { id: 'select-tasks', label: 'Select Tasks', systemImage: 'square.and.pencil', onPress: () => enterSelectionMode('tasks') },
            
            ]}
            style={styles.topSectionContextButton}
            accessibilityLabel="Open menu"
            dropdownAnchorTopOffset={insets.top + 48}
            dropdownAnchorRightOffset={24}
            tint="primary"
          />
        </View>
      </View>
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
          {/* fade opacity overlay - starts 48px below date selection border, matches Today screen */}
          <View style={styles.fadeOverlay} pointerEvents="none">
            <LinearGradient
              colors={[
                themeColors.background.primary(),
                themeColors.withOpacity(themeColors.background.primary(), 0),
              ]}
              locations={[0.0, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
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

        {/* Floating Action Button – opens task Stack screen with selected date pre-filled */}
        <FloatingActionButton
          onPress={() => {
            router.push({ pathname: '/task-create' as any, params: { dueDate: selectedDate } });
          }}
          backgroundColor={themeColors.background.invertedPrimary()}
          iconColor={themeColors.text.invertedPrimary()}
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
      
      {/* Calendar Navigation Modal */}
      <CalendarNavigationModal
        visible={isCalendarModalVisible}
        selectedDate={selectedDate}
        onClose={handleCalendarClose}
        onSelectDate={handleDateSelect}
        title="Select Date"
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
  // top section anchor - fixed row for context button, matches Today screen (insets.top + 48)
  topSectionAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },

  // row container for context button - matches Today screen topSectionRow
  topSectionRow: {
    position: 'absolute',
    top: insets.top,
    left: 0,
    right: 0,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Paddings.screen,
  },
  // matches task screen ActionContextMenu (transparent bg, liquid glass)
  topSectionContextButton: {
    backgroundColor: 'primary',
  },

  // week view container - starts at inset top; top section overlays with context button (zIndex 10)
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
    position: 'relative',
    backgroundColor: themeColors.background.primarySecondaryBlend(), // primary secondary blend background color
   

    margin: 0, // 8px spacing from all screen edges
    paddingHorizontal: Paddings.none,
    paddingTop: Paddings.none,
    overflow: 'hidden', // ensure content respects border radius
  },

  // fade overlay - 48px below date selection border, same gradient as Today screen (locations 0.4-1 = solid to transparent)
  fadeOverlay: {
    position: 'absolute',
    top: 0, // 48px below the border of the date selection
    left: 0,
    right: 0,
    height: 32, // matches Today screen fade height
    zIndex: 5,
    overflow: 'hidden',
  },
});