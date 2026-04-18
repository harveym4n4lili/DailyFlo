/**
 * MonthSelectScreen
 *
 * Stack screen content for the planner's month/day navigator. Shown when the user
 * taps the month display in the Planner screen. Uses the same liquid glass pattern
 * as date-select, time-duration-select, and alert-select: transparent background
 * on iOS (not iPad) so the system form sheet shows the glass effect.
 *
 * Gets initial date and selection callback from PlannerMonthSelectContext (set by
 * Planner before pushing this route). On date select, calls the callback and
 * navigates back.
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { usePlannerMonthSelect } from '@/app/PlannerMonthSelectContext';
import { CalendarView } from '@/components/features/calendar/sections';

export function MonthSelectScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { consumeMonthSelect } = usePlannerMonthSelect();

  // liquid glass: on iOS (not iPad) use transparent background so form sheet shows native glass
  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass ? 'transparent' : themeColors.background.secondary();

  // consume the payload from context exactly once on mount (ref prevents double-run from Strict Mode / effect deps)
  const [payload, setPayload] = useState<{ initialDate: string; onSelected: (date: string) => void } | null>(null);
  const hasConsumedRef = useRef(false);

  useEffect(() => {
    if (hasConsumedRef.current) return;
    hasConsumedRef.current = true;
    const next = consumeMonthSelect();
    setPayload(next);
    if (next === null) {
      // no payload (e.g. opened directly) – go back after a tick so we don't block the first paint
      const id = setTimeout(() => router.back(), 100);
      return () => clearTimeout(id);
    }
  }, [consumeMonthSelect, router]);

  const handleDateSelect = (date: string) => {
    payload?.onSelected(date);
    router.back();
  };

  // no payload yet – show minimal placeholder until effect runs (or we'll go back if null)
  if (payload === null) {
    return <View style={[styles.container, { backgroundColor }]} />;
  }

  const selectedDate = payload.initialDate;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Paddings.card, paddingBottom: insets.bottom + Paddings.modalBottomExtra },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <CalendarView
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          initialMonth={selectedDate ? new Date(selectedDate) : undefined}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1 },
});
