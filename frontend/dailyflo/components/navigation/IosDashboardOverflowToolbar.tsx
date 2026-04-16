/**
 * ios-only: native Stack.Toolbar overflow for screens that used dashboard ScreenHeaderActions + ActionContextMenu.
 * android has no overflow (product choice); same actions are unavailable there until a fallback exists.
 */

import React from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
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
  const themeColors = useThemeColors();
  const { enterSelectionMode } = useUI();
  const toolbarTint = themeColors.text.primary();

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
              onPress={() => enterSelectionMode('tasks')}
            />
          </Menu>
        </Host>
      </Stack.Toolbar.View>
    </Stack.Toolbar>
  );
}
