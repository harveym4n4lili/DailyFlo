/**
 * ActivityLogSectionHeader Component
 *
 * Displays a date section header above a group of log entries.
 * Typography matches ListCard GroupHeader (heading-4, primary color).
 */

import React from 'react';
import { Text } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { formatDateHeader } from './activityLogUtils';

export interface ActivityLogSectionHeaderProps {
  /** the YYYY-MM-DD date key for this section */
  dateKey: string;
}

export function ActivityLogSectionHeader({ dateKey }: ActivityLogSectionHeaderProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // same typography as ListCard GroupHeader groupTitle: heading-4, primary color
  const headerStyle = {
    ...typography.getTextStyle('heading-4'),
    color: themeColors.text.primary(),
    marginBottom: 8,
  };

  return <Text style={headerStyle}>{formatDateHeader(dateKey)}</Text>;
}

export default ActivityLogSectionHeader;
