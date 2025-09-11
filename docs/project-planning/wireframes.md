# Wireframe Planning/UI - UX Document
## App Overview

**App Name:** DailyFlo  
**Tagline/Purpose:** _Clean, intuitive task planner app built with React Native, Expo and Django. Features daily task views, weekly recurring tasks and monthly calendar navigation._

**Target Users:**  
- Students, Freelancers, Busy Parents

**Primary Goals:**  
- [X] Rapid task entry  
- [X] Simple daily/weekly/monthly planning  
- [X] Intuitive mobile-first design  

## Information Architecture
### Site Map / App Structure
High-level navigation structure and content hierarchy:
```
DailyFlo App
├── Onboarding Flow
│   ├── Splash Screen
│   ├── Registration (Social Auth)
│   ├── Permission Requests
│   └── Onboarding Completion
├── Main App (Tab Navigation)
│   ├── Today View (Default)
│   │   ├── Daily Tasks List (Categorized)
│   │   ├── Calendar Navigation (Monthly/Weekly)
│   │   ├── Task Categories (Reading, Lifestyle, Other)
│   │   └── Floating Action Button
│   ├── Planner View
│   │   ├── Monthly Calendar Grid
│   │   ├── Weekly Day Selector
│   │   ├── Selected Day Tasks
│   │   └── Date Navigation
│   ├── Browse View
│   │   ├── Lists Dashboard
│   │   ├── Inbox (Uncategorized Tasks)
│   │   ├── Completed Tasks
│   │   └── List Detail Views
│   └── Settings
│       ├── Account Management
│       ├── App Preferences
│       ├── Integrations
│       └── Support
└── Modal Screens
    ├── Task Creation (Multi-step)
    ├── List Creation
    ├── Date Picker
    ├── Task Detail View
    └── Task Edit Modal
```
### Content Strategy
Key content types, messaging priorities, and content requirements for each screen.
* Minimal Text
* Progressive Disclosure
* Empty States
* Microcopy

## User Flows
### Primary User Journey
#### New User Journey
##### Onboarding Flow:
> Splash Screen -> Registration (Social Auth) -> Permission Requests (Notifications) -> Onboarding Completion -> Create First Task
##### First Task Creation:
> Onboarding Completion -> Create Task Button -> Task Creation Modal (Step 1: Name & Type) -> Task Creation Modal (Step 2: Date, Routine, Reminders, Color) -> Task Creation Modal (Step 3: Subtasks & Notes) -> Create Task -> Today View (With Tasks)
##### Feature Discovery:
> Today View -> Calendar Toggle (Monthly/Weekly) -> Calendar View -> Select Date -> Day View with Tasks
#### Existing User Journey
##### Daily Task Management:
> App Launch -> Today View -> View Categorized Tasks -> Complete Tasks (Tap Circle) -> Navigate Between Days
##### Task Organization:
> Today View -> Browse Tab -> Lists Dashboard -> Select List -> List Detail View -> Manage Tasks in Category
##### Calendar Planning:
> Today View -> Planner Tab -> Monthly/Weekly Calendar -> Select Date -> View/Add Tasks for Selected Date
##### Task Creation (Quick):
> Any Screen -> Floating Action Button -> Create New Modal -> Task Type Selection -> Task Creation Flow
#### Alternative Flows
##### No Tasks Flow:
> Today View (Empty) -> Add Task Prompt -> Floating Action Button -> Task Creation Flow
##### List Management:
> Browse Tab -> Lists Dashboard -> Create List Button -> List Creation Modal -> Link Existing Tasks -> Save List
##### Task Details:
> Any Task Card -> Tap Task -> Task Detail Modal -> View Subtasks -> Edit/Complete/Delete Actions
##### Offline Usage:
> App Launch -> Local Data Load -> Task Management -> Background Sync When Online
##### Error States:
> Failed Task Save -> Error Message -> Retry Option -> Manual Sync

## Individual Wireframes

### Onboarding Screens

#### 1. **Splash Screen**
**Purpose:** App launch screen with branding and loading indicator
**Elements:**
- DailyFlo app name in large, bold typography (heading-1 style)
- Tagline: "Your day, simplified and in flow"
- Page indicators (3 dots) showing onboarding progress
- "Get Started" primary button
- "Already have an account? Sign In" secondary link
**File:** `docs/designs/wireframes/Onboarding/Splash.png`

#### 2. **Registration Screen**
**Purpose:** Social authentication for new users
**Elements:**
- "Let's get you in..." title (heading-2 style)
- Social sign-up buttons: Facebook, Google, Apple
- "Would you like to sign in later? Skip" option
- Progress indicator (step 3 of 3)
**File:** `docs/designs/wireframes/Onboarding/Register.png`

#### 3. **Permission Request Screen**
**Purpose:** Request notification permissions
**Elements:**
- Large bell icon in circular background
- "Reminders, your way" title (heading-2 style)
- "Get alerts for tasks and deadlines - you're always in control" description
- "Allow" primary button
- "Not ready? Skip" secondary link
**File:** `docs/designs/wireframes/Onboarding/Permission Request.png`

#### 4. **Onboarding Completion Screen**
**Purpose:** Welcome completion and first task creation prompt
**Elements:**
- "We're all set!" title (heading-2 style)
- Double checkmark icons in circular background
- "Create your first task and make progress today" description
- "Create Task" primary button
**File:** `docs/designs/wireframes/Onboarding/Onboard Completion.png`

### Core App Screens

#### 5. **Today View (Home Screen)**
**Purpose:** Primary landing screen showing today's tasks with immediate action capabilities
**Elements:**
- Header with user name "Harvey" and menu options
- Search bar with magnifying glass icon
- Quick filters: "Inbox (4)", "Completed", "Sort"
- Task list cards in grid layout:
  - "Home" card: 12 total tasks, 4 due today, 1 overdue
  - "Gym" card: 3 total tasks, 1 due today, 0 overdue
  - "Book Reading" card: 5 total tasks, 2 due today, 1 overdue
  - "Cook" card: 3 total tasks, 1 due today, 0 overdue
- Floating Action Button (FAB) for adding new tasks
- Bottom navigation: Today (active), Planner, Browse, Settings
**File:** `docs/designs/wireframes/Core Screens 1 (Planners)/Home (daily tasks).png`

#### 6. **Today View (Task List)**
**Purpose:** Detailed view of today's tasks with categorization
**Elements:**
- Header with user icon and name "Harvey"
- "Today" title (heading-2 style)
- "1 overdue" section with reschedule option
- "2 due today" section with task cards
- Task cards with color-coded icons:
  - Red: "Read book on human heart" (overdue)
  - Blue: "Read Harry Potter" (due today)
  - Green: "Read Jujutsu Kaisen Manga" (due today)
- FAB for adding new tasks
- Bottom navigation
**File:** `docs/designs/wireframes/Core Screens 1 (Planners)/Home (daily tasks).png`

#### 7. **Planner View (Monthly Calendar)**
**Purpose:** Monthly calendar view for planning and navigation
**Elements:**
- Calendar header with "September 2025" and navigation arrows
- "Monthly" toggle button
- Standard calendar grid with days of week headers
- Selected date highlighted (September 25th)
- "25/09/2025 Tasks (16)" section header
- Categorized task sections:
  - "Reading" category with "Reading Books" task
  - "Lifestyle" category with "Go to the gym" task
  - "Other" category with "Meal Prep Adobo" and "Make Game Audios" tasks
- FAB for adding new tasks
- Bottom navigation with Planner tab active
**File:** `docs/designs/wireframes/Core Screens 1 (Planners)/Planner Screen (Monthly).png`

#### 8. **Planner View (Weekly)**
**Purpose:** Weekly view with day selector and task list
**Elements:**
- Calendar header with "September 2025" and "Weekly" toggle
- Weekly day selector: Mon 10, Tue 11, Wed 12, Thu 13, Fri 14 (selected), Sat 15, Sun 16
- "14/09/2025 Tasks (16)" section header
- Same categorized task structure as monthly view
- FAB for adding new tasks
- Bottom navigation with Planner tab active
**File:** `docs/designs/wireframes/Core Screens 1 (Planners)/Planner Screen (Weekly, Today).png`

### Browse Screens

#### 9. **Lists Dashboard**
**Purpose:** Grid view of task categories/lists for organization
**Elements:**
- Header with user name and menu options
- Search bar
- Quick filters: Inbox, Completed, Sort
- Grid of list cards:
  - "Home" list: 12 total tasks, 4 due today, 1 overdue
  - "Gym" list: 3 total tasks, 1 due today, 0 overdue
  - "Book Reading" list: 5 total tasks, 2 due today, 1 overdue
  - "Cook" list: 3 total tasks, 1 due today, 0 overdue
- Each card shows task counts and due/overdue indicators
- FAB for adding new lists
- Bottom navigation with Browse tab active
**File:** `docs/designs/wireframes/Core Screens 2 (Browse and Settings)/Lists View.png`

#### 10. **List Detail View**
**Purpose:** Detailed view of tasks within a specific list/category
**Elements:**
- Header with back arrow and "Book Reading" title
- Lorem ipsum description text
- "12 total tasks" summary
- "1 overdue" section with reschedule option
- "2 due today" section with task cards
- "All tasks" section with additional tasks
- Task cards with color-coded book icons and completion circles
- FAB for adding new tasks to this list
- Bottom navigation with Planner tab active
**File:** `docs/designs/wireframes/Core Screens 2 (Browse and Settings)/Lists Detail View.png`

#### 11. **Inbox Screen**
**Purpose:** View of uncategorized tasks
**Elements:**
- Header with back arrow and "Inbox" title
- Three task cards:
  - Red: "Read book on human heart" (overdue - Yesterday)
  - Blue: "Read Harry Potter" (due today)
  - Green: "Read Jujutsu Kaisen Manga" (no specific date)
- Each task shows title, description, and due date status
- FAB for adding new tasks
- Bottom navigation
**File:** `docs/designs/wireframes/Core Screens 2 (Browse and Settings)/Inbox Screen (Browse).png`

#### 12. **Completed Tasks Screen**
**Purpose:** View of completed tasks for review
**Elements:**
- Header with back arrow and "Activity" title
- Three completed task cards:
  - Red: "Read book on human heart" (completed 10/09/2025)
  - Blue: "Read Harry Potter" (completed 09/09/2025)
  - Green: "Read Jujutsu Kaisen Manga" (completed 09/09/2025)
- Each card shows completion checkmark and date
- FAB for adding new tasks
- Bottom navigation
**File:** `docs/designs/wireframes/Core Screens 2 (Browse and Settings)/Completed Screen (Browse).png`

#### 13. **Settings Screen**
**Purpose:** User account management and app preferences
**Elements:**
- "Settings" title (heading-2 style)
- Organized sections:
  - **GENERAL**: Account, Notifications & Alerts, Calendar, Sync
  - **PERSONALIZATION**: Theme, App Icon, Navigation
  - **INTEGRATIONS**: Calendar, Reminders
  - **SUPPORT**: Help & Feedback
- "Log out" button in red
- Bottom navigation with Settings tab active
**File:** `docs/designs/wireframes/Core Screens 2 (Browse and Settings)/Settings View 1.png`

### Modal Screens

#### 14. **Create New Modal (Step 1)**
**Purpose:** Initial task/list creation selection
**Elements:**
- "Create New" title with close (X) button
- "Icon and Name?" input field with pencil icon
- "Task or List?" selection:
  - "Task" button (selected, dark background)
  - "List" button (unselected, light background)
- "Continue" primary button
- iOS keyboard visible
**File:** `docs/designs/wireframes/Modal Screens/Create page 1.png`

#### 15. **Task Creation Modal (Step 1)**
**Purpose:** Basic task information input
**Elements:**
- "New Task" title with close (X) button
- "Icon and Name?" input field with pencil icon
- "When?" date picker showing "21/08/2025"
- "Routine Type?" segmented control: Once (selected), Daily, Weekly, Monthly
- "Need reminders?" section
- "Create Task" primary button
- iOS keyboard visible
**File:** `docs/designs/wireframes/Modal Screens/Create Task page 1.png`

#### 16. **Task Creation Modal (Step 2)**
**Purpose:** Advanced task configuration
**Elements:**
- "New Task" title with close (X) button
- Task name input field
- "When?" date picker
- "Routine Type?" segmented control
- "Need reminders?" section with:
  - "Start of task day" (active, with X to remove)
  - "60m before" (inactive, with + to add)
  - "Add Alert" button
- "Task color?" color picker with 6 color swatches
- "Create Task" primary button
**File:** `docs/designs/wireframes/Modal Screens/Create Task page 2.png`

#### 17. **Task Creation Modal (Step 3)**
**Purpose:** Subtasks and notes configuration
**Elements:**
- "New Task" title with close (X) button
- "Any notes?" text area
- "+ Add Subtask" button
- Two subtask entries with checkboxes and remove (X) buttons
- "Add additional notes, phone numbers or links..." placeholder
- "Create Task" primary button
- iOS keyboard visible
**File:** `docs/designs/wireframes/Modal Screens/Create Task page 2.png`

#### 18. **List Creation Modal**
**Purpose:** Create new task list/category
**Elements:**
- "New List" title with close (X) button
- "Icon and Name?" input field with pencil icon
- "Any details?" text area for description
- "Linked Tasks (2)" section showing:
  - "Reading Books" task (blue icon, with X to unlink)
  - "Reading other Books" task (red icon, with X to unlink)
- "Link Task" button to add more tasks
- "Create List" primary button
- iOS keyboard visible
**File:** `docs/designs/wireframes/Modal Screens/Create List page 1.png`

#### 19. **Date Picker Modal**
**Purpose:** Date selection for tasks
**Elements:**
- "Date" title with close (X) button
- Search bar for date search
- Quick selection options:
  - Today (Wed)
  - Tomorrow (Thu)
  - This Weekend (Sun)
  - Next Week (Wed)
  - No Deadline
- Calendar view with "September 2025" header
- Standard monthly grid with September 25th selected
- Navigation arrows for month switching
**File:** `docs/designs/wireframes/Modal Screens/Date Select.png`

#### 20. **Task Detail Modal**
**Purpose:** View and manage individual task details
**Elements:**
- Modal overlay with blurred background
- "Reading books" title with book icon and close (X) button
- "(3) subtasks, today" subtitle
- Three subtask entries with checkboxes:
  - "Read book 1"
  - "Read book 2" 
  - "Read book 3"
- Progress notes for each book with page numbers
- Action buttons: "Delete", "Complete", "Edit Task"
**File:** `docs/designs/wireframes/Modal Screens/Task Modal View.png`

## Visual Design Direction
### Design System References
**Implemented Design System:**
* **Typography**: Satoshi font family with defined text styles (heading-1 through navbar)
* **Color Palette**: Primary palette with 9 shades (primary-50 to primary-900) plus task category colors
* **Icons**: Lucide React icon library for consistent iconography
* **Components**: Comprehensive component library with detailed specifications
* **Reference**: See `docs/technical-design/frontend/design-system.md` for complete specifications

### Key Design Principles
**5 core principles that inform all design decisions:**
1. **Clarity comes first:** Every interface element has a clear purpose and visual hierarchy
2. **Effortless Interaction:** Minimize friction in user flows towards task creation and management
3. **Contextual Awareness:** Surface the right information based on user context and current state
4. **Consistent Rhythm:** Maintain visual and interaction consistency across all screens and components
5. **Purposeful Animation:** Motion guides attention and creates seamless transitions between states

### Visual Design Patterns
**Consistent patterns observed across wireframes:**
* **Color-coded task categories**: Red (overdue), Blue (primary), Green (completed), Yellow/Purple (categories)
* **Card-based layouts**: White cards with rounded corners (12px) and subtle shadows
* **Floating Action Button**: Consistent 56px circular button for primary actions
* **Bottom navigation**: 4-tab navigation with clear active states
* **Modal presentations**: Bottom sheet style with backdrop blur
* **Typography hierarchy**: Clear distinction between headings, body text, and metadata

### Accessibility Requirements
**WCAG AA compliance with specific considerations:**
* **Screen Reader Support:** Full VoiceOver/TalkBack compatibility with semantic labels and proper structure
* **Touch Targets:** Minimum 44px touch targets for all interactive elements
* **Color Contrast:** All text meets 4.5:1 contrast ratio requirements
* **Motion Sensitivity:** Respect user preferences for reduced motion and provide alternatives
* **Keyboard Navigation:** Full keyboard accessibility for all interactive elements

## Responsive Design
### Breakpoint Strategy
**Mobile-first approach with specific breakpoints:**
* **Small Mobile**: 320px (iPhone SE) - Single column, compact spacing
* **Standard Mobile**: 375px (iPhone 12/13/14) - Primary design target
* **Large Mobile**: 414px (iPhone 14 Plus) - Optimized spacing and typography
* **Tablet**: 768px+ - Multi-column layouts, enhanced navigation
* **Desktop**: 1024px+ - Sidebar navigation, expanded task views

### Progressive Enhancement
**How the experience adapts across devices and screen sizes:**
* **Core Experience:** Essential task management functionality works across all devices
* **Mobile Optimization:** Touch-first design with 44px minimum touch targets
* **Tablet Enhancement:** Multi-column task lists, enhanced calendar views
* **Desktop Features:** Keyboard shortcuts, drag-and-drop, expanded task details
* **Input Optimization:** Touch-first design scales up to support keyboard and mouse interactions
* **Performance Scaling:** Animations and transitions adapt to device capabilities

## Performance & Technical Considerations
### Loading States
**Content loading patterns based on wireframe analysis:**
* **Initial Launch:** Splash screen with DailyFlo branding and progress indicator
* **Data Loading:** Skeleton screens that mirror final content structure (task cards, calendar grid)
* **Task Lists:** Progressive loading with shimmer effects for task cards
* **Calendar Views:** Smooth transitions between monthly/weekly views
* **Modal Loading:** Subtle loading indicators for task creation and list management

### Error Handling
**Error message patterns and recovery flows:**
* **Network Errors:** Clear offline indicators with retry options
* **Task Creation Failures:** Inline validation with specific error messages
* **Sync Issues:** Background sync status with manual retry options
* **Permission Denied:** Graceful degradation with re-request options

### Technical Constraints
**Implementation considerations based on wireframe designs:**
* **Initial Launch:** Branded splash screen with progress indicator for first-time setup
* **Data Loading:** Skeleton screens that mirror final content structure
* **Image Loading:** Progressive loading with blur-to-sharp transitions for task icons
* **Offline Indicators:** Clear visual feedback when operating in offline mode
* **Empty States:** Engaging illustrations and helpful onboarding prompts
* **Modal Performance:** Smooth bottom sheet animations with backdrop blur
* **List Performance:** Virtualized scrolling for large task lists
* **Calendar Performance:** Efficient rendering of monthly/weekly calendar grids

### Animation Guidelines
**Motion design based on wireframe interactions:**
* **Task Card Interactions:** Subtle scale and shadow changes on press
* **Modal Transitions:** Slide up from bottom with fade backdrop
* **Navigation Transitions:** Smooth tab switching with active state indicators
* **List Updates:** Fade in/out with slide transitions for task additions/removals
* **Calendar Navigation:** Smooth month/week transitions with date highlighting

*Last updated: 10/09/2025*
*Wireframes completed and documented*