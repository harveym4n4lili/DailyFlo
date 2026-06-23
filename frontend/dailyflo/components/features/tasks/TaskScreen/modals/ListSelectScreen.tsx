/**
 * Route content for /list-select — same presentation as date-select (root stack formSheet + liquid glass).
 * taskId: PATCH listId then update CreateTaskDraftContext.pickedListId.
 * habitId: update CreateHabitDraftContext.pickedListId only — habit listId PATCH when API adds field.
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { useCreateHabitDraft } from '@/app/habit/CreateHabitDraftContext';
import { useLists } from '@/store/hooks';
import { useAppDispatch } from '@/store';
import { updateTask } from '@/store/slices/tasks/tasksSlice';
import { updateHabit } from '@/store/slices/habits/habitsSlice';
import { getTypographyStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { DashedSeparator } from '@/components/ui/borders';

export type ListSelectRow = { id: string | null; name: string };

export function ListSelectScreen() {
  const typographyPlatform = Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const router = useGuardedRouter();
  const params = useLocalSearchParams<{ taskId?: string; habitId?: string; forHabit?: string }>();
  const taskIdForPersist =
    typeof params.taskId === 'string' && params.taskId.length > 0 ? params.taskId : undefined;
  const habitIdForDraft =
    typeof params.habitId === 'string' && params.habitId.length > 0 ? params.habitId : undefined;
  /** habit detail uses habitId; habit create uses forHabit=1 — both write CreateHabitDraftContext */
  const forHabitDraft =
    params.forHabit === '1' || params.forHabit === 'true';
  const isHabitMode = Boolean(habitIdForDraft) || forHabitDraft;

  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const dispatch = useAppDispatch();
  const { draft: taskDraft, setDraft: setTaskDraft } = useCreateTaskDraft();
  const { draft: habitDraft, setDraft: setHabitDraft } = useCreateHabitDraft();
  const { lists: reduxLists } = useLists();

  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass ? 'transparent' : themeColors.background.secondary();

  const pickedListId = isHabitMode ? habitDraft.pickedListId : taskDraft.pickedListId;

  const rows = useMemo((): ListSelectRow[] => {
    const inbox: ListSelectRow = { id: null, name: isHabitMode ? 'Habits' : 'Inbox' };
    const active = reduxLists.filter((l) => !l.softDeleted).map((l) => ({ id: l.id, name: l.name }));
    return [inbox, ...active];
  }, [reduxLists, isHabitMode]);

  const handlePick = async (id: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isHabitMode) {
      if (habitIdForDraft) {
        try {
          await dispatch(
            updateHabit({
              id: habitIdForDraft,
              input: { listId: id === null ? null : id },
            }),
          ).unwrap();
        } catch (e) {
          console.error('ListSelectScreen: failed to persist habit listId', e);
          return;
        }
      }
      // create flow: only update habit draft — detail flow also PATCHes above
      setHabitDraft({ pickedListId: id === null ? null : id });
      router.back();
      return;
    }

    if (taskIdForPersist) {
      try {
        await dispatch(
          updateTask({
            id: taskIdForPersist,
            updates: { id: taskIdForPersist, listId: id === null ? null : id },
          })
        ).unwrap();
      } catch (e) {
        console.error('ListSelectScreen: failed to persist listId', e);
        return;
      }
    }
    setTaskDraft({ pickedListId: id === null ? null : id });
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Paddings.card,
            paddingBottom: insets.bottom + Paddings.modalBottomExtra,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {rows.map((row, index) => {
          const selected =
            row.id === null ? pickedListId === null : pickedListId === row.id;
          const isLast = index === rows.length - 1;
          return (
            <View key={row.id === null ? 'inbox' : row.id}>
              <Pressable
                onPress={() => {
                  void handlePick(row.id);
                }}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[getTypographyStyle('body-large', typographyPlatform), { color: themeColors.text.primary(), flex: 1 }]}
                  numberOfLines={1}
                >
                  {row.name}
                </Text>
                {selected ? (
                  <Text style={[getTypographyStyle('body-small', typographyPlatform), { color: themeColors.text.tertiary() }]}>
                    Selected
                  </Text>
                ) : null}
              </Pressable>
              {!isLast && (
                <View style={styles.separatorWrapper}>
                  <DashedSeparator paddingHorizontal={0} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Paddings.none },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Paddings.listItemVertical,
    paddingHorizontal: Paddings.card,
    minHeight: 48,
  },
  separatorWrapper: {
    paddingHorizontal: Paddings.card,
  },
});

export default ListSelectScreen;
