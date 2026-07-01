/**
 * Habits tab root — FAB opens create modal; list loads on focus via HabitsScreenContent.
 */

import React, { useCallback } from 'react';
import { View, Platform } from 'react-native';
import AnimatedReanimated from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { HabitsScreenContent } from '@/components/features/habits';
import { FloatingActionButton } from '@/components/ui/Button';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';

export default function HabitsScreen() {
  const router = useGuardedRouter();

  const { setTabFabRegistration } = useTabFabOverlay();
  useFocusEffect(
    useCallback(() => {
      if (!USE_CUSTOM_LIQUID_TAB_BAR) return undefined;
      setTabFabRegistration({
        onPress: () => router.push('/(tabs)/habits/create' as any),
        accessibilityLabel: 'Add new habit',
        accessibilityHint: 'Double tap to create a new habit',
      });
      return () => setTabFabRegistration(null);
    }, [router, setTabFabRegistration]),
  );

  return (
    <>
      <IosDashboardOverflowToolbar />
      <View style={{ flex: 1 }}>
        <HabitsScreenContent />
        {!USE_CUSTOM_LIQUID_TAB_BAR ? (
          <AnimatedReanimated.View style={fabChromeZoneStyle}>
            <FloatingActionButton
              onPress={() => router.push('/(tabs)/habits/create' as any)}
              accessibilityLabel="Add new habit"
              accessibilityHint="Double tap to create a new habit"
            />
          </AnimatedReanimated.View>
        ) : null}
      </View>
    </>
  );
}
