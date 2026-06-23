/**
 * horizontal segment pills — shared by timeline (Timeline | All-day | Habits) and list (Tasks | Habits).
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { TimelineAllDayPill } from './TimelineAllDayPill';
import { Paddings } from '@/constants/Paddings';

export type DaySegmentPill = {
  id: string;
  label: string;
  accessibilityLabel?: string;
};

type DaySegmentPillBarProps = {
  pills: DaySegmentPill[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** when pills sit directly under a scroll big title — skip extra top padding */
  /** when parent scroll/list already applies screen padding — avoid double inset on pills */
  embeddedInListHeader?: boolean;
};

export function DaySegmentPillBar({
  pills,
  selectedId,
  onSelect,
  compactHeaderTop = false,
  embeddedInListHeader = false,
}: DaySegmentPillBarProps) {
  return (
    <View
      style={[styles.measureRoot, compactHeaderTop ? styles.measureRootCompactTop : null]}
      collapsable={false}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          embeddedInListHeader ? styles.scrollContentEmbedded : null,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {pills.map((pill) => (
          <TimelineAllDayPill
            key={pill.id}
            label={pill.label}
            selected={selectedId === pill.id}
            onPress={() => onSelect(pill.id)}
            accessibilityLabel={pill.accessibilityLabel ?? pill.label}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  measureRoot: {
    paddingTop: Paddings.screen,
    paddingBottom: Paddings.timelineAllDayPillPaddingBottom,
    overflow: 'visible',
  },
  measureRootCompactTop: {
    paddingTop: 0,
  },
  scroll: {
    flexGrow: 0,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Paddings.formDataPillRowGap,
    paddingHorizontal: Paddings.screen,
    paddingVertical: Paddings.liquidGlassBleed,
    overflow: 'visible',
  },
  scrollContentEmbedded: {
    paddingHorizontal: 0,
  },
});
