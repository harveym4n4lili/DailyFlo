/**
 * UI Slice - Redux State Management for UI State
 * 
 * This file defines the Redux slice for managing UI-related state.
 * It handles modals, loading states, notifications, and other UI interactions.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Define the shape of the UI state
 */
interface UIState {
  // Modal states
  modals: {
    createTask: boolean;             // Create task modal visibility
    editTask: boolean;               // Edit task modal visibility
    createList: boolean;             // Create list modal visibility
    editList: boolean;               // Edit list modal visibility
    deleteConfirm: boolean;          // Delete confirmation modal visibility
    settings: boolean;               // Settings modal visibility
    datePicker: boolean;             // Date picker modal visibility
    emailAuth: boolean;              // Email authentication modal visibility (sign up with email)
    emailAuthSignIn: boolean;        // Email sign in modal visibility
  };
  
  // Loading states for UI operations
  loading: {
    global: boolean;                 // Global loading state
    tasks: boolean;                  // Tasks loading state
    lists: boolean;                  // Lists loading state
    auth: boolean;                   // Authentication loading state
  };
  
  // Notification system
  notifications: Array<{
    id: string;                      // Unique notification ID
    type: 'success' | 'error' | 'warning' | 'info'; // Notification type
    title: string;                   // Notification title
    message: string;                 // Notification message
    duration?: number;               // Auto-dismiss duration (ms)
    timestamp: number;               // When notification was created
  }>;
  
  // Keyboard state
  keyboard: {
    isVisible: boolean;              // Whether keyboard is visible
    height: number;                  // Keyboard height
  };
  
  // Navigation state
  navigation: {
    currentTab: string;              // Current active tab
    previousTab: string | null;      // Previous tab (for back navigation)
    canGoBack: boolean;              // Whether back navigation is possible
  };
  
  // Selection states
  selection: {
    isSelectionMode: boolean;        // Whether selection mode is active
    selectedItems: string[];         // Array of selected item IDs
    selectionType: 'tasks' | 'lists' | null; // Type of items being selected
  };
  
  // Search state
  search: {
    isSearching: boolean;            // Whether search is active
    query: string;                   // Current search query
    results: string[];               // Array of search result IDs
  };
  
  // Error states
  errors: {
    global: string | null;           // Global error message
    network: string | null;          // Network error message
    validation: Record<string, string>; // Field-specific validation errors
  };
  
  // App state
  app: {
    isOnline: boolean;               // Whether app is online
    isInitialized: boolean;          // Whether app has been initialized
    lastSyncTime: number | null;     // Last successful sync timestamp
  };
  
  // Onboarding state
  onboarding: {
    showEmailAuth: boolean;          // Whether to show email/password inputs on signup screen
    emailAuthEmail: string;          // Email value for email auth (shared between signup screen and actions)
    emailAuthPassword: string;       // Password value for email auth (shared between signup screen and actions)
    emailAuthFirstName: string;      // First name value for email auth registration
    emailAuthLastName: string;       // Last name value for email auth registration
  };
}

/**
 * Initial state - the default state when the app starts
 */
const initialState: UIState = {
  // Start with all modals closed
  modals: {
    createTask: false,
    editTask: false,
    createList: false,
    editList: false,
    deleteConfirm: false,
    settings: false,
    datePicker: false,
    emailAuth: false,
    emailAuthSignIn: false,
  },
  
  // Start with no loading states
  loading: {
    global: false,
    tasks: false,
    lists: false,
    auth: false,
  },
  
  // Start with no notifications
  notifications: [],
  
  // Start with keyboard hidden
  keyboard: {
    isVisible: false,
    height: 0,
  },
  
  // Start with default navigation
  navigation: {
    currentTab: 'today',
    previousTab: null,
    canGoBack: false,
  },
  
  // Start with no selections
  selection: {
    isSelectionMode: false,
    selectedItems: [],
    selectionType: null,
  },
  
  // Start with no search
  search: {
    isSearching: false,
    query: '',
    results: [],
  },
  
  // Start with no errors
  errors: {
    global: null,
    network: null,
    validation: {},
  },
  
  // Start with app offline and not initialized
  app: {
    isOnline: true,
    isInitialized: false,
    lastSyncTime: null,
  },
  
  // Start with email auth hidden
  onboarding: {
    showEmailAuth: false,            // Email inputs are hidden by default (show social auth first)
    emailAuthEmail: '',              // Empty email initially
    emailAuthPassword: '',           // Empty password initially
    emailAuthFirstName: '',          // Empty first name initially
    emailAuthLastName: '',           // Empty last name initially
  },
};

/**
 * Create the UI slice
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Modal management actions
     */
    
    // Open a modal
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    
    // Close a modal
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    
    // Close all modals
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
    
    /**
     * Loading state management actions
     */
    
    // Set global loading state
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    
    // Set specific loading state
    setLoading: (state, action: PayloadAction<{ type: keyof UIState['loading']; value: boolean }>) => {
      state.loading[action.payload.type] = action.payload.value;
    },
    
    /**
     * Notification management actions
     */
    
    // Add a notification
    addNotification: (state, action: PayloadAction<{
      type: UIState['notifications'][0]['type'];
      title: string;
      message: string;
      duration?: number;
    }>) => {
      const notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    
    // Remove a notification
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    // Clear all notifications
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    /**
     * Keyboard state management actions
     */
    
    // Set keyboard visibility
    setKeyboardVisible: (state, action: PayloadAction<boolean>) => {
      state.keyboard.isVisible = action.payload;
    },
    
    // Set keyboard height
    setKeyboardHeight: (state, action: PayloadAction<number>) => {
      state.keyboard.height = action.payload;
    },
    
    /**
     * Navigation state management actions
     */
    
    // Set current tab
    setCurrentTab: (state, action: PayloadAction<string>) => {
      state.navigation.previousTab = state.navigation.currentTab;
      state.navigation.currentTab = action.payload;
      state.navigation.canGoBack = state.navigation.previousTab !== null;
    },
    
    // Go back to previous tab
    goBack: (state) => {
      if (state.navigation.previousTab) {
        const currentTab = state.navigation.currentTab;
        state.navigation.currentTab = state.navigation.previousTab;
        state.navigation.previousTab = currentTab;
        state.navigation.canGoBack = state.navigation.previousTab !== null;
      }
    },
    
    /**
     * Selection state management actions
     */
    
    // Enter selection mode
    enterSelectionMode: (state, action: PayloadAction<'tasks' | 'lists'>) => {
      state.selection.isSelectionMode = true;
      state.selection.selectionType = action.payload;
      state.selection.selectedItems = [];
    },
    
    // Exit selection mode
    exitSelectionMode: (state) => {
      state.selection.isSelectionMode = false;
      state.selection.selectionType = null;
      state.selection.selectedItems = [];
    },
    
    // Toggle item selection
    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const index = state.selection.selectedItems.indexOf(itemId);
      
      if (index === -1) {
        // Add to selection
        state.selection.selectedItems.push(itemId);
      } else {
        // Remove from selection
        state.selection.selectedItems.splice(index, 1);
      }
    },
    
    // Select all items
    selectAllItems: (state, action: PayloadAction<string[]>) => {
      state.selection.selectedItems = action.payload;
    },
    
    // Clear selection
    clearSelection: (state) => {
      state.selection.selectedItems = [];
    },
    
    /**
     * Search state management actions
     */
    
    // Start search
    startSearch: (state) => {
      state.search.isSearching = true;
    },
    
    // Stop search
    stopSearch: (state) => {
      state.search.isSearching = false;
      state.search.query = '';
      state.search.results = [];
    },
    
    // Set search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.search.query = action.payload;
    },
    
    // Set search results
    setSearchResults: (state, action: PayloadAction<string[]>) => {
      state.search.results = action.payload;
    },
    
    /**
     * Error state management actions
     */
    
    // Set global error
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.errors.global = action.payload;
    },
    
    // Set network error
    setNetworkError: (state, action: PayloadAction<string | null>) => {
      state.errors.network = action.payload;
    },
    
    // Set validation error
    setValidationError: (state, action: PayloadAction<{ field: string; error: string | null }>) => {
      const { field, error } = action.payload;
      if (error) {
        state.errors.validation[field] = error;
      } else {
        delete state.errors.validation[field];
      }
    },
    
    // Clear all errors
    clearErrors: (state) => {
      state.errors.global = null;
      state.errors.network = null;
      state.errors.validation = {};
    },
    
    /**
     * App state management actions
     */
    
    // Set online status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.app.isOnline = action.payload;
    },
    
    // Set app initialized
    setAppInitialized: (state, action: PayloadAction<boolean>) => {
      state.app.isInitialized = action.payload;
    },
    
    // Set last sync time
    setLastSyncTime: (state, action: PayloadAction<number>) => {
      state.app.lastSyncTime = action.payload;
    },
    
    /**
     * Onboarding state management actions
     */
    
    // Toggle email auth view (show/hide email/password inputs)
    toggleEmailAuth: (state) => {
      state.onboarding.showEmailAuth = !state.onboarding.showEmailAuth;
      // clear email/password and name fields when hiding email auth
      if (!state.onboarding.showEmailAuth) {
        state.onboarding.emailAuthEmail = '';
        state.onboarding.emailAuthPassword = '';
        state.onboarding.emailAuthFirstName = '';
        state.onboarding.emailAuthLastName = '';
      }
    },
    
    // Set email auth visibility
    setShowEmailAuth: (state, action: PayloadAction<boolean>) => {
      state.onboarding.showEmailAuth = action.payload;
      // clear email/password and name fields when hiding email auth
      if (!action.payload) {
        state.onboarding.emailAuthEmail = '';
        state.onboarding.emailAuthPassword = '';
        state.onboarding.emailAuthFirstName = '';
        state.onboarding.emailAuthLastName = '';
      }
    },
    
    // Set email auth email value
    setEmailAuthEmail: (state, action: PayloadAction<string>) => {
      state.onboarding.emailAuthEmail = action.payload;
    },
    
    // Set email auth password value
    setEmailAuthPassword: (state, action: PayloadAction<string>) => {
      state.onboarding.emailAuthPassword = action.payload;
    },
    
    // Set email auth first name value
    setEmailAuthFirstName: (state, action: PayloadAction<string>) => {
      state.onboarding.emailAuthFirstName = action.payload;
    },
    
    // Set email auth last name value
    setEmailAuthLastName: (state, action: PayloadAction<string>) => {
      state.onboarding.emailAuthLastName = action.payload;
    },
    
    /**
     * Utility actions
     */
    
    // Reset UI state to initial state
    resetUIState: () => initialState,
  },
});

/**
 * Export actions and reducer
 */
export const {
  // Modal actions
  openModal,
  closeModal,
  closeAllModals,
  
  // Loading actions
  setGlobalLoading,
  setLoading,
  
  // Notification actions
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Keyboard actions
  setKeyboardVisible,
  setKeyboardHeight,
  
  // Navigation actions
  setCurrentTab,
  goBack,
  
  // Selection actions
  enterSelectionMode,
  exitSelectionMode,
  toggleItemSelection,
  
  // Onboarding actions
  toggleEmailAuth,
  setShowEmailAuth,
  setEmailAuthEmail,
  setEmailAuthPassword,
  setEmailAuthFirstName,
  setEmailAuthLastName,
  selectAllItems,
  clearSelection,
  
  // Search actions
  startSearch,
  stopSearch,
  setSearchQuery,
  setSearchResults,
  
  // Error actions
  setGlobalError,
  setNetworkError,
  setValidationError,
  clearErrors,
  
  // App actions
  setOnlineStatus,
  setAppInitialized,
  setLastSyncTime,
  
  // Utility actions
  resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;
