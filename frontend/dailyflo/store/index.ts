/**
 * Redux Store Configuration
 * 
 * This file sets up the main Redux store using Redux Toolkit.
 * Redux is a state management library that helps manage application state
 * in a predictable way. Redux Toolkit (RTK) is the modern way to use Redux
 * with less boilerplate code.
 */

import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// Import all the slice reducers
// These are the individual pieces of state that make up our app
import authReducer from './slices/auth/authSlice';
import tasksReducer from './slices/tasks/tasksSlice';
import listsReducer from './slices/lists/listsSlice';
import uiReducer from './slices/ui/uiSlice';
import themeReducer from './slices/ui/themeSlice';

/**
 * Configure the Redux store
 * 
 * The store is like a big JavaScript object that holds all our app's state.
 * Each slice (auth, tasks, lists, ui, theme) manages its own piece of state.
 */
export const store = configureStore({
  // Reducers are functions that specify how the state changes
  // Each slice has its own reducer that handles state updates
  reducer: {
    auth: authReducer,        // Handles user authentication state
    tasks: tasksReducer,      // Handles task management state
    lists: listsReducer,      // Handles list/category state
    ui: uiReducer,           // Handles UI state (modals, loading, etc.)
    theme: themeReducer,     // Handles theme and preferences
  },
  
  // Middleware provides a way to extend Redux with custom functionality
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Redux Toolkit includes Redux Thunk by default for async actions
      // We can add more middleware here if needed
      serializableCheck: {
        // Ignore these action types for serializable check
        // (useful for Date objects and other non-serializable data)
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  
  // Enable Redux DevTools in development
  // This allows you to see state changes in the browser dev tools
  devTools: process.env.NODE_ENV !== 'production',
});

/**
 * TypeScript types for the store
 * 
 * These types help TypeScript understand the shape of our state
 * and provide better autocomplete and error checking.
 */

// Infer the type of the entire Redux state
// This creates a type that represents all the state in our store
export type RootState = ReturnType<typeof store.getState>;

// Infer the type of the dispatch function
// This creates a type for the dispatch function that can send actions
export type AppDispatch = typeof store.dispatch;

/**
 * Typed hooks for using Redux with TypeScript
 * 
 * These are custom hooks that provide better TypeScript support
 * when using useSelector and useDispatch in components.
 */

// Typed version of useSelector hook
// This hook lets components read data from the Redux store
// The type parameter ensures we get the correct state type
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Typed version of useDispatch hook
// This hook lets components dispatch actions to update the store
// The type parameter ensures we can only dispatch valid actions
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Export the store as default
 * This allows other files to import the store if needed
 */
export default store;
