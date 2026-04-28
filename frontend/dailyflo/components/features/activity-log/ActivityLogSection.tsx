/**
 * ActivityLogSection Component
 *
 * A single date section in the activity log: a header (e.g. "Today") plus
 * a rounded card containing all log entries for that date.
 * Composes ActivityLogSectionHeader and LogCard.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityLog } from '@/types/common/ActivityLog';
import { LogCard } from '@/components/ui/Card';
import { ActivityLogSectionHeader } from './ActivityLogSectionHeader';

export interface ActivityLogSectionProps {
  /** the YYYY-MM-DD date key for this section */
  dateKey: string;
  /** the log entries for this date (newest first within the section) */
  entries: ActivityLog[];
  /** called when the user taps a log card (navigates to task view) */
  onLogPress: (log: ActivityLog) => void;
}

export function ActivityLogSection({
  dateKey,
  entries,
  onLogPress,
}: ActivityLogSectionProps) {
  return (
    <View style={styles.section}>
      <ActivityLogSectionHeader dateKey={dateKey} />

      <View style={styles.sectionCard}>
        {entries.map((log, index) => {
          const isLast = index === entries.length - 1;
          return (
            <LogCard
              key={log.id}
              log={log}
              onPress={onLogPress}
              showSeparator={!isLast}
            />
          );
        })}
      </View>
    </View>
  );
}

export default ActivityLogSection;

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionCard: {
    overflow: 'hidden',
  },
});
