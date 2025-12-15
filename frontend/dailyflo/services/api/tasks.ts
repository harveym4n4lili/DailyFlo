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
      // Send a GET request to /tasks/tasks/ with query parameters
      // Django URL structure: /tasks/ includes apps.tasks.urls, which has router with 'tasks' registered
      // So the full path is /tasks/tasks/ for the list endpoint
      // Query parameters are added to the URL like: /tasks/tasks/?isCompleted=false&sortBy=dueDate
      const response = await apiClient.get('/tasks/tasks/', { params });
      
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
      // Send a GET request to /tasks/tasks/{id}/ to get a specific task
      // Django URL structure: /tasks/tasks/{id}/ for detail view
      const response = await apiClient.get(`/tasks/tasks/${taskId}/`);
      
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
   * @param data - The task data to create
   * @returns Promise with the newly created task
   */
  async createTask(data: CreateTaskRequest): Promise<TaskResponse> {
    try {
      // Send a POST request to /tasks/tasks/ to create a new task
      // Django URL structure: /tasks/tasks/ for list/create endpoint
      const response = await apiClient.post('/tasks/tasks/', data);
      
      return response.data;
    } catch (error) {
      console.error('Create task failed:', error);
      throw error;
    }
  }

  /**
   * Update an existing task
   * This modifies an existing task on the server
   * 
   * @param taskId - The ID of the task to update
   * @param data - The new data for the task
   * @returns Promise with the updated task
   */
  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<TaskResponse> {
    try {
      // Send a PATCH request to /tasks/tasks/{id}/ to update a specific task
      // PATCH is used for partial updates (only changing some fields)
      // Django URL structure: /tasks/tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/tasks/${taskId}/`, data);
      
      return response.data;
    } catch (error) {
      console.error('Update task failed:', error);
      throw error;
    }
  }

  /**
   * Delete a task
   * This removes a task from the server
   * 
   * @param taskId - The ID of the task to delete
   * @returns Promise with deletion confirmation
   */
  async deleteTask(taskId: string): Promise<TaskResponse> {
    try {
      // Send a DELETE request to /tasks/tasks/{id}/ to delete a specific task
      // Django URL structure: /tasks/tasks/{id}/ for detail/delete endpoint
      const response = await apiClient.delete(`/tasks/tasks/${taskId}/`);
      
      return response.data;
    } catch (error) {
      console.error('Delete task failed:', error);
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
      // Django URL structure: /tasks/tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/tasks/${taskId}/`, {
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
      // Django URL structure: /tasks/tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/tasks/${taskId}/`, {
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
      // Django URL structure: /tasks/tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/tasks/${taskId}/`, {
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
      // Django URL structure: /tasks/tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/tasks/${taskId}/`, {
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
      // Django URL structure: /tasks/tasks/{id}/duplicate/ for duplicate action
      const response = await apiClient.post(`/tasks/tasks/${taskId}/duplicate/`);
      
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
      // Django URL structure: /tasks/tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/tasks/${taskId}/`, {
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
      // Django URL structure: /tasks/tasks/{id}/ for detail/update endpoint
      const response = await apiClient.patch(`/tasks/tasks/${taskId}/`, {
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
      // Django URL structure: /tasks/tasks/ for list endpoint
      const response = await apiClient.get('/tasks/tasks/', {
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
      // Django URL structure: /tasks/tasks/ for list endpoint
      const response = await apiClient.get('/tasks/tasks/', {
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
      // Django URL structure: /tasks/tasks/ for list endpoint
      const response = await apiClient.get('/tasks/tasks/', {
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
      // Note: This might need to be /tasks/tasks/search/ depending on Django setup
      const response = await apiClient.get('/tasks/tasks/search/', {
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
