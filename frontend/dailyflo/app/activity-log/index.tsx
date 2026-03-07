/**
 * Activity log – full-screen stack screen (same structure as task-create: draggable, full screen, same background and glass).
 * Content is blank for now; opened when tapping "Activity log" in the context menu.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function ActivityLogScreen() {
  const themeColors = useThemeColors();

  // liquid glass: transparent on iOS (not iPad) so formSheet shows glass blur; solid primary fallback on Android/older iOS
  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass ? 'transparent' : themeColors.background.primary();

  // drag indicator pill: same sizing as TaskScreenContent / ModalHeader (iOS 15+ smaller pill)
  const iosVersion = Platform.OS === 'ios' ? (typeof Platform.Version === 'string' ? parseInt(Platform.Version.split('.')[0], 10) : Math.floor(Platform.Version as number)) : 0;
  const isNewerIOS = iosVersion >= 15;
  const pillWidth = isNewerIOS ? 36 : 42;
  const pillHeight = isNewerIOS ? 5 : 6;
  const pillRadius = isNewerIOS ? 2 : 3;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* drag indicator at top – same positioning as TaskScreenContent (absolute top: 10) */}
      <View style={styles.dragIndicatorWrap}>
        <View
          style={[
            styles.dragIndicatorPill,
            {
              width: pillWidth,
              height: pillHeight,
              borderRadius: pillRadius,
              backgroundColor: themeColors.interactive.tertiary(),
            },
          ]}
        />
      </View>
      {/* blank content area – placeholder for future activity log content */}
      <View style={styles.content} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // drag indicator: centered pill at top – same as TaskScreenContent (absolute top: 10)
  dragIndicatorWrap: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  dragIndicatorPill: {},
  // blank content area – fills remaining space
  content: {
    flex: 1,
  },
});
