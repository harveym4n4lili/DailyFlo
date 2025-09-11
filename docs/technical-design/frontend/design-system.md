# Frontend Full System Design - UX Design Document
## Design Tokens
### Colors
#### Primary palette (based on Figma variables)
```
    // Token naming follows Figma variable structure
    primary: {
    50: '#FFFFFF',   // pure white - light backgrounds, modal surfaces
    100: '#F5F7FA',  // subtle off-white - page backgrounds, settings panels
    200: '#ECF0F5',  // light neutral - secondary backgrounds
    300: '#959BA5',  // medium neutral - secondary buttons, inactive elements
    400: '#374151',  // dark neutral - secondary text, labels
    500: '#111827',  // base brand color - primary text, headings
    600: '#0F172A',  // darker brand - primary buttons, active states
    700: '#0C1320',  // deep neutral - navigation headers
    800: '#111827',  // strong base for text in dark mode
    900: '#0B111C'   // near-black - dark mode backgrounds, overlays
    }
```
#### Status colors (success, error, warning, info)
```
    semantic: {
        success: '#10B981',  // green-500 - completed tasks, success states
        warning: '#F59E0B',  // amber-500 - warning states
        error: '#EF4444',    // red-500 - overdue tasks, error states
        info: '#3B82F6'      // blue-500 - primary tasks, active states
    }
```

#### Task category colors
```
    taskColors: {
        red: '#EF4444',      // red-500 - overdue tasks, urgent items
        blue: '#3B82F6',     // blue-500 - primary tasks, reading category
        green: '#10B981',    // green-500 - completed tasks, lifestyle category
        yellow: '#F59E0B',   // amber-500 - secondary tasks, meal prep
        purple: '#8B5CF6',   // violet-500 - lifestyle category, gym tasks
        teal: '#14B8A6',     // teal-500 - additional task categories
        orange: '#F97316',   // orange-500 - task color picker option
    }
```
#### Dark/light theme specifications
```
    themes: {
        light: {
            background: {
            primary: 'neutral.0',
            secondary: 'neutral.50',
            surface: 'neutral.0'
            },
            text: {
            primary: 'neutral.900',
            secondary: 'neutral.500'
            }
        },
        dark: {
            background: {
            primary: 'neutral.900',
            secondary: 'neutral.800', 
            surface: 'neutral.700'
            },
            text: {
            primary: 'neutral.0',
            secondary: 'neutral.300'
            }
        }
    }
```
### Typography
#### Font families and weights
```
    fontFamily: {
        primary: ['Satoshi', 'system-ui', 'sans-serif'], // Satoshi as main font
        fallback: {
            ios: ['SF Pro Display', '-apple-system'],      // iOS fallback
            android: ['Roboto', 'sans-serif']              // Android fallback
        }
    }

    fontWeight: {
        // Using Satoshi's actual font weights
        light: '300',      // Satoshi Light
        regular: '400',    // Satoshi Regular  
        medium: '500',     // Satoshi Medium
        semibold: '600',   // Satoshi SemiBold
        bold: '700'        // Satoshi Bold
        // black: '900'    // Satoshi Black (if available)
    }
```
#### Type scales (headings, body, captions)
```
    textStyles: {
        'heading-1': {
            fontSize: '36px',
            lineHeight: '40px',
            fontWeight: 'bold'
        },
        'heading-2': {
            fontSize: '24px', 
            lineHeight: '21px',
            fontWeight: 'bold'
        },
        'heading-3': {
            fontSize: '18px',
            lineHeight: 'auto',
            fontWeight: 'semibold'
        },
        'heading-4': {
            fontSize: '16px',
            lineHeight: 'auto',
            fontWeight: 'semibold'
        },
        'body-large': {
            fontSize: '14px',
            lineHeight: '18px',
            fontWeight: 'regular'
        },
        'body-medium': {
            fontSize: '10px',
            lineHeight: '14px',
            fontWeight: 'regular'
        },
        'body-small': {
            fontSize: '8px',
            lineHeight: '12px',
            fontWeight: 'regular'
        },
        'button-primary': {
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 'medium'
        },
        'button-secondary': {
            fontSize: '14px',
            lineHeight: '18px',
            fontWeight: 'medium'
        },
        'button-text': {
            fontSize: '10px',
            lineHeight: 'auto',
            fontWeight: 'medium'
        },
        'navbar': {
            fontSize: '10px',
            lineHeight: 'auto',
            fontWeight: 'medium'
        }
    }
```
#### Line heights and letter spacing
```
    lineHeight: {
        tight: '1.25',   // headings
        normal: '1.5',   // body text
        relaxed: '1.75'  // long form content
    }

    letterSpacing: {
        tight: '-0.025em',  // large headings
        normal: '0',        // body
        wide: '0.025em'     // small text, caps
    }
```
#### Responsive typography rules
```
    // Scale factors for different screen sizes
        typography: {
        mobile: { scale: 1 },
        tablet: { scale: 1.125 },
        desktop: { scale: 1.25 }
    }
```
### Spacing & Layout
#### Spacing scale (4px, 8px, 16px, etc.)
```
    space: {
        0: '0px',
        1: '4px',    // xs
        2: '8px',    // sm  
        3: '12px',
        4: '16px',   // md - base unit
        5: '20px',
        6: '24px',   // lg
        8: '32px',   // xl
        10: '40px',
        12: '48px',  // 2xl
        16: '64px',  // 3xl
        20: '80px',
        24: '96px'   // 4xl
    }
```
#### Grid system specifications
```
    breakpoints: {
        sm: '380px',   // small phones
        md: '768px',   // tablets
        lg: '1024px',  // desktop
        xl: '1280px'   // large desktop
    }

    container: {
        padding: 'space.4',  // 16px default
        maxWidth: {
            sm: '100%',
            md: '768px',
            lg: '1024px'
        }
    }
```
#### Container max-widths
```
    maxWidth: {
        content: '65ch',     // optimal reading width
        container: '1200px', // main content container
        screen: '100vw'      // full screen
    }
```
### Shadows & Elevation
#### Shadow tokens for different elevation levels
```
    shadows: {
        xs: {
            ios: {
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1
            },
            android: { elevation: 1 }
        },
        sm: {
            ios: {
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2
            },
            android: { elevation: 2 }
        },
        md: {
            ios: {
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 6
            },
            android: { elevation: 4 }
        },
        lg: {
            ios: {
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 15
            },
            android: { elevation: 8 }
        }
    }
```

## Component Library

### Core UI Components

#### Button Components
```
Button Variants:
- Primary: Dark background (#111827), white text, rounded corners (12px)
- Secondary: Light grey background (#F5F7FA), dark text, rounded corners (12px)
- Ghost: Transparent background, dark text, minimal border
- Floating Action Button (FAB): Large circular button (56px), dark background, white plus icon

Button Sizes:
- Small: height 32px, padding 8px 12px
- Medium: height 40px, padding 12px 16px  
- Large: height 48px, padding 16px 24px
- FAB: 56px diameter
```

#### Input Components
```
Input Field:
- Background: White (#FFFFFF)
- Border: Light grey (#E5E7EB) when inactive, primary color when focused
- Border radius: 8px
- Padding: 12px 16px
- Placeholder text: Light grey (#9CA3AF)
- Font: Satoshi Regular, 16px

Search Bar:
- Background: Light grey (#F5F7FA)
- Border radius: 12px
- Padding: 12px 16px
- Magnifying glass icon on left
- Placeholder: "Search something..."
```

#### Card Components
```
Task Card:
- Background: White (#FFFFFF)
- Border radius: 12px
- Padding: 16px
- Margin: 8px 0
- Layout: Horizontal with icon, content, and action area

List Card:
- Background: White (#FFFFFF)
- Border radius: 12px
- Padding: 20px
- Grid layout for dashboard view
```

### Navigation Components

#### Bottom Navigation Bar
```
Specifications:
- Height: 80px (including safe area)
- Background: White (#FFFFFF)
- Border top: 1px solid #E5E7EB
- Tab count: 4 (Today, Planner, Browse, Settings)
- Active state: Dark icon and text
- Inactive state: Light grey icon and text
- Icon size: 24px
- Text size: 10px, Satoshi Medium (navbar text style)

Tab Icons:
- Today: Calendar with checkmark
- Planner: Calendar grid
- Browse: Folder
- Settings: Gear
```

#### Header Navigation
```
Header Bar:
- Height: 60px
- Background: White (#FFFFFF)
- Padding: 16px
- Title: Satoshi Bold, 20px (heading-4 style)
- Back button: 24px arrow icon
- Action buttons: 24px icons (ellipsis, close, etc.)
```

### Task Management Components

#### Task Card
```
Layout Structure:
- Left: Color-coded icon (40px square, rounded corners)
- Center: Task content (title, description, metadata)
- Right: Completion indicator (24px circle)

Task Title:
- Font: Satoshi Semibold, 16px (heading-4 style)
- Color: #111827 (primary text)

Task Description:
- Font: Satoshi Regular, 14px (body-large style)
- Color: #6B7280 (secondary text)
- Truncated with "See More" link

Task Metadata:
- Font: Satoshi Regular, 10px (body-medium style)
- Color: #9CA3AF
- Icons: Calendar, clock, etc.

Completion Indicator:
- Unchecked: Light grey circle outline (#D1D5DB)
- Checked: Green circle with white checkmark (#10B981)
```

#### Task Category Section
```
Category Header:
- Font: Satoshi Semibold, 16px (heading-4 style)
- Color: #374151
- Chevron icon: 16px, right-aligned
- Collapsible functionality

Category Content:
- Task cards within category
- Consistent spacing between cards
- Category-specific color coding
```

#### Floating Action Button (FAB)
```
Specifications:
- Size: 56px diameter
- Background: #111827 (primary dark)
- Icon: White plus (+) symbol, 24px
- Position: Bottom right, 16px from edges
- Shadow: lg elevation
- Z-index: 1000 (above other content)
```

### Modal Components

#### Modal Overlay
```
Backdrop:
- Background: rgba(0, 0, 0, 0.5)
- Blur effect: 4px
- Full screen coverage
- Z-index: 999

Modal Container:
- Background: White (#FFFFFF)
- Border radius: 16px (top corners)
- Max height: 80% of screen
- Position: Bottom sheet style
- Padding: 24px
```

#### Task Creation Modal
```
Header:
- Title: "New Task" or "Create New"
- Close button: X icon, top right
- Height: 60px

Content Sections:
- Task name input with icon
- Date picker with calendar icon
- Routine type segmented control
- Reminder settings
- Color picker
- Notes text area

Action Button:
- Full width, dark background
- Text: "Create Task" (button-primary style: 14px/20px, medium weight)
- Height: 48px
- Border radius: 8px
```

#### Date Picker Modal
```
Quick Selection Options:
- Today, Tomorrow, This Weekend, Next Week, No Deadline
- Each with appropriate icon and day indicator
- Font: Satoshi Medium, 16px (heading-4 style)

Calendar View:
- Standard monthly grid
- Selected date: Dark circle with white text
- Navigation arrows for month switching
- Day headers: Mon, Tue, Wed, etc.
```

### Form Components

#### Segmented Control
```
Routine Type Selector:
- Options: Once, Daily, Weekly, Monthly
- Background: Light grey (#F5F7FA)
- Border radius: 8px
- Selected: Dark background (#111827), white text
- Unselected: Light background, dark text
- Font: Satoshi Medium, 14px (button-secondary style)
```

#### Color Picker
```
Color Swatches:
- Size: 32px diameter circles
- Colors: Red, Orange, Yellow, Green, Blue, Purple
- Spacing: 12px between swatches
- Selected state: Ring indicator around chosen color
- Layout: Horizontal row
```

### Onboarding Components

#### Onboarding Screen
```
Layout:
- Full screen background
- Centered content
- Page indicators (dots)
- Primary action button
- Secondary action link

Content:
- Large icon or illustration
- Bold title (Satoshi Bold, 24px - heading-2 style)
- Descriptive text (Satoshi Regular, 16px - heading-4 style)
- Action buttons at bottom
```

#### Permission Request Screen
```
Elements:
- Large permission icon (bell, camera, etc.)
- Title: "Reminders, your way" (heading-2 style: 24px/21px, bold)
- Description: "Get alerts for tasks and deadlines - you're always in control" (heading-4 style: 16px, regular)
- Allow button: Primary style (button-primary: 14px/20px, medium)
- Skip link: Secondary text style (button-text: 10px, medium)
```

### Component States

#### Loading States
```
Skeleton Loading:
- Background: Light grey (#F5F7FA)
- Animation: Shimmer effect
- Shape: Matches final content structure

Spinner:
- Size: 24px
- Color: Primary brand color
- Animation: Rotating
```

#### Error States
```
Error Message:
- Background: Light red (#FEF2F2)
- Border: Red (#EF4444)
- Text: Dark red (#991B1B)
- Icon: Warning or error symbol
```

#### Empty States
```
Empty State Container:
- Centered content
- Large illustration or icon
- Title: Satoshi Semibold, 18px (heading-3 style)
- Description: Satoshi Regular, 14px (body-large style)
- Action button: Primary style (button-primary: 14px/20px, medium)
```

### Figma Variable Usage Mapping
#### Text Style Applications
```
Component Usage:
- Screen Titles: heading-2 (24px/21px, bold) - "Today", "Settings", "New Task"
- Section Headers: heading-4 (16px, semibold) - Category names, modal titles
- Task Titles: heading-4 (16px, semibold) - Individual task names
- Body Text: body-large (14px/18px, regular) - Task descriptions, modal content
- Metadata: body-medium (10px/14px, regular) - Dates, counts, secondary info
- Navigation: navbar (10px, medium) - Bottom tab labels
- Buttons: button-primary (14px/20px, medium) - Primary actions
- Secondary Buttons: button-secondary (14px/18px, medium) - Secondary actions
- Small Text: button-text (10px, medium) - Links, captions
```

#### Color Variable Applications
```
Component Usage:
- primary-50 (#FFFFFF): Modal backgrounds, card backgrounds
- primary-100 (#F5F7FA): Page backgrounds, secondary surfaces
- primary-200 (#ECF0F5): Subtle backgrounds, disabled states
- primary-300 (#959BA5): Inactive elements, secondary buttons
- primary-400 (#374151): Secondary text, labels
- primary-500 (#111827): Primary text, headings, active elements
- primary-600 (#0F172A): Primary buttons, active states
- primary-700 (#0C1320): Navigation headers, dark mode elements
- primary-800 (#111827): Strong text in dark mode
- primary-900 (#0B111C): Dark mode backgrounds, overlays
```

### Component API Standards

#### Props Naming Conventions
```
- Use camelCase for all props
- Boolean props use 'is' or 'has' prefix (isActive, hasError)
- Event handlers use 'on' prefix (onPress, onChange)
- Style props use descriptive names (backgroundColor, borderRadius)
```

#### Accessibility Requirements
```
- All interactive elements: minimum 44px touch target
- Screen reader labels for all icons and images
- Color contrast ratio: minimum 4.5:1 for normal text
- Focus indicators: visible outline or background change
- Semantic HTML elements where applicable
```

#### Error State Handling
```
- Inline validation messages below form fields
- Error states: Red border, error icon, descriptive message
- Success states: Green border, checkmark icon
- Loading states: Disabled inputs with spinner
```

### Icon System

#### Icon Specifications
```
Icon Library: Lucide React (primary), custom icons for specific use cases
Icon Sizes:
- Small: 16px (metadata, inline icons)
- Medium: 24px (navigation, buttons, task actions)
- Large: 32px (category icons, primary actions)
- Extra Large: 40px (task category icons)

Icon Colors:
- Primary: #111827 (dark text)
- Secondary: #6B7280 (medium grey)
- Muted: #9CA3AF (light grey)
- Accent: Task category colors (red, blue, green, etc.)
- White: #FFFFFF (on dark backgrounds)
```

#### Common Icons Used
```
Navigation Icons:
- Back arrow: ChevronLeft
- Close: X
- Menu: MoreHorizontal (three dots)
- Search: Search

Task Icons:
- Calendar: Calendar
- Clock: Clock
- Check: Check
- Plus: Plus
- Edit: Edit3
- Delete: Trash2
- Book: BookOpen
- Heart: Heart
- Water drop: Droplets
- Clipboard: ClipboardList

Category Icons:
- Reading: BookOpen
- Lifestyle: Heart
- Meal Prep: Droplets
- General: ClipboardList
- Gym: Dumbbell (custom)
- Home: Home (custom)

Status Icons:
- Overdue: AlertCircle (red)
- Due Today: Clock (blue/green)
- Completed: CheckCircle (green)
- Inactive: Circle (grey outline)
```

## Accessibility Standards

### WCAG Compliance
```
Level: AA compliance target
- Color contrast ratio: minimum 4.5:1 for normal text
- Color contrast ratio: minimum 3:1 for large text (18px+)
- No color-only information conveyance
- Keyboard navigation support for all interactive elements
```

### Screen Reader Support
```
- All icons have descriptive aria-labels
- Task cards use semantic structure (heading, description, status)
- Form inputs have associated labels
- Modal dialogs have proper focus management
- Status changes are announced to screen readers
```

### Touch Target Sizes
```
Minimum touch target: 44px x 44px
- Task cards: Full card area is touchable
- Buttons: Minimum 44px height
- Navigation tabs: 44px height minimum
- Icon buttons: 44px x 44px minimum
- Checkboxes: 44px x 44px minimum
```

### Focus Management
```
- Visible focus indicators on all interactive elements
- Tab order follows logical reading flow
- Modal dialogs trap focus within modal
- Skip links for main content navigation
- Focus returns to trigger element when modal closes
```

### Color and Contrast
```
- All text meets WCAG AA contrast requirements
- Task status uses both color and text/icon indicators
- Error states use multiple visual cues (color, icon, text)
- High contrast mode support for accessibility preferences
```

## Platform Considerations

### iOS Specific
```
Human Interface Guidelines Adherence:
- Dynamic Island/Notch support in status bar
- Safe area insets for all screen edges
- Native iOS navigation patterns (back gestures)
- iOS-style modal presentations (bottom sheet)
- Native iOS keyboard behavior and animations

Native Component Usage:
- iOS date picker for date selection
- iOS segmented controls for routine types
- Native iOS haptic feedback for interactions
- iOS-style loading indicators and spinners

Safe Area Handling:
- Status bar: 44px height (including Dynamic Island)
- Bottom safe area: 34px for home indicator
- Side margins: 16px minimum on all devices
- Modal positioning: Respects safe areas
```

### Android Specific
```
Material Design Integration:
- Material Design 3 color system adaptation
- Material Design elevation and shadows
- Android-style floating action button
- Material Design typography scale
- Android navigation patterns

Android-Specific Patterns:
- Android back button behavior
- Android-style modal dialogs
- Material Design ripple effects
- Android keyboard behavior
- Android notification patterns

Navigation Behavior:
- Android back gesture support
- Android-style bottom navigation
- Material Design navigation drawer (if needed)
- Android-specific status bar styling
```

### Cross-Platform Considerations
```
Responsive Design:
- Minimum width: 320px (iPhone SE)
- Maximum width: 428px (iPhone 14 Pro Max)
- Tablet support: 768px+ breakpoints
- Orientation: Portrait primary, landscape support

Performance:
- Image optimization for different screen densities
- Lazy loading for task lists
- Smooth 60fps animations
- Efficient re-rendering for task updates

Accessibility:
- Platform-specific accessibility APIs
- VoiceOver (iOS) and TalkBack (Android) support
- Platform-specific gesture recognition
- Dynamic type support for text scaling
```

## Implementation Guidelines

### Style Organization
```
File Structure:
- /styles/tokens/ - Design tokens (colors, typography, spacing)
- /styles/components/ - Component-specific styles
- /styles/global/ - Global styles and resets
- /styles/themes/ - Light/dark theme definitions

Theme Provider Setup:
- React Context for theme switching
- CSS custom properties for dynamic theming
- Platform-specific theme adaptations
- Dark mode support with system preference detection

CSS-in-JS Conventions:
- Styled-components for component styling
- Theme object injection for design tokens
- Consistent naming conventions for styled components
- TypeScript support for theme typing
```

### Component Implementation
```
Component Structure:
- /components/ui/ - Base UI components
- /components/features/ - Feature-specific components
- /components/layout/ - Layout components
- /components/forms/ - Form components

Props Interface:
- TypeScript interfaces for all component props
- Default props for optional properties
- Consistent prop naming conventions
- JSDoc comments for complex props

State Management:
- Local state for component-specific data
- Context for theme and global state
- Custom hooks for reusable logic
- Redux/ Zustand for complex state (if needed)
```

### Animation Guidelines
```
Animation Principles:
- Duration: 200-300ms for micro-interactions
- Easing: ease-out for entrances, ease-in for exits
- Stagger: 50ms delay between list items
- Spring animations for natural feel

Common Animations:
- Task card hover: subtle scale (1.02) and shadow increase
- Modal entrance: slide up from bottom with fade
- Button press: scale down (0.98) with haptic feedback
- List updates: fade in/out with slide transitions
- Loading states: shimmer or pulse effects
```

## Testing Standards

### Visual Regression Testing
```
Tools: Storybook + Chromatic or Percy
Coverage:
- All component variants and states
- Light and dark theme variations
- Different screen sizes (320px, 375px, 414px)
- Loading, error, and empty states
- Interactive states (hover, focus, active)

Test Scenarios:
- Component rendering in isolation
- Component interactions and state changes
- Theme switching behavior
- Accessibility compliance
```

### Component Testing
```
Unit Tests:
- Component rendering with different props
- Event handler functionality
- State management logic
- Custom hook behavior

Integration Tests:
- Component interaction flows
- Form submission and validation
- Navigation between screens
- Modal open/close behavior

Testing Tools:
- Jest for unit testing
- React Testing Library for component testing
- Detox for end-to-end testing
```

### Accessibility Testing
```
Automated Testing:
- axe-core for accessibility violations
- Jest-axe for component accessibility testing
- Lighthouse for overall accessibility score

Manual Testing:
- Screen reader testing (VoiceOver, TalkBack)
- Keyboard navigation testing
- High contrast mode testing
- Voice control testing

Testing Checklist:
- All interactive elements are keyboard accessible
- Color contrast meets WCAG AA standards
- Screen reader announcements are clear
- Focus indicators are visible
- Touch targets meet minimum size requirements
```

## Documentation & Maintenance

### Component Documentation
```
Documentation Standards:
- Storybook stories for all components
- Props documentation with TypeScript interfaces
- Usage examples and code snippets
- Accessibility notes and requirements
- Design token usage documentation

Story Structure:
- Default story with basic usage
- Variant stories for different states
- Interactive stories for complex components
- Documentation stories with usage guidelines
```

### Design Token Management
```
Token Organization:
- Semantic naming for all design tokens
- Hierarchical structure (color.primary.500)
- Platform-specific token variations
- Version control for token changes

Update Process:
- Design review for token changes
- Automated token validation
- Component impact assessment
- Migration guide for breaking changes
- Version bumping for major changes
```

### Version Control
```
Design Changes:
- Feature branches for design updates
- Pull request reviews for design changes
- Automated visual regression testing
- Design system versioning
- Changelog maintenance

Release Process:
- Semantic versioning for design system
- Breaking change documentation
- Migration guides for updates
- Rollback procedures for issues
- Communication plan for releases
```