/**
 * create goal modal — POST /gamification/goals/ via redux createGoal thunk.
 * mounted from app/(tabs)/browse/goal-create route.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack } from 'expo-router';
import { useFocusEffect } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainCloseButton, MainSubmitButton } from '@/components/ui/Button';
import {
  IosBrowseModalCloseStackToolbar,
  IosBrowseModalTrailingStackToolbar,
} from '@/components/navigation/IosBrowseModalStackToolbars';
import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { Paddings } from '@/constants/Paddings';
import { useAppDispatch } from '@/store/index';
import { fetchTasks } from '@/store/slices/tasks/tasksSlice';
import { useGamification, useTasks } from '@/store/hooks';
import type { CreateUserGoalInput } from '@/types/api/gamification';

const PERIODS: CreateUserGoalInput['period'][] = ['daily', 'weekly', 'monthly'];
const GOAL_TYPES: CreateUserGoalInput['goalType'][] = ['task_count', 'linked_task'];

export default function GoalCreateScreen() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const dispatch = useAppDispatch();
  const { createGoal, isGoalSaving } = useGamification();
  const { tasks } = useTasks();

  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState<CreateUserGoalInput['goalType']>('task_count');
  const [targetCount, setTargetCount] = useState('5');
  const [period, setPeriod] = useState<CreateUserGoalInput['period']>('weekly');
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void dispatch(fetchTasks());
    }, [dispatch])
  );

  const incompleteTasks = useMemo(
    () => tasks.filter((t) => !t.isCompleted).slice(0, 20),
    [tasks]
  );

  const canSubmit = title.trim().length > 0 && Number(targetCount) >= 1 && !isGoalSaving;

  const handleSubmit = useCallback(() => {
    const parsed = parseInt(targetCount, 10);
    if (!title.trim() || Number.isNaN(parsed) || parsed < 1) return;
    if (goalType === 'linked_task' && !linkedTaskId) {
      Alert.alert('Select a task', 'Pick a task to link for this habit-style goal.');
      return;
    }
    void (async () => {
      try {
        await createGoal({
          title: title.trim(),
          goalType,
          targetCount: parsed,
          period,
          linkedTaskId: goalType === 'linked_task' ? linkedTaskId : null,
        });
        router.back();
      } catch (e) {
        Alert.alert('Could not create goal', e instanceof Error ? e.message : 'Try again');
      }
    })();
  }, [title, goalType, targetCount, period, linkedTaskId, createGoal, router]);

  const headerHeight = useHeaderHeight();

  return (
    <>
      <Stack.Screen options={{ title: 'New Goal' }} />
      <IosBrowseModalCloseStackToolbar />
      <IosBrowseModalTrailingStackToolbar
        icon="checkmark"
        onPress={handleSubmit}
        disabled={!canSubmit}
        accessibilityLabel="Create goal"
      />
      <View style={[styles.screen, { backgroundColor: themeColors.background.root() }]}>
        {Platform.OS === 'android' ? (
          <View style={[styles.androidBar, { paddingTop: headerHeight }]}>
            <MainCloseButton onPress={() => router.back()} />
            <MainSubmitButton onPress={handleSubmit} disabled={!canSubmit} />
          </View>
        ) : null}
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[typography.getTextStyle('body-small'), { color: themeColors.text.secondary() }]}>
            Set a target for how many tasks you want to complete in a period (max 5 active goals).
          </Text>
          <TextInput
            placeholder="Goal title"
            placeholderTextColor={themeColors.text.tertiary()}
            value={title}
            onChangeText={setTitle}
            style={[
              styles.input,
              {
                color: themeColors.text.primary(),
                backgroundColor: themeColors.background.primarySecondaryBlend(),
              },
            ]}
          />
          <TextInput
            placeholder="Target count"
            placeholderTextColor={themeColors.text.tertiary()}
            value={targetCount}
            onChangeText={setTargetCount}
            keyboardType="number-pad"
            style={[
              styles.input,
              {
                color: themeColors.text.primary(),
                backgroundColor: themeColors.background.primarySecondaryBlend(),
              },
            ]}
          />
          <GroupedList
            backgroundColor={themeColors.background.primarySecondaryBlend()}
            borderRadius={24}
          >
            {PERIODS.map((p) => (
              <FormDetailButton
                key={p}
                label={p.charAt(0).toUpperCase() + p.slice(1)}
                value={period === p ? 'Selected' : ''}
                onPress={() => setPeriod(p)}
                showChevron={false}
              />
            ))}
          </GroupedList>
          <GroupedList
            backgroundColor={themeColors.background.primarySecondaryBlend()}
            borderRadius={24}
          >
            {GOAL_TYPES.map((t) => (
              <FormDetailButton
                key={t}
                label={t === 'task_count' ? 'Any task completions' : 'Linked task only'}
                value={goalType === t ? 'Selected' : ''}
                onPress={() => setGoalType(t)}
                showChevron={false}
              />
            ))}
          </GroupedList>
          {goalType === 'linked_task' ? (
            <GroupedList
              backgroundColor={themeColors.background.primarySecondaryBlend()}
              borderRadius={24}
            >
              {incompleteTasks.map((task) => (
                <FormDetailButton
                  key={task.id}
                  label={task.title}
                  value={linkedTaskId === task.id ? 'Selected' : ''}
                  onPress={() => setLinkedTaskId(task.id)}
                  showChevron={false}
                />
              ))}
            </GroupedList>
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  androidBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Paddings.screen,
  },
  scroll: {
    padding: Paddings.screen,
    gap: Paddings.sectionCompact,
    paddingBottom: Paddings.scrollBottomExtra + Paddings.sectionCompact,
  },
  input: {
    borderRadius: Paddings.formDataPillRadius,
    paddingHorizontal: Paddings.groupedListContentHorizontal,
    paddingVertical: Paddings.listItemVertical,
    fontSize: 16,
  },
});
