/**
 * Task Entity Type Definition
 * 
 * This file defines the TypeScript interface for Task objects.
 * It matches the backend Django model structure to ensure type safety
 * between frontend and backend.
 */

// Define the possible color choices for tasks
// This matches the COLOR_CHOICES in the backend Task model
export type TaskColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'teal' | 'orange';

// Define the possible routine types for tasks
// This matches the ROUTINE_TYPE_CHOICES in the backend Task model
export type RoutineType = 'once' | 'daily' | 'weekly' | 'monthly';

// Define the priority levels (1-5, where 5 is highest priority)
// This matches the priority_level field in the backend Task model
export type PriorityLevel = 1 | 2 | 3 | 4 | 5;

// Define the structure for subtasks (stored in metadata JSON field)
export interface Subtask {
  id: string;           // Unique identifier for the subtask
  title: string;        // Title of the subtask
  isCompleted: boolean; // Whether the subtask is completed
  sortOrder: number;    // Order of the subtask within the task
}

// Define the structure for reminders (stored in metadata JSON field)
export interface TaskReminder {
  id: string;           // Unique identifier for the reminder
  type: 'due_date' | 'custom'; // Type of reminder
  scheduledTime: Date;  // When the reminder should fire
  isEnabled: boolean;   // Whether the reminder is active
}

// Main Task interface that represents a task entity
// This interface matches the Django Task model structure
export interface Task {
  // Primary key - UUID string from backend
  id: string;
  
  // User relationship - ID of the user who owns this task
  userId: string;
  
  // List relationship - ID of the list this task belongs to (optional for inbox tasks)
  listId: string | null;
  
  // Basic task information
  title: string;                    // Title of the task (required)
  description: string;              // Optional description of the task
  
  // Task scheduling and status
  dueDate: Date | null;             // When the task is due (optional)
  isCompleted: boolean;             // Whether the task is completed
  completedAt: Date | null;         // When the task was completed (if completed)
  
  // Task organization and properties
  priorityLevel: PriorityLevel;     // Priority from 1 (lowest) to 5 (highest)
  color: TaskColor;                 // Color for visual organization
  routineType: RoutineType;         // Type of routine (once, daily, weekly, monthly)
  sortOrder: number;                // Custom ordering within the list
  
  // Additional data stored as JSON in backend
  metadata: {
    subtasks: Subtask[];            // Array of subtasks
    reminders: TaskReminder[];      // Array of reminders
    notes?: string;                 // Additional notes
    tags?: string[];                // Optional tags for categorization
  };
  
  // Soft delete support
  softDeleted: boolean;             // Whether the task has been soft deleted
  
  // Timestamps
  createdAt: Date;                  // When the task was created
  updatedAt: Date;                  // When the task was last updated
}

// Type for creating a new task (without auto-generated fields)
export interface CreateTaskInput {
  title: string;                    // Required: Task title
  description?: string;             // Optional: Task description
  dueDate?: Date;                   // Optional: Due date
  priorityLevel?: PriorityLevel;    // Optional: Priority (defaults to 3)
  color?: TaskColor;                // Optional: Color (defaults to 'blue')
  routineType?: RoutineType;        // Optional: Routine type (defaults to 'once')
  listId?: string;                  // Optional: List ID (null for inbox)
  sortOrder?: number;               // Optional: Sort order (defaults to 0)
  metadata?: Partial<Task['metadata']>; // Optional: Additional metadata
}

// Type for updating an existing task (all fields optional except id)
export interface UpdateTaskInput {
  id: string;                       // Required: Task ID to update
  title?: string;                   // Optional: New title
  description?: string;             // Optional: New description
  dueDate?: Date | null;            // Optional: New due date (null to remove)
  isCompleted?: boolean;            // Optional: Completion status
  priorityLevel?: PriorityLevel;    // Optional: New priority
  color?: TaskColor;                // Optional: New color
  routineType?: RoutineType;        // Optional: New routine type
  listId?: string | null;           // Optional: New list ID
  sortOrder?: number;               // Optional: New sort order
  metadata?: Partial<Task['metadata']>; // Optional: Updated metadata
}

// Type for task filtering and querying
export interface TaskFilters {
  listId?: string | null;           // Filter by list (null for inbox tasks)
  isCompleted?: boolean;            // Filter by completion status
  priorityLevel?: PriorityLevel;    // Filter by priority level
  color?: TaskColor;                // Filter by color
  routineType?: RoutineType;        // Filter by routine type
  dueDateFrom?: Date;               // Filter tasks due after this date
  dueDateTo?: Date;                 // Filter tasks due before this date
  searchQuery?: string;             // Search in title and description
}

// Type for task sorting options
export interface TaskSortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priorityLevel' | 'title' | 'sortOrder';
  direction: 'asc' | 'desc';
}

// Utility type for task statistics
export interface TaskStats {
  total: number;                    // Total number of tasks
  completed: number;                // Number of completed tasks
  pending: number;                  // Number of pending tasks
  overdue: number;                  // Number of overdue tasks
  byPriority: Record<PriorityLevel, number>; // Tasks grouped by priority
  byColor: Record<TaskColor, number>;        // Tasks grouped by color
}
