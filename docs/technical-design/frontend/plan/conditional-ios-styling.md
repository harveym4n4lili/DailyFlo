# Conditional iOS Styling Plan

## Overview

This document outlines the plan for implementing conditional iOS styling based on iOS version detection. iOS 15+ introduced the glass UI design language with larger border radii, refined spacing, and updated interaction patterns. This plan ensures UI elements adapt appropriately to match the native iOS design language for each iOS version.

## Version Detection

### Implementation Pattern
```
iOS Version Detection:
- iOS 15+: Glass UI design (newer styling)
- iOS < 15: Pre-glass UI design (current/legacy styling)
- Detection: Platform.Version parsing for major version number
```

### Threshold
- **iOS 15+**: Glass UI styling (rounder corners, refined spacing)
- **iOS < 15**: Pre-glass UI styling (smaller corners, traditional spacing)

## Modal Components

### DraggableModal
**Status**: ✅ Implemented
- Border radius: iOS 15+ (36px), iOS < 15 (20px)
- Top corner rounding for glass UI aesthetic

### KeyboardModal
**Status**: ✅ Implemented
- Border radius: iOS 15+ (36px), iOS < 15 (20px)
- Consistent with DraggableModal styling

### ModalHeader
**Status**: ✅ Implemented
- Header height: iOS 15+ (70px), iOS < 15 (56px)
- Action buttons: iOS 15+ (icon buttons 38x38px), iOS < 15 (text buttons)
- Drag indicator: iOS 15+ (5px height, 36px width), iOS < 15 (6px height, 42px width)
- Button spacing: iOS 15+ (16px equal spacing), iOS < 15 (15px spacing)
- Title centering: iOS 15+ (no top padding), iOS < 15 (4px top padding)

## Card Components

### TaskCard
**Status**: Planned
- Border radius: iOS 15+ (larger), iOS < 15 (current)
- Shadow/elevation: iOS 15+ (refined), iOS < 15 (current)
- Padding: iOS 15+ (adjusted), iOS < 15 (current)

### ListCard
**Status**: Planned
- Border radius: iOS 15+ (larger), iOS < 15 (current)
- Header styling: iOS 15+ (refined), iOS < 15 (current)
- Spacing: iOS 15+ (adjusted), iOS < 15 (current)

### SwipeableCard
**Status**: Planned
- Border radius: iOS 15+ (larger), iOS < 15 (current)
- Swipe action indicators: iOS 15+ (refined), iOS < 15 (current)

## Button Components

### FloatingActionButton (FAB)
**Status**: Planned
- Size: iOS 15+ (refined), iOS < 15 (current)
- Shadow: iOS 15+ (refined), iOS < 15 (current)
- Position: iOS 15+ (adjusted spacing), iOS < 15 (current)

### FormPickerButton
**Status**: Planned
- Border radius: iOS 15+ (larger), iOS < 15 (current)
- Padding: iOS 15+ (adjusted), iOS < 15 (current)
- Icon size: iOS 15+ (refined), iOS < 15 (current)

## Input Components

### CustomTextInput
**Status**: Planned
- Border radius: iOS 15+ (larger), iOS < 15 (current)
- Focus state: iOS 15+ (refined), iOS < 15 (current)
- Padding: iOS 15+ (adjusted), iOS < 15 (current)

## List Components

### GroupedList
**Status**: Planned
- Section header styling: iOS 15+ (refined), iOS < 15 (current)
- Item spacing: iOS 15+ (adjusted), iOS < 15 (current)
- Border radius: iOS 15+ (larger), iOS < 15 (current)

## Navigation Components

### Tab Bar
**Status**: Planned
- Border radius: iOS 15+ (top corners rounded), iOS < 15 (current)
- Height: iOS 15+ (refined), iOS < 15 (current)
- Icon spacing: iOS 15+ (adjusted), iOS < 15 (current)

### Screen Headers
**Status**: Planned
- Height: iOS 15+ (refined), iOS < 15 (current)
- Button styling: iOS 15+ (icon-based), iOS < 15 (text-based)
- Spacing: iOS 15+ (adjusted), iOS < 15 (current)

## Form Components

### SegmentedControl
**Status**: Planned
- Border radius: iOS 15+ (larger), iOS < 15 (current)
- Segment styling: iOS 15+ (refined), iOS < 15 (current)
- Spacing: iOS 15+ (adjusted), iOS < 15 (current)

### ColorPicker
**Status**: Planned
- Swatch size: iOS 15+ (refined), iOS < 15 (current)
- Border radius: iOS 15+ (larger), iOS < 15 (current)
- Spacing: iOS 15+ (adjusted), iOS < 15 (current)

## Picker Modals

### DatePickerModal
**Status**: Planned
- Quick option styling: iOS 15+ (refined), iOS < 15 (current)
- Calendar cell styling: iOS 15+ (larger radius), iOS < 15 (current)

### IconColorModal
**Status**: Planned
- Icon grid spacing: iOS 15+ (adjusted), iOS < 15 (current)
- Color swatch styling: iOS 15+ (refined), iOS < 15 (current)

### TimeDurationModal
**Status**: Planned
- Slider styling: iOS 15+ (refined), iOS < 15 (current)
- Button styling: iOS 15+ (refined), iOS < 15 (current)

### AlertModal
**Status**: Planned
- Option item styling: iOS 15+ (refined), iOS < 15 (current)
- Border radius: iOS 15+ (larger), iOS < 15 (current)

## Utility Components

### EmptyState
**Status**: Planned
- Border radius: iOS 15+ (larger), iOS < 15 (current)
- Icon size: iOS 15+ (refined), iOS < 15 (current)
- Spacing: iOS 15+ (adjusted), iOS < 15 (current)

### LoadingState
**Status**: Planned
- Indicator styling: iOS 15+ (refined), iOS < 15 (current)
- Skeleton styling: iOS 15+ (refined), iOS < 15 (current)

## Implementation Guidelines

### Styling Patterns

#### Border Radius
```
iOS 15+: Larger border radius (typically 2-4px increase)
iOS < 15: Current border radius maintained
```

#### Spacing
```
iOS 15+: Refined spacing (typically 2-4px adjustments)
iOS < 15: Current spacing maintained
```

#### Button Styling
```
iOS 15+: Icon-based buttons with refined sizing
iOS < 15: Text-based buttons with current sizing
```

#### Height Adjustments
```
iOS 15+: Slightly increased heights for better touch targets
iOS < 15: Current heights maintained
```

### Code Pattern
```typescript
// Standard pattern for conditional styling
const getIOSVersion = (): number => {
  if (Platform.OS !== 'ios') return 0;
  const version = Platform.Version as string;
  const majorVersion = typeof version === 'string' 
    ? parseInt(version.split('.')[0], 10) 
    : Math.floor(version as number);
  return majorVersion;
};

const isNewerIOS = getIOSVersion() >= 15;

// Apply conditional styling
const borderRadius = isNewerIOS ? 36 : 20;
const height = isNewerIOS ? 70 : 56;
```

## Priority Order

### Phase 1: Core Modal System (✅ Complete)
- DraggableModal
- KeyboardModal
- ModalHeader

### Phase 2: Primary UI Components
- TaskCard
- ListCard
- FloatingActionButton
- CustomTextInput

### Phase 3: Secondary Components
- SwipeableCard
- FormPickerButton
- GroupedList
- Tab Bar

### Phase 4: Form & Picker Components
- SegmentedControl
- ColorPicker
- DatePickerModal
- IconColorModal
- TimeDurationModal
- AlertModal

### Phase 5: Utility Components
- EmptyState
- LoadingState
- Screen Headers

## Testing Considerations

### Version Testing
- Test on iOS 14 devices (pre-glass UI)
- Test on iOS 15+ devices (glass UI)
- Verify smooth transitions between versions
- Ensure no visual regressions

### Visual Consistency
- Maintain design system consistency
- Ensure proper spacing relationships
- Verify touch target sizes meet accessibility requirements
- Check dark mode compatibility

## Notes

- All conditional styling should maintain backward compatibility
- Changes should be subtle and enhance the native iOS feel
- Focus on border radius, spacing, and interaction patterns
- Avoid breaking changes to existing functionality
- Document all conditional styling decisions

