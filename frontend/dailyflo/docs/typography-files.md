# Files Using Typography

This document lists all files in the DailyFlo frontend that use the typography system (`useTypography`, `getTextStyle`, or `typography.getTextStyle`).

## Core Typography System

| File | Description |
|------|-------------|
| `constants/Typography.ts` | Defines typography constants (FontFamily, FontWeight, TextStyles) |
| `hooks/useTypography.ts` | Typography hook and utilities |

## App Screens

| File | Description |
|------|-------------|
| `app/(tabs)/today/index.tsx` | Today tab |
| `app/(tabs)/planner/index.tsx` | Planner tab |
| `app/(tabs)/settings/index.tsx` | Settings screen |
| `app/(tabs)/browse/index.tsx` | Browse screen |
| `app/(tabs)/_layout.tsx` | Tabs layout |
| `app/+not-found.tsx` | 404 screen |
| `app/(onboarding)/welcome.tsx` | Onboarding welcome |
| `app/(onboarding)/reminders.tsx` | Onboarding reminders |
| `app/(onboarding)/signup.tsx` | Onboarding signup |
| `app/(onboarding)/completion.tsx` | Onboarding completion |

## Components — Cards & Lists

| File | Description |
|------|-------------|
| `components/ui/card/ListCard/ListCard.tsx` | Main list card |
| `components/ui/card/ListCard/GroupHeader.tsx` | Group header (collapsible) |
| `components/ui/card/ListCard/LoadingState.tsx` | Loading state |
| `components/ui/card/ListCard/EmptyState.tsx` | Empty state |
| `components/ui/card/TaskCard/TaskCardContent.tsx` | Task card content |
| `components/ui/card/TaskCard/TaskMetadata.tsx` | Task metadata (date, time) |
| `components/ui/card/TaskCard/TaskIndicators.tsx` | Task indicators (Inbox, Daily, etc.) |
| `components/ui/list/DropdownList/DropdownList.tsx` | Dropdown list menu |

## Components — Timeline

| File | Description |
|------|-------------|
| `components/features/timeline/TimelineView.tsx` | Timeline view |
| `components/features/timeline/TimelineItem/TimelineItem.tsx` | Timeline item card |
| `components/features/timeline/DragOverlay.tsx` | Drag overlay |
| `components/features/timeline/TimeLabel.tsx` | Time label |

## Components — Calendar

| File | Description |
|------|-------------|
| `components/features/calendar/sections/WeekView.tsx` | Week view |
| `components/features/calendar/sections/QuickDateOptions.tsx` | Quick date options |
| `components/features/calendar/sections/CalendarView.tsx` | Calendar view |

## Components — Tasks

| File | Description |
|------|-------------|
| `components/features/tasks/TaskScreen/TaskScreenContent.tsx` | Task screen content |
| `components/features/tasks/TaskScreen/sections/FormDetailSection.tsx` | Form detail section |
| `components/features/tasks/TaskScreen/subtask/SubtaskListItem.tsx` | Subtask list item |
| `components/features/tasks/TaskScreen/subtask/SubtaskCreateButton.tsx` | Add subtask button |
| `components/features/tasks/TaskScreen/modals/AlertSelectScreen.tsx` | Alert select modal |
| `components/features/tasks/TaskScreen/modals/TimeDurationSelectScreen.tsx` | Time/duration select modal |
| `components/features/tasks/TaskScreen/modals/IconColorModal.tsx` | Icon color modal |

## Components — Authentication

| File | Description |
|------|-------------|
| `components/features/authentication/modals/SignInModal.tsx` | Sign-in modal |
| `components/features/authentication/modals/EmailAuthModal.tsx` | Email auth modal |
| `components/features/authentication/sections/SocialAuthActions.tsx` | Social auth buttons |
| `components/features/authentication/sections/EmailAuthInputs.tsx` | Email auth inputs |
| `components/features/authentication/sections/EmailAuth.tsx` | Email auth section |

## Components — Onboarding

| File | Description |
|------|-------------|
| `components/features/onboarding/OnboardingActions.tsx` | Onboarding action buttons |

## Components — Subtasks

| File | Description |
|------|-------------|
| `components/features/subtasks/SubtaskListItem.tsx` | Subtask list item |

## Components — UI

| File | Description |
|------|-------------|
| `components/ui/button/FormDetailButton.tsx` | Form detail button |
| `components/ui/button/TaskButton/CustomFormDetailButton.tsx` | Custom form detail button |
| `components/ui/button/FormPickerButton/FormPickerButton.tsx` | Form picker button |
| `components/ui/button/FormPickerButton/TaskOptionButton.tsx` | Task option button |
| `components/ui/button/SaveButton/SaveButton.tsx` | Save button |
| `components/ui/button/CloseButton/MainCloseButton.tsx` | Main close button |
| `components/ui/button/CloseButton/MainBackButton.tsx` | Main back button |
| `components/ui/message/TaskSummary.tsx` | Task summary message |
| `components/ui/textinput/CustomTextInput.tsx` | Custom text input |

## Components — Layout

| File | Description |
|------|-------------|
| `components/layout/ModalLayout/ModalHeader.tsx` | Modal header |
| `components/layout/ModalLayout/ModalContainer.tsx` | Modal container |

## Components — Forms

| File | Description |
|------|-------------|
| `components/forms/TaskForm/TaskForm.tsx` | Task form |

---

**Total: 53 files** (excluding core typography system)

**Style order:** In files with `createStyles` or `StyleSheet.create`, styles are ordered as:
1. `// --- LAYOUT STYLES ---` – layout (flex, position, etc.) without padding
2. `// --- PADDING STYLES ---` – styles with padding; use `Paddings` from `@/constants/Paddings`
3. `// --- TYPOGRAPHY STYLES ---` – typography using `getTextStyle()` or `typography.getTextStyle()`
