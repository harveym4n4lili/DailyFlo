/**
 * LogCard Component
 *
 * A single tappable row representing one activity log entry.
 * Layout: action icon | action message (above) + task title + time (below).
 * Action message (e.g. "You updated a task") in subtext, task title as main text.
 *
 * When the task is still accessible (taskId present) and not a delete action, the row is
 * tappable and navigates to the task view. Deleted logs are never tappable.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { DashedSeparator } from '@/components/ui/borders';
import { SFSymbolIcon } from '@/components/ui/Icon';
import { useTypography } from '@/hooks/useTypography';
import { getFontFamilyWithWeight } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { ActivityLog } from '@/types/common/ActivityLog';
import {
  getActionMessage,
  getActionSFSymbol,
  getActionFallbackIcon,
} from '@/components/features/activity-log/activityLogUtils';

// icon size matches other list icons in app (TaskScreen actions, SelectionActionsBar, etc.)
const ACTION_ICON_SIZE = 20;
// separator starts where main text starts (icon + gap) – matches TaskCard separator alignment
const SEPARATOR_PADDING_LEFT = ACTION_ICON_SIZE + 16;
import { getActionAccentColor, getActionLabel } from '@/components/features/activity-log/activityLogUtils';

export interface LogCardProps {
  /** the activity log entry to display */
  log: ActivityLog;
  /** called when the user taps the card (only when log.taskId is present) */
  onPress?: (log: ActivityLog) => void;
  /** whether to show a bottom separator (false for last item in a section) */
  showSeparator?: boolean;
}

/**
 * LogCard Component
 * Renders a single log row: action message above, task title + time below.
 * Renders a single log row with action dot, title, meta line, and chevron.
 */
export function LogCard({ log, onPress, showSeparator = false }: LogCardProps) {
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();

  const actionMessage = getActionMessage(log.actionType);
  // deleted logs never open task view; completed/updated need taskId to navigate
  const isTappable = !!log.taskId && log.actionType !== 'deleted';

  const textPrimary = themeColors.text.primary();
  const textTertiary = themeColors.text.tertiary();

  // icon color: created/completed = primary, updated = tertiary, deleted = red
  const iconColor =
    log.actionType === 'created' || log.actionType === 'completed'
      ? textPrimary
      : log.actionType === 'updated'
        ? textTertiary
        : semanticColors.error();

  const timeStr = new Date(log.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handlePress = () => {
    if (isTappable && onPress) {
      onPress(log);
    }
  };

  // match TaskCard: main text = heading-4 (TaskCardContent title), subtext = body-medium (TaskMetadata)
  const taskTitleStyle = {
    ...typography.getTextStyle('heading-4'),
    fontFamily: getFontFamilyWithWeight('medium'),
    color: isTappable ? textPrimary : textTertiary,
  };
  // subtext matches TaskCard exactly: body-medium + tertiary color (TaskMetadata/TaskCardContent timeLabel)
  const logMetaStyle = {
    ...typography.getTextStyle('body-medium'),
    fontFamily: getFontFamilyWithWeight('medium'),
    color: textTertiary,
  };

  const contentWidth = Dimensions.get('window').width - 2 * Paddings.screen; // matches activity log scroll padding

  return (
    <View>
      <TouchableOpacity
        style={styles.row}
        onPress={handlePress}
        disabled={!isTappable}
        activeOpacity={isTappable ? 0.6 : 1}
      >
        {/* action icon on the left – SF Symbol on iOS, Ionicons fallback on Android/Web */}
        <View style={styles.iconWrap}>
          <SFSymbolIcon
            name={getActionSFSymbol(log.actionType)}
            size={ACTION_ICON_SIZE}
            color={iconColor}
            fallback={
              <Ionicons
                name={getActionFallbackIcon(log.actionType) as any}
                size={ACTION_ICON_SIZE}
                color={iconColor}
              />
            }
          />
        </View>

        {/* column: action message above, task title + time on same line below */}
        <View style={styles.textColumn}>
          <Text style={[logMetaStyle, styles.actionMessage]} numberOfLines={1}>
            {actionMessage}
          </Text>
          <View style={styles.titleRow}>
            <Text style={[taskTitleStyle, styles.titleText]} numberOfLines={1}>
              {log.taskTitle}
            </Text>
            <Text style={[logMetaStyle, styles.timeText]} numberOfLines={1}>
              {timeStr}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      {showSeparator && (
        <DashedSeparator
          paddingLeft={SEPARATOR_PADDING_LEFT}
          paddingRight={0}
          maxWidth={contentWidth}
        />
      )}
    </View>
  );
}

export default LogCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', // icon left, text column right (default is column which stacks vertically)
    alignItems: 'center', // vertically center icon with text column
    paddingVertical: Paddings.card, // matches TaskCard vertical padding
    paddingHorizontal: Paddings.none,
    gap: 16, // matches TaskCard icon-to-content spacing
  },
  iconWrap: {
    width: ACTION_ICON_SIZE,
    height: ACTION_ICON_SIZE,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  actionMessage: {
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minWidth: 0,
  },
  titleText: {
    flex: 1,
    flexShrink: 1,
  },
  timeText: {
    flexShrink: 0,
    maxWidth: 90,
    textAlign: 'right',
  },
});
