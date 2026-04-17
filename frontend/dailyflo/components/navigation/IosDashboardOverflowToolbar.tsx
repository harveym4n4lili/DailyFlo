/**
 * ios-only: native Stack.Toolbar overflow for screens that used dashboard ScreenHeaderActions + ActionContextMenu.
 * android has no overflow (product choice). task multi-select on android stays in-place where wired (e.g. today list);
 * browse inbox/list still use listSelectionMode on the main screen because there is no ios-style overflow entry yet.
 */

import React, { useCallback } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { Host, Menu, Button } from '@expo/ui/swift-ui';
import { useThemeColors } from '@/hooks/useColorPalette';
import { headerChromeActionMenuTriggerSizePx } from '@/constants/headerChromeIconScale';
import {
  STACK_TOOLBAR_HEADER_GLYPH_PX,
  STACK_TOOLBAR_OVERFLOW_ELLIPSES,
  stackToolbarDashboardIcon,
} from '@/constants/stackToolbarIcons';
import { useUI } from '@/store/hooks';

export type IosDashboardOverflowToolbarProps = {
  /** when true, omit toolbar (e.g. selection mode replaces header actions) */
  hidden?: boolean;
};

export function IosDashboardOverflowToolbar({ hidden = false }: IosDashboardOverflowToolbarProps) {
  const router = useRouter();
  const segments = useSegments() as string[];
  const { listId: listIdParam } = useLocalSearchParams<{ listId?: string | string[] }>();
  const listId = Array.isArray(listIdParam) ? listIdParam[0] : listIdParam;
  const themeColors = useThemeColors();
  const { enterSelectionMode, beginIosLiquidChromePreSelectFade } = useUI();
  const toolbarTint = themeColors.text.primary();

  // start liquid tab chrome fade before push so it eases with the stack instead of popping off after
  const pushSelectAfterChromeFade = useCallback(
    (fn: () => void) => {
      beginIosLiquidChromePreSelectFade();
      queueMicrotask(fn);
    },
    [beginIosLiquidChromePreSelectFade],
  );

  // ios-only component: task multi-select uses pushed routes (today/select, planner/select, browse/task-select).
  const onSelectTasks = useCallback(() => {
    if (segments.includes('select') || segments.includes('task-select')) {
      return;
    }
    if (segments.includes('today')) {
      pushSelectAfterChromeFade(() => router.push('/(tabs)/today/select' as any));
      return;
    }
    if (segments.includes('planner')) {
      pushSelectAfterChromeFade(() => router.push('/(tabs)/planner/select' as any));
      return;
    }
    if (segments.includes('inbox')) {
      pushSelectAfterChromeFade(() =>
        router.push({ pathname: '/(tabs)/browse/task-select' as any, params: { source: 'inbox' } }),
      );
      return;
    }
    if (segments.includes('list') && listId) {
      pushSelectAfterChromeFade(() =>
        router.push({
          pathname: '/(tabs)/browse/task-select' as any,
          params: { source: 'list', listId },
        }),
      );
      return;
    }
    // browse home / tags / etc.: no ios select route yet — toggle redux only
    enterSelectionMode('tasks');
  }, [enterSelectionMode, listId, pushSelectAfterChromeFade, router, segments]);

  if (hidden || Platform.OS !== 'ios') {
    return null;
  }

  const toolbarHitPx = headerChromeActionMenuTriggerSizePx();
  // both slots use Stack.Toolbar.View + RN Image at STACK_TOOLBAR_HEADER_GLYPH_PX; overflow uses swift-ui Menu like ActionContextMenu
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.View>
        <Pressable
          onPress={() => {}}
          accessibilityLabel="Timeline"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ minWidth: toolbarHitPx, minHeight: toolbarHitPx, justifyContent: 'center', alignItems: 'center' }}
        >
          <Image
            source={stackToolbarDashboardIcon()}
            resizeMode="contain"
            style={{
              width: STACK_TOOLBAR_HEADER_GLYPH_PX,
              height: STACK_TOOLBAR_HEADER_GLYPH_PX,
              tintColor: toolbarTint,
            }}
          />
        </Pressable>
      </Stack.Toolbar.View>
      <Stack.Toolbar.View>
        <Host
          matchContents={false}
          style={{
            width: toolbarHitPx,
            height: toolbarHitPx,
            alignSelf: 'flex-start',
            overflow: 'visible',
          }}
        >
          <Menu
            label={
              <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  source={STACK_TOOLBAR_OVERFLOW_ELLIPSES}
                  resizeMode="contain"
                  style={{
                    width: STACK_TOOLBAR_HEADER_GLYPH_PX,
                    height: STACK_TOOLBAR_HEADER_GLYPH_PX,
                    tintColor: toolbarTint,
                  }}
                />
              </View>
            }
          >
            <Button
              label="Activity log"
              systemImage={'clock.arrow.circlepath' as any}
              onPress={() => router.push('/activity-log' as any)}
            />
            <Button
              label="Select Tasks"
              systemImage={'checkmark.circle' as any}
              onPress={onSelectTasks}
            />
          </Menu>
        </Host>
      </Stack.Toolbar.View>
    </Stack.Toolbar>
  );
}
