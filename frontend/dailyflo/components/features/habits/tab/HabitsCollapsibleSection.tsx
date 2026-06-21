/**
 * collapsible habits tab section — same native iOS slide as ListCard group expand/collapse
 * and DisplaySettingsAnimatedSection (spring layout + FadeInUp/FadeOutUp).
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { LAYOUT_TRANSITION_SPRING } from '@/constants/LayoutTransitions';
import { HabitSectionHeader } from './HabitSectionHeader';
import {
  HABIT_SECTION_HEADER_STYLE_FIRST,
  HABIT_SECTION_HEADER_STYLE_FOLLOWING,
} from './habitSectionUiTokens';

type HabitsCollapsibleSectionProps = {
  title: string;
  children: React.ReactNode;
  /** first = top of scroll; following = stacked below another habits block */
  placement?: 'first' | 'following';
  /** extra margin on the header row (e.g. dashboard → today's title gap) */
  headerStyle?: ViewStyle;
  /** when collapsed, appended like ListCard GroupHeader "(3)" */
  itemCount?: number;
  /** whether section starts expanded — defaults to open */
  defaultExpanded?: boolean;
};

export function HabitsCollapsibleSection({
  title,
  children,
  placement = 'first',
  headerStyle,
  itemCount,
  defaultExpanded = true,
}: HabitsCollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const sectionStyle = useMemo(
    () =>
      placement === 'following'
        ? HABIT_SECTION_HEADER_STYLE_FOLLOWING
        : HABIT_SECTION_HEADER_STYLE_FIRST,
    [placement],
  );

  const headerTitle = useMemo(() => {
    if (isExpanded || itemCount == null) return title;
    return `${title} (${itemCount})`;
  }, [isExpanded, itemCount, title]);

  return (
    <Animated.View layout={LAYOUT_TRANSITION_SPRING} style={sectionStyle}>
      <HabitSectionHeader
        title={headerTitle}
        placement="first"
        style={headerStyle}
        showDropdownArrow
        isExpanded={isExpanded}
        onPress={toggleExpanded}
      />
      {isExpanded ? (
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOutUp.duration(200)}
        >
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
