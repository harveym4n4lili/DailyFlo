
import React, { useCallback, useEffect, useRef } from 'react';
import { View, Platform } from 'react-native';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';

import { FloatingActionButton } from '@/components/ui/Button';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { TodayScreenContent } from './TodayScreenContent';

import { useUI } from '@/store/hooks';

// same shape as planner quick-add — ISO dueDate seeds CreateTaskDraft so Date pill shows Today
function pushQuickAddWithTodayDue(router: ReturnType<typeof useGuardedRouter>) {
  router.push({
    pathname: '/task-quick-add' as any,
    params: { dueDate: new Date().toISOString() },
  });
}

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
        onPress: () => pushQuickAddWithTodayDue(router),
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
      pushQuickAddWithTodayDue(router);
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
              onPress={() => pushQuickAddWithTodayDue(router)}
              accessibilityLabel="Add new task"
              accessibilityHint="Double tap to create a new task"
            />
          </AnimatedReanimated.View>
        ) : null}
      </View>
    </>
  );
}
