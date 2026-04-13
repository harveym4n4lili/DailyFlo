/**
 * renders the registered tab FAB above CustomLiquidTabBar (see TabFabOverlayContext + tabFabAboveChromeZIndex).
 */

import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import AnimatedReanimated from 'react-native-reanimated';

import { FloatingActionButton } from '@/components/ui/button';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';

import { TAB_BAR_CHROME_VISUAL } from './tabBarChrome.constants';
import { fabChromeZoneStyle } from './fabChromeZone';

export function TabFabOverlayLayer() {
  const { registration } = useTabFabOverlay();
  if (!registration) return null;

  return (
    <AnimatedReanimated.View
      pointerEvents={registration.pointerEventsBlocked ? 'none' : 'box-none'}
      style={[fabChromeZoneStyle, styles.aboveChrome, registration.wrapperStyle]}
    >
      <FloatingActionButton
        onPress={registration.onPress}
        accessibilityLabel={registration.accessibilityLabel}
        accessibilityHint={registration.accessibilityHint}
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
});
