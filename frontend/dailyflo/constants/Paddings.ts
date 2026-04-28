/**
 * Padding System Constants
 *
 * Centralized padding values for consistent spacing across the app.
 * Use these constants instead of hardcoded values for easier maintenance.
 *
 * Usage:
 *   import { Paddings } from '@/constants/Paddings';
 *   paddingHorizontal: Paddings.screen,
 */

export const Paddings = {
  // screen-level padding - horizontal padding for full-width screens
  // used by: today/index, planner/index, welcome, reminders, signup, completion, OnboardingActions, OnboardingNavigation, SignInModal, EmailAuthModal, EmailAuth, EmailAuthInputs, SocialAuthActions, TaskForm, ScreenContainer
  screen: 20,
  // used by: ListCard, ModalContainer, settings/index, TaskForm, TaskSummary, TimeDurationSelectScreen, AlertSelectScreen
  screenSmall: 16,
  // used by: reminders, completion (description/instruction padding)
  screenLarge: 32,

  // section padding - for elevated sections, cards, modals
  // used by: list-create (vertical gap between stacked GroupedLists)
  section: 32,
  sectionCompact: 16,

  // card padding
  // used by: ListCard, TimelineItem, DragOverlay, CalendarView, QuickDateOptions, settings/index, SignInModal, TaskCard, AlertSelectScreen, SubtaskListItem, TaskScreenContent, EmailAuthModal, ModalHeader
  card: 18,
  // used by: TimelineItem, DragOverlay (icon container), TaskCard, TaskScreenContent
  cardCompact: 12,

  // list/item padding
  // used by: DropdownList
  listItemHorizontal: 16,
  // used by: FormDetailSection, TimelineItem, DragOverlay, OnboardingActions, settings/index, QuickDateOptions, SignInModal, AlertSelectScreen, EmailAuthModal, CustomTextInput, TimeDurationSelectScreen, GroupHeader, +not-found
  listItemVertical: 12,
  /** gap under the group title row before the first task (GroupHeader) */
  groupHeaderPaddingBottom: 0,

  // button padding
  // used by: OnboardingActions, SignInModal, EmailAuthModal
  buttonHorizontal: 32,
  // used by: OnboardingActions, SignInModal, SocialAuthActions, EmailAuthModal, EmailAuth, EmailAuthInputs
  buttonVertical: 16,
  buttonSmallHorizontal: 24, // not yet used
  buttonSmallVertical: 12, // not yet used

  // touch target padding - for interactive elements
  // used by: today/index, GroupHeader, CalendarView, TaskSummary, ScreenContainer, IconColorModal, TaskForm, WeekView, TimeDurationSelectScreen
  touchTarget: 8,
  // used by: GroupHeader, ModalHeader, TaskForm, +not-found
  touchTargetSmall: 4,

  // legacy browse/settings pill rhythm before formDataPill* — prefer formDataPill* for new pill UI
  pillHorizontal: 14,
  pillVertical: 12,

  // form data pills — TaskQuickAddForm, FormDetailSection, browse listPill, settings logout, FormPickerButton, TaskOptionButton (formDataPillRowGap: quick-add chips + FormDetailSection pill row)
  formDataPillVertical: 11,
  formDataPillHorizontal: 12,
  formDataPillRadius: 20,
  // space between leading icon and label inside those pills (separate from GroupedList row icon column)
  formDataPillIconGap: 8,
  /** horizontal gap between sibling pills in one row (quick-add chip strip, task screen recurrence + list) */
  formDataPillRowGap: 12,

  // indicator/tag padding
  // used by: TaskIndicators
  indicatorHorizontal: 6,
  // used by: TaskIndicators, ActionContextMenu (compact tags — not the header ellipsis chip)
  indicatorVertical: 2,

  // content padding - for scroll content, empty states
  // used by: LoadingState, EmptyState
  contentHorizontal: 32,
  contentVertical: 64,

  // GroupedList padding - content padding inside each list item wrapper
  // used by: GroupedList, TaskForm, CustomTextInput, IconColorModal, TaskScreenContent
  groupedListContentHorizontal: 16,
  // used by: GroupedList
  groupedListContentVertical: 16,
  // icon-to-text spacing in GroupedList rows (FormDetailButton, etc.)
  // used by: FormDetailButton, CustomFormDetailButton
  groupedListIconTextSpacing: 12,
  // gap between GroupedListHeader and content below (grouped list or pills)
  // used by: browse screen (groupedListSection, listsPillsContainer)
  groupedListHeaderContentGap: 10,

  // modal/sheet padding (not yet used - modalBottomExtra used instead)
  modalHorizontal: 24,
  modalBottom: 24,

  // timeline-specific - all used by: TimelineView
  // used by: TimelineView
  timelineLabelsRight: 20,
  timelineTasksLeft: 20,
  timelineTasksRight: 20,
  timelineFreeTimeLeft: 36,
  timelineScrollTop: 56,
  timelineScrollBottom: 200,
  timelineEmptyHorizontal: 40,
  timelineEmptyTop: 100,

  // scroll content - extra bottom padding for scrollable areas
  // used by: ListCard, settings/index, TaskScreenContent
  scrollBottomExtra: 40,

  // modal content - bottom padding for modal/sheet content
  // used by: IconColorModal, DateSelectScreen, TimeDurationSelectScreen, AlertSelectScreen
  modalBottomExtra: 24,

  // time label - right padding for timeline time labels
  // used by: TimeLabel
  timeLabelRight: 4,

  // form picker - horizontal padding for icon-only pills
  // used by: FormPickerButton
  formPickerIconPadding: 10,

  // context menu / small button padding
  // used by: ModalContainer, ActionContextMenu, ScreenContextButton, MainBackButton, MainCloseButton, SaveButton, TimeDurationSelectScreen
  contextMenuHorizontal: 16,
  // used by: ModalContainer, ModalHeader, MainBackButton, MainCloseButton, SaveButton, FormPickerButton, ScreenContextButton, ActionContextMenu
  contextMenuVertical: 14,
  /** corner radius for header ellipsis glass chip (ScreenContextButton, TaskEditOverflowMenu) */
  screenContextButtonRadius: 20,
  /** DropdownList anchor: extra top offset below header when opened from task overflow */
  overflowDropdownTopOffset: 12,
  /** DropdownList anchor: task edit ActionContextMenu (android) — ~Paddings.screen + 48px trigger + small gap */
  taskEditActionsDropdownTopOffset: 72,

  // TaskCard - right padding to avoid overlap with completion indicator
  // used by: TaskCard
  taskCardRightPadding: 56,
  taskCardRightPaddingCompact: 52,

  // IconColorModal - padding for content below floating color slider
  // used by: IconColorModal
  iconColorModalContentTop: 80,

  // AI tab — space between the input section (message field + send) and the native bottom tab bar
  // used by: app/(tabs)/ai/index
  tabBarInputGap: 12,

  // zero - for reset or no-padding cases
  // used by: Description, CustomFormDetailButton, SubtaskListItem, ModalHeader, TaskScreenContent, TaskCard, FormPickerButton, planner/index, CreateSubtaskButton, SubtaskListItem (TaskScreen), SubtaskCreateButton, AlertSelectScreen, QuickDateOptions, WeekView, TimelineItem, DragOverlay
  none: 0,
} as const;

export type PaddingKey = keyof typeof Paddings;
