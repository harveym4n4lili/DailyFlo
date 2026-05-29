import React, { useCallback, useEffect, useRef } from 'react';
import { View, Platform } from 'react-native';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { FloatingActionButton } from '@/components/ui/Button';
import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';
import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';
import { InboxTaskListContent } from '@/components/features/inbox/InboxTaskListContent';
import { useUI } from '@/store/hooks';

/** inbox quick-add — no dueDate param so new tasks stay in inbox until user picks a date */
function pushQuickAddForInbox(router: ReturnType<typeof useGuardedRouter>) {
  router.push({ pathname: '/task-quick-add' as any });
}

/** inbox tab root — main navbar destination when user adds Inbox to their bar */
export default function InboxTabScreen() {
  const router = useGuardedRouter();
  const { modals, closeModal, selection } = useUI();

  const taskSelectionActive =
    selection.isSelectionMode && selection.selectionType === 'tasks';

  const androidInPlaceSelection =
    Platform.OS === 'android' && taskSelectionActive;

  const fabOpacity = useSharedValue(1);
  useEffect(() => {
    fabOpacity.value = withTiming(androidInPlaceSelection ? 0 : 1, { duration: 400 });
  }, [androidInPlaceSelection, fabOpacity]);
  const fabAnimatedStyle = useAnimatedStyle(() => ({ opacity: fabOpacity.value }));
  const fabStyleRef = useRef(fabAnimatedStyle);
  fabStyleRef.current = fabAnimatedStyle;

  // register FAB with the shared tab chrome layer (same pattern as today / planner)
  const { setTabFabRegistration } = useTabFabOverlay();
  useFocusEffect(
    useCallback(() => {
      if (!USE_CUSTOM_LIQUID_TAB_BAR) return undefined;
      setTabFabRegistration({
        onPress: () => pushQuickAddForInbox(router),
        accessibilityLabel: 'Add new task',
        accessibilityHint: 'Double tap to create a new task',
        wrapperStyle: fabStyleRef.current,
        pointerEventsBlocked: taskSelectionActive,
      });
      return () => setTabFabRegistration(null);
    }, [router, setTabFabRegistration, taskSelectionActive]),
  );

  useEffect(() => {
    if (modals.createTask) {
      closeModal('createTask');
      pushQuickAddForInbox(router);
    }
  }, [modals.createTask, closeModal, router]);

  return (
    <View style={{ flex: 1 }}>
      <InboxTaskListContent chromeVariant="tab-root" />
      {!USE_CUSTOM_LIQUID_TAB_BAR ? (
        <AnimatedReanimated.View
          style={[
            fabAnimatedStyle,
            fabChromeZoneStyle,
            taskSelectionActive ? { pointerEvents: 'none' } : null,
          ]}
        >
          <FloatingActionButton
            onPress={() => pushQuickAddForInbox(router)}
            accessibilityLabel="Add new task"
            accessibilityHint="Double tap to create a new task"
          />
        </AnimatedReanimated.View>
      ) : null}
    </View>
  );
}
