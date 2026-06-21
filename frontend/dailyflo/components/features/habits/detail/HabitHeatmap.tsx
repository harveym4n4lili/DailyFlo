/**
 * github-style consistency grid — weeks as columns, days-of-week as rows.
 * left: day labels; scrollable grid of completion cells + legend key.
 */

import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import {
  getHabitHeatmapCellFill,
  getHabitHeatmapDayScore,
} from './habitHeatmapColors';
import { HabitHeatmapLegend } from './HabitHeatmapLegend';
import type { HabitColor, HabitHeatmapData } from '@/types/api/habits';

const CELL = 14;
const GAP = 3;
const ROWS = 7;
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const DAY_LABEL_A11Y = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
/** sun, tue, thu, sat — keep row slots for grid alignment but hide the letter */
const HIDDEN_DAY_ROW_INDICES = new Set([0, 2, 4, 6]);

const ROW_PITCH = CELL + GAP;
const DAY_LABEL_COLUMN_WIDTH = 12;
/** space between day letters and the first week column */
const DAY_LABEL_GRID_GAP = 4;
const DAY_LABEL_TRACK_WIDTH = DAY_LABEL_COLUMN_WIDTH + DAY_LABEL_GRID_GAP;

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
  score: number;
  empty: boolean;
  date: Date;
};

type HeatmapWeekColumn = {
  key: string;
  cells: HeatmapCell[];
};

type HabitHeatmapProps = {
  heatmap: HabitHeatmapData;
  color: HabitColor;
  /** false on habit card — legend moves to the footer toggle row */
  showLegend?: boolean;
};

export function HabitHeatmap({ heatmap, color, showLegend = true }: HabitHeatmapProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

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
    let weekIndex = 0;

    while (true) {
      const weekSunday = addDays(gridStart, weekIndex * 7);
      if (weekSunday > lastWeekStart) break;

      const cells: HeatmapCell[] = [];

      for (let row = 0; row < ROWS; row += 1) {
        const date = addDays(weekSunday, row);
        const inRange = date >= rangeStart && date <= rangeEnd;
        const iso = localDateStr(date);

        cells.push({
          key: iso,
          date,
          empty: !inRange,
          score: inRange ? getHabitHeatmapDayScore(heatmap, iso) : 0,
        });
      }

      columns.push({
        key: `w-${weekIndex}`,
        cells,
      });

      weekIndex += 1;
    }

    return columns;
  }, [heatmap]);

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

  return (
    <View style={styles.wrapper}>
      <View style={styles.root}>
        <View style={styles.dayLabelColumn}>
          {DAY_LABELS.map((label, rowIdx) => (
            <View key={`day-${rowIdx}`} style={styles.dayLabelSlot}>
              {HIDDEN_DAY_ROW_INDICES.has(rowIdx) ? null : (
                <Text style={styles.dayLabel} accessibilityLabel={DAY_LABEL_A11Y[rowIdx]}>
                  {label}
                </Text>
              )}
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
                            : getHabitHeatmapCellFill(cell.score, color, themeColors),
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
          </View>
        </ScrollView>
      </View>

      {showLegend ? (
        <View style={styles.legendTrack}>
          <View style={styles.legendSpacer} />
          <View style={styles.legendRowEnd}>
            <HabitHeatmapLegend color={color} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  labelColor: string,
) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
    },
    root: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    dayLabelColumn: {
      width: DAY_LABEL_COLUMN_WIDTH,
      marginRight: DAY_LABEL_GRID_GAP,
      alignItems: 'center',
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
      textAlign: 'center',
      width: DAY_LABEL_COLUMN_WIDTH,
    },
    gridScroll: {
      flex: 1,
    },
    gridScrollContent: {
      flexGrow: 1,
      overflow: 'visible',
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
    legendTrack: {
      flexDirection: 'row',
      marginTop: Paddings.listItemVertical,
      alignItems: 'center',
    },
    legendSpacer: {
      width: DAY_LABEL_TRACK_WIDTH,
    },
    legendRowEnd: {
      flex: 1,
      alignItems: 'flex-end',
    },
  });
