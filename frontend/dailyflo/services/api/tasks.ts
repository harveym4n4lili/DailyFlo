/**
 * Tasks API Service
 * 
 * This service handles all task-related API calls to the Django backend.
 * Think of it as the "task manager" for your app - it handles creating, reading,
 * updating, and deleting tasks (CRUD operations).
 * 
 * Key concepts:
 * - CRUD: Create, Read, Update, Delete - the four basic operations for data
 * - REST API: A way of organizing API endpoints (like having different mailboxes for different types of mail)
 * - HTTP Methods: GET (read), POST (create), PUT/PATCH (update), DELETE (delete)
 * - Query Parameters: Extra information added to URLs (like ?filter=completed&sort=date)
 */

import apiClient from './client';
import {
  TaskQueryRequest,
  TasksResponse,
  TaskResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  BulkTaskRequest,
  BulkTaskResponse
} from '../../types/api/tasks';
// CreateTaskInput: Type for creating tasks (from types/common/Task.ts)
// UpdateTaskInput: Type for updating tasks (from types/common/Task.ts)
// These are the frontend formats with camelCase field names
import { CreateTaskInput, UpdateTaskInput } from '../../types/common/Task';

/**
 * Tasks API service class
 * This class contains all the methods for task operations
 */
class TasksApiService {
  /**
   * Fetch tasks with optional filtering and sorting
   * This gets a list of tasks from the server
   * 
   * @param params - Optional parameters for filtering, sorting, and pagination
   * @returns Promise with a list of tasks
   */
  async fetchTasks(params: TaskQueryRequest = {}): Promise<TasksResponse> {
    try {
      // Send a GET request to /tasks/ with query parameters
      // Django URL structure: /tasks/ includes apps.tasks.urls, which has router registered with empty string
      // So the full path is /tasks/ for the list endpoint
      // Query parameters are added to the URL like: /tasks/?isCompleted=false&sortBy=dueDate
      const response = await apiClient.get('/tasks/', { params });
      
      return response.data;
    } catch (error) {
      console.error('Fetch tasks failed:', error);
      throw error;
    }
  }

  /**
   * Fetch a single task by ID
   * This gets one specific task from the server
   * 
   * @param taskId - The unique ID of the task to fetch
   * @returns Promise with the task data
   */
  async fetchTaskById(taskId: string): Promise<TaskResponse> {
    try {
      // Send a GET request to /tasks/{id}/ to get a specific task
      // Django URL structure: /tasks/{id}/ for detail view
      const response = await apiClient.get(`/tasks/${taskId}/`);
      
      return response.data;
    } catch (error) {
      console.error('Fetch task by ID failed:', error);
      throw error;
    }
  }

  /**
   * Create a new task
   * This adds a new task to the server
   * 
   * @param data - The task data to create (can be wrapped CreateTaskRequest or direct CreateTaskInput)
   * @returns Promise with the newly created task
   */
  async createTask(data: CreateTaskRequest | CreateTaskInput): Promise<TaskResponse> {
    try {
      // Extract task data - handle both wrapped format { task: ... } and direct format
      // Django REST Framework expects the data directly in snake_case format
      let taskData: CreateTaskInput;
      
      if ('task' in data) {
        // Wrapped format: { task: CreateTaskInput }
        taskData = (data as CreateTaskRequest).task;
      } else {
        // Direct format: CreateTaskInput
        taskData = data as CreateTaskInput;
      }
      
      // Transform camelCase (frontend format) to snake_case (Django API format)
      // Django uses snake_case field names (e.g., due_date, priority_level)
      // This transformation ensures the frontend can use camelCase while Django gets snake_case
      const apiData: any = {};
      
      // Required field - always include
      apiData.title = taskData.title;
      
      // Optional fields - only include if defined (not undefined)
      // This prevents sending null/undefined values that Django might reject
      if (taskData.description !== undefined && taskData.description !== null) {
        apiData.description = taskData.description;
      }
      // only include icon if it's explicitly set and not empty
      // tasks don't require icons - icon is optional
      if (taskData.icon !== undefined && taskData.icon !== null && taskData.icon.trim() !== '') {
        apiData.icon = taskData.icon.trim();
      }
      if (taskData.time !== undefined && taskData.time !== null) {
        apiData.time = taskData.time; // Django TimeField accepts HH:MM format string
      }
      if (taskData.duration !== undefined && taskData.duration !== null) {
        apiData.duration = taskData.duration;
      }
      // Convert camelCase dueDate to snake_case due_date
      // Send due_date if it's explicitly set (can be past, present, or future dates)
      // Django DateTimeField accepts ISO string format
      if (taskData.dueDate !== undefined && taskData.dueDate !== null) {
        apiData.due_date = taskData.dueDate; // Django DateTimeField accepts ISO string
      }
      // Convert camelCase priorityLevel to snake_case priority_level
      if (taskData.priorityLevel !== undefined && taskData.priorityLevel !== null) {
        apiData.priority_level = taskData.priorityLevel;
      }
      if (taskData.color !== undefined && taskData.color !== null) {
        apiData.color = taskData.color;
      }
      // Convert camelCase routineType to snake_case routine_type
      if (taskData.routineType !== undefined && taskData.routineType !== null) {
        apiData.routine_type = taskData.routineType;
      }
      // Convert camelCase listId to snake_case list (Django field is 'list', not 'list_id')
      // Django expects the list ID value (UUID string), not the field name 'list_id'
      // Only include if listId is a valid non-empty string
      if (taskData.listId !== undefined && taskData.listId !== null && taskData.listId !== '') {
        apiData.list = taskData.listId;
      }
      // Convert camelCase sortOrder to snake_case sort_order
      if (taskData.sortOrder !== undefined && taskData.sortOrder !== null) {
        apiData.sort_order = taskData.sortOrder;
      }
      // Include metadata if it exists (metadata structure stays the same - nested objects don't need transformation)
      if (taskData.metadata !== undefined && taskData.metadata !== null) {
        apiData.metadata = taskData.metadata;
      }
      
      // DEBUG: Log the data being sent to Django
      console.log('📤 Sending task data to API:', JSON.stringify(apiData, null, 2));
      
      // Send a POST request to /tasks/ to create a new task
      // Django URL structure: /tasks/ for list/create endpoint
      // Django REST Framework expects the data directly in snake_case format (not wrapped)
      const response = await apiClient.post('/tasks/', apiData);
      
      return response.data;
    } catch (error) {
      console.error('Create task failed:', error);
      
      // DEBUG: Log the full error response from Django
      if ((error as any)?.response) {
        console.error('📦 Django Error Response:', {
          status: (error as any).response.status,
          statusText: (error as any).response.statusText,
          data: (error as any).response.data,
          headers: (error as any).response.headers,
        });
      }
      
      throw error;
    }
  }

  /**
   * Update an existing task
   * This modifies an existing task on the server
   * 
   * @param taskId - The ID of the task to update
   * @param data - The new data for the task (can be wrapped UpdateTaskRequest or direct UpdateTaskInput)
   * @returns Promise with the updated task
   */
  async updateTask(taskId: string, data: UpdateTaskRequest | UpdateTaskInput): Promise<TaskResponse> {
    try {
      // Extract task data - handle both wrapped format { task: ... } and direct format
      // Django REST Framework expects the data directly in snake_case format
      let taskData: UpdateTaskInput;
      
      if ('task' in data) {
        // Wrapped format: { task: UpdateTaskInput }
        taskData = (data as UpdateTaskRequest).task;
      } else {
        // Direct format: UpdateTaskInput
        taskData = data as UpdateTaskInput;
      }
      
      // Transform camelCase (frontend format) to snake_case (Django API format)
      // Django uses snake_case field names (e.g., due_date, priority_level)
      // This transformation ensures the frontend can use camelCase while Django gets snake_case
      const apiData: any = {};
      
      // Optional fields - only include if defined (not undefined)
      // This prevents sending null/undefined values that Django might reject
      // Note: For updates, we only send the fields that are being changed
      if (taskData.title !== undefined && taskData.title !== null) {
        apiData.title = taskData.title;
      }
      if (taskData.description !== undefined && taskData.description !== null) {
        apiData.description = taskData.description;
      }
      // only include icon if it's explicitly set and not empty
      // tasks don't require icons - icon is optional
      if (taskData.icon !== undefined && taskData.icon !== null && taskData.icon.trim() !== '') {
        apiData.icon = taskData.icon.trim();
      }
      // Handle time field - distinguish between not provided vs explicitly cleared
      // If time is undefined, null, or empty string, send null to clear it in Django
      // If time has a value, send that value
      // This allows users to clear the time field by setting it to "No Time"
      if (taskData.time !== undefined) {
        if (taskData.time === null || taskData.time === '') {
          // Explicitly clearing time - send null to Django to remove the time
          apiData.time = null;
        } else {
          // Time has a value - send it to Django
          apiData.time = taskData.time; // Django TimeField accepts HH:MM format string
        }
      }
      // Handle duration field - distinguish between not provided vs explicitly cleared
      // Django duration field doesn't allow null (default is 0), so we send 0 to clear it
      // If duration has a value, send that value
      // This allows users to clear the duration field by setting it to "No Duration"
      if (taskData.duration !== undefined) {
        if (taskData.duration === null || taskData.duration === 0) {
          // Explicitly clearing duration - send 0 to Django (Django doesn't allow null for duration)
          // Django model has default=0, so 0 represents "no duration"
          apiData.duration = 0;
        } else {
          // Duration has a value - send it to Django
          apiData.duration = taskData.duration;
        }
      }
      // Convert camelCase dueDate to snake_case due_date
      // Handle null case - if dueDate is explicitly null, send null to remove the due date
      // Otherwise, send the date as-is (can be past, present, or future dates)
      if (taskData.dueDate !== undefined) {
        if (taskData.dueDate === null) {
          // Explicitly setting to null removes the due date
          apiData.due_date = null;
        } else {
          // Send the date as-is - Django DateTimeField accepts ISO string format
          apiData.due_date = taskData.dueDate;
        }
      }
      // Convert camelCase priorityLevel to snake_case priority_level
      if (taskData.priorityLevel !== undefined && taskData.priorityLevel !== null) {
        apiData.priority_level = taskData.priorityLevel;
      }
      if (taskData.color !== undefined && taskData.color !== null) {
        apiData.color = taskData.color;
      }
      // Convert camelCase routineType to snake_case routine_type
      if (taskData.routineType !== undefined && taskData.routineType !== null) {
        apiData.routine_type = taskData.routineType;
      }
      // Convert camelCase listId to snake_case list (Django field is 'list', not 'list_id')
      // Handle null case - if listId is explicitly null, send null to remove from list
      if (taskData.listId !== undefined) {
        if (taskData.listId === null || taskData.listId === '') {
          apiData.list = null; // Remove task from list (move to inbox)
        } else {
          apiData.list = taskData.listId;
        }
      }
      // Convert camelCase sortOrder to snake_case sort_order
      if (taskData.sortOrder !== undefined && taskData.sortOrder !== null) {
        apiData.sort_order = taskData.sortOrder;
      }
      // Include metadata if it exists (metadata structure stays the same)
      if (taskData.metadata !== undefined && taskData.metadata !== null) {
        apiData.metadata = taskData.metadata;
      }
      // Handle isCompleted - Django uses is_completed
      if (taskData.isCompleted !== undefined) {
        apiData.is_completed = taskData.isCompleted;
      }
      
      // DEBUG: Log the data being sent to Django
      console.log('📤 Sending task update data to API:', JSON.stringify(apiData, null, 2));
      
      // Send a PATCH request to /tasks/{id}/ to update a specific task
      // PATCH is used for partial updates (only changing some fields)
      // Django URL structure: /tasks/{id}/ for detail/update endpoint
      // Django REST Framework expects the data directly in snake_case format (not wrapped)
      const response = await apiClient.patch(`/tasks/${taskId}/`, apiData);
      
      return response.data;
    } catch (error) {
      console.error('Update task failed:', error);
      
      // DEBUG: Log the full error response from Django
      if ((error as any)?.response) {
        console.error('📦 Django Error Response:', {
          status: (error as any).response.status,
          statusText: (error as any).response.statusText,
          data: (error as any).response.data,
          headers: (error as any).response.headers,
        });
      }
      
      throw error;
    }
  }

  /**
   * Delete a task
   * This removes a task from the server (soft delete)
   * 
   * @param taskId - The ID of the task to delete
   * @returns Promise with deletion confirmation
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      // Send a DELETE request to /tasks/{id}/ to delete a specific task
      // Django URL structure: /tasks/{id}/ for detail/delete endpoint
      // Django REST Framework performs soft delete (sets soft_deleted=True)
      // Returns 204 No Content on success
      const response = await apiClient.delete(`/tasks/${taskId}/`);
      
      // Django REST Framework returns 204 No Content for successful DELETE
      // No response body is returned, so we don't need to return anything
      // The response object will have status 204 if successful
      console.log('✅ Task deleted successfully:', taskId);
      
      // Return void since DELETE doesn't return data
      return;
    } catch (error) {
      console.error('Delete task failed:', error);
      
      // DEBUG: Log the full error response from Django
      if ((error as any)?.response) {
        console.error('📦 Django Error Response:', {
          status: (error as any).response.status,
          statusText: (error as any).response.statusText,
          data: (error as any).response.data,
          headers: (error as any).response.headers,
        });
      }
      
      throw error;
    }
  }

  /**
   * Toggle task completion status
   * This marks a task as completed or uncompleted
   * 
   * @param taskId - The ID of the task
   * @param isCompleted - Whether the task is completed
   * @returns Promise with the updated task
   */
  async toggleTaskCompletion(taskId: string, isCompleted: boolean): Promise<TaskResponse> {
    try {
      // Send a PATCH request to update the completion status
      // Django URL structure: /tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/${taskId}/`, {
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
      });
      
      return response.data;
    } catch (error) {
      console.error('Toggle task completion failed:', error);
      throw error;
    }
  }

  /**
   * Update task priority
   * This changes the priority level of a task
   * 
   * @param taskId - The ID of the task
   * @param priorityLevel - The new priority level (1-5)
   * @returns Promise with the updated task
   */
  async updateTaskPriority(taskId: string, priorityLevel: number): Promise<TaskResponse> {
    try {
      // Send a PATCH request to update the priority
      // Django URL structure: /tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/${taskId}/`, {
        priorityLevel,
      });
      
      return response.data;
    } catch (error) {
      console.error('Update task priority failed:', error);
      throw error;
    }
  }

  /**
   * Update task due date
   * This changes when a task is due
   * 
   * @param taskId - The ID of the task
   * @param dueDate - The new due date (or null to remove due date)
   * @returns Promise with the updated task
   */
  async updateTaskDueDate(taskId: string, dueDate: Date | null): Promise<TaskResponse> {
    try {
      // Send a PATCH request to update the due date
      // Django URL structure: /tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/${taskId}/`, {
        dueDate: dueDate ? dueDate.toISOString() : null,
      });
      
      return response.data;
    } catch (error) {
      console.error('Update task due date failed:', error);
      throw error;
    }
  }

  /**
   * Move task to different list
   * This moves a task from one list to another
   * 
   * @param taskId - The ID of the task
   * @param listId - The ID of the new list (or null for inbox)
   * @returns Promise with the updated task
   */
  async moveTaskToList(taskId: string, listId: string | null): Promise<TaskResponse> {
    try {
      // Send a PATCH request to update the list
      // Django URL structure: /tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/${taskId}/`, {
        listId,
      });
      
      return response.data;
    } catch (error) {
      console.error('Move task to list failed:', error);
      throw error;
    }
  }

  /**
   * Duplicate a task
   * This creates a copy of an existing task
   * 
   * @param taskId - The ID of the task to duplicate
   * @returns Promise with the new duplicated task
   */
  async duplicateTask(taskId: string): Promise<TaskResponse> {
    try {
      // Send a POST request to duplicate the task
      // Django URL structure: /tasks/{id}/duplicate/ for duplicate action
      const response = await apiClient.post(`/tasks/${taskId}/duplicate/`);
      
      return response.data;
    } catch (error) {
      console.error('Duplicate task failed:', error);
      throw error;
    }
  }

  /**
   * Archive a task (soft delete)
   * This hides a task without permanently deleting it
   * 
   * @param taskId - The ID of the task to archive
   * @returns Promise with the updated task
   */
  async archiveTask(taskId: string): Promise<TaskResponse> {
    try {
      // Send a PATCH request to mark the task as archived
      // Django URL structure: /tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/${taskId}/`, {
        softDeleted: true,
      });
      
      return response.data;
    } catch (error) {
      console.error('Archive task failed:', error);
      throw error;
    }
  }

  /**
   * Restore an archived task
   * This brings back a previously archived task
   * 
   * @param taskId - The ID of the task to restore
   * @returns Promise with the updated task
   */
  async restoreTask(taskId: string): Promise<TaskResponse> {
    try {
      // Send a PATCH request to unarchive the task
      // Django URL structure: /tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/${taskId}/`, {
        softDeleted: false,
      });
      
      return response.data;
    } catch (error) {
      console.error('Restore task failed:', error);
      throw error;
    }
  }

  /**
   * Bulk update multiple tasks
   * This updates several tasks at once (more efficient than updating one by one)
   * 
   * @param data - The bulk update data (task IDs and updates to apply)
   * @returns Promise with the results of the bulk update
   */
  async bulkUpdateTasks(data: BulkTaskRequest): Promise<BulkTaskResponse> {
    try {
      // Send a PATCH request to update multiple tasks
      const response = await apiClient.patch('/tasks/bulk-update/', data);
      
      return response.data;
    } catch (error) {
      console.error('Bulk update tasks failed:', error);
      throw error;
    }
  }

  /**
   * Bulk delete multiple tasks
   * This deletes several tasks at once
   * 
   * @param data - The bulk delete data (task IDs to delete)
   * @returns Promise with the results of the bulk delete
   */
  async bulkDeleteTasks(data: BulkTaskRequest): Promise<BulkTaskResponse> {
    try {
      // Send a DELETE request to delete multiple tasks
      const response = await apiClient.delete('/tasks/bulk-delete/', { data });
      
      return response.data;
    } catch (error) {
      console.error('Bulk delete tasks failed:', error);
      throw error;
    }
  }

  /**
   * Get tasks for today
   * This gets all tasks that are due today
   * 
   * @returns Promise with today's tasks
   */
  async getTodayTasks(): Promise<TasksResponse> {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Send a GET request with today's date as a filter
      // Django URL structure: /tasks/ for list endpoint
      const response = await apiClient.get('/tasks/', {
        params: {
          dueDate: today,
          isCompleted: false, // Only get incomplete tasks
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Get today tasks failed:', error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   * This gets all tasks that are past their due date
   * 
   * @returns Promise with overdue tasks
   */
  async getOverdueTasks(): Promise<TasksResponse> {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Send a GET request to get tasks due before today
      // Django URL structure: /tasks/ for list endpoint
      const response = await apiClient.get('/tasks/', {
        params: {
          dueDateBefore: today,
          isCompleted: false, // Only get incomplete tasks
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Get overdue tasks failed:', error);
      throw error;
    }
  }

  /**
   * Get completed tasks
   * This gets all tasks that have been completed
   * 
   * @param params - Optional parameters for pagination
   * @returns Promise with completed tasks
   */
  async getCompletedTasks(params: { limit?: number; offset?: number } = {}): Promise<TasksResponse> {
    try {
      // Send a GET request to get completed tasks
      // Django URL structure: /tasks/ for list endpoint
      const response = await apiClient.get('/tasks/', {
        params: {
          isCompleted: true,
          ...params, // Include any additional parameters
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Get completed tasks failed:', error);
      throw error;
    }
  }

  /**
   * Search tasks
   * This searches for tasks based on a text query
   * 
   * @param query - The search query (text to search for)
   * @param filters - Additional filters to apply
   * @returns Promise with search results
   */
  async searchTasks(query: string, filters: any = {}): Promise<TasksResponse> {
    try {
      // Send a GET request to the search endpoint
      // Django URL structure: /tasks/search/ (if custom search endpoint exists)
      // Note: This might need to be /tasks/search/ depending on Django setup
      const response = await apiClient.get('/tasks/search/', {
        params: {
          q: query, // The search query
          ...filters, // Any additional filters
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Search tasks failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const tasksApiService = new TasksApiService();
export default tasksApiService;
