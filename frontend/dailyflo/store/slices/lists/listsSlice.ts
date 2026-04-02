/**
 * Lists Slice - Redux State Management for Task Lists
 * 
 * This file defines the Redux slice for managing list-related state.
 * Lists are used to organize and categorize tasks in the application.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import listsApi, { getListApiErrorMessage } from '../../../services/api/lists';
import { List, CreateListInput, UpdateListInput, ListFilters, ListSortOptions } from '../../../types';

/**
 * Define the shape of the lists state
 */
interface ListsState {
  // Data arrays
  lists: List[];                    // Array of all lists
  filteredLists: List[];            // Array of lists after filtering
  
  // Loading states
  isLoading: boolean;               // True when loading lists
  isCreating: boolean;              // True when creating a new list
  isUpdating: boolean;              // True when updating a list
  isDeleting: boolean;              // True when deleting a list
  
  // Error states
  error: string | null;             // Error message if something goes wrong
  createError: string | null;       // Error message when creating fails
  updateError: string | null;       // Error message when updating fails
  deleteError: string | null;       // Error message when deleting fails
  
  // Filtering and sorting
  filters: ListFilters;             // Current filters applied to lists
  sortOptions: ListSortOptions;     // Current sorting options
  
  // UI state
  selectedListIds: string[];        // Array of selected list IDs (for bulk operations)
  editingListId: string | null;     // ID of list currently being edited
  
  // Cache management
  lastFetched: number | null;       // Timestamp of last successful fetch
  cacheExpiry: number;              // How long cache is valid (in milliseconds)
}

/**
 * Initial state - the default state when the app starts
 */
const initialState: ListsState = {
  // Start with empty arrays
  lists: [],
  filteredLists: [],
  
  // Start with no loading states
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  
  // Start with no errors
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  
  // Default filters and sorting
  filters: {},
  sortOptions: {
    field: 'name',
    direction: 'asc',
  },
  
  // Start with no selections
  selectedListIds: [],
  editingListId: null,
  
  // Cache settings
  lastFetched: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

/**
 * Async Thunks - Functions that handle async operations
 */

// Fetch all lists from the API
export const fetchLists = createAsyncThunk(
  'lists/fetchLists',
  async (_, { rejectWithValue }) => {
    try {
      return await listsApi.fetchLists();
    } catch (error) {
      return rejectWithValue(getListApiErrorMessage(error));
    }
  }
);

// Create a new list
export const createList = createAsyncThunk(
  'lists/createList',
  async (listData: CreateListInput, { rejectWithValue }) => {
    try {
      return await listsApi.createList(listData);
    } catch (error) {
      return rejectWithValue(getListApiErrorMessage(error));
    }
  }
);

// Update an existing list (PATCH)
export const updateList = createAsyncThunk(
  'lists/updateList',
  async (
    { id, updates }: { id: string; updates: Omit<UpdateListInput, 'id'> },
    { rejectWithValue }
  ) => {
    try {
      return await listsApi.patchList(id, updates);
    } catch (error) {
      return rejectWithValue(getListApiErrorMessage(error));
    }
  }
);

// Delete a list (soft delete on server)
export const deleteList = createAsyncThunk(
  'lists/deleteList',
  async (listId: string, { rejectWithValue }) => {
    try {
      await listsApi.deleteList(listId);
      return listId;
    } catch (error) {
      return rejectWithValue(getListApiErrorMessage(error));
    }
  }
);

// after local reorderLists reducer, PATCH sort_order for each row; on failure refetch to restore
export const persistListOrder = createAsyncThunk(
  'lists/persistListOrder',
  async (orderedIds: string[], { dispatch, rejectWithValue }) => {
    try {
      await listsApi.patchSortOrders(orderedIds);
    } catch (error) {
      await dispatch(fetchLists());
      return rejectWithValue(getListApiErrorMessage(error));
    }
  }
);

/**
 * Create the lists slice
 */
const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {
    /**
     * Reducers for synchronous state updates
     */
    
    // Clear all errors
    clearErrors: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
    },
    
    // Set filters for list filtering
    setFilters: (state, action: PayloadAction<ListFilters>) => {
      state.filters = action.payload;
      // Apply filters to lists
      state.filteredLists = applyFilters(state.lists, action.payload);
    },
    
    // Set sorting options
    setSortOptions: (state, action: PayloadAction<ListSortOptions>) => {
      state.sortOptions = action.payload;
      // Apply sorting to filtered lists
      state.filteredLists = applySorting(state.filteredLists, action.payload);
    },
    
    // Toggle list selection (for bulk operations)
    toggleListSelection: (state, action: PayloadAction<string>) => {
      const listId = action.payload;
      const index = state.selectedListIds.indexOf(listId);
      
      if (index === -1) {
        // Add to selection
        state.selectedListIds.push(listId);
      } else {
        // Remove from selection
        state.selectedListIds.splice(index, 1);
      }
    },
    
    // Clear all list selections
    clearListSelection: (state) => {
      state.selectedListIds = [];
    },
    
    // Set editing list ID
    setEditingListId: (state, action: PayloadAction<string | null>) => {
      state.editingListId = action.payload;
    },
    
    // Update list task count (when tasks are added/removed)
    updateListTaskCount: (state, action: PayloadAction<{ listId: string; taskCount: number; completedCount: number }>) => {
      const { listId, taskCount, completedCount } = action.payload;
      const listIndex = state.lists.findIndex(list => list.id === listId);
      
      if (listIndex !== -1) {
        state.lists[listIndex].metadata.taskCount = taskCount;
        state.lists[listIndex].metadata.completedTaskCount = completedCount;
        state.lists[listIndex].metadata.lastUsed = new Date();
        
        // Also update in filtered lists if it exists there
        const filteredIndex = state.filteredLists.findIndex(list => list.id === listId);
        if (filteredIndex !== -1) {
          state.filteredLists[filteredIndex].metadata.taskCount = taskCount;
          state.filteredLists[filteredIndex].metadata.completedTaskCount = completedCount;
          state.filteredLists[filteredIndex].metadata.lastUsed = new Date();
        }
      }
    },
    
    // Optimistically update a list (for immediate UI feedback)
    optimisticUpdateList: (state, action: PayloadAction<{ id: string; updates: Partial<List> }>) => {
      const { id, updates } = action.payload;
      const listIndex = state.lists.findIndex(list => list.id === id);
      
      if (listIndex !== -1) {
        // Update the list in the array
        state.lists[listIndex] = { ...state.lists[listIndex], ...updates };
        
        // Also update in filtered lists if it exists there
        const filteredIndex = state.filteredLists.findIndex(list => list.id === id);
        if (filteredIndex !== -1) {
          state.filteredLists[filteredIndex] = { ...state.filteredLists[filteredIndex], ...updates };
        }
      }
    },

    // reorder lists after drag-and-drop: ids in display order; rewrites sortOrder 0..n-1
    reorderLists: (state, action: PayloadAction<string[]>) => {
      const orderedIds = action.payload;
      const map = new Map(state.lists.map((l) => [l.id, l]));
      const next: List[] = [];
      let i = 0;
      for (const id of orderedIds) {
        const list = map.get(id);
        if (list) {
          next.push({ ...list, sortOrder: i, updatedAt: new Date() });
          map.delete(id);
          i += 1;
        }
      }
      map.forEach((list) => {
        next.push({ ...list, sortOrder: i, updatedAt: new Date() });
        i += 1;
      });
      state.lists = next;
      state.filteredLists = applyFilters(next, state.filters);
    },
  },
  
  /**
   * Extra reducers handle actions created by async thunks
   */
  extraReducers: (builder) => {
    builder
      // Handle fetchLists actions
      .addCase(fetchLists.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLists.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lists = action.payload;
        state.filteredLists = applyFilters(action.payload, state.filters);
        state.lastFetched = Date.now();
      })
      .addCase(fetchLists.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Handle createList actions
      .addCase(createList.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createList.fulfilled, (state, action) => {
        state.isCreating = false;
        state.lists.push(action.payload);
        state.filteredLists = applyFilters(state.lists, state.filters);
      })
      .addCase(createList.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload as string;
      })
      
      // Handle updateList actions
      .addCase(updateList.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateList.fulfilled, (state, action) => {
        state.isUpdating = false;
        const list = action.payload;
        const listIndex = state.lists.findIndex((l) => l.id === list.id);
        if (listIndex !== -1) {
          state.lists[listIndex] = list;
          state.filteredLists = applyFilters(state.lists, state.filters);
        }
      })
      .addCase(updateList.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      })
      
      // Handle deleteList actions
      .addCase(deleteList.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(deleteList.fulfilled, (state, action) => {
        state.isDeleting = false;
        const listId = action.payload;
        state.lists = state.lists.filter(list => list.id !== listId);
        state.filteredLists = state.filteredLists.filter(list => list.id !== listId);
        state.selectedListIds = state.selectedListIds.filter(id => id !== listId);
      })
      .addCase(deleteList.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload as string;
      })
      .addCase(persistListOrder.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to save list order';
      });
  },
});

/**
 * Helper functions for filtering and sorting
 */

// Apply filters to lists
function applyFilters(lists: List[], filters: ListFilters): List[] {
  return lists.filter(list => {
    // Filter by default status
    if (filters.isDefault !== undefined && list.isDefault !== filters.isDefault) {
      return false;
    }
    
    // Filter by color
    if (filters.color !== undefined && list.color !== filters.color) {
      return false;
    }
    
    // Filter by whether list has tasks
    if (filters.hasTasks !== undefined) {
      const hasTasks = (list.metadata.taskCount || 0) > 0;
      if (hasTasks !== filters.hasTasks) {
        return false;
      }
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = list.name.toLowerCase().includes(query);
      const matchesDescription = list.description.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription) {
        return false;
      }
    }
    
    return true;
  });
}

// Apply sorting to lists
function applySorting(lists: List[], sortOptions: ListSortOptions): List[] {
  return [...lists].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    // Get the values to compare based on the sort field
    switch (sortOptions.field) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'createdAt':
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      case 'updatedAt':
        aValue = a.updatedAt.getTime();
        bValue = b.updatedAt.getTime();
        break;
      case 'sortOrder':
        aValue = a.sortOrder;
        bValue = b.sortOrder;
        break;
      case 'taskCount':
        aValue = a.metadata.taskCount || 0;
        bValue = b.metadata.taskCount || 0;
        break;
      default:
        return 0;
    }
    
    // Compare values
    if (aValue < bValue) {
      return sortOptions.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOptions.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Export actions and reducer
 */
export const {
  clearErrors,
  setFilters,
  setSortOptions,
  toggleListSelection,
  clearListSelection,
  setEditingListId,
  updateListTaskCount,
  optimisticUpdateList,
  reorderLists,
} = listsSlice.actions;

export default listsSlice.reducer;
