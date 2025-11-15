/**
 * Form Picker Button Utilities
 * 
 * Helper functions for common display logic patterns used with FormPickerButtons.
 * These utilities help determine what text and colors to show based on form values.
 * 
 * Common patterns:
 * - Date relative display (Today, Tomorrow, etc.)
 * - Time and duration formatting
 * - Status-based coloring
 */

import type { ColorPaletteReturn } from '@/hooks/useColorPalette';

/**
 * Display information for a form picker button
 * Contains the text to display and the colors to use
 */
export interface PickerButtonDisplay {
  text: string;         // The display text (e.g., "Today", "Tomorrow", "10:30 AM")
  color: string;        // Text color (semantic or theme color)
  iconColor: string;    // Icon color (usually matches text color)
}

/**
 * Get date display information with relative labels and semantic colors
 * 
 * Returns appropriate text and colors for date selection:
 * - "No Date" for unselected (secondary color)
 * - "Today" (success green)
 * - "Tomorrow" (warning amber)
 * - "Yesterday" (error red)
 * - "This Weekend" (info blue)
 * - "Next Week" (purple)
 * - Past dates show "X days ago" (error red)
 * - Custom dates show formatted date (secondary gray)
 * 
 * @param dateString - ISO date string or undefined
 * @param colors - Color palette object from useColorPalette()
 * @param themeColors - Theme colors object from useThemeColors()
 * @returns Display information with text and colors
 */
export function getDatePickerDisplay(
  dateString: string | undefined,
  colors: ColorPaletteReturn,
  themeColors: ReturnType<typeof import('@/hooks/useColorPalette').useThemeColors>
): PickerButtonDisplay {
  // no date selected - show default
  if (!dateString) {
    return {
      text: 'No Date',
      color: themeColors.text.secondary(),
      iconColor: themeColors.text.secondary(),
    };
  }

  // create date objects and normalize to start of day for accurate comparison
  // this ensures we're comparing dates without time or timezone issues
  const selectedDate = new Date(dateString);
  const today = new Date();
  
  // normalize both dates to start of day (midnight) in local timezone
  // this prevents timezone and time-of-day issues when comparing
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  
  // calculate difference in days using date-only comparison
  // use Math.floor for accurate day calculation (handles partial days correctly)
  const diffTime = selectedDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // alternative comparison using date strings for absolute accuracy
  // compare year-month-day strings to avoid any timezone or rounding issues
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  
  // use string comparison for exact date matching (more reliable than time diff)
  const isToday = todayStr === selectedStr;
  const isTomorrow = (() => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    return tomorrowStr === selectedStr;
  })();
  const isYesterday = (() => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    return yesterdayStr === selectedStr;
  })();

  // check for quick options FIRST (Today, Tomorrow, Yesterday, Next Week)
  // these take priority over weekend check to avoid showing "This Weekend" when it's actually "Today"
  // use string comparison for exact matches (more reliable)
  if (isToday) {
    return {
      text: 'Today',
      color: colors.getSemanticColor('success'),
      iconColor: colors.getSemanticColor('success'),
    };
  } else if (isTomorrow) {
    return {
      text: 'Tomorrow',
      color: colors.getSemanticColor('warning'),
      iconColor: colors.getSemanticColor('warning'),
    };
  } else if (isYesterday) {
    return {
      text: 'Yesterday',
      color: colors.getSemanticColor('error'),
      iconColor: colors.getSemanticColor('error'),
    };
  } else if (diffDays === 7) {
    return {
      text: 'Next Week',
      color: colors.getTaskCategoryColor('purple'),
      iconColor: colors.getTaskCategoryColor('purple'),
    };
  }

  // check for weekend dates AFTER checking Today/Tomorrow/Yesterday
  // only show "This Weekend" if it's not already covered by the above checks
  const selectedDayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
  
  if ((selectedDayOfWeek === 6 || selectedDayOfWeek === 0) && diffDays >= 0 && diffDays <= 6) {
    return {
      text: 'This Weekend',
      color: colors.getSemanticColor('info'),
      iconColor: colors.getSemanticColor('info'),
    };
  }

  // check for past dates
  if (diffDays < 0) {
    // past date - show "X days ago"
    return {
      text: `${Math.abs(diffDays)} days ago`,
      color: colors.getSemanticColor('error'),
      iconColor: colors.getSemanticColor('error'),
    };
  } else {
    // custom date - show formatted date
    const formattedDate = selectedDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return {
      text: formattedDate, // e.g., "9 Nov 2025"
      color: themeColors.text.secondary(),
      iconColor: themeColors.text.secondary(),
    };
  }
}

/**
 * Get time and duration display information
 * 
 * Returns appropriate text for time/duration selection:
 * - "No Time or Duration" when both are unset
 * - "10:30 AM" when only time is set
 * - "30min" when only duration is set
 * - "10:30 AM • 30min" when both are set
 * 
 * All states use secondary color for consistency
 * 
 * @param time - Time string (e.g., "10:30 AM") or undefined
 * @param duration - Duration in minutes or undefined
 * @param themeColors - Theme colors object from useThemeColors()
 * @returns Display information with text and colors
 */
export function getTimeDurationPickerDisplay(
  time: string | undefined,
  duration: number | undefined,
  themeColors: ReturnType<typeof import('@/hooks/useColorPalette').useThemeColors>
): PickerButtonDisplay {
  // both time and duration selected
  if (time && duration) {
    return {
      text: `${time} • ${duration}min`,
      color: themeColors.text.secondary(),
      iconColor: themeColors.text.secondary(),
    };
  } 
  // only time selected
  else if (time) {
    return {
      text: time,
      color: themeColors.text.secondary(),
      iconColor: themeColors.text.secondary(),
    };
  } 
  // only duration selected
  else if (duration) {
    return {
      text: `${duration}min`,
      color: themeColors.text.secondary(),
      iconColor: themeColors.text.secondary(),
    };
  } 
  // neither selected
  else {
    return {
      text: 'No Time or Duration',
      color: themeColors.text.secondary(),
      iconColor: themeColors.text.secondary(),
    };
  }
}

/**
 * Get alerts/reminders display information
 * 
 * Returns appropriate text for alerts selection:
 * - "No Alerts" when no alerts are set
 * - "1 Alert" when one alert is set
 * - "X Alerts" when multiple alerts are set
 * 
 * Uses secondary color for all states
 * 
 * @param alertsCount - Number of alerts/reminders set
 * @param themeColors - Theme colors object from useThemeColors()
 * @returns Display information with text and colors
 */
export function getAlertsPickerDisplay(
  alertsCount: number,
  themeColors: ReturnType<typeof import('@/hooks/useColorPalette').useThemeColors>
): PickerButtonDisplay {
  if (alertsCount === 0) {
    return {
      text: 'No Alerts',
      color: themeColors.text.secondary(),
      iconColor: themeColors.text.secondary(),
    };
  } else if (alertsCount === 1) {
    return {
      text: '1 Alert',
      color: themeColors.text.secondary(),
      iconColor: themeColors.text.secondary(),
    };
  } else {
    return {
      text: `${alertsCount} Alerts`,
      color: themeColors.text.secondary(),
      iconColor: themeColors.text.secondary(),
    };
  }
}

/**
 * Get icon and color display information
 * 
 * Returns appropriate text for icon/color selection:
 * - "No Icon" when no icon is selected
 * - "Icon Selected" when an icon is selected
 * 
 * Uses the selected color for both text and icon colors when available
 * 
 * @param icon - Selected icon name or undefined
 * @param color - Selected color or undefined
 * @param colors - Color palette object from useColorPalette()
 * @param themeColors - Theme colors object from useThemeColors()
 * @returns Display information with text and colors
 */
export function getIconPickerDisplay(
  icon: string | undefined,
  color: string | undefined,
  colors: ColorPaletteReturn,
  themeColors: ReturnType<typeof import('@/hooks/useColorPalette').useThemeColors>
): PickerButtonDisplay {
  if (!icon) {
    return {
      text: 'No Icon',
      color: themeColors.text.secondary(),
      iconColor: themeColors.text.secondary(),
    };
  } else {
    // Use the selected color if available, otherwise use secondary
    const selectedColor = color ? colors.getTaskCategoryColor(color) : themeColors.text.secondary();
    return {
      text: 'Icon Selected',
      color: selectedColor,
      iconColor: selectedColor,
    };
  }
}

/**
 * Calculate relative date message (Today, Tomorrow, In X days)
 * Helper function for displaying relative dates in different contexts
 * 
 * @param dateString - ISO date string
 * @returns Relative date message (e.g., "Today", "Tomorrow", "In 3 days", "2 days ago")
 */
export function getRelativeDateMessage(dateString: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 0) {
    return `In ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
}


