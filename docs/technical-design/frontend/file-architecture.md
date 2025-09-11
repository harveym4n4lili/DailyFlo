# Frontend File Architecture Design - Frontend Design Document
## Project Structure
```
/
├── app/                   # Expo Router file-based routing
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── services/              # API and external service integrations
├── store/                 # State management
├── utils/                 # Utility functions and helpers
├── constants/             # App constants and configuration
├── types/                 # JavaScript type definitions and PropTypes
└── assets/                # Images, fonts, and static assets
```

## File-Based Routing Structure ```(/app)```
### Core Routes
```
app/
├── (onboarding)/
│   ├── _layout.jsx              # Onboarding layout
│   ├── splash.jsx               # Splash screen
│   ├── register.jsx             # Social authentication
│   ├── permissions.jsx          # Permission requests
│   └── completion.jsx           # Onboarding completion
├── (tabs)/
│   ├── _layout.jsx              # Tab navigation layout
│   ├── today/
│   │   ├── _layout.jsx          # Today screen layout
│   │   ├── index.jsx            # Today view (home dashboard)
│   │   └── tasks.jsx            # Today's task list
│   ├── planner/
│   │   ├── _layout.jsx          # Planner screen layout
│   │   ├── index.jsx            # Monthly calendar view
│   │   ├── weekly.jsx           # Weekly view
│   │   └── day/[date].jsx       # Specific day view
│   ├── browse/
│   │   ├── _layout.jsx          # Browse screen layout
│   │   ├── index.jsx            # Lists dashboard
│   │   ├── inbox.jsx            # Inbox (uncategorized tasks)
│   │   ├── completed.jsx        # Completed tasks
│   │   └── list/[id].jsx        # List detail view
│   └── settings/
│       ├── _layout.jsx          # Settings screen layout
│       ├── index.jsx            # Settings main
│       ├── account.jsx          # Account management
│       ├── preferences.jsx      # App preferences
│       └── integrations.jsx     # External integrations
└── (modals)/
    ├── _layout.jsx              # Modal layout
    ├── create-task/
    │   ├── _layout.jsx          # Task creation layout
    │   ├── index.jsx            # Step 1: Basic info
    │   ├── details.jsx          # Step 2: Date, routine, reminders
    │   └── subtasks.jsx         # Step 3: Subtasks and notes
    ├── create-list/
    │   └── index.jsx            # List creation modal
    ├── date-picker/
    │   └── index.jsx            # Date selection modal
    └── task-detail/
        └── [id].jsx             # Task detail modal
```

### Route Organization
* **Dynamic routes**: `[id].jsx` for list and task detail views, `[date].jsx` for specific dates
* **Layout files**: `_layout.jsx` for nested layouts with proper navigation structure
* **Loading states**: `loading.jsx` for route-level loading with skeleton screens
* **Error boundaries**: `error.jsx` for error handling with retry options

## Component Architecture (/components)
### Folder Structure
```
components/
├── ui/                           # Base UI components
│   ├── Button/
│   │   ├── Button.jsx           # Primary, secondary, ghost variants
│   │   ├── FloatingActionButton.jsx  # FAB component
│   │   └── index.js
│   ├── Input/
│   │   ├── TextInput.jsx        # Text input with validation
│   │   ├── SearchInput.jsx      # Search bar component
│   │   ├── DateInput.jsx        # Date picker input
│   │   └── index.js
│   ├── Card/
│   │   ├── TaskCard.jsx         # Individual task card
│   │   ├── ListCard.jsx         # List/category card
│   │   ├── ModalCard.jsx        # Modal container
│   │   └── index.js
│   ├── Icon/
│   │   ├── TaskIcon.jsx         # Color-coded task icons
│   │   ├── CategoryIcon.jsx     # Category-specific icons
│   │   └── index.js
│   ├── SegmentedControl/
│   │   ├── RoutineSelector.jsx  # Once/Daily/Weekly/Monthly
│   │   └── index.js
│   ├── ColorPicker/
│   │   ├── ColorSwatches.jsx    # Color selection component
│   │   └── index.js
│   └── index.js
├── navigation/
│   ├── BottomNavigation/
│   │   ├── TabBar.jsx           # 4-tab bottom navigation
│   │   ├── TabIcon.jsx          # Individual tab icons
│   │   └── index.js
│   ├── Header/
│   │   ├── ScreenHeader.jsx     # Standard screen header
│   │   ├── ModalHeader.jsx      # Modal header with close
│   │   └── index.js
│   └── index.js
├── features/
│   ├── tasks/
│   │   ├── TaskList/
│   │   │   ├── TaskList.jsx     # Main task list component
│   │   │   ├── TaskCategory.jsx # Collapsible category section
│   │   │   ├── TaskItem.jsx     # Individual task item
│   │   │   └── index.js
│   │   ├── TaskCreation/
│   │   │   ├── TaskCreationModal.jsx  # Multi-step modal
│   │   │   ├── TaskBasicInfo.jsx      # Step 1: Name and type
│   │   │   ├── TaskDetails.jsx        # Step 2: Date, routine, reminders
│   │   │   ├── TaskSubtasks.jsx       # Step 3: Subtasks and notes
│   │   │   └── index.js
│   │   ├── TaskDetail/
│   │   │   ├── TaskDetailModal.jsx    # Task detail view
│   │   │   ├── SubtaskList.jsx        # Subtask management
│   │   │   ├── TaskActions.jsx        # Edit/Complete/Delete actions
│   │   │   └── index.js
│   │   └── index.js
│   ├── lists/
│   │   ├── ListDashboard/
│   │   │   ├── ListGrid.jsx           # Grid of list cards
│   │   │   ├── ListCard.jsx           # Individual list card
│   │   │   └── index.js
│   │   ├── ListDetail/
│   │   │   ├── ListDetailView.jsx     # List detail screen
│   │   │   ├── ListTasks.jsx          # Tasks within list
│   │   │   └── index.js
│   │   ├── ListCreation/
│   │   │   ├── ListCreationModal.jsx  # Create new list
│   │   │   ├── TaskLinking.jsx        # Link existing tasks
│   │   │   └── index.js
│   │   └── index.js
│   ├── calendar/
│   │   ├── CalendarView/
│   │   │   ├── MonthlyCalendar.jsx    # Monthly grid view
│   │   │   ├── WeeklySelector.jsx     # Weekly day selector
│   │   │   ├── CalendarHeader.jsx     # Month/year navigation
│   │   │   └── index.js
│   │   ├── DatePicker/
│   │   │   ├── DatePickerModal.jsx    # Date selection modal
│   │   │   ├── QuickDateOptions.jsx   # Today/Tomorrow/etc
│   │   │   └── index.js
│   │   └── index.js
│   ├── onboarding/
│   │   ├── SplashScreen.jsx           # App launch screen
│   │   ├── RegistrationScreen.jsx     # Social authentication
│   │   ├── PermissionScreen.jsx       # Notification permissions
│   │   ├── CompletionScreen.jsx       # Onboarding completion
│   │   └── index.js
│   └── index.js
├── forms/
│   ├── TaskForm/
│   │   ├── TaskForm.jsx               # Main task form
│   │   ├── TaskValidation.jsx         # Form validation
│   │   └── index.js
│   ├── ListForm/
│   │   ├── ListForm.jsx               # List creation form
│   │   └── index.js
│   └── index.js
├── layout/
│   ├── ScreenLayout/
│   │   ├── ScreenContainer.jsx        # Standard screen wrapper
│   │   ├── SafeAreaWrapper.jsx        # Safe area handling
│   │   └── index.js
│   ├── ModalLayout/
│   │   ├── ModalContainer.jsx         # Modal wrapper
│   │   ├── ModalBackdrop.jsx          # Backdrop with blur
│   │   └── index.js
│   └── index.js
└── index.js
```

### Component Organization Principles
* **One component per file**: Each component has its own file with co-located styles
* **Feature-based grouping**: Components grouped by feature (tasks, lists, calendar, etc.)
* **Index files**: Clean imports with barrel exports
* **Composition patterns**: Small, reusable components that compose into larger features
* **Props validation**: PropTypes or JSDoc comments for component props
* **Co-located tests**: Test files alongside component files

## State Management ```(/store)```
### Store Structure
```
store/
├── index.js                    # Store configuration and setup
├── middleware/
│   ├── auth.js                # Authentication middleware
│   ├── sync.js                # Offline sync middleware
│   └── index.js
├── slices/
│   ├── auth/
│   │   ├── authSlice.js       # User authentication state
│   │   └── index.js
│   ├── tasks/
│   │   ├── tasksSlice.js      # Task management state
│   │   ├── taskFilters.js     # Task filtering and search
│   │   └── index.js
│   ├── lists/
│   │   ├── listsSlice.js      # List/category management
│   │   └── index.js
│   ├── calendar/
│   │   ├── calendarSlice.js   # Calendar view state
│   │   └── index.js
│   ├── ui/
│   │   ├── uiSlice.js         # UI state (modals, loading, etc.)
│   │   ├── themeSlice.js      # Theme and preferences
│   │   └── index.js
│   └── index.js
└── types/
    ├── store.js               # Store type definitions
    └── index.js
```

### State Slices
**Authentication State (`authSlice.js`):**
- User profile information
- Authentication tokens
- Login/logout status
- Social auth providers

**Tasks State (`tasksSlice.js`):**
- All tasks (by date, category, status)
- Task creation/editing state
- Task completion status
- Subtask management
- Task filtering and search

**Lists State (`listsSlice.js`):**
- Task lists/categories
- List creation and management
- Task-to-list associations
- List ordering and preferences

**Calendar State (`calendarSlice.js`):**
- Selected date
- Calendar view mode (monthly/weekly)
- Date navigation state
- Calendar-specific task filtering

**UI State (`uiSlice.js`):**
- Modal visibility and state
- Loading states
- Error messages
- Navigation state
- Keyboard visibility

### State Patterns
* **Local vs Global State**: 
  - Global: User data, tasks, lists, authentication
  - Local: Form inputs, temporary UI state, component-specific data
* **Optimistic Updates**: Task completion, list creation, immediate UI feedback
* **Cache Management**: Task data caching with TTL, offline data persistence
* **Offline State Handling**: Queue for offline actions, sync status tracking

## Services Layer ```(/services)```
### API Integration
```
services/
├── api/
│   ├── client.js              # HTTP client configuration
│   ├── auth.js                # Authentication API calls
│   ├── tasks.js               # Task CRUD operations
│   ├── lists.js               # List management API
│   ├── calendar.js            # Calendar data API
│   └── index.js
├── auth/
│   ├── AuthService.js         # Authentication service
│   ├── TokenManager.js        # JWT token management
│   ├── SocialAuth.js          # Social authentication
│   └── index.js
├── storage/
│   ├── AsyncStorage.js        # Local storage wrapper
│   ├── SecureStorage.js       # Secure token storage
│   └── index.js
├── sync/
│   ├── OfflineSync.js         # Offline data sync
│   ├── ConflictResolver.js    # Data conflict resolution
│   └── index.js
└── index.js
```

### API Services
**Authentication Service (`AuthService.js`):**
- User registration and login
- Social authentication (Facebook, Google, Apple)
- Token refresh and management
- Logout and session cleanup

**Tasks Service (`tasks.js`):**
- Create, read, update, delete tasks
- Task completion and status updates
- Subtask management
- Task filtering and search
- Bulk operations

**Lists Service (`lists.js`):**
- List creation and management
- Task-to-list associations
- List ordering and preferences
- List deletion and cleanup

**Calendar Service (`calendar.js`):**
- Date-based task retrieval
- Calendar view data
- Date navigation and filtering
- Recurring task generation

### External Services
**Push Notifications:**
- Task reminder notifications
- Due date alerts
- Permission management
- Notification scheduling

**Background Sync:**
- Offline data synchronization
- Conflict resolution
- Network status monitoring
- Retry mechanisms

**Analytics (Future):**
- User behavior tracking
- Task completion analytics
- Performance monitoring

## Custom Hooks ```(/hooks)```
### Hook Categories
```
hooks/
├── data/
│   ├── useTasks.js            # Task data fetching and management
│   ├── useLists.js            # List data operations
│   ├── useCalendar.js         # Calendar data and navigation
│   ├── useAuth.js             # Authentication state and actions
│   └── index.js
├── forms/
│   ├── useTaskForm.js         # Task creation/editing form
│   ├── useListForm.js         # List creation form
│   ├── useFormValidation.js   # Form validation logic
│   └── index.js
├── ui/
│   ├── useModal.js            # Modal state management
│   ├── useKeyboard.js         # Keyboard visibility handling
│   ├── useTheme.js            # Theme switching and preferences
│   ├── useAnimation.js        # Animation state management
│   └── index.js
├── navigation/
│   ├── useNavigation.js       # Navigation helpers
│   ├── useRouteParams.js      # Route parameter handling
│   └── index.js
├── device/
│   ├── useNotifications.js    # Push notification management
│   ├── useNetworkStatus.js    # Network connectivity
│   ├── useDeviceInfo.js       # Device information
│   └── index.js
└── index.js
```

### Specific Hooks
**Data Hooks:**
- `useTasks()`: Fetch, create, update, delete tasks with caching
- `useLists()`: List management with task associations
- `useCalendar()`: Calendar navigation and date-based task filtering
- `useAuth()`: Authentication state, login/logout, token management

**Form Hooks:**
- `useTaskForm()`: Multi-step task creation form state
- `useListForm()`: List creation with task linking
- `useFormValidation()`: Reusable validation logic

**UI Hooks:**
- `useModal()`: Modal visibility and state management
- `useKeyboard()`: Keyboard visibility and height tracking
- `useTheme()`: Theme switching and dark mode support
- `useAnimation()`: Animation state and transitions

**Device Hooks:**
- `useNotifications()`: Push notification permissions and scheduling
- `useNetworkStatus()`: Network connectivity monitoring
- `useDeviceInfo()`: Device capabilities and platform detection

### Hook Organization
* **Single Responsibility**: Each hook handles one specific concern
* **Reusability**: Hooks are composable and reusable across components
* **Performance**: Optimized with proper dependency arrays and memoization
* **Testing**: Each hook is unit testable with mock implementations

## Type Definitions ```(/types)```
### Type Organization
```
types/
├── api/
│   ├── auth.js                # Authentication API schemas
│   ├── tasks.js               # Task API response schemas
│   ├── lists.js               # List API response schemas
│   ├── calendar.js            # Calendar API schemas
│   └── index.js
├── components/
│   ├── Button.js              # Button component PropTypes
│   ├── TaskCard.js            # Task card component PropTypes
│   ├── Modal.js               # Modal component PropTypes
│   ├── Navigation.js          # Navigation component PropTypes
│   └── index.js
├── navigation/
│   ├── routes.js              # Route parameter schemas
│   ├── navigation.js          # Navigation schemas
│   └── index.js
├── store/
│   ├── auth.js                # Authentication state schemas
│   ├── tasks.js               # Task state schemas
│   ├── lists.js               # List state schemas
│   ├── ui.js                  # UI state schemas
│   └── index.js
├── common/
│   ├── Task.js                # Task entity schema
│   ├── List.js                # List entity schema
│   ├── User.js                # User entity schema
│   ├── Calendar.js            # Calendar schemas
│   └── index.js
└── index.js
```

### Core Types
**Task Entity (`Task.js`):**
```javascript
// Task entity structure using PropTypes
const Task = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  dueDate: PropTypes.instanceOf(Date),
  isCompleted: PropTypes.bool.isRequired,
  priority: PropTypes.oneOf([1, 2, 3, 4, 5]).isRequired,
  color: PropTypes.string.isRequired,
  listId: PropTypes.string,
  subtasks: PropTypes.arrayOf(PropTypes.object).isRequired,
  reminders: PropTypes.arrayOf(PropTypes.object).isRequired,
  routineType: PropTypes.oneOf(['once', 'daily', 'weekly', 'monthly']).isRequired,
  createdAt: PropTypes.instanceOf(Date).isRequired,
  updatedAt: PropTypes.instanceOf(Date).isRequired,
  completedAt: PropTypes.instanceOf(Date)
};
```

**List Entity (`List.js`):**
```javascript
// List entity structure using PropTypes
const List = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  color: PropTypes.string.isRequired,
  taskIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  createdAt: PropTypes.instanceOf(Date).isRequired,
  updatedAt: PropTypes.instanceOf(Date).isRequired
};
```

**User Entity (`User.js`):**
```javascript
// User entity structure using PropTypes
const User = {
  id: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  avatar: PropTypes.string,
  preferences: PropTypes.object.isRequired,
  createdAt: PropTypes.instanceOf(Date).isRequired,
  updatedAt: PropTypes.instanceOf(Date).isRequired
};
```

### Component PropTypes
**TaskCard Props:**
```javascript
// TaskCard component PropTypes
const TaskCardProps = {
  task: PropTypes.object.isRequired,
  onPress: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  showCategory: PropTypes.bool,
  compact: PropTypes.bool
};
```

**Modal Props:**
```javascript
// Modal component PropTypes
const ModalProps = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  animationType: PropTypes.oneOf(['slide', 'fade']),
  presentationStyle: PropTypes.oneOf(['pageSheet', 'formSheet'])
};
```

### Navigation Schemas
**Route Parameters:**
```javascript
// Navigation parameter schemas
const RootStackParamList = {
  '(tabs)': undefined,
  '(onboarding)': undefined,
  '(modals)': undefined
};

const TabParamList = {
  today: undefined,
  planner: undefined,
  browse: undefined,
  settings: undefined
};

const ModalParamList = {
  'create-task': undefined,
  'create-list': undefined,
  'date-picker': { onSelect: PropTypes.func },
  'task-detail': { taskId: PropTypes.string }
};
```

### JavaScript Standards
* **PropTypes**: Use PropTypes for component prop validation and documentation
* **JSDoc Comments**: Use JSDoc for function and component documentation
* **ESLint**: Configure ESLint for code quality and consistency
* **Consistent Naming**: Use camelCase for variables and functions, PascalCase for components
* **Error Handling**: Implement proper error boundaries and try-catch blocks
* **Code Organization**: Use barrel exports and consistent file structure

## Asset Management ```(/assets)```
### Asset Organization
```
assets/
├── images/
│   ├── icons/
│   │   ├── task-icons/         # Color-coded task category icons
│   │   ├── navigation/         # Tab bar icons
│   │   ├── actions/            # Action icons (edit, delete, etc.)
│   │   └── status/             # Status icons (completed, overdue)
│   ├── illustrations/
│   │   ├── onboarding/         # Onboarding illustrations
│   │   ├── empty-states/       # Empty state illustrations
│   │   └── errors/             # Error state illustrations
│   └── backgrounds/
│       ├── gradients/          # Background gradients
│       └── patterns/           # Subtle background patterns
├── fonts/
│   ├── Satoshi/                # Primary font family
│   │   ├── Satoshi-Light.otf
│   │   ├── Satoshi-Regular.otf
│   │   ├── Satoshi-Medium.otf
│   │   ├── Satoshi-SemiBold.otf
│   │   └── Satoshi-Bold.otf
│   └── fallbacks/              # System font fallbacks
├── animations/
│   ├── lottie/                 # Lottie animation files
│   ├── transitions/            # Custom transition animations
│   └── micro-interactions/     # Small interaction animations
└── data/
    ├── mock-data/              # Mock data for development
    └── fixtures/               # Test fixtures
```

### Asset Optimization
* **Image Compression**: WebP format for better compression, PNG for icons with transparency
* **Icon Strategy**: SVG for scalable icons, PNG for complex illustrations
* **Font Loading**: Preload critical fonts, lazy load secondary fonts
* **Animation Files**: Lottie for complex animations, CSS/React Native for simple transitions

## Configuration Files
### Environment Configuration
```
config/
├── environments/
│   ├── development.js          # Development environment config
│   ├── staging.js              # Staging environment config
│   ├── production.js           # Production environment config
│   └── index.js
├── api/
│   ├── endpoints.js            # API endpoint configuration
│   ├── headers.js              # Default headers configuration
│   └── index.js
└── features/
    ├── flags.js                # Feature flags configuration
    └── index.js
```

### Tool Configuration
```
Configuration Files:
├── .eslintrc.js                # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── metro.config.js             # Metro bundler configuration
├── babel.config.js             # Babel configuration
├── jest.config.js              # Jest testing configuration
├── app.json                    # Expo configuration
├── package.json                # Dependencies and scripts
└── .env.example                # Environment variables template
```

### Build Configuration
* **Development**: Hot reloading, debug tools, mock data
* **Staging**: Production-like environment with test data
* **Production**: Optimized builds, error tracking, analytics
* **Feature Flags**: Toggle features without code deployment
* **API Management**: Environment-specific API endpoints and configurations

*Last updated: 10/09/2025*