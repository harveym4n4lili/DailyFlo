/**
 * OverlappingTaskCard Component
 * 
 * Displays multiple overlapping tasks stacked vertically as a single card on the timeline.
 * Uses TimelineItem components for each task to reuse existing drag functionality.
 * 
 * This component is used by TimelineView to render overlapping tasks as a single card.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Task } from '@/types';
import { getTaskCardHeight } from '../timelineUtils';
import TimelineItem from '../TimelineItem/TimelineItem';

interface OverlappingTaskCardProps {
  // array of tasks sorted by start time (earliest first)
  tasks: Task[];
  // Y position on the timeline in pixels (start position of the overlapping card)
  position: number;
  // combined duration in minutes (calculated from start of first to end of last)
  duration: number;
  // pixels per minute for reference
  pixelsPerMinute: number;
  // callback when task is pressed
  onPress?: (task: Task) => void;
  // callback when task completion checkbox is pressed
  onTaskComplete?: (task: Task) => void;
  // callback when task is dragged to a new position
  onDrag: (taskId: string, newY: number) => void;
  // callback when drag position changes (for showing time label)
  onDragPositionChange?: (taskId: string, yPosition: number) => void;
  // callback when drag starts
  onDragStart?: (taskId: string) => void;
  // callback when drag ends
  onDragEnd?: (taskId: string) => void;
  // start hour of the timeline (e.g., 6 for 6 AM)
  startHour?: number;
  // callback when card height is measured/calculated
  onHeightMeasured?: (taskId: string, height: number) => void;
  // whether a specific task is currently being dragged (for z-index management)
  draggedTaskId?: string | null;
}

/**
 * OverlappingTaskCard Component
 * 
 * Renders multiple overlapping tasks using TimelineItem components.
 * Each task is positioned absolutely within the overlapping card container.
 */
export default function OverlappingTaskCard({
  tasks = [],
  position,
  duration,
  pixelsPerMinute,
  onPress,
  onTaskComplete,
  onDrag,
  onDragPositionChange,
  onDragStart,
  onDragEnd,
  startHour = 6,
  onHeightMeasured,
  draggedTaskId = null,
}: OverlappingTaskCardProps) {
  // ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // calculate absolute position for each task on the timeline
  // tasks are stacked vertically with 4px spacing between them
  // each TimelineItem positions itself absolutely on the timeline
  const taskPositions = useMemo(() => {
    if (!safeTasks || safeTasks.length === 0) return [];
    
    const positions: Array<{ task: Task; position: number }> = [];
    let currentAbsolutePosition = position; // start at the overlapping card's position on timeline
    
    safeTasks.forEach((task) => {
      if (!task) return;
      
      // store the absolute position for this task on the timeline
      // TimelineItem will use this to position itself absolutely
      positions.push({
        task,
        position: currentAbsolutePosition,
      });
      
      // calculate the height of this task for positioning the next one
      const taskDuration = task.duration || 0;
      const taskHasSubtasks = !!(task.metadata?.subtasks && Array.isArray(task.metadata.subtasks) && task.metadata.subtasks.length > 0);
      const taskHeight = getTaskCardHeight(taskDuration, taskHasSubtasks);
      
      // move to the next absolute position: current position + task height + 4px spacing
      currentAbsolutePosition += taskHeight + 4;
    });
    
    return positions;
  }, [safeTasks, position]);

  // container spans full width of tasksContainer (left: 0, right: 0)
  // TimelineItems inside position themselves absolutely and inherit the same padding
  // this ensures overlapping tasks have the same horizontal padding as standalone tasks
  return (
    <View style={{ position: 'absolute', left: 0, right: 0 }}>
      {taskPositions.map(({ task, position: taskPosition }) => {
        const taskDuration = task.duration || 0;
        const isDragged = draggedTaskId === task.id;
        
        return (
          <TimelineItem
            key={task.id}
            task={task}
            position={taskPosition}
            duration={taskDuration}
            pixelsPerMinute={pixelsPerMinute}
            startHour={startHour}
            onHeightMeasured={(height: number) => {
              // forward height measurement to parent with task id
              onHeightMeasured?.(task.id, height);
            }}
            onDrag={(newY: number) => {
              // forward drag to parent with task id
              onDrag(task.id, newY);
            }}
            onDragPositionChange={(yPosition: number) => {
              // forward drag position change to parent with task id
              onDragPositionChange?.(task.id, yPosition);
            }}
            onDragStart={() => {
              // forward drag start to parent with task id
              onDragStart?.(task.id);
            }}
            onDragEnd={() => {
              // forward drag end to parent with task id
              onDragEnd?.(task.id);
            }}
            onPress={() => {
              // forward press to parent with task object
              onPress?.(task);
            }}
            onTaskComplete={onTaskComplete}
            // pass isDraggedTask prop so this task can apply higher z-index when being dragged
            isDraggedTask={isDragged}
          />
        );
      })}
    </View>
  );
}
