/**
 * habits tab section title — thin wrapper around GroupedListHeader so habits screens
 * share the same heading-4 chrome as settings/browse without repeating margin tokens.
 */

import React from 'react';
import type { ViewStyle } from 'react-native';

import { GroupedListHeader } from '@/components/ui/List/GroupedList';
import {
  HABIT_SECTION_HEADER_STYLE_FIRST,
  HABIT_SECTION_HEADER_STYLE_FOLLOWING,
} from './habitSectionUiTokens';

type HabitSectionHeaderProps = {
  title: string;
  /** first = top of scroll; following = stacked below another habits section */
  placement?: 'first' | 'following';
  style?: ViewStyle;
  /** chevron + tap to expand/collapse — wired by HabitsCollapsibleSection */
  showDropdownArrow?: boolean;
  isExpanded?: boolean;
  onPress?: () => void;
};

export function HabitSectionHeader({
  title,
  placement = 'first',
  style,
  showDropdownArrow = false,
  isExpanded = true,
  onPress,
}: HabitSectionHeaderProps) {
  const placementStyle =
    placement === 'following'
      ? HABIT_SECTION_HEADER_STYLE_FOLLOWING
      : HABIT_SECTION_HEADER_STYLE_FIRST;

  return (
    <GroupedListHeader
      title={title}
      showDropdownArrow={showDropdownArrow}
      isExpanded={isExpanded}
      onPress={onPress}
      style={[placementStyle, style]}
    />
  );
}
