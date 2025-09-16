/**
 * List Entity Type Definition
 * 
 * This file defines the TypeScript interface for List objects.
 * Lists are used to organize and categorize tasks in the application.
 * It matches the backend Django List model structure.
 */

// Define the possible color choices for lists
// This matches the COLOR_CHOICES in the backend List model
export type ListColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'teal' | 'orange';

// Main List interface that represents a task list/category
// This interface matches the Django List model structure
export interface List {
  // Primary key - UUID string from backend
  id: string;
  
  // User relationship - ID of the user who owns this list
  userId: string;
  
  // Basic list information
  name: string;                     // Name of the task list (required)
  description: string;              // Optional description of the list
  
  // Visual organization
  color: ListColor;                 // Color for visual organization
  icon: string;                     // Icon identifier for the list (optional)
  
  // List properties
  isDefault: boolean;               // Whether this is the default inbox list
  sortOrder: number;                // Custom ordering for lists
  
  // Additional metadata stored as JSON in backend
  metadata: {
    taskCount?: number;             // Cached count of tasks in this list
    completedTaskCount?: number;    // Cached count of completed tasks
    lastUsed?: Date;                // When this list was last accessed
    tags?: string[];                // Optional tags for categorization
    settings?: {                    // List-specific settings
      autoArchive?: boolean;        // Auto-archive completed tasks
      defaultPriority?: number;     // Default priority for new tasks
      reminderSettings?: object;    // Reminder preferences for this list
    };
  };
  
  // Soft delete support
  softDeleted: boolean;             // Whether the list has been soft deleted
  
  // Timestamps
  createdAt: Date;                  // When the list was created
  updatedAt: Date;                  // When the list was last updated
}

// Type for creating a new list (without auto-generated fields)
export interface CreateListInput {
  name: string;                     // Required: List name
  description?: string;             // Optional: List description
  color?: ListColor;                // Optional: Color (defaults to 'blue')
  icon?: string;                    // Optional: Icon identifier
  isDefault?: boolean;              // Optional: Whether this is the default list
  sortOrder?: number;               // Optional: Sort order (defaults to 0)
  metadata?: Partial<List['metadata']>; // Optional: Additional metadata
}

// Type for updating an existing list (all fields optional except id)
export interface UpdateListInput {
  id: string;                       // Required: List ID to update
  name?: string;                    // Optional: New name
  description?: string;             // Optional: New description
  color?: ListColor;                // Optional: New color
  icon?: string;                    // Optional: New icon
  isDefault?: boolean;              // Optional: Whether this is the default list
  sortOrder?: number;               // Optional: New sort order
  metadata?: Partial<List['metadata']>; // Optional: Updated metadata
}

// Type for list filtering and querying
export interface ListFilters {
  isDefault?: boolean;              // Filter by default status
  color?: ListColor;                // Filter by color
  hasTasks?: boolean;               // Filter lists that have tasks
  searchQuery?: string;             // Search in name and description
}

// Type for list sorting options
export interface ListSortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder' | 'taskCount';
  direction: 'asc' | 'desc';
}

// Utility type for list statistics
export interface ListStats {
  total: number;                    // Total number of lists
  withTasks: number;                // Number of lists that have tasks
  empty: number;                    // Number of empty lists
  byColor: Record<ListColor, number>; // Lists grouped by color
}

// Type for list with task count information
export interface ListWithTaskCount extends List {
  taskCount: number;                // Total number of tasks in this list
  completedTaskCount: number;       // Number of completed tasks
  pendingTaskCount: number;         // Number of pending tasks
}

// Type for list selection in UI components
export interface ListOption {
  id: string;                       // List ID
  name: string;                     // List name
  color: ListColor;                 // List color
  icon?: string;                    // List icon
  isDefault: boolean;               // Whether this is the default list
  taskCount?: number;               // Optional task count for display
}
