/**
 * github-style consistency grid — weeks as columns, days-of-week as rows.
 * left: day labels; top: month labels when the month changes.
 */

import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { getTaskColorValue } from '@/utils/taskColors';
import type { HabitColor, HabitHeatmapData } from '@/types/api/habits';

const CELL = 16;
const GAP = 2;
const MONTH_GRID_GAP = 2;
const ROWS = 7;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const ROW_PITCH = CELL + GAP;
const DAY_LABEL_COLUMN_WIDTH = 30;
const MONTH_ROW_HEIGHT = 12;

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** sunday at or before the given date — aligns columns to calendar weeks */
function weekStartSunday(d: Date): Date {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function stripTime(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

type HeatmapCell = {
  key: string;
  filled: boolean;
  empty: boolean;
  date: Date;
};

type HeatmapWeekColumn = {
  key: string;
  monthLabel: string | null;
  cells: HeatmapCell[];
};

type HabitHeatmapProps = {
  heatmap: HabitHeatmapData;
  color: HabitColor;
};

export function HabitHeatmap({ heatmap, color }: HabitHeatmapProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const accent = getTaskColorValue(color);

  const completedSet = useMemo(
    () => new Set(heatmap.completedDates),
    [heatmap.completedDates],
  );

  const labelColor = themeColors.text.tertiary();
  const styles = useMemo(
    () => createStyles(typography, labelColor),
    [typography, labelColor],
  );

  const weekColumns = useMemo(() => {
    if (!heatmap.startDate) return [] as HeatmapWeekColumn[];

    const rangeStart = stripTime(parseLocalDate(heatmap.startDate));
    const rangeEnd = addDays(rangeStart, heatmap.days - 1);
    const gridStart = weekStartSunday(rangeStart);
    const lastWeekStart = weekStartSunday(rangeEnd);

    const columns: HeatmapWeekColumn[] = [];
    let prevMonth: number | null = null;
    let weekIndex = 0;

    while (true) {
      const weekSunday = addDays(gridStart, weekIndex * 7);
      if (weekSunday > lastWeekStart) break;

      const cells: HeatmapCell[] = [];
      let monthForLabel: number | null = null;

      for (let row = 0; row < ROWS; row += 1) {
        const date = addDays(weekSunday, row);
        const inRange = date >= rangeStart && date <= rangeEnd;
        const iso = localDateStr(date);

        if (inRange && date.getDate() === 1) {
          monthForLabel = date.getMonth();
        }

        cells.push({
          key: iso,
          date,
          empty: !inRange,
          filled: inRange && completedSet.has(iso),
        });
      }

      if (monthForLabel === null) {
        const firstInRange = cells.find((cell) => !cell.empty);
        if (firstInRange) {
          monthForLabel = firstInRange.date.getMonth();
        }
      }

      const monthLabel =
        monthForLabel !== null && monthForLabel !== prevMonth
          ? MONTH_LABELS[monthForLabel]
          : null;

      if (monthForLabel !== null) {
        prevMonth = monthForLabel;
      }

      columns.push({
        key: `w-${weekIndex}`,
        monthLabel,
        cells,
      });

      weekIndex += 1;
    }

    return columns;
  }, [heatmap.startDate, heatmap.days, completedSet]);

  const emptyFill = themeColors.withOpacity(themeColors.text.tertiary(), 0.2);
  const doneFill = themeColors.withOpacity(accent, 0.85);

  // heatmap spans ~52 weeks — start scrolled to the right so today’s column is visible first
  const scrollRef = useRef<ScrollView>(null);
  const scrollToLatestWeek = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    });
  }, []);

  useEffect(() => {
    if (weekColumns.length === 0) return;
    scrollToLatestWeek();
  }, [weekColumns.length, scrollToLatestWeek]);

  if (weekColumns.length === 0) return null;

  const gridContentWidth =
    weekColumns.length * CELL + Math.max(0, weekColumns.length - 1) * GAP;

  return (
    <View style={styles.root}>
      <View style={styles.dayLabelColumn}>
        <View style={styles.monthSpacer} />
        {DAY_LABELS.map((label, rowIdx) => (
          <View key={label} style={styles.dayLabelSlot}>
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.gridScroll}
        contentContainerStyle={styles.gridScrollContent}
        onContentSizeChange={scrollToLatestWeek}
      >
        <View style={styles.gridBody}>
          <View style={[styles.monthHeaderTrack, { width: gridContentWidth }]}>
            {weekColumns.map((column, weekIdx) =>
              column.monthLabel ? (
                <Text
                  key={`m-${column.key}`}
                  style={[styles.monthLabel, { left: weekIdx * (CELL + GAP) }]}
                >
                  {column.monthLabel}
                </Text>
              ) : null,
            )}
          </View>

          <View style={styles.weekRow}>
            {weekColumns.map((column) => (
              <View key={column.key} style={styles.weekColumn}>
                {column.cells.map((cell, rowIdx) => (
                  <View
                    key={cell.key}
                    style={[
                      styles.cell,
                      rowIdx < ROWS - 1 ? styles.cellGap : null,
                      {
                        backgroundColor: cell.empty
                          ? 'transparent'
                          : cell.filled
                            ? doneFill
                            : emptyFill,
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  labelColor: string,
) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    dayLabelColumn: {
      width: DAY_LABEL_COLUMN_WIDTH,
      marginRight: 6,
    },
    monthSpacer: {
      height: MONTH_ROW_HEIGHT,
      marginBottom: MONTH_GRID_GAP,
    },
    dayLabelSlot: {
      height: ROW_PITCH,
      justifyContent: 'center',
    },
    dayLabel: {
      ...typography.getTextStyle('body-small'),
      color: labelColor,
      fontSize: 10,
      lineHeight: 12,
    },
    gridScroll: {
      flex: 1,
    },
    gridScrollContent: {
      flexGrow: 1,
      overflow: 'visible',
    },
    gridBody: {
      flexDirection: 'column',
    },
    monthHeaderTrack: {
      position: 'relative',
      height: MONTH_ROW_HEIGHT,
      marginBottom: MONTH_GRID_GAP,
    },
    monthLabel: {
      position: 'absolute',
      bottom: 0,
      ...typography.getTextStyle('body-small'),
      color: labelColor,
      fontSize: 10,
      lineHeight: MONTH_ROW_HEIGHT,
    },
    weekRow: {
      flexDirection: 'row',
      gap: GAP,
    },
    weekColumn: {
      flexDirection: 'column',
    },
    cell: {
      width: CELL,
      height: CELL,
      borderRadius: 4,
    },
    cellGap: {
      marginBottom: GAP,
    },
  });
