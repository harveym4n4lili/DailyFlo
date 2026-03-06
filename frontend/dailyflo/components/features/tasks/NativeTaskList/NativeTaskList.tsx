/**
 * NativeTaskList - iOS native SwiftUI List for task selection/edit mode.
 * Uses @expo/ui List + Label for native iOS edit mode (two-finger swipe to select,
 * swipe to delete, drag to reorder). Renders only on iOS; returns null on Android.
 *
 * When selectEnabled + editModeEnabled: native iOS selection UI with checkmarks.
 * onSelectionChange provides indices; we map to task IDs and sync with Redux.
 */

import React, { useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Host, List, Label } from '@expo/ui/swift-ui';
import { Task } from '@/types';
import { useAppDispatch } from '@/store';
import { deleteTask } from '@/store/slices/tasks/tasksSlice';
import { getBaseTaskId } from '@/utils/recurrenceUtils';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useUI } from '@/store/hooks';
import { Paddings } from '@/constants/Paddings';

export interface NativeTaskListProps {
  tasks: Task[];
}

export function NativeTaskList({ tasks }: NativeTaskListProps) {
  const dispatch = useAppDispatch();
  const { selectAllItems } = useUI();
  const themeColors = useThemeColors();

  // map selection indices from native List to task IDs, sync to Redux for actions bar
  const handleSelectionChange = useCallback(
    (selection: number[]) => {
      const ids = selection
        .filter((i) => i >= 0 && i < tasks.length)
        .map((i) => tasks[i].id);
      selectAllItems(ids);
    },
    [tasks, selectAllItems]
  );

  const handleDeleteItem = useCallback(
    (index: number) => {
      if (index >= 0 && index < tasks.length) {
        const task = tasks[index];
        const baseId = getBaseTaskId(task.id);
        dispatch(deleteTask(baseId));
      }
    },
    [tasks, dispatch]
  );

  const handleMoveItem = useCallback(
    (from: number, to: number) => {
      // native List move = reorder; for now we could update task order in backend
      // our tasks are sorted by dueDate/createdAt - reorder would need new field
      // for MVP, we'll leave moveEnabled false or handle as no-op
    },
    []
  );

  // iOS only - @expo/ui List is native SwiftUI
  if (Platform.OS !== 'ios') {
    return null;
  }

  const textColor = themeColors.text.primary();

  // Host is required: SwiftUI views (List, Label) must live inside Host to bridge UIKit↔SwiftUI
  return (
    <View style={styles.container}>
      <Host style={styles.host} matchContents={false}>
        <List
          listStyle="insetGrouped"
          selectEnabled
          editModeEnabled
          deleteEnabled
          moveEnabled={false}
          scrollEnabled
          onSelectionChange={handleSelectionChange}
          onDeleteItem={handleDeleteItem}
          onMoveItem={handleMoveItem}
        >
          {tasks.map((task) => (
            <Label
              key={task.id}
              title={task.title}
              systemImage={(task.icon ? mapIconToSFSymbol(task.icon) : 'checkmark.circle') as any}
              color={textColor}
            />
          ))}
        </List>
      </Host>
    </View>
  );
}

// map common Ionicons-style names to SF Symbols (for Label systemImage)
function mapIconToSFSymbol(icon: string): string {
  const map: Record<string, string> = {
    'briefcase': 'briefcase',
    'briefcase-outline': 'briefcase',
    'home': 'house',
    'home-outline': 'house',
    'calendar': 'calendar',
    'calendar-outline': 'calendar',
    'checkmark': 'checkmark.circle',
    'checkmark-circle': 'checkmark.circle',
    'checkmark-circle-outline': 'checkmark.circle',
    'person': 'person',
    'person-outline': 'person',
    'cart': 'cart',
    'cart-outline': 'cart',
    'fitness': 'figure.walk',
    'heart': 'heart',
    'heart-outline': 'heart',
    'star': 'star',
    'star-outline': 'star',
    'book': 'book',
    'book-outline': 'book',
    'school': 'graduationcap',
    'work': 'briefcase',
  };
  return map[icon] ?? 'checkmark.circle';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Paddings.screen,
  },
  // host fills container so List can scroll; matchContents=false lets it expand
  host: {
    flex: 1,
  },
});
