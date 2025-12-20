/**
 * Custom Redux Hooks
 * 
 * This file provides custom hooks that make it easier to use Redux
 * in components. These hooks provide typed access to the store state
 * and dispatch functions.
 */

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch, RootState } from './index';

/**
 * Custom hook for accessing tasks state
 * 
 * This hook provides easy access to tasks-related state and actions.
 * It returns the current tasks state and commonly used actions.
 */
export const useTasks = () => {
  const dispatch = useAppDispatch();
  
  // Select tasks state from the store
  const tasksState = useAppSelector((state: RootState) => state.tasks);
  
  // Return state and actions
  return {
    // State
    ...tasksState,
    
    // Actions (wrapped in useCallback for performance)
    clearErrors: useCallback(() => dispatch({ type: 'tasks/clearErrors' }), [dispatch]),
    setFilters: useCallback((filters: any) => dispatch({ type: 'tasks/setFilters', payload: filters }), [dispatch]),
    setSortOptions: useCallback((sortOptions: any) => dispatch({ type: 'tasks/setSortOptions', payload: sortOptions }), [dispatch]),
    toggleTaskSelection: useCallback((taskId: string) => dispatch({ type: 'tasks/toggleTaskSelection', payload: taskId }), [dispatch]),
    clearTaskSelection: useCallback(() => dispatch({ type: 'tasks/clearTaskSelection' }), [dispatch]),
    setEditingTaskId: useCallback((taskId: string | null) => dispatch({ type: 'tasks/setEditingTaskId', payload: taskId }), [dispatch]),
    setPagination: useCallback((pagination: any) => dispatch({ type: 'tasks/setPagination', payload: pagination }), [dispatch]),
    optimisticUpdateTask: useCallback((data: any) => dispatch({ type: 'tasks/optimisticUpdateTask', payload: data }), [dispatch]),
  };
};

/**
 * Custom hook for accessing lists state
 * 
 * This hook provides easy access to lists-related state and actions.
 */
export const useLists = () => {
  const dispatch = useAppDispatch();
  
  // Select lists state from the store
  const listsState = useAppSelector((state: RootState) => state.lists);
  
  // Return state and actions
  return {
    // State
    ...listsState,
    
    // Actions
    clearErrors: useCallback(() => dispatch({ type: 'lists/clearErrors' }), [dispatch]),
    setFilters: useCallback((filters: any) => dispatch({ type: 'lists/setFilters', payload: filters }), [dispatch]),
    setSortOptions: useCallback((sortOptions: any) => dispatch({ type: 'lists/setSortOptions', payload: sortOptions }), [dispatch]),
    toggleListSelection: useCallback((listId: string) => dispatch({ type: 'lists/toggleListSelection', payload: listId }), [dispatch]),
    clearListSelection: useCallback(() => dispatch({ type: 'lists/clearListSelection' }), [dispatch]),
    setEditingListId: useCallback((listId: string | null) => dispatch({ type: 'lists/setEditingListId', payload: listId }), [dispatch]),
    updateListTaskCount: useCallback((data: any) => dispatch({ type: 'lists/updateListTaskCount', payload: data }), [dispatch]),
    optimisticUpdateList: useCallback((data: any) => dispatch({ type: 'lists/optimisticUpdateList', payload: data }), [dispatch]),
  };
};

/**
 * Custom hook for accessing authentication state
 * 
 * This hook provides easy access to auth-related state and actions.
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  
  // Select auth state from the store
  const authState = useAppSelector((state: RootState) => state.auth);
  
  // Return state and actions
  return {
    // State
    ...authState,
    
    // Actions
    clearErrors: useCallback(() => dispatch({ type: 'auth/clearErrors' }), [dispatch]),
    logout: useCallback(() => dispatch({ type: 'auth/logout' }), [dispatch]),
    setRememberMe: useCallback((remember: boolean) => dispatch({ type: 'auth/setRememberMe', payload: remember }), [dispatch]),
    updateUserPreferences: useCallback((preferences: any) => dispatch({ type: 'auth/updateUserPreferences', payload: preferences }), [dispatch]),
    setAuthMethod: useCallback((method: any) => dispatch({ type: 'auth/setAuthMethod', payload: method }), [dispatch]),
  };
};

/**
 * Custom hook for accessing UI state
 * 
 * This hook provides easy access to UI-related state and actions.
 */
export const useUI = () => {
  const dispatch = useAppDispatch();
  
  // Select UI state from the store
  const uiState = useAppSelector((state: RootState) => state.ui);
  
  // Return state and actions
  return {
    // State
    ...uiState,
    
    // Actions
    openModal: useCallback((modal: string) => dispatch({ type: 'ui/openModal', payload: modal }), [dispatch]),
    closeModal: useCallback((modal: string) => dispatch({ type: 'ui/closeModal', payload: modal }), [dispatch]),
    closeAllModals: useCallback(() => dispatch({ type: 'ui/closeAllModals' }), [dispatch]),
    setGlobalLoading: useCallback((loading: boolean) => dispatch({ type: 'ui/setGlobalLoading', payload: loading }), [dispatch]),
    setLoading: useCallback((data: any) => dispatch({ type: 'ui/setLoading', payload: data }), [dispatch]),
    addNotification: useCallback((notification: any) => dispatch({ type: 'ui/addNotification', payload: notification }), [dispatch]),
    removeNotification: useCallback((id: string) => dispatch({ type: 'ui/removeNotification', payload: id }), [dispatch]),
    clearNotifications: useCallback(() => dispatch({ type: 'ui/clearNotifications' }), [dispatch]),
    setKeyboardVisible: useCallback((visible: boolean) => dispatch({ type: 'ui/setKeyboardVisible', payload: visible }), [dispatch]),
    setKeyboardHeight: useCallback((height: number) => dispatch({ type: 'ui/setKeyboardHeight', payload: height }), [dispatch]),
    setCurrentTab: useCallback((tab: string) => dispatch({ type: 'ui/setCurrentTab', payload: tab }), [dispatch]),
    goBack: useCallback(() => dispatch({ type: 'ui/goBack' }), [dispatch]),
    enterSelectionMode: useCallback((type: string) => dispatch({ type: 'ui/enterSelectionMode', payload: type }), [dispatch]),
    exitSelectionMode: useCallback(() => dispatch({ type: 'ui/exitSelectionMode' }), [dispatch]),
    toggleItemSelection: useCallback((id: string) => dispatch({ type: 'ui/toggleItemSelection', payload: id }), [dispatch]),
    selectAllItems: useCallback((ids: string[]) => dispatch({ type: 'ui/selectAllItems', payload: ids }), [dispatch]),
    clearSelection: useCallback(() => dispatch({ type: 'ui/clearSelection' }), [dispatch]),
    startSearch: useCallback(() => dispatch({ type: 'ui/startSearch' }), [dispatch]),
    stopSearch: useCallback(() => dispatch({ type: 'ui/stopSearch' }), [dispatch]),
    setSearchQuery: useCallback((query: string) => dispatch({ type: 'ui/setSearchQuery', payload: query }), [dispatch]),
    setSearchResults: useCallback((results: string[]) => dispatch({ type: 'ui/setSearchResults', payload: results }), [dispatch]),
    setGlobalError: useCallback((error: string | null) => dispatch({ type: 'ui/setGlobalError', payload: error }), [dispatch]),
    setNetworkError: useCallback((error: string | null) => dispatch({ type: 'ui/setNetworkError', payload: error }), [dispatch]),
    setValidationError: useCallback((data: any) => dispatch({ type: 'ui/setValidationError', payload: data }), [dispatch]),
    clearErrors: useCallback(() => dispatch({ type: 'ui/clearErrors' }), [dispatch]),
    setOnlineStatus: useCallback((online: boolean) => dispatch({ type: 'ui/setOnlineStatus', payload: online }), [dispatch]),
    setAppInitialized: useCallback((initialized: boolean) => dispatch({ type: 'ui/setAppInitialized', payload: initialized }), [dispatch]),
    setLastSyncTime: useCallback((time: number) => dispatch({ type: 'ui/setLastSyncTime', payload: time }), [dispatch]),
    toggleEmailAuth: useCallback(() => dispatch({ type: 'ui/toggleEmailAuth' }), [dispatch]),
    setShowEmailAuth: useCallback((show: boolean) => dispatch({ type: 'ui/setShowEmailAuth', payload: show }), [dispatch]),
    setEmailAuthEmail: useCallback((email: string) => dispatch({ type: 'ui/setEmailAuthEmail', payload: email }), [dispatch]),
    setEmailAuthPassword: useCallback((password: string) => dispatch({ type: 'ui/setEmailAuthPassword', payload: password }), [dispatch]),
    setEmailAuthFirstName: useCallback((firstName: string) => dispatch({ type: 'ui/setEmailAuthFirstName', payload: firstName }), [dispatch]),
    setEmailAuthLastName: useCallback((lastName: string) => dispatch({ type: 'ui/setEmailAuthLastName', payload: lastName }), [dispatch]),
    resetUIState: useCallback(() => dispatch({ type: 'ui/resetUIState' }), [dispatch]),
  };
};

/**
 * Custom hook for accessing theme state
 * 
 * This hook provides easy access to theme-related state and actions.
 */
export const useTheme = () => {
  const dispatch = useAppDispatch();
  
  // Select theme state from the store
  const themeState = useAppSelector((state: RootState) => state.theme);
  
  // Return state and actions
  return {
    // State
    ...themeState,
    
    // Actions
    setThemeMode: useCallback((mode: string) => dispatch({ type: 'theme/setThemeMode', payload: mode }), [dispatch]),
    toggleTheme: useCallback(() => dispatch({ type: 'theme/toggleTheme' }), [dispatch]),
    setCustomColors: useCallback((colors: any) => dispatch({ type: 'theme/setCustomColors', payload: colors }), [dispatch]),
    resetColors: useCallback(() => dispatch({ type: 'theme/resetColors' }), [dispatch]),
    setFontFamily: useCallback((fontFamily: string) => dispatch({ type: 'theme/setFontFamily', payload: fontFamily }), [dispatch]),
    setFontSizes: useCallback((sizes: any) => dispatch({ type: 'theme/setFontSizes', payload: sizes }), [dispatch]),
    setFontWeights: useCallback((weights: any) => dispatch({ type: 'theme/setFontWeights', payload: weights }), [dispatch]),
    setSpacing: useCallback((spacing: any) => dispatch({ type: 'theme/setSpacing', payload: spacing }), [dispatch]),
    setBorderRadius: useCallback((radius: any) => dispatch({ type: 'theme/setBorderRadius', payload: radius }), [dispatch]),
    setShadows: useCallback((shadows: any) => dispatch({ type: 'theme/setShadows', payload: shadows }), [dispatch]),
    setAnimationDurations: useCallback((durations: any) => dispatch({ type: 'theme/setAnimationDurations', payload: durations }), [dispatch]),
    setAnimationEasing: useCallback((easing: any) => dispatch({ type: 'theme/setAnimationEasing', payload: easing }), [dispatch]),
    setPreferences: useCallback((preferences: any) => dispatch({ type: 'theme/setPreferences', payload: preferences }), [dispatch]),
    toggleReducedMotion: useCallback(() => dispatch({ type: 'theme/toggleReducedMotion' }), [dispatch]),
    toggleHighContrast: useCallback(() => dispatch({ type: 'theme/toggleHighContrast' }), [dispatch]),
    setFontSizePreference: useCallback((size: string) => dispatch({ type: 'theme/setFontSizePreference', payload: size }), [dispatch]),
    resetTheme: useCallback(() => dispatch({ type: 'theme/resetTheme' }), [dispatch]),
    applySystemTheme: useCallback((theme: string) => dispatch({ type: 'theme/applySystemTheme', payload: theme }), [dispatch]),
  };
};
