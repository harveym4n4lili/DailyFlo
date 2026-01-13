feat: implement timeline view for planner screen

Add a comprehensive timeline view that displays tasks positioned at their scheduled times with drag-and-drop functionality to quickly adjust task times.

## Core Components

- **TimelineView**: Main timeline container component that orchestrates time labels and task items
  - Generates time labels on the left side with smart filtering
  - Handles task-aware spacing calculations for tasks with durations
  - Manages drag state and time label updates during drag operations

- **TimelineItem**: Draggable task card component for timeline
  - Calculates its own height based on content (duration or minimal height)
  - Reports height to parent to adjust timeline spacing dynamically
  - Supports hold-and-drag gesture (300ms activation) with haptic feedback
  - Center-aligned for tasks without duration, top-aligned for tasks with duration

- **TimeLabel**: Time marker component for left timeline
  - Displays formatted time (12-hour format with AM/PM)
  - Special styling for task end times and drag preview labels
  - Positioned to align with timeline markers

- **timelineUtils**: Utility functions for time calculations
  - Time string to minutes conversion and vice versa
  - Position-to-time and time-to-position calculations
  - Task height calculations with minimum constraints
  - Time range formatting for display

## Key Features

### Drag Functionality
- Hold-and-drag interaction (prevents accidental drags)
- Real-time time label display on left timeline during drag
- 5-minute interval snapping for precise time selection
- Accurate position-to-time conversion accounting for task-aware spacing

### Smart Time Label Management
- Hides normal time labels within 2 hours before/after task times
- Always shows task-specific start and end time labels
- Filters out labels that fall within task duration ranges
- Displays drag preview label with accent color highlighting

### Dynamic Spacing
- Tasks with duration stretch timeline spacing to fit card height
- Timeline spacing adjusts based on actual measured card heights
- Tasks without duration use minimal height (56px) and center-align
- Base spacing of 0.5 pixels per minute for compact timeline

### Visual Design
- Matches TaskCard styling (padding, border radius, colors)
- Border radius increased to 28px for modern appearance
- Timeline line extends to calculated end time
- Consistent typography and spacing with existing task cards

## Technical Implementation

- Reversed height calculation: TimelineItem determines height, TimelineView adjusts spacing
- Prevents infinite loops with ref-based height tracking and stable callbacks
- Task-aware position calculations account for cumulative offsets from previous tasks
- Efficient time label generation with deduplication and sorting

## Integration

- Integrated into planner screen (`app/(tabs)/planner/index.tsx`)
- Uses Redux for task updates via `updateTask` thunk
- Supports task press callbacks for navigation/actions
- Handles empty state when no tasks have scheduled times

