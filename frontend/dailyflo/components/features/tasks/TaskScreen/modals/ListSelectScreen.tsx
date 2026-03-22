/**
 * Route content for /list-select — same presentation as date-select (root stack formSheet + liquid glass).
 * Writes choice to CreateTaskDraftContext.pickedListId then router.back (null = Inbox, string = list).
 * When route params include taskId (task edit), PATCH listId to the API first so the DB stays in sync.
 * Row padding + dashed rules match QuickDateOptions / DateSelectScreen (Paddings.card, DashedSeparator wrapper).
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { useLists } from '@/store/hooks';
import { useAppDispatch } from '@/store';
import { updateTask } from '@/store/slices/tasks/tasksSlice';
import { EXAMPLE_LISTS } from '@/app/(tabs)/browse/_data/exampleLists';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { DashedSeparator } from '@/components/ui/borders';

export type ListSelectRow = { id: string | null; name: string };

export function ListSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const taskIdForPersist =
    typeof params.taskId === 'string' && params.taskId.length > 0 ? params.taskId : undefined;

  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const dispatch = useAppDispatch();
  const { draft, setDraft } = useCreateTaskDraft();
  const { lists: reduxLists } = useLists();

  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass ? 'transparent' : themeColors.background.secondary();

  const rows = useMemo((): ListSelectRow[] => {
    const inbox: ListSelectRow = { id: null, name: 'Inbox' };
    const active = reduxLists.filter((l) => !l.softDeleted).map((l) => ({ id: l.id, name: l.name }));
    if (active.length > 0) return [inbox, ...active];
    return [inbox, ...EXAMPLE_LISTS.map((l) => ({ id: l.id, name: l.name }))];
  }, [reduxLists]);

  const handlePick = async (id: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    setDraft({ pickedListId: id === null ? null : id });
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            // same top/bottom as DateSelectScreen scroll content
            paddingTop: Paddings.card,
            paddingBottom: insets.bottom + Paddings.modalBottomExtra,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {rows.map((row, index) => {
          const selected =
            row.id === null ? draft.pickedListId === null : draft.pickedListId === row.id;
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
                  style={[getTextStyle('body-large'), { color: themeColors.text.primary(), flex: 1 }]}
                  numberOfLines={1}
                >
                  {row.name}
                </Text>
                {selected ? (
                  <Text style={[getTextStyle('body-small'), { color: themeColors.text.tertiary() }]}>
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
  // match DateSelectScreen / AlertSelectScreen: no extra horizontal on scroll — row + separator supply it
  scrollContent: { flexGrow: 1, paddingHorizontal: Paddings.none },
  // same H + V as QuickDateOptions optionButton (date sheet first block)
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
