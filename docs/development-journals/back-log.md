# Product Backlog - Future Features & Improvements

This document tracks features, improvements, and technical debt items that are planned for future implementation. Items are organized by priority and category.

**Last Updated**: 2025-01-20 (Updated from dev-log analysis)

---

## 🔴 High Priority

### Tasks API Integration - Remaining Items

#### Offline Support & Sync
- **Status**: Not Started
- **Description**: Implement offline queue system for task operations
- **Files**: 
  - Create `services/sync/taskSync.ts`
  - Update `store/slices/tasks/tasksSlice.ts`
- **Details**: 
  - Queue operations when offline using AsyncStorage
  - Detect network status with NetInfo
  - Sync pending operations when connection returns
  - Show offline indicator in UI
- **Reference**: `docs/technical-design/api/plan/tasks/tasks-api-integration.md` - Step 7

#### Retry Logic with Exponential Backoff
- **Status**: ✅ Completed
- **Description**: Add automatic retry for failed API requests
- **Files**: `store/slices/tasks/tasksSlice.ts`
- **Details**:
  - Retry failed requests up to 3 times
  - Exponential backoff (1s, 2s, 4s)
  - Don't retry 4xx errors (client errors)
  - User-friendly error messages
- **Reference**: `docs/technical-design/api/plan/tasks/tasks-api-integration.md` - Step 6
- **Completed**: 20/01/2025

#### Loading State UI Components
- **Status**: Not Started
- **Description**: Add visual feedback for loading states
- **Files**: 
  - Create `components/ui/LoadingIndicator.tsx`
  - Create `components/ui/ErrorMessage.tsx`
  - Update task-related screens
- **Details**:
  - Show loading spinner during API calls
  - Display error messages with dismiss option
  - Success toast notifications
  - Optimistic update visual feedback
- **Reference**: `docs/technical-design/api/plan/tasks/tasks-api-integration.md` - Step 9

---

## 🟡 Medium Priority

### UI/UX Improvements

#### Task Form Component Refinements
- **Status**: Not Started
- **Description**: Improve various form components and interactions
- **Details**:
  - Implement better time picker style (currently using react-native-time-wheel-picker)
  - Implement better duration slider style
  - Improve text input component (custom iOS version exists but needs refinement)
  - Fix scrolling issue with subtasks in task view and create modal
  - Fix auto scroll in subtask section of task view and create
  - Re-style subtask component in task creation modal
- **Files**: `components/forms/TaskForm/`, `components/ui/`
- **Reference**: Dev-log recurring TODO items

#### Task Detail View Enhancements
- **Status**: Partially Complete
- **Description**: Complete task detail view functionality
- **Details**:
  - Implement functional buttons for detail view
  - Separate task save button and task create button styling (consider opacity styling)
  - Implement title, desc and icon edit full screen modal for task view
  - Consider keyboard anchored section in task detail to be initially hidden
  - Consider primary buttons and styling
  - Update button should disappear when task update is complete (better UX feedback)
- **Files**: `components/features/tasks/TaskDetail/`
- **Reference**: Dev-log entries 09/12/2025, 11/12/2025

#### Task List Association & Editing
- **Status**: Not Started
- **Description**: Implement task list association and editing for task create and view
- **Details**: Allow users to assign tasks to lists from create and detail views
- **Files**: `components/forms/TaskForm/`, `components/features/tasks/TaskDetail/`
- **Reference**: Dev-log entry 11/12/2025

#### Subtask Functionality
- **Status**: Partially Complete
- **Description**: Complete subtask creation and management
- **Details**:
  - Implement subtask creation functionality
  - Ensure clear, reusable component structure for subtask
  - Fix scrolling and auto-scroll issues
- **Files**: `components/features/tasks/Subtask/`
- **Reference**: Dev-log entries 09/12/2025, 10/12/2025

#### Modal & Animation Improvements
- **Status**: Partially Complete
- **Description**: Enhance modal transitions and animations
- **Details**:
  - Implement custom task creation modal structure
  - Improve seamless transitioning between modals
  - Find alternative to stacked modals (expo iOS limitation)
  - Add more animations throughout app
- **Files**: `components/layout/modals/`
- **Reference**: Dev-log entries 23/10/2025, 13/11/2025

#### Haptic Feedback Enhancement
- **Status**: Partially Complete
- **Description**: Add haptic feedback throughout app
- **Details**: 
  - General haptic feedback for interactions (some already implemented)
  - Add relevant haptic feedback to form buttons
- **Files**: Various components
- **Reference**: Dev-log entries 16/11/2025, recurring TODO

#### Task Color Palette Aesthetic
- **Status**: Not Started
- **Description**: Improve task color palette for better aesthetics
- **Details**: Review and update color choices for tasks
- **Files**: `constants/ColorPalette.ts`
- **Reference**: Dev-log recurring TODO

### Performance & Optimization

#### Task List Pagination
- **Status**: Not Started
- **Description**: Implement pagination for large task lists
- **Details**: Load tasks in batches (20-50 at a time) to improve performance
- **Files**: `store/slices/tasks/tasksSlice.ts`, API service

#### Request Deduplication
- **Status**: Not Started
- **Description**: Prevent duplicate API calls for same data
- **Details**: Cache in-flight requests, return same promise for concurrent calls

#### Optimistic Updates
- **Status**: Not Started
- **Description**: Update UI immediately, sync in background
- **Details**: Show changes instantly, rollback on error

### User Experience

#### Bulk Operations UI
- **Status**: Not Started
- **Description**: UI for bulk update/delete operations
- **Details**: Multi-select interface, bulk action toolbar

#### Advanced Search
- **Status**: Not Started
- **Description**: Enhanced search with filters and sorting
- **Details**: Search by date range, priority, tags, etc.

#### Dark Mode Support
- **Status**: Not Started
- **Description**: Implement dark mode throughout app
- **Details**: 
  - Color palette for dark mode exists (designed 17/09/2025)
  - Need to implement theme switching
  - Ensure all components support dark mode
- **Files**: `constants/ColorPalette.ts`, `hooks/useColorScheme.ts`
- **Reference**: Dev-log entry 09/09/2025

---

## 🟢 Low Priority / Nice to Have

### Features

#### Task Templates
- **Status**: Not Started
- **Description**: Save task configurations as templates for quick creation

#### Task Attachments
- **Status**: Not Started
- **Description**: Attach files/images to tasks

#### Recurring Task Improvements
- **Status**: Not Started
- **Description**: Enhanced recurring task options (custom patterns, exceptions)
- **Details**: 
  - Plan how to implement repeating task selection
  - Custom patterns beyond daily/weekly/monthly
- **Reference**: Dev-log entries 09/10/2025, 13/10/2025

#### Task Categories/Grouping
- **Status**: Not Started
- **Description**: Extend task organization with categories
- **Details**: 
  - Consider extending with task categories
  - Grouped tasks view (e.g., project/task-list)
  - Controlled categories
- **Reference**: Dev-log entry 26/06/2025

#### Focus Task Feature
- **Status**: Partially Complete (UI only)
- **Description**: Implement focus task functionality
- **Details**: 
  - Non-functional focus task button component exists (12/12/2025)
  - Need to implement actual focus functionality
- **Files**: `components/features/tasks/TaskDetail/`

### Technical Debt & Code Quality

#### Remove Mock Data
- **Status**: Pending
- **Description**: Remove commented-out mock data from `tasksSlice.ts`
- **Files**: `store/slices/tasks/tasksSlice.ts` (lines 243-551)

#### Component Architecture Review
- **Status**: Not Started
- **Description**: Review and restructure component hierarchy
- **Details**:
  - Check how current structure follows planned file architecture
  - Review task creation modal, task card components structure
  - Consider file structure after task view implementation
- **Files**: Various component files
- **Reference**: Dev-log entries 14/11/2025, 15/11/2025, 18/11/2025

#### Status Bar Issue Fix
- **Status**: Not Started
- **Description**: Fix status bar display issue
- **Files**: App root component
- **Reference**: Dev-log entry 19/09/2025

#### Responsive Design Improvements
- **Status**: Not Started
- **Description**: Improve responsiveness for various components
- **Details**:
  - Responsiveness for description input, box expansion
  - Consider auto scroll to keep content avoiding keyboard
- **Reference**: Dev-log entries 19/10/2025, 18/11/2025

#### TypeScript Strict Mode
- **Status**: Not Started
- **Description**: Enable strict TypeScript checking for better type safety

#### Unit Tests
- **Status**: Not Started
- **Description**: Add unit tests for async thunks and reducers

#### E2E Tests
- **Status**: Not Started
- **Description**: Add end-to-end tests for critical flows

### Learning & Documentation

#### API Integration Testing Documentation
- **Status**: Not Started
- **Description**: Document API integration testing process
- **Details**:
  - Learn and record how to test API integration
  - Document how to prepare Django backend for API integration testing
  - Note how to temporarily bypass auth (token checks) for local testing
  - Note how to manually set tokens to bypass auth for local testing
- **Reference**: Dev-log entries 12/12/2025, 14/12/2025

#### Redux/State Management Understanding
- **Status**: Not Started
- **Description**: Deepen understanding of Redux patterns
- **Details**:
  - Get better understanding of async thunk
  - Learn Redux slice state management patterns
- **Reference**: Dev-log entry 12/12/2025

---

## 📝 Notes

### How to Use This Backlog

1. **When discovering a future need**: Add it here immediately with:
   - Clear description
   - Priority level
   - Relevant files
   - Reference to related docs if applicable

2. **When starting work**: Move item to "In Progress" section (create if needed)

3. **When completing**: Move to "Completed" section with completion date

4. **Regular review**: Review and reprioritize monthly

### Priority Guidelines

- **High**: Blocks core functionality or significantly impacts UX
- **Medium**: Improves UX or performance but not critical
- **Low**: Nice to have, can wait

---

## ✅ Completed (Archive)

*Items moved here after completion*

---

## 🔄 In Progress

*Items currently being worked on*

