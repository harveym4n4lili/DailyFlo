/**
 * Shared root Stack screen options for formSheet modals.
 *
 * Task/habit detail + field pickers all live as siblings on app/_layout.tsx:
 *   (tabs) → task|habit (detail formSheet) → date-select|time-duration-select|… (picker formSheets stacked on top)
 *
 * Routine/recurrence on tasks is NOT a stack route — it is an inline Menu pill on TaskScreenContent.
 */

import { Platform } from 'react-native';

type ThemeBackground = { secondary: () => string };

/** detail edit sheets: /task/[taskId], /habit/[habitId] */
export function rootDetailFormSheetOptions(useLiquidGlass: boolean) {
  return {
    headerShown: false as const,
    presentation: 'formSheet' as const,
    gestureEnabled: true,
    sheetGrabberVisible: false,
    sheetAllowedDetents: [0.7, 1] as number[],
    ...(Platform.OS === 'ios'
      ? { scrollEdgeEffects: { top: 'hidden' as const, bottom: 'hidden' as const } }
      : {}),
    contentStyle: {
      backgroundColor: useLiquidGlass ? 'transparent' : 'transparent',
    },
  };
}

/** picker sheets at 0.7 detent — time, duration, alert, habit field pickers */
export function rootPickerFormSheetOptions(
  useLiquidGlass: boolean,
  themeColors: ThemeBackground,
  detents: number[] = [0.7],
) {
  return {
    headerShown: false as const,
    presentation:
      Platform.OS === 'ios' ? (useLiquidGlass ? ('formSheet' as const) : ('modal' as const)) : ('modal' as const),
    sheetGrabberVisible: false,
    sheetAllowedDetents: detents,
    sheetInitialDetentIndex: 0,
    contentStyle: {
      backgroundColor: useLiquidGlass ? 'transparent' : themeColors.secondary(),
    },
  };
}
