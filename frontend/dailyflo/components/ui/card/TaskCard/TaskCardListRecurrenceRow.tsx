/**
 * second row on Today task rows: leaf + list name (only when task has a list), recurrence (only when not one-time).
 * when both list and recurrence show: list name, same bullet as group headers (`GROUP_HEADER_META_SEPARATOR`), then recurrence — inline row, not space-between.
 * inbox repeating tasks: recurrence only, left-aligned where the list name would start.
 * one-time / no list non-repeating: row hidden if nothing to show.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeafIcon } from '@/components/ui/Icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useLists } from '@/store/hooks';
import { getListDisplayName } from '@/utils/listDisplayName';
import { GROUP_HEADER_META_SEPARATOR } from '@/utils/taskGrouping';
import type { Task } from '@/types';

const LEAF_SIZE = 14;

function recurrenceLabel(routineType: Task['routineType'] | undefined): string {
  switch (routineType) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
    default:
      return 'One-time';
  }
}

type TaskCardListRecurrenceRowProps = {
  task: Task;
  isCompleted: boolean;
};

export default function TaskCardListRecurrenceRow({ task, isCompleted }: TaskCardListRecurrenceRowProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const { lists } = useLists();

  const hasList = Boolean(task.listId);
  const showRecurrence = task.routineType != null && task.routineType !== 'once';

  if (!hasList && !showRecurrence) {
    return null;
  }

  const listLabel = hasList ? getListDisplayName(task.listId, lists) : '';
  const tertiary = themeColors.text.tertiary();

  const textStyle = [
    typography.getTextStyle('body-medium'),
    { color: tertiary },
    isCompleted && styles.completedSubtext,
  ];

  const leafWrap = (
    <View style={isCompleted ? styles.completedIconWrap : undefined}>
      <LeafIcon size={LEAF_SIZE} color={tertiary} />
    </View>
  );

  // flex:1 on the name alone stretches it across the row and pins dot + recurrence to the right; cluster keeps them adjacent to the name
  const listNameText = hasList ? (
    <Text
      style={[textStyle, showRecurrence ? styles.listNameInCluster : styles.listNameFlex]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {listLabel}
    </Text>
  ) : null;

  // same refresh icon + label pairing as TaskIndicators (bottom of card) for repeating tasks
  const recurrenceBlock = showRecurrence ? (
    <View style={styles.recurrenceBlock}>
      <View style={isCompleted ? styles.completedIconWrap : undefined}>
        <Ionicons name="refresh" size={12} color={tertiary} style={styles.recurrenceIcon} />
      </View>
      <Text style={[textStyle, styles.recurrenceLabel]} numberOfLines={1}>
        {recurrenceLabel(task.routineType)}
      </Text>
    </View>
  ) : null;

  // list + recurrence: leaf, then a cluster (name • refresh+label) so the name truncates without shoving recurrence to the card edge
  if (hasList && showRecurrence) {
    return (
      <View style={[styles.row, styles.rowStart]}>
        <View style={styles.leafAndListRow}>
          {leafWrap}
          <View style={styles.listDotRecurrenceCluster}>
            {listNameText}
            <Text style={[textStyle, styles.metaDot]} accessible={false}>
              {GROUP_HEADER_META_SEPARATOR}
            </Text>
            {recurrenceBlock}
          </View>
        </View>
      </View>
    );
  }
  if (hasList) {
    return (
      <View style={[styles.row, styles.rowStart]}>
        <View style={styles.leafAndListRow}>
          {leafWrap}
          {listNameText}
        </View>
      </View>
    );
  }
  // inbox repeating task: recurrence only, left-aligned (same start as list name column)
  return (
    <View style={[styles.row, styles.rowStart]}>
      {recurrenceBlock}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  rowStart: {
    justifyContent: 'flex-start',
  },
  // leaf + remainder of row (list-only: name grows; list+recurrence: inner cluster handles layout)
  leafAndListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  // sits after leaf; row shrinks so long names ellipsize; dot + recurrence stay right after the name text
  listDotRecurrenceCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'flex-start',
  },
  metaDot: {
    flexShrink: 0,
  },
  listNameFlex: {
    flex: 1,
    minWidth: 0,
  },
  listNameInCluster: {
    flexShrink: 1,
    minWidth: 0,
  },
  recurrenceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  recurrenceIcon: {
    marginRight: 4,
  },
  recurrenceLabel: {
    flexShrink: 0,
  },
  completedSubtext: {
    opacity: 0.6,
  },
  completedIconWrap: {
    opacity: 0.6,
  },
});
