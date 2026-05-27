import { Platform } from 'react-native';

import type { useThemeColors } from '@/hooks/useColorPalette';

/** ios header + toolbar chrome for display modal index (close + save) */
export function displayModalIndexStackOptions(themeColors: ReturnType<typeof useThemeColors>) {
  return Platform.OS === 'ios'
    ? {
        headerShown: true as const,
        headerTransparent: true as const,
        headerTitle: '',
        headerShadowVisible: false as const,
        headerBackVisible: false as const,
        contentStyle: { backgroundColor: themeColors.background.primary() },
      }
    : {
        title: 'Display',
        headerShown: false as const,
      };
}

/** ios header + toolbar chrome for pushed sort option screens (back chevron) — same slide as browse inbox */
export function displaySortPushStackOptions(themeColors: ReturnType<typeof useThemeColors>) {
  return Platform.OS === 'ios'
    ? {
        headerShown: true as const,
        headerTransparent: true as const,
        headerTitle: '',
        headerShadowVisible: false as const,
        headerBackVisible: false as const,
        contentStyle: { backgroundColor: themeColors.background.primary() },
      }
    : {
        headerShown: false as const,
      };
}

export type DisplaySettingsPickerRoute = 'sorting' | 'ordering' | 'date' | 'priority';

/** today vs planner display modal — date filter default differs by tab */
export type DisplaySettingsContext = 'today' | 'planner';

export const DISPLAY_SETTINGS_ROW_TO_ROUTE = {
  sorting: 'sorting',
  ordering: 'ordering',
  date: 'date',
  priority: 'priority',
} as const satisfies Record<
  'sorting' | 'ordering' | 'date' | 'priority',
  DisplaySettingsPickerRoute
>;

export const DISPLAY_SETTINGS_PICKER_TITLES: Record<DisplaySettingsPickerRoute, string> = {
  sorting: 'Sorting',
  ordering: 'Ordering',
  date: 'Date',
  priority: 'Priority',
};

/** @deprecated use DisplaySettingsPickerRoute */
export type DisplaySortOptionRoute = DisplaySettingsPickerRoute;

/** @deprecated use DISPLAY_SETTINGS_ROW_TO_ROUTE */
export const DISPLAY_SORT_ROW_TO_ROUTE = {
  sort: 'sorting',
  date: 'date',
  priority: 'priority',
} as const;

/** @deprecated use DISPLAY_SETTINGS_PICKER_TITLES */
export const DISPLAY_SORT_OPTION_TITLES = DISPLAY_SETTINGS_PICKER_TITLES;
