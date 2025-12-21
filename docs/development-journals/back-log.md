# Product Backlog - Future Features & Improvements

This document tracks features, improvements, and technical debt items that are planned for future implementation. Items are organized by priority and category.

**Last Updated**: 2025-01-21 (Updated with task management and social auth planning items)

---

## 🔴 High Priority

### Authentication API Integration - Remaining Items

#### Social Authentication Implementation Plan & Development
- **Status**: Not Started
- **Description**: Create implementation plan and implement functionality for social auth buttons (Google, Apple, Facebook) in onboarding and sign-in modals
- **Files**: 
  - Create planning document: `docs/technical-design/authentication/plan/social-auth-implementation.md`
  - `store/slices/auth/authSlice.ts` (update socialAuth thunk)
  - `services/api/auth.ts` (connect to social auth API endpoint)
  - `components/features/authentication/sections/SocialAuthActions.tsx` (wire up button handlers)
  - `components/features/authentication/modals/SignInModal.tsx` (connect handleSocialAuth)
  - `components/features/onboarding/OnboardingActions.tsx` (connect handleSocialAuth)
- **Planning Tasks**:
  - Research and document Expo AuthSession capabilities and setup requirements
  - Plan OAuth flow for each provider (Google, Apple, Facebook)
  - Design token exchange flow with backend API
  - Plan error handling and edge cases (user cancellation, network failures)
  - Design user experience flow (loading states, success/error feedback)
  - Document required backend API contract and response formats
- **Implementation Details**: 
  - Connect socialAuth Redux thunk to backend API endpoint `/accounts/auth/social/`
  - Integrate with Expo AuthSession or appropriate social auth libraries
  - Handle provider token validation and user creation/retrieval
  - Store tokens securely after successful social auth
  - Handle social auth errors and edge cases
  - Implement proper loading states and user feedback
- **Reference**: `docs/technical-design/authentication/plan/auth-api-integration.md` - Step 3 (partial), backend endpoint exists

#### Onboarding Reminders Message Functionality
- **Status**: Not Started
- **Description**: Implement reminder permission request functionality on reminders screen
- **Files**: 
  - `app/(onboarding)/reminders.tsx` (implement permission request)
  - `components/features/onboarding/OnboardingActions.tsx` (implement handleAllow)
- **Details**: 
  - Request notification permissions from device
  - Handle permission grant/denial appropriately
  - Store permission status
  - Navigate to next screen after handling permissions
- **Reference**: Onboarding reminders screen exists but permission handling is not implemented

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
- **Description**: Complete task detail view functionality and fix modal refresh issues
- **Details**:
  - Implement functional buttons for detail view
  - Separate task save button and task create button styling (consider opacity styling)
  - Implement title, desc and icon edit full screen modal for task view
  - Consider keyboard anchored section in task detail to be initially hidden
  - Consider primary buttons and styling
  - Update button should disappear when task update is complete (better UX feedback)
  - **Bug**: Task view modal does not update/refresh after saving changes - modal should reflect updated task data immediately after save
  - Ensure modal syncs with Redux store state after update operations
- **Files**: 
  - `components/features/tasks/TaskView/TaskViewModal.tsx` (fix refresh after save)
  - `components/features/tasks/TaskDetail/`
- **Reference**: Dev-log entries 09/12/2025, 11/12/2025

#### Task List Association & Editing
- **Status**: Not Started
- **Description**: Implement task list association and editing for task create and view modals
- **Details**: 
  - Allow users to assign tasks to lists from task creation modal
  - **Currently broken**: Allow users to update associated list from task view modal (ListSection exists but cannot be edited)
  - Implement list selection UI/component for both modals
  - Update task when list association changes
- **Files**: 
  - `components/features/tasks/TaskView/TaskViewModal.tsx` (implement list editing in ListSection)
  - `components/features/tasks/TaskView/sections/ListSection.tsx` (make editable)
  - `components/forms/TaskForm/` (if needed for create modal)
- **Reference**: Dev-log entry 11/12/2025, TaskViewModal.tsx ListSection (line ~985-990)

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
- **Description**: UI for bulk update/delete operations, including "Select All" functionality
- **Details**: 
  - Implement "Select All" feature accessible from 3-dots menu (ellipse button) in today screen
  - Multi-select interface for selecting multiple tasks
  - Bulk action toolbar for performing actions on selected tasks
  - Clear visual indication of selected tasks
  - Handle selection state in Redux store
- **Files**: 
  - `app/(tabs)/today/index.tsx` (implement handleSelectAll function - currently has TODO at line ~343)
  - `components/ui/Card/TaskCard/` (add selection state UI)
  - `store/slices/tasks/tasksSlice.ts` (bulk selection actions already exist - toggleTaskSelection, clearTaskSelection)
- **Reference**: Today screen dropdown menu with "Select All" option exists but is not functional

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
- **Description**: Implement repeating/recurring task selection in task creation date picker modal
- **Details**: 
  - **Currently broken**: Repeating option exists in DatePickerModal but has no functionality (button is disabled/does nothing)
  - Implement repeating task selection UI and logic in DatePickerModal
  - Allow users to select repeat patterns (daily, weekly, monthly) when creating tasks
  - Store routineType in task data when repeating is selected
  - Plan and implement custom patterns beyond daily/weekly/monthly (future enhancement)
  - Integrate with backend routine/recurring task system when available
- **Files**: 
  - `components/features/calendar/DatePicker/DatePickerModal.tsx` (implement repeating functionality - currently no-op at line ~156)
  - `components/features/tasks/TaskCreation/TaskCreationModal.tsx` (handle routineType from date picker)
  - `store/slices/tasks/tasksSlice.ts` (ensure routineType is saved with task)
- **Reference**: Dev-log entries 09/10/2025, 13/10/2025, DatePickerModal.tsx repeating button (line ~154-193)

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

### Authentication API Integration - Completed Steps

#### Secure Token Storage Implementation
- **Status**: ✅ Completed
- **Description**: Implemented secure token storage using Expo SecureStore
- **Files**: `services/auth/tokenStorage.ts`
- **Details**: Created functions to store, retrieve, and clear access tokens, refresh tokens, and expiry timestamps using encrypted device storage
- **Completed**: 20/01/2025

#### API Client Token Management
- **Status**: ✅ Completed
- **Description**: Updated API client to use stored tokens and handle automatic token refresh
- **Files**: `services/api/client.ts`
- **Details**: Implemented request interceptor to add auth headers, response interceptor for automatic token refresh on 401 errors, proper error handling
- **Completed**: 20/01/2025

#### Login API Integration
- **Status**: ✅ Completed
- **Description**: Connected loginUser Redux thunk to real backend API
- **Files**: `store/slices/auth/authSlice.ts`, `services/api/auth.ts`
- **Details**: Integrated with TokenObtainPairView endpoint, handles username/password authentication, stores tokens securely, fetches user data separately, comprehensive error handling
- **Completed**: 20/01/2025

#### Registration API Integration
- **Status**: ✅ Completed
- **Description**: Connected registerUser Redux thunk to real backend API
- **Files**: `store/slices/auth/authSlice.ts`, `services/api/auth.ts`
- **Details**: Integrated with UserRegistrationView endpoint, includes password_confirm field, transforms API responses from snake_case to camelCase, stores tokens securely, comprehensive error handling
- **Completed**: 20/01/2025

#### Token Refresh Logic
- **Status**: ✅ Completed
- **Description**: Implemented automatic token refresh in API client response interceptor
- **Files**: `services/api/client.ts`
- **Details**: Handles 401 errors by refreshing access token using refresh token, retries failed requests, clears tokens and logs out on refresh failure
- **Completed**: 20/01/2025

#### Check Auth Status on App Launch
- **Status**: ✅ Completed
- **Description**: Implemented authentication status check on app launch using SecureStore
- **Files**: `store/slices/auth/authSlice.ts`, `app/_layout.tsx`
- **Details**: Checks for valid tokens, validates with backend, automatically refreshes expired tokens, clears invalid tokens, restores user session on successful validation
- **Completed**: 20/01/2025

#### Logout Functionality
- **Status**: ✅ Completed
- **Description**: Implemented logout functionality with secure token clearing
- **Files**: `store/slices/auth/authSlice.ts`, `app/(tabs)/settings/index.tsx`
- **Details**: Created logoutUser async thunk, clears tokens from SecureStore, clears Redux state, resets onboarding status, navigates to welcome screen, added logout button to settings page
- **Completed**: 20/01/2025

---

## 🔄 In Progress

*Items currently being worked on*

