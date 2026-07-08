/**
 * session view proposal stack — same vertical gap as between reply and first proposal.
 * cards fade in one-by-one after the assistant reply words finish revealing.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { Task } from '@/types';
import type { TaskProposal, TaskProposalPayload, ProposalStatus } from '@/types/api/llm';
import {
  CHAT_SESSION_RESPONSE_GAP,
  CHAT_COMPOSER_LAYOUT_EASING,
  CHAT_SESSION_PROPOSAL_REVEAL_FADE_MS,
  CHAT_SESSION_PROPOSAL_REVEAL_STAGGER_MS,
} from './chatComposerUiTokens';
import { AiSessionProposalCard } from './AiSessionProposalCard';

export interface AiSessionProposalListProps {
  proposals: readonly TaskProposal[];
  /** redux tasks — resolve update/delete proposal targets by id */
  tasks: Task[];
  messageId: string;
  getProposalStatus: (messageId: string, proposalId: string) => ProposalStatus;
  getProposalPayload: (messageId: string, proposal: TaskProposal) => TaskProposalPayload;
  getProposalError?: (messageId: string, proposalId: string) => string | undefined;
  /** apply one proposal — dispatches create/update/delete via useAiAssistant */
  onConfirmProposal: (proposal: TaskProposal) => void;
  /** hide proposal without changing tasks */
  onDismissProposal: (proposalId: string) => void;
  /** reverse a confirmed proposal */
  onUndoProposal: (proposal: TaskProposal) => void;
  /** disables per-card pills while Accept All runs */
  isConfirmingAll?: boolean;
  /** true after reply word fade completes — unlocks sequential proposal reveals */
  revealProposals?: boolean;
}

type RevealProposalSlotProps = {
  revealIndex: number;
  canReveal: boolean;
  children: React.ReactNode;
};

/** wraps one proposal card — waits its turn, then fades in */
function RevealProposalSlot({ revealIndex, canReveal, children }: RevealProposalSlotProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!canReveal) {
      opacity.value = 0;
      return;
    }

    opacity.value = withDelay(
      revealIndex * CHAT_SESSION_PROPOSAL_REVEAL_STAGGER_MS,
      withTiming(1, {
        duration: CHAT_SESSION_PROPOSAL_REVEAL_FADE_MS,
        easing: CHAT_COMPOSER_LAYOUT_EASING,
      }),
    );
  }, [canReveal, revealIndex, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} pointerEvents={canReveal ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  );
}

export function AiSessionProposalList({
  proposals,
  tasks,
  messageId,
  getProposalStatus,
  getProposalPayload,
  getProposalError,
  onConfirmProposal,
  onDismissProposal,
  onUndoProposal,
  isConfirmingAll = false,
  revealProposals = false,
}: AiSessionProposalListProps) {
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null);

  // dismissed proposals are removed from the stack — user chose not to apply them
  const visibleProposals = useMemo(
    () =>
      proposals.filter(
        (proposal) => getProposalStatus(messageId, proposal.id) !== 'dismissed',
      ),
    [proposals, messageId, getProposalStatus],
  );

  const resolveExistingTask = useCallback(
    (proposal: TaskProposal) => {
      if (proposal.type === 'create') return undefined;
      const taskId =
        proposal.type === 'update'
          ? (proposal.payload as { taskId: string }).taskId
          : (proposal.payload as { taskId: string }).taskId;
      return tasks.find((task) => task.id === taskId);
    },
    [tasks],
  );

  const handleToggleExpand = useCallback((proposalId: string) => {
    setExpandedProposalId((current) => (current === proposalId ? null : proposalId));
  }, []);

  const handleAccept = useCallback(
    (proposal: TaskProposal) => {
      onConfirmProposal(proposal);
    },
    [onConfirmProposal],
  );

  const handleDiscard = useCallback(
    (proposalId: string) => {
      onDismissProposal(proposalId);
      setExpandedProposalId((current) => (current === proposalId ? null : proposalId));
    },
    [onDismissProposal],
  );

  const handleUndo = useCallback(
    (proposal: TaskProposal) => {
      onUndoProposal(proposal);
    },
    [onUndoProposal],
  );

  if (visibleProposals.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {visibleProposals.map((proposal, index) => (
        <RevealProposalSlot
          key={proposal.id}
          revealIndex={index}
          canReveal={revealProposals}
        >
          <AiSessionProposalCard
            proposal={proposal}
            payload={getProposalPayload(messageId, proposal)}
            existingTask={resolveExistingTask(proposal)}
            proposalStatus={getProposalStatus(messageId, proposal.id)}
            proposalError={getProposalError?.(messageId, proposal.id)}
            actionsDisabled={isConfirmingAll}
            isExpanded={expandedProposalId === proposal.id}
            onToggleExpand={() => handleToggleExpand(proposal.id)}
            onAccept={() => handleAccept(proposal)}
            onDiscard={() => handleDiscard(proposal.id)}
            onUndo={() => handleUndo(proposal)}
          />
        </RevealProposalSlot>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: CHAT_SESSION_RESPONSE_GAP,
  },
});
