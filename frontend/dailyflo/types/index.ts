/**
 * Types Index
 * 
 * This is the main entry point for all TypeScript type definitions.
 * Import types from here to use throughout the application.
 */

// Export all common entity types
export * from './common';

// Export all API types
export * from './api';

// Export all component types
export * from './components';

// Re-export commonly used types for convenience
export type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskColor,
  PriorityLevel,
  RoutineType,
} from './common/Task';

export type {
  List,
  CreateListInput,
  UpdateListInput,
  ListFilters,
  ListColor,
} from './common/List';

export type {
  User,
  UserPreferences,
  AuthProvider,
  RegisterUserInput,
  LoginUserInput,
  UpdateUserInput,
} from './common/User';
