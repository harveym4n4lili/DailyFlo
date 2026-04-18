
import React, { useCallback, useEffect, useRef } from 'react';
import { View, Platform } from 'react-native';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';

import { FloatingActionButton } from '@/components/ui/button';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { TodayScreenContent } from './TodayScreenContent';

import { useUI } from '@/store/hooks';

export default function TodayScreen() {
  const router = useGuardedRouter();
  const { modals, closeModal, selection } = useUI();

  const androidInPlaceSelection =
    Platform.OS === 'android' && selection.isSelectionMode && selection.selectionType === 'tasks';

  const fabOpacity = useSharedValue(1);
  useEffect(() => {
    fabOpacity.value = withTiming(androidInPlaceSelection ? 0 : 1, { duration: 400 });
  }, [androidInPlaceSelection, fabOpacity]);
  const fabAnimatedStyle = useAnimatedStyle(() => ({ opacity: fabOpacity.value }));
  const fabStyleRef = useRef(fabAnimatedStyle);
  fabStyleRef.current = fabAnimatedStyle;

  const { setTabFabRegistration } = useTabFabOverlay();
  useFocusEffect(
    useCallback(() => {
      if (!USE_CUSTOM_LIQUID_TAB_BAR) return undefined;
      setTabFabRegistration({
        onPress: () => router.push('/task-create' as any),
        accessibilityLabel: 'Add new task',
        accessibilityHint: 'Double tap to create a new task',
        wrapperStyle: fabStyleRef.current,
        pointerEventsBlocked: androidInPlaceSelection,
      });
      return () => setTabFabRegistration(null);
    }, [router, setTabFabRegistration, androidInPlaceSelection]),
  );

  useEffect(() => {
    if (modals.createTask) {
      closeModal('createTask');
      router.push('/task-create' as any);
    }
  }, [modals.createTask, closeModal, router]);

  return (
    <>
      <IosDashboardOverflowToolbar hidden={androidInPlaceSelection} />
      <View style={{ flex: 1 }}>
        <TodayScreenContent mode="index" />
        {!USE_CUSTOM_LIQUID_TAB_BAR ? (
          <AnimatedReanimated.View
            style={[
              fabAnimatedStyle,
              fabChromeZoneStyle,
              androidInPlaceSelection ? { pointerEvents: 'none' } : null,
            ]}
          >
            <FloatingActionButton
              onPress={() => router.push('/task-create' as any)}
              accessibilityLabel="Add new task"
              accessibilityHint="Double tap to create a new task"
            />
          </AnimatedReanimated.View>
        ) : null}
      </View>
    </>
  );
}
