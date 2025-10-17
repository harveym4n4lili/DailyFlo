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

  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(selectedDate);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // check for weekend dates (Saturday or Sunday within next 7 days)
  const selectedDayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
  
  if ((selectedDayOfWeek === 6 || selectedDayOfWeek === 0) && diffDays >= 0 && diffDays <= 6) {
    return {
      text: 'This Weekend',
      color: colors.getSemanticColor('info'),
      iconColor: colors.getSemanticColor('info'),
    };
  }

  // check for quick options (Today, Tomorrow, Yesterday, Next Week)
  if (diffDays === 0) {
    return {
      text: 'Today',
      color: colors.getSemanticColor('success'),
      iconColor: colors.getSemanticColor('success'),
    };
  } else if (diffDays === 1) {
    return {
      text: 'Tomorrow',
      color: colors.getSemanticColor('warning'),
      iconColor: colors.getSemanticColor('warning'),
    };
  } else if (diffDays === 7) {
    return {
      text: 'Next Week',
      color: colors.getTaskCategoryColor('purple'),
      iconColor: colors.getTaskCategoryColor('purple'),
    };
  } else if (diffDays === -1) {
    return {
      text: 'Yesterday',
      color: colors.getSemanticColor('error'),
      iconColor: colors.getSemanticColor('error'),
    };
  } else if (diffDays < 0) {
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


