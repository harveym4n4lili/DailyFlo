/**
 * Task API Response Types
 * 
 * This file defines TypeScript interfaces for API responses
 * related to task operations. These types represent the data
 * structure returned by the Django REST API.
 */

import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, TaskSortOptions } from '../common/Task';

// API response wrapper for single task
export interface TaskResponse {
  success: boolean;                 // Whether the request was successful
  data: Task;                       // The task data
  message?: string;                 // Optional success/error message
}

// API response wrapper for multiple tasks
export interface TasksResponse {
  success: boolean;                 // Whether the request was successful
  data: Task[];                     // Array of task data
  pagination?: {                    // Optional pagination information
    page: number;                   // Current page number
    pageSize: number;               // Number of items per page
    totalPages: number;             // Total number of pages
    totalItems: number;             // Total number of items
    hasNext: boolean;               // Whether there's a next page
    hasPrevious: boolean;           // Whether there's a previous page
  };
  message?: string;                 // Optional success/error message
}

// API request for creating a task
export interface CreateTaskRequest {
  task: CreateTaskInput;            // Task data to create
}

// API request for updating a task
export interface UpdateTaskRequest {
  id: string;                       // Task ID to update
  task: UpdateTaskInput;            // Updated task data
}

// API request for task query/filtering
export interface TaskQueryRequest {
  filters?: TaskFilters;            // Optional filters to apply
  sort?: TaskSortOptions;           // Optional sorting options
  page?: number;                    // Optional page number for pagination
  pageSize?: number;                // Optional page size for pagination
}

// API response for task statistics
export interface TaskStatsResponse {
  success: boolean;                 // Whether the request was successful
  data: {
    total: number;                  // Total number of tasks
    completed: number;              // Number of completed tasks
    pending: number;                // Number of pending tasks
    overdue: number;                // Number of overdue tasks
    byPriority: Record<number, number>; // Tasks grouped by priority
    byColor: Record<string, number>;    // Tasks grouped by color
    byList: Record<string, number>;     // Tasks grouped by list
  };
  message?: string;                 // Optional success/error message
}

// API response for bulk task operations
export interface BulkTaskResponse {
  success: boolean;                 // Whether the request was successful
  data: {
    updated: number;                // Number of tasks updated
    failed: number;                 // Number of tasks that failed to update
    errors: Array<{                 // Array of errors for failed updates
      taskId: string;               // ID of the task that failed
      error: string;                // Error message
    }>;
  };
  message?: string;                 // Optional success/error message
}

// API request for bulk task operations
export interface BulkTaskRequest {
  taskIds: string[];                // Array of task IDs to operate on
  operation: 'complete' | 'incomplete' | 'delete' | 'archive'; // Operation to perform
  data?: Partial<UpdateTaskInput>;  // Optional data for the operation
}

// API response for task completion
export interface TaskCompletionResponse {
  success: boolean;                 // Whether the request was successful
  data: {
    task: Task;                     // Updated task data
    completedAt: Date;              // When the task was completed
  };
  message?: string;                 // Optional success/error message
}

// API response for task restoration (from soft delete)
export interface TaskRestoreResponse {
  success: boolean;                 // Whether the request was successful
  data: Task;                       // Restored task data
  message?: string;                 // Optional success/error message
}
