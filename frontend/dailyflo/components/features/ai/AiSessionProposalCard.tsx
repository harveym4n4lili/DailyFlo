/**
 * read-only proposal card in session view — tap expands brand border + action pills row.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { TaskCard } from '@/components/ui/Card/TaskCard';
import {
  QuickAddIconPill,
  QUICK_ADD_ICON_PILL_ICON_SIZE,
} from '@/components/features/tasks/quickAdd/QuickAddIconPill';
import { QuickAddPillChrome } from '@/components/features/tasks/quickAdd/QuickAddLabelOnlyPill';
import { getTextStyle } from '@/constants/Typography';
import { SparklesIcon, SFSymbolIcon, PencilFillIcon, TrashIcon } from '@/components/ui/Icon';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useBrandColors, useColorPalette } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import type { Task } from '@/types';
import type { ProposalType, ProposalStatus, TaskProposal, TaskProposalPayload } from '@/types/api/llm';
import {
  CHAT_COMPOSER_SHELL_BORDER_WIDTH,
  CHAT_COMPOSER_SHELL_RADIUS,
  CHAT_COMPOSER_LAYOUT_EASING,
  CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
} from './chatComposerUiTokens';
import { buildDisplayTaskFromProposal } from './proposalTaskDisplay';

/** fallback until onLayout measures the pill row */
const PROPOSAL_ACTIONS_SECTION_HEIGHT_ESTIMATE =
  Paddings.formDataPillHorizontal * 2 + 48;

/** proposal type chip sits half above the card — measured on layout; estimate until first measure */
export const PROPOSAL_TYPE_BADGE_HALF_HEIGHT_ESTIMATE = 15;

const PROPOSAL_TYPE_BADGE_ICON_SIZE = 14;

const PROPOSAL_TYPE_LABELS: Record<ProposalType, string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
};

/** create = system yellow, update = system orange, delete = brand marple — indicator label text only */
function getProposalTypeIndicatorColor(
  type: ProposalType,
  deleteColor: string,
  theme: 'light' | 'dark',
): string {
  if (type === 'delete') return deleteColor;
  if (type === 'create') return theme === 'dark' ? '#FFD60A' : '#FFCC00';
  return theme === 'dark' ? '#FF9F0A' : '#FF9500';
}

export interface AiSessionProposalCardProps {
  proposal: TaskProposal;
  payload: TaskProposalPayload;
  /** existing task from redux — used for update/delete previews */
  existingTask?: Task;
  proposalStatus: ProposalStatus;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function AiSessionProposalCard({
  proposal,
  payload,
  existingTask,
  proposalStatus,
  isExpanded,
  onToggleExpand,
}: AiSessionProposalCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const { theme } = useColorPalette();
  const { getMarpleBrandColor } = useBrandColors();
  const idleBorderColor = themeColors.border.secondary();
  const brandBorderColor = useMemo(() => getMarpleBrandColor(500), [getMarpleBrandColor]);
  const typeLabelColor = useMemo(
    () => getProposalTypeIndicatorColor(proposal.type, brandBorderColor, theme),
    [proposal.type, brandBorderColor, theme],
  );
  const isProposalConfirmed = proposalStatus === 'confirmed';
  // same default chip icon/label color as TaskQuickAddForm empty pills
  const pillIconColor = themeColors.interactive.active();
  const proposalTypeLabel = PROPOSAL_TYPE_LABELS[proposal.type];

  const typeBadgeLeadingIcon = useMemo(() => {
    if (isProposalConfirmed) {
      return (
        <SFSymbolIcon
          name="checkmark"
          size={PROPOSAL_TYPE_BADGE_ICON_SIZE}
          color={typeLabelColor}
          fallback={
            <Ionicons name="checkmark" size={PROPOSAL_TYPE_BADGE_ICON_SIZE} color={typeLabelColor} />
          }
        />
      );
    }
    return <SparklesIcon size={PROPOSAL_TYPE_BADGE_ICON_SIZE} color={typeLabelColor} />;
  }, [isProposalConfirmed, typeLabelColor]);

  const expandProgress = useSharedValue(isExpanded ? 1 : 0);
  const actionsHeightSv = useSharedValue(PROPOSAL_ACTIONS_SECTION_HEIGHT_ESTIMATE);
  const [actionsMeasured, setActionsMeasured] = useState(false);
  const [typeBadgeHalfHeight, setTypeBadgeHalfHeight] = useState(
    PROPOSAL_TYPE_BADGE_HALF_HEIGHT_ESTIMATE,
  );

  useEffect(() => {
    expandProgress.value = withTiming(isExpanded ? 1 : 0, {
      duration: CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
      easing: CHAT_COMPOSER_LAYOUT_EASING,
    });
  }, [isExpanded, expandProgress]);

  const displayTask = useMemo(
    () => buildDisplayTaskFromProposal(proposal, payload, existingTask),
    [proposal, payload, existingTask],
  );

  const handleActionsLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (height <= 0) return;
      actionsHeightSv.value = height;
      setActionsMeasured(true);
    },
    [actionsHeightSv],
  );

  const handleTypeBadgeLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height <= 0) return;
    setTypeBadgeHalfHeight(height / 2);
  }, []);

  const animatedShellStyle = useAnimatedStyle(
    () => ({
      borderColor: interpolateColor(
        expandProgress.value,
        [0, 1],
        [idleBorderColor, brandBorderColor],
      ),
      borderWidth: CHAT_COMPOSER_SHELL_BORDER_WIDTH,
    }),
    [idleBorderColor, brandBorderColor],
  );

  const animatedActionsSlotStyle = useAnimatedStyle(() => ({
    height: interpolate(expandProgress.value, [0, 1], [0, actionsHeightSv.value]),
    opacity: expandProgress.value,
    overflow: 'hidden' as const,
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          position: 'relative',
          borderRadius: CHAT_COMPOSER_SHELL_RADIUS,
          backgroundColor: themeColors.background.primary(),
          overflow: 'visible',
          ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
        },
        shellContentClip: {
          borderRadius: CHAT_COMPOSER_SHELL_RADIUS,
          overflow: 'hidden',
          ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
        },
        taskSection: {
          paddingHorizontal: Paddings.groupedListContentHorizontal,
          paddingVertical: Paddings.touchTargetSmall,
        },
        typeBadge: {
          position: 'absolute',
          right: Paddings.groupedListContentHorizontal,
          zIndex: 2,
        },
        typeBadgeText: {
          ...typography.getTextStyle('body-small'),
          fontWeight: '600',
        },
        actionsMeasure: {
          position: 'absolute',
          opacity: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none',
        },
        actionsSection: {
          paddingHorizontal: Paddings.groupedListContentHorizontal,
          paddingBottom: Paddings.formDataPillHorizontal,
        },
        actionsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: Paddings.formDataPillRowGap,
        },
      }),
    [themeColors, typography],
  );

  const acceptPillIcon = useMemo(
    () => (
      <SFSymbolIcon
        name="checkmark.circle.fill"
        size={QUICK_ADD_ICON_PILL_ICON_SIZE}
        color={pillIconColor}
        fallback={
          <Ionicons name="checkmark-circle" size={QUICK_ADD_ICON_PILL_ICON_SIZE} color={pillIconColor} />
        }
      />
    ),
    [pillIconColor],
  );

  const actionPills = (
    <View style={styles.actionsRow}>
      <QuickAddIconPill
        icon={acceptPillIcon}
        label="Accept"
        onPress={() => {}}
        accessibilityLabel="Accept proposal"
        textColor={pillIconColor}
      />
      <QuickAddIconPill
        icon={
          <SFSymbolIcon
            name="pencil"
            size={QUICK_ADD_ICON_PILL_ICON_SIZE}
            color={pillIconColor}
            fallback={
              <PencilFillIcon size={QUICK_ADD_ICON_PILL_ICON_SIZE} color={pillIconColor} />
            }
          />
        }
        label="Edit"
        onPress={() => {}}
        accessibilityLabel="Edit proposal task"
        textColor={pillIconColor}
      />
      <QuickAddIconPill
        icon={
          <SFSymbolIcon
            name="trash.fill"
            size={QUICK_ADD_ICON_PILL_ICON_SIZE}
            color={pillIconColor}
            fallback={
              <TrashIcon size={QUICK_ADD_ICON_PILL_ICON_SIZE} color={pillIconColor} />
            }
          />
        }
        label="Discard"
        onPress={() => {}}
        accessibilityLabel="Discard proposal"
        textColor={pillIconColor}
      />
    </View>
  );

  return (
    <Animated.View
      style={[styles.shell, animatedShellStyle, { marginTop: typeBadgeHalfHeight }]}
      accessibilityRole="none"
    >
      <View
        style={[styles.typeBadge, { top: -typeBadgeHalfHeight }]}
        onLayout={handleTypeBadgeLayout}
        pointerEvents="none"
      >
        <QuickAddPillChrome
          variant="outlined"
          size="badge"
          borderColor={typeLabelColor}
          innerBackgroundColor={themeColors.background.primary()}
        >
          {typeBadgeLeadingIcon}
          <Text
            style={[
              getTextStyle('body-small'),
              styles.typeBadgeText,
              { color: typeLabelColor },
            ]}
          >
            {proposalTypeLabel}
          </Text>
        </QuickAddPillChrome>
      </View>
      <View style={styles.shellContentClip}>
        <Pressable
          onPress={onToggleExpand}
          accessibilityRole="button"
          accessibilityLabel={`Proposal: ${displayTask.title}`}
          accessibilityHint={
            isExpanded ? 'Collapse proposal actions' : 'Expand proposal actions'
          }
          accessibilityState={{ expanded: isExpanded }}
        >
          <View style={styles.taskSection} pointerEvents="none">
            <TaskCard
              task={displayTask}
              hideBackground
              removeInnerPadding
              cardSpacing={0}
              showMetadata
              showIndicators
              showListRecurrenceRow
              titleStrikethrough={proposal.type === 'delete'}
            />
          </View>
        </Pressable>

        {/* measure pill row once so height animation matches real layout */}
        {!actionsMeasured ? (
          <View style={styles.actionsMeasure} onLayout={handleActionsLayout}>
            <View style={styles.actionsSection}>{actionPills}</View>
          </View>
        ) : null}

        <Animated.View style={animatedActionsSlotStyle} pointerEvents={isExpanded ? 'auto' : 'none'}>
          {actionsMeasured ? <View style={styles.actionsSection}>{actionPills}</View> : null}
        </Animated.View>
      </View>
    </Animated.View>
  );
}
