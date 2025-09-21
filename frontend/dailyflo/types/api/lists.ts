/**
 * List API Response Types
 * 
 * This file defines TypeScript interfaces for API responses
 * related to list operations. These types represent the data
 * structure returned by the Django REST API.
 */

import { List, CreateListInput, UpdateListInput, ListFilters, ListSortOptions } from '../common/List';

// API response wrapper for single list
export interface ListResponse {
  success: boolean;                 // Whether the request was successful
  data: List;                       // The list data
  message?: string;                 // Optional success/error message
}

// API response wrapper for multiple lists
export interface ListsResponse {
  success: boolean;                 // Whether the request was successful
  data: List[];                     // Array of list data
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

// API request for creating a list
export interface CreateListRequest {
  list: CreateListInput;            // List data to create
}

// API request for updating a list
export interface UpdateListRequest {
  id: string;                       // List ID to update
  list: UpdateListInput;            // Updated list data
}

// API request for list query/filtering
export interface ListQueryRequest {
  filters?: ListFilters;            // Optional filters to apply
  sort?: ListSortOptions;           // Optional sorting options
  page?: number;                    // Optional page number for pagination
  pageSize?: number;                // Optional page size for pagination
}

// API response for list statistics
export interface ListStatsResponse {
  success: boolean;                 // Whether the request was successful
  data: {
    total: number;                  // Total number of lists
    withTasks: number;              // Number of lists that have tasks
    empty: number;                  // Number of empty lists
    byColor: Record<string, number>; // Lists grouped by color
  };
  message?: string;                 // Optional success/error message
}

// API response for list with task count
export interface ListWithTaskCountResponse {
  success: boolean;                 // Whether the request was successful
  data: {
    list: List;                     // List data
    taskCount: number;              // Total number of tasks in this list
    completedTaskCount: number;     // Number of completed tasks
    pendingTaskCount: number;       // Number of pending tasks
  };
  message?: string;                 // Optional success/error message
}

// API response for bulk list operations
export interface BulkListResponse {
  success: boolean;                 // Whether the request was successful
  data: {
    updated: number;                // Number of lists updated
    failed: number;                 // Number of lists that failed to update
    errors: Array<{                 // Array of errors for failed updates
      listId: string;               // ID of the list that failed
      error: string;                // Error message
    }>;
  };
  message?: string;                 // Optional success/error message
}

// API request for bulk list operations
export interface BulkListRequest {
  listIds: string[];                // Array of list IDs to operate on
  operation: 'delete' | 'archive' | 'update'; // Operation to perform
  data?: Partial<UpdateListInput>;  // Optional data for the operation
}

// API response for list restoration (from soft delete)
export interface ListRestoreResponse {
  success: boolean;                 // Whether the request was successful
  data: List;                       // Restored list data
  message?: string;                 // Optional success/error message
}

// API response for moving tasks between lists
export interface MoveTasksResponse {
  success: boolean;                 // Whether the request was successful
  data: {
    movedCount: number;             // Number of tasks moved
    fromListId: string;             // ID of the source list
    toListId: string;               // ID of the destination list
  };
  message?: string;                 // Optional success/error message
}

// API request for moving tasks between lists
export interface MoveTasksRequest {
  taskIds: string[];                // Array of task IDs to move
  fromListId: string;               // ID of the source list
  toListId: string;                 // ID of the destination list
}
