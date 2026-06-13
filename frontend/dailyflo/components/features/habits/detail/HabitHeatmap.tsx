/**
 * github-style consistency grid — one cell per day over the heatmap window.
 */

import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { getTaskColorValue } from '@/utils/taskColors';
import type { HabitColor, HabitHeatmapData } from '@/types/api/habits';

const CELL = 10;
const GAP = 3;
const ROWS = 7;

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

type HabitHeatmapProps = {
  heatmap: HabitHeatmapData;
  color: HabitColor;
};

export function HabitHeatmap({ heatmap, color }: HabitHeatmapProps) {
  const themeColors = useThemeColors();
  const accent = getTaskColorValue(color);
  const completedSet = useMemo(
    () => new Set(heatmap.completedDates),
    [heatmap.completedDates],
  );

  const start = useMemo(() => parseLocalDate(heatmap.startDate), [heatmap.startDate]);
  const weekCount = Math.ceil(heatmap.days / ROWS);

  const cells = useMemo(() => {
    const grid: { key: string; filled: boolean; empty: boolean }[][] = [];
    for (let week = 0; week < weekCount; week += 1) {
      const column: { key: string; filled: boolean; empty: boolean }[] = [];
      for (let row = 0; row < ROWS; row += 1) {
        const dayIndex = week * ROWS + row;
        if (dayIndex >= heatmap.days) {
          column.push({ key: `e-${week}-${row}`, filled: false, empty: true });
          continue;
        }
        const d = new Date(start);
        d.setDate(start.getDate() + dayIndex);
        const iso = localDateStr(d);
        column.push({ key: iso, filled: completedSet.has(iso), empty: false });
      }
      grid.push(column);
    }
    return grid;
  }, [weekCount, heatmap.days, start, completedSet]);

  const emptyFill = themeColors.withOpacity(themeColors.text.tertiary(), 0.2);
  const doneFill = themeColors.withOpacity(accent, 0.85);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row}>
        {cells.map((column, weekIdx) => (
          <View key={`w-${weekIdx}`} style={styles.column}>
            {column.map((cell) => (
              <View
                key={cell.key}
                style={[
                  styles.cell,
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  column: {
    flexDirection: 'column',
    gap: GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 2,
  },
});
