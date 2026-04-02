/**
 * Activity Log Screen
 *
 * Displays all the user's task actions (created, completed, updated, deleted) grouped by date.
 * Tapping a log entry navigates to the task view screen for that task.
 *
 * Layout:
 *   - Absolutely positioned header row: MainCloseButton (left) + "Activity Log" title (right of button)
 *   - Content at top of screen; header overlays content
 *
 * Composes feature components from features/activity-log and LogCard from ui/Card.
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { useTypography } from '@/hooks/useTypography';
import { MainCloseButton } from '@/components/ui/button';
import { useActivityLogs } from '@/store/hooks';
import { ActivityLog } from '@/types/common/ActivityLog';
import {
  groupLogsByDate,
  ActivityLogSection,
  ActivityLogEmptyState,
  ActivityLogErrorState,
  ActivityLogLoadingState,
} from '@/components/features/activity-log';

// header row height matches close button (42) so header text bottom aligns with button bottom
const HEADER_ROW_HEIGHT = 42;

// ─── Screen Component ────────────────────────────────────────────────────────

export default function ActivityLogScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const router = useRouter();

  const { logs, isLoading, error, fetchLogs } = useActivityLogs();

  useEffect(() => {
    fetchLogs();
  }, []);

  const sections = useMemo(() => groupLogsByDate(logs), [logs]);
  const insets = useSafeAreaInsets();

  const textPrimary = themeColors.text.primary();

  // header: heading-3 typography
  const headerTitleStyle = {
    ...typography.getTextStyle('heading-3'),
    color: textPrimary,
  };

  function handleLogPress(log: ActivityLog) {
    if (!log.taskId || log.actionType === 'deleted') return;

    router.push({
      pathname: '/task/[taskId]',
      params: {
        taskId: log.taskId,
        ...(log.occurrenceDate ? { occurrenceDate: log.occurrenceDate } : {}),
      },
    });
  }

  const headerTop = 10;
  const contentTopPadding = headerTop + HEADER_ROW_HEIGHT;
  // gradient extends below header so content fades as it scrolls under it (matches today screen)
  const FADE_OVERFLOW = 48;
  const topSectionHeight = contentTopPadding + FADE_OVERFLOW;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      {/* content first (behind) – wrap in flex: 1 so loading/empty/error states fill the screen */}
      <View style={styles.contentArea}>
        {isLoading && logs.length === 0 ? (
          <ActivityLogLoadingState topPadding={contentTopPadding + HEADER_ROW_HEIGHT} />
        ) : error ? (
          <ActivityLogErrorState
            error={error}
            onRetry={fetchLogs}
            topPadding={contentTopPadding}
          />
        ) : sections.length === 0 ? (
          <ActivityLogEmptyState topPadding={contentTopPadding + HEADER_ROW_HEIGHT} />
        ) : (
          <View collapsable={false} style={styles.scroll}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: contentTopPadding + HEADER_ROW_HEIGHT },
              ]}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {sections.map(({ dateKey, entries }) => (
                <ActivityLogSection
                  key={dateKey}
                  dateKey={dateKey}
                  entries={entries}
                  onLogPress={handleLogPress}
                />
              ))}
              <View style={{ height: 40 }} />
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </View>

      {/* header on top: gradient + close button + title – collapsable={false} for FormSheet, pointerEvents so content is tappable */}
      <View collapsable={false} style={[styles.headerOverlay, { height: topSectionHeight }]} pointerEvents="box-none">
        <View style={[styles.topSectionAnchor, { height: topSectionHeight }]}>
          <BlurView
            tint={themeColors.isDark ? 'dark' : 'light'}
            intensity={1}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              themeColors.background.primary(),
              themeColors.withOpacity(themeColors.background.primary(), 0),
            ]}
            locations={[0.4, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
        <View
          style={[styles.headerRow, { top: headerTop }]}
          pointerEvents="box-none"
        >
          <MainCloseButton
            onPress={() => router.back()}
            top={headerTop}
            left={Paddings.screen}
          />
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={headerTitleStyle}>Activity Log</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // content area fills the screen (behind header); loading/empty/error/scroll all live here
  contentArea: {
    flex: 1,
  },
  // header overlays the top only – gradient + close button + title – so content stays visible underneath
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden', // clip to height so it doesn't cover scroll content below
  },
  topSectionAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Paddings.screen,
  },
  headerRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEADER_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end', // align header bottom with close button bottom
    zIndex: 10,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 42 + 38, // close button width + gap
    justifyContent: 'flex-end',
  },
});
