/**
 * TaskSummary Component
 *
 * Displays a dynamic today message with:
 * 1. Time-based greeting (Good Morning/Afternoon/Evening)
 * 2. Task count for the day
 * 3. Largest free time slot (based on wake 09:00 - sleep 23:00)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import type { Task } from '@/types';

// wake and sleep times in 24h format - user's assumed active day
const WAKE_HOUR = 9;
const SLEEP_HOUR = 23;

/** converts HH:MM string to minutes from midnight (e.g. "14:30" -> 870) */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

/** formats minutes from midnight as hour-only 12h string, e.g. 795 -> "1 pm" */
function formatHourOnly(minutesFromMidnight: number): string {
  const roundedToHour = Math.round(minutesFromMidnight / 60) * 60;
  const hours24 = Math.floor(roundedToHour / 60) % 24;
  const period = hours24 >= 12 ? 'pm' : 'am';
  const hours12 = hours24 % 12 || 12;
  return `${hours12} ${period}`;
}

/** finds start minute of the largest free gap between 09:00 and 23:00; only considers tasks due today */
function findLargestFreeGapStart(tasks: Task[]): number {
  const WAKE_MIN = WAKE_HOUR * 60;
  const SLEEP_MIN = SLEEP_HOUR * 60;

  const todayStr = new Date().toDateString();
  // only tasks due today with a time block our schedule (exclude overdue - their slots are in the past)
  const withTime = tasks.filter(
    (t) =>
      t?.time &&
      t.time.trim() !== '' &&
      t.dueDate &&
      new Date(t.dueDate).toDateString() === todayStr
  );
  if (withTime.length === 0) {
    return WAKE_MIN; // entire day free, say "mostly free at 9 am"
  }

  // build [startMin, endMin] blocks, clamp to wake-sleep window
  const blocks: [number, number][] = withTime.map((t) => {
    const start = Math.max(WAKE_MIN, timeToMinutes(t.time!));
    const end = Math.min(SLEEP_MIN, start + (t.duration ?? 0));
    return [start, end];
  });

  // sort by start time
  blocks.sort((a, b) => a[0] - b[0]);

  // merge overlapping blocks
  const merged: [number, number][] = [];
  for (const [s, e] of blocks) {
    if (merged.length === 0) {
      merged.push([s, e]);
    } else {
      const last = merged[merged.length - 1];
      if (s <= last[1]) {
        last[1] = Math.max(last[1], e);
      } else {
        merged.push([s, e]);
      }
    }
  }

  // gaps: [wake, firstStart], [block1End, block2Start], ..., [lastEnd, sleep]
  let maxGap = 0;
  let bestStart = WAKE_MIN;

  // gap before first block
  const firstGap = merged[0][0] - WAKE_MIN;
  if (firstGap > maxGap) {
    maxGap = firstGap;
    bestStart = WAKE_MIN;
  }

  // gaps between blocks
  for (let i = 0; i < merged.length - 1; i++) {
    const gapStart = merged[i][1];
    const gapEnd = merged[i + 1][0];
    const gap = gapEnd - gapStart;
    if (gap > maxGap) {
      maxGap = gap;
      bestStart = gapStart;
    }
  }

  // gap after last block
  const lastGap = SLEEP_MIN - merged[merged.length - 1][1];
  if (lastGap > maxGap) {
    maxGap = lastGap;
    bestStart = merged[merged.length - 1][1];
  }

  return bestStart;
}

export interface TaskSummaryProps {
  /** tasks due today (filtered by parent); used for count and free-time calc */
  tasks: Task[];
  /** optional display name; defaults to "Harvey" */
  userName?: string;
  /** horizontal padding for the container; defaults to 16 */
  paddingHorizontal?: number;
  /** line height for the text; defaults to 28 */
  lineHeight?: number;
  /** top margin for the container */
  marginTop?: number;
}

export function TaskSummary({
  tasks,
  userName = 'Harvey',
  paddingHorizontal = Paddings.screenSmall,
  
  marginTop,
}: TaskSummaryProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  const { greetingPrefix, count, freeTimeStr } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const hour = now.getHours();

    // ignore overdue tasks - only consider tasks due today for count and free time
    const tasksDueToday = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate).toDateString() === todayStr
    );

    // sentence 1: greeting prefix (e.g. "Good morning, ")
    let g = 'Good evening';
    if (hour >= 0 && hour < 12) g = 'Good morning';
    else if (hour >= 12 && hour < 17) g = 'Good afternoon';
    const greetingPrefix = `${g}, `;

    // sentence 2: task count (incomplete tasks due today only)
    const count = tasksDueToday.filter((t) => !t.isCompleted).length;

    // sentence 3: free time string - rounded to nearest hour, displayed as "1 pm"
    const freeStartMin = findLargestFreeGapStart(tasksDueToday);
    const freeTimeStr = formatHourOnly(freeStartMin);

    return { greetingPrefix, count, freeTimeStr };
  }, [tasks, userName]);

  const tertiaryColor = themeColors.text.tertiary();
  const highlightColor = themeColors.text.primary();
  const textStyle = typography.getTextStyle('heading-2');

  return (
    <View style={[styles.container, { paddingHorizontal }, marginTop != null && { marginTop }]}>
      <Text style={[textStyle, { color: tertiaryColor, }]}>
        {greetingPrefix}
        <Text style={{ color: highlightColor }}>{userName}</Text>
        .{'\n'}
        {count === 0 ? (
          'No tasks seen.'
        ) : (
          <>
            {'You have '}
            <Text style={{ color: highlightColor }}>{count} task{count === 1 ? '' : 's'}</Text>
            {' due today.'}
          </>
        )}{' '}
        {count === 0 ? (
          <>You're free <Text style={{ color: highlightColor }}>all day</Text>!</>
        ) : (
          <>You're <Text style={{ color: highlightColor }}>mostly free</Text> after{' '}
            <Text style={{ color: highlightColor }}>{freeTimeStr}</Text>.</>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Paddings.touchTarget,
    backgroundColor: 'transparent',
  },
});
