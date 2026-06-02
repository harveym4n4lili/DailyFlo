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
  buttonVertical:20,
  buttonSmallHorizontal: 24, // not yet used
  buttonSmallVertical: 12, // not yet used
  /** full-width text continue CTA (`ContinueButton` FAB + `OnboardingContinueButton`) — corner radius */
  continueButtonRadius: 28,
  /** questionnaire `OnboardingContinueButton` — inner vertical padding inside glass/solid pill */
  onboardingContinueButtonPaddingVertical: 18,
  /** questionnaire `OnboardingContinueButton` — inner horizontal padding */
  onboardingContinueButtonPaddingHorizontal: 32,
  /** questionnaire `OnboardingContinueButton` — hitSlop on each edge (extends tap past rounded bounds) */
  onboardingContinueButtonHitSlop: 8,

  /** slides funnel native header (`OnboardingSlidesHeaderChrome`) — horizontal gap between back and progress bar (and optional right action) */
  onboardingSlidesHeaderSectionGap: 16,
  /** extra tap expansion on back `Pressable` in slides header */
  onboardingSlidesHeaderBackHitSlop: 12,
  /** inner padding on back/header tap targets (keeps icon/text clear of neighbors beside section gap) */
  onboardingSlidesHeaderControlPadding: 6,

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
  // extra per-row vertical padding on display settings grouped lists (dashboard layout modal)
  groupedListContentVerticalExtra: 2,
  // icon-to-text spacing in GroupedList rows (FormDetailButton, etc.)
  // used by: FormDetailButton, CustomFormDetailButton
  groupedListIconTextSpacing: 12,
  // default GroupedList / FormDetailButton row icon size (SFSymbolIcon, Ionicons fallbacks)
  groupedListIconSize: 18,
  // display settings modal — larger row icons (+2pt vs groupedListIconSize)
  displayGroupedListIconSizeExtra: 2,
  // gap between GroupedListHeader and content below (grouped list or pills)
  // used by: browse screen (groupedListSection, listsPillsContainer)
  groupedListHeaderContentGap: 10,
  // display settings — gap between layout view picker row (incl. labels) and toggles grouped list
  displayLayoutSelectorToGroupedListGap: 24,

  // modal/sheet padding (not yet used - modalBottomExtra used instead)
  modalHorizontal: 24,
  modalBottom: 24,

  // timeline-specific - all used by: TimelineView
  // used by: TimelineView
  timelineLabelsRight: 20,
  timelineTasksLeft: 20,
  timelineTasksRight: 20,
  // free-time gap copy uses TIMELINE_CONTENT_LEFT from timelineChrome.ts (kept in sync with task text)
  timelineScrollTop: 56,
  timelineScrollBottom: 200,
  /** gap between all-day footer and timed timeline row (TimelineView timelineRowWithFooterAbove) */
  timelineFooterToRowGap: 32,
  /** spacer above timed rows when all-day footer is hidden — between header and timeline (not full collapsed footer height) */
  timelineTopWhenAllDayHidden: 56,
  /** planner timeline/list panel — top corner radius on `contentContainer` (bottom corners stay square) */
  plannerContentPanelTopRadius: 40,
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

  /**
   * Inset around expo-glass-effect views so the native blur can extend past the layout box without clipping.
   * ContinueButton uses this for its halo and to align the visible circle with Paddings.screen when absolutely positioned.
   */
  liquidGlassBleed: 6,
} as const;

export type PaddingKey = keyof typeof Paddings;
