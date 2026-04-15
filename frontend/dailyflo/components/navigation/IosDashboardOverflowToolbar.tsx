/**
 * ios-only: native Stack.Toolbar overflow for screens that used dashboard ScreenHeaderActions + ActionContextMenu.
 * android has no overflow (product choice); same actions are unavailable there until a fallback exists.
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';
import {
  STACK_TOOLBAR_ACTIVITY,
  STACK_TOOLBAR_OVERFLOW,
  STACK_TOOLBAR_SELECT_TASKS,
  stackToolbarDashboardIcon,
} from '@/constants/stackToolbarIcons';
import { useUI } from '@/store/hooks';

export type IosDashboardOverflowToolbarProps = {
  /** when true, omit toolbar (e.g. selection mode replaces header actions) */
  hidden?: boolean;
};

export function IosDashboardOverflowToolbar({ hidden = false }: IosDashboardOverflowToolbarProps) {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { enterSelectionMode } = useUI();
  const toolbarTint = themeColors.text.primary();

  if (hidden || Platform.OS !== 'ios') {
    return null;
  }

  // matches old glass row: layout/dashboard chip (was non-interactive) + overflow menu — pngs for native bar items
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={stackToolbarDashboardIcon()}
        iconRenderingMode="template"
        tintColor={toolbarTint}
        onPress={() => {}}
        accessibilityLabel="Dashboard"
      />
      <Stack.Toolbar.Menu
        icon={STACK_TOOLBAR_OVERFLOW}
        iconRenderingMode="template"
        tintColor={toolbarTint}
      >
        <Stack.Toolbar.MenuAction
          icon={STACK_TOOLBAR_ACTIVITY}
          iconRenderingMode="template"
          onPress={() => router.push('/activity-log' as any)}
        >
          Activity log
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction
          icon={STACK_TOOLBAR_SELECT_TASKS}
          iconRenderingMode="template"
          onPress={() => enterSelectionMode('tasks')}
        >
          Select Tasks
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
