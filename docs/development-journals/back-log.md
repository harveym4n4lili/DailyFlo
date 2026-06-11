# Product Backlog - Future Features & Improvements

This document tracks features, improvements, and technical debt items that are planned for future implementation. Items are organized by priority and category.

**Last Updated**: 2026-05-26 — Onboarding backlog aligned with shipped code; reconciliation doc unchanged path reference below.

> **Maintainers:** Prefer moving **✅ Completed** rows into **[§ Completed (Archive)]** when an item ships; archive entries keep file-path hints for archaeology.

---

## 🔴 High Priority

### Authentication API Integration — **remaining** vs shipped (**onboarding**)

**✅ Completed (below):** Onboarding expo stack (**`auth` + `slides`**), Google & Apple sign-in from auth landing, email login/register sheets, full questionnaire funnel + AsyncStorage answers, finish path (**task create**, wake/sleep **PATCH**, onboarding flags, **`dismissTo`** Today), and **Skip** for returning users.

**❌ Still open in this backlog section:** Facebook/deferred providers; optional **notifications permission** onboarding step — see [`onboarding-backlog-reconciliation.md`](../technical-design/onboarding/onboarding-backlog-reconciliation.md).

Other auth backlog (tokens, logout, etc.) stays in Completed archive unchanged.

#### Facebook social sign-in & other providers
- **Status**: Deferred (not MVP)
- **Description**: Extend backend `SocialAuthSerializer` (`google`/`apple` only today) plus client parity; `CustomUser` / TS types reserve `facebook`.
- **When picked up**: Add verifier on Django mirroring Apple/Google patterns; onboarding auth landing row; error states.
- **Reference**: [`onboarding-backlog-reconciliation.md`](../technical-design/onboarding/onboarding-backlog-reconciliation.md) §2

#### On-device notification permission during onboarding (“reminders” step)
- **Status**: Not Started
- **Description**: Dedicated onboarding screen to request notification permission, persist consent, navigate forward.
- **Reality**: **No `app/(onboarding)/reminders.tsx`**, no **`OnboardingActions.tsx`** — legacy backlog paths obsolete; greenfield route + hook into `(onboarding)/_layout` stack if product wants this.
- **Details**: Prefer `expo-notifications` permission APIs; optionally sync preference field on profile PATCH.
- **Reference**: Same reconciliation doc §2 · §3.2

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
- **Status**: Partially Complete
- **Description**: Dedicated `LoadingIndicator` / `ErrorMessage` primitives remain optional; the app widely uses **`ActivityIndicator`**, inline banners, **`submitting`/busy props** on forms, and Redux flags (`isLoading`, `isLoggingIn`, …).
- **Remaining**: Centralize spinner + toast/error patterns when design system settles.
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
- **Status**: Partially Complete (ongoing polish)
- **Description**: Major palette / **Marple** botanical ramp landed (see dev-log Spring 2026); further harmonize chip colors + task ramps as needed.
- **Files**: `constants/ColorPalette.ts`, `hooks/useColorPalette.ts`
- **Reference**: Dev-log Spring 2026 brand/palette commits

#### Planner Screen Enhancements
- **Status**: Partially Complete
- **Description**: Overlapping groups, timeline polish, wake/sleep planner rows, all-day footer, freetime helpers — iterated heavily; backlog bullets below may still have follow-ups (native reanimated overhaul, richer “between task” messaging).
- **Details**:
  - Add better styling for overlapping tasks
  - Add in-between task messages
  - Reimplement animations to use native animations (react-native-reanimated)
  - Add "overlapping tasks" message between tasks in overlapping task group
- **Files**: 
  - `components/features/timeline/OverlappingTaskCard/OverlappingTaskCard.tsx`
  - `components/features/timeline/TimelineView.tsx`
  - `components/features/timeline/TimelineItem/`

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
- **Status**: Partially Complete
- **Description**: Checkbox / completion paths use **`optimisticUpdateTask`** and related thunk-side patterns in `tasksSlice.ts` for snappy Timeline/Today UX.
- **Remaining**: Extend pattern to fewer-covered mutations; formal rollback UX on hard failures where needed.

### User Experience

#### Bulk Operations UI
- **Status**: ✅ Completed (iterate as needed)
- **Description**: Route/stack-based multi-select with toolbars Today / Planner / Browse; **`selectAllItems` / bulk reschedule** wired from `TodayScreenContent` (+ iOS **`today/select`** route pattern); Redux selection via `useUI` / slices.
- **Files**: `app/(tabs)/today/TodayScreenContent.tsx`, `app/(tabs)/today/select.tsx`, `components/ui/Card/TaskCard/` (among others — planner/browse parity)
- **Completed**: Rolling — core UX shipped **2026-04**

#### Advanced Search
- **Status**: Partially Complete
- **Description**: Browse unified search overlay with **filters / chips**, top vs recent grouping, docked animations — revisit backlog scope (extra sort dimensions, tags, calendar-range filters).
- **Files**: Browse stack — `components/features/browse/`

#### Dark Mode Support
- **Status**: Partially Complete
- **Description**: **`useColorPalette`** / **`useThemeColors`** respect **system** light/dark with shared ramps; polish per-screen edge cases vs “missing dark”.
- **Remaining**: Optional explicit in-app toggle (vs system-follow only).
- **Files**: `constants/ColorPalette.ts`, `hooks/useColorPalette.ts`

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
- **Status**: Partially Complete
- **Description**: **`routineType`** selection + backend CRUD paths ship on **task screen**, **quick-add**, **`TaskCreateModalScreen`/`TaskEditModalScreen`** (`FormDetailSection` repeat menus) — backlog’s **legacy `DatePickerModal`** recurrence row is superseded/outdated naming.
- **Remaining**: Rare edge patterns, clearer discoverability vs date UI, recurrence-from-old DatePicker workflows if any screen still orphaned.
- **Files**: `components/features/tasks/TaskScreen/`, `components/features/tasks/quickAdd/`, `components/features/tasks/TaskScreens/`
- **Reference**: Dev-log recurring CRUD milestone **Feb 2026**; see `RoutineType` in `@/types`

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

#### Onboarding Expo stack (auth landing + questionnaire)
- **Status**: ✅ Completed
- **Description**: Full-screen onboarding group with **`initialRouteName: auth`** and questionnaire **`slides/index`** (`Stack` screens in `(onboarding)/_layout.tsx`); questionnaire also reachable as standalone **`app/onboarding/index.tsx`** (same flow component).
- **Files**: `app/(onboarding)/_layout.tsx`, `app/(onboarding)/auth/_layout.tsx`, `app/(onboarding)/slides/index.tsx`, `app/onboarding/index.tsx`; feature code under `components/features/onboarding/`
- **Details**: Transparent native headers for slides; **`auth`** group hides outer header (`auth/login`, `auth/register`, landing `auth/index`).
- **Reference**: [`onboarding-backlog-reconciliation.md`](../technical-design/onboarding/onboarding-backlog-reconciliation.md) §2
- **Completed**: 05/2026 (see dev-log / git history)

#### Onboarding Google & Apple social sign-in
- **Status**: ✅ Completed
- **Description**: Native Google + Sign in with Apple on **auth landing**; id tokens exchanged via Django **`POST /accounts/auth/social/`**; Redux **`socialAuth`** persists JWTs (`SecureStore`) and hydrates user; completion helper navigates toward questionnaire per product flow (`completeOnboardingSocialSignIn` pattern).
- **Files**: `services/api/auth.ts` (`socialLogin`), `store/slices/auth/authSlice.ts` (`socialAuth`), `backend/dailyflo/apps/accounts/views.py` (`SocialAuthView`), `backend/.../serializers.py` (**`provider`**: `google` \| `apple`); UI: `components/features/onboarding/auth/` (landing rows, hooks)
- **Completed**: 05/2026

#### Onboarding email login & registration (sheets)
- **Status**: ✅ Completed
- **Description**: **`login`** / **`register`** form-sheet routes dispatch **`loginUser`** / **`registerUser`**; on fulfilled thunk (**tokens stored + user resolved**), **`completeOnboardingEmailAuth`** dismisses nested sheet then pushes **`/(onboarding)/slides`**.
- **Files**: `app/(onboarding)/auth/login.tsx`, `app/(onboarding)/auth/register.tsx`, `components/features/onboarding/auth/screens/AuthLoginScreen.tsx`, `AuthRegisterScreen.tsx`, `hooks/completeOnboardingEmailAuth.ts`, `backend/.../serializers.py` (optional **`first_name` / `last_name`** on registration for mobile‑first forms)
- **Completed**: 05/2026

#### Onboarding questionnaire UX + outbound data
- **Status**: ✅ Completed
- **Description**: Multi-step questionnaire (wake/sleep wheels, habit vs task branching, agenda/duration UX, planner preview finish); **`OnboardingQuestionnaireFlow`** owns local state + AsyncStorage persistence of **`ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY`** on finish branch.
- **Files**: `components/features/onboarding/onboarding/` (`pages/OnboardingQuestionnaireFlow.tsx`, constants, utilities)
- **Completed**: 05/2026

#### Onboarding finish → profile, first task, and exit modal
- **Status**: ✅ Completed
- **Description**: **`useCompleteOnboardingAndExit`**: (**1**) map stored answers → **`createTask`** (optional **`updateTask`** if agenda item completed); (**2**) **`patchUserSchedulePreferences`** for wake/sleep HH:MM synced to Django **preferences**; (**3**) device + server **`onboarding_completed`** where applicable; (**4**) **`router.dismissTo('/(tabs)/today')`** so user does not land back on auth after finish.
- **Files**: `components/features/onboarding/auth/hooks/useCompleteOnboardingAndExit.ts`, `onboarding/utils/buildCreateTaskInputFromOnboardingAnswers.ts`, auth slice PATCH thunks (`patchUserSchedulePreferences`, `patchUserOnboardingCompleted`), `utils/onboarding/onboardingUserStatus.ts`
- **Completed**: 05/2026

#### Onboarding questionnaire Skip for returning sessions
- **Status**: ✅ Completed
- **Description**: Returning users (**`useIsReturningOnboardingUser`**: `onboardingIsNewAccount`, **`preferences.onboarding_completed`**, etc.) see Skip in questionnaire header alongside progress UX.
- **Files**: `components/features/onboarding/onboarding/hooks/useIsReturningOnboardingUser.ts`, slides header chrome
- **Completed**: 05/2026

#### Habits feature (tracking, graphs, gamification)
- **Status**: 📋 Planned
- **Description**: Dedicated `Habit` + `HabitCompletion` backend; Habits tab today list + create/edit; Today section; per-habit streaks, heatmap + trend detail; `first_habit_completion` achievement; onboarding habit branch → `POST /habits/` (deprecate habit→task); Phase 4 local reminders.
- **Docs**: [`docs/technical-design/habits/plan/habits-implementation.md`](../technical-design/habits/plan/habits-implementation.md), [`habits-manual-qa-checklist.md`](../technical-design/habits/plan/habits-manual-qa-checklist.md)
- **Files**: `backend/dailyflo/apps/habits/`, `frontend/dailyflo/components/features/habits/`, `app/(tabs)/habits/`, `TodayHabitsSection.tsx`
- **Depends on**: Habits tab navbar shell (shipped on `feat/habits`)

---

## 🔄 In Progress

*Items currently being worked on*

