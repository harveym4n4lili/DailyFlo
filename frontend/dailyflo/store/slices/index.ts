/**
 * Slices Index
 * 
 * This file exports all Redux slices for easy importing.
 * It serves as the main entry point for all Redux state management.
 */

// Export all slice reducers
export { authReducer } from './auth';
export { tasksReducer } from './tasks';
export { listsReducer } from './lists';
export { uiReducer, themeReducer } from './ui';

// Export all slice actions with namespace to avoid conflicts
export * as authActions from './auth';
export * as taskActions from './tasks';
export * as listActions from './lists';
export * as uiActions from './ui';
