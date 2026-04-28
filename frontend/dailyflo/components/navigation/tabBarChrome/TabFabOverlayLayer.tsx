/**
 * registered tab FAB above CustomLiquidTabBar (TabFabOverlayContext + tabFabAboveChromeZIndex).
 * FAB stays mounted: no registration or blocked state → opacity 0 + disabled (no unmount).
 */

import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import AnimatedReanimated from 'react-native-reanimated';

import { FloatingActionButton } from '@/components/ui/Button';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';

import { TAB_BAR_CHROME_VISUAL } from './tabBarChrome.constants';
import { fabChromeZoneStyle } from './fabChromeZone';

export function TabFabOverlayLayer() {
  const { registration } = useTabFabOverlay();

  const inactive = registration == null;
  const pointerBlocked = !!registration?.pointerEventsBlocked;
  const pointerEvents = inactive || pointerBlocked ? ('none' as const) : ('box-none' as const);

  return (
    <AnimatedReanimated.View
      pointerEvents={pointerEvents}
      style={[
        fabChromeZoneStyle,
        styles.aboveChrome,
        registration?.wrapperStyle,
        inactive ? styles.hidden : null,
      ]}
    >
      <FloatingActionButton
        onPress={registration?.onPress}
        disabled={inactive || pointerBlocked}
        accessibilityLabel={registration?.accessibilityLabel ?? 'Add new task'}
        accessibilityHint={registration?.accessibilityHint ?? 'Double tap to create a new task'}
      />
    </AnimatedReanimated.View>
  );
}

const styles = StyleSheet.create({
  aboveChrome: {
    zIndex: TAB_BAR_CHROME_VISUAL.tabFabAboveChromeZIndex,
    ...Platform.select({
      android: { elevation: 20 },
      default: {},
    }),
  },
  hidden: { opacity: 0 },
});
