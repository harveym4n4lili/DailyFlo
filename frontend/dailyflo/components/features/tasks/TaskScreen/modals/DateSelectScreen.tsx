/**
 * Date select screen content. Used by app/date-select (root-level route).
 * Uses QuickDateOptions + CalendarView. Draft via CreateTaskDraftProvider.
 */

import React from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { QuickDateOptions, CalendarView } from '@/components/features/calendar/sections';

export function DateSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { draft, setDueDate } = useCreateTaskDraft();

  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass ? 'transparent' : themeColors.background.secondary();

  const selectedDate = draft.dueDate ?? new Date().toISOString();

  const handleQuickDateSelect = (date: string) => {
    setDueDate(date);
    router.back();
  };

  const handleCalendarDateSelect = (date: string) => {
    setDueDate(date);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <QuickDateOptions
          selectedDate={selectedDate}
          onSelectDate={handleQuickDateSelect}
          transparentOptionBackground
        />
        <CalendarView
          selectedDate={selectedDate}
          onSelectDate={handleCalendarDateSelect}
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
