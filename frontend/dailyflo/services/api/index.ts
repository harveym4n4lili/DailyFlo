/**
 * API Services Index
 * 
 * This file exports all API-related services for making HTTP requests
 * to the Django backend. Each service handles a specific domain of
 * the application's data.
 * 
 * Think of this as the "API directory" - it organizes all the different
 * ways your app talks to the server.
 */

// HTTP Client - Base configuration for all API requests
export { default as apiClient } from './client';

// Authentication API - User login, registration, and token management
export { default as authApiService } from './auth';

// Tasks API - Task CRUD operations and management
export { default as tasksApiService } from './tasks';
