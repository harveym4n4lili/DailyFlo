/**
 * Slices Index
 * 
 * This file exports all Redux slices for easy importing.
 */

// Export all slice reducers
export { default as authReducer } from './auth';
export { default as tasksReducer } from './tasks';
export { default as listsReducer } from './lists';
export { default as uiReducer } from './ui/uiSlice';
export { default as themeReducer } from './ui/themeSlice';

// Export all slice actions
export * from './auth';
export * from './tasks';
export * from './lists';
export * from './ui/uiSlice';
export * from './ui/themeSlice';
