/**
 * TaskCard Component Props Types
 * 
 * This file defines TypeScript interfaces for the TaskCard component props.
 * These types ensure type safety when using the TaskCard component.
 */

import { Task, TaskColor, PriorityLevel } from '../common/Task';

// Main props interface for TaskCard component
export interface TaskCardProps {
  // Required props
  task: Task;                       // The task data to display
  
  // Event handlers
  onPress: (task: Task) => void;    // Called when the task card is pressed
  onComplete: (task: Task) => void; // Called when the task is marked as complete
  onEdit: (task: Task) => void;     // Called when the task edit button is pressed
  onDelete: (task: Task) => void;   // Called when the task delete button is pressed
  
  // Optional display props
  showCategory?: boolean;           // Whether to show the list/category name
  showPriority?: boolean;           // Whether to show the priority indicator
  showDueDate?: boolean;            // Whether to show the due date
  showSubtasks?: boolean;           // Whether to show subtask progress
  compact?: boolean;                // Whether to use compact layout
  
  // Optional styling props
  backgroundColor?: string;         // Custom background color
  textColor?: string;              // Custom text color
  borderColor?: string;            // Custom border color
  
  // Optional behavior props
  swipeable?: boolean;             // Whether the card supports swipe gestures
  selectable?: boolean;            // Whether the card can be selected
  selected?: boolean;              // Whether the card is currently selected
  
  // Optional accessibility props
  accessibilityLabel?: string;     // Accessibility label for screen readers
  accessibilityHint?: string;      // Accessibility hint for screen readers
}

// Props for TaskCard in different contexts
export interface TaskCardListProps extends TaskCardProps {
  // Additional props when used in a list context
  index: number;                    // Index of the task in the list
  totalCount: number;              // Total number of tasks in the list
}

// Props for TaskCard in selection mode
export interface TaskCardSelectionProps extends TaskCardProps {
  // Additional props when used in selection mode
  isSelected: boolean;             // Whether this task is selected
  onSelect: (task: Task, selected: boolean) => void; // Called when selection changes
  selectionMode: boolean;          // Whether selection mode is active
}

// Props for TaskCard with swipe actions
export interface TaskCardSwipeProps extends TaskCardProps {
  // Additional props when swipe actions are enabled
  leftActions?: SwipeAction[];     // Actions available on left swipe
  rightActions?: SwipeAction[];    // Actions available on right swipe
  onSwipeAction: (task: Task, action: SwipeAction) => void; // Called when swipe action is triggered
}

// Interface for swipe actions
export interface SwipeAction {
  id: string;                      // Unique identifier for the action
  label: string;                   // Display label for the action
  icon: string;                    // Icon name for the action
  color: string;                   // Background color for the action
  textColor: string;               // Text color for the action
  destructive?: boolean;           // Whether this is a destructive action
}

// Props for TaskCard with drag and drop
export interface TaskCardDragProps extends TaskCardProps {
  // Additional props when drag and drop is enabled
  draggable: boolean;              // Whether the card can be dragged
  onDragStart: (task: Task) => void; // Called when drag starts
  onDragEnd: (task: Task) => void;   // Called when drag ends
  onDrop: (task: Task, targetTask: Task) => void; // Called when dropped on another task
}

// Props for TaskCard with context menu
export interface TaskCardContextProps extends TaskCardProps {
  // Additional props when context menu is enabled
  contextActions: ContextAction[]; // Available context menu actions
  onContextAction: (task: Task, action: ContextAction) => void; // Called when context action is triggered
}

// Interface for context menu actions
export interface ContextAction {
  id: string;                      // Unique identifier for the action
  label: string;                   // Display label for the action
  icon: string;                    // Icon name for the action
  destructive?: boolean;           // Whether this is a destructive action
  disabled?: boolean;              // Whether this action is disabled
}

// Props for TaskCard with priority indicator
export interface TaskCardPriorityProps extends TaskCardProps {
  // Additional props for priority display
  priorityColors: Record<PriorityLevel, string>; // Color mapping for priority levels
  showPriorityNumber?: boolean;    // Whether to show the priority number
}

// Props for TaskCard with color coding
export interface TaskCardColorProps extends TaskCardProps {
  // Additional props for color coding
  colorMapping: Record<string, string>; // Color mapping for task colors
  showColorIndicator?: boolean;    // Whether to show a color indicator
}
