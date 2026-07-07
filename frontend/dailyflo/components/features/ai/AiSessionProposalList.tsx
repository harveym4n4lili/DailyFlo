/**
 * session view proposal stack — same vertical gap as between reply and first proposal.
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Task } from '@/types';
import type { TaskProposal, ProposalStatus } from '@/types/api/llm';
import { CHAT_SESSION_RESPONSE_GAP } from './chatComposerUiTokens';
import { AiSessionProposalCard } from './AiSessionProposalCard';

export interface AiSessionProposalListProps {
  proposals: readonly TaskProposal[];
  /** redux tasks — resolve update/delete proposal targets by id */
  tasks: Task[];
  messageId: string;
  getProposalStatus: (messageId: string, proposalId: string) => ProposalStatus;
}

export function AiSessionProposalList({
  proposals,
  tasks,
  messageId,
  getProposalStatus,
}: AiSessionProposalListProps) {
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null);

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

  if (proposals.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {proposals.map((proposal) => (
        <AiSessionProposalCard
          key={proposal.id}
          proposal={proposal}
          payload={proposal.payload}
          existingTask={resolveExistingTask(proposal)}
          proposalStatus={getProposalStatus(messageId, proposal.id)}
          isExpanded={expandedProposalId === proposal.id}
          onToggleExpand={() => handleToggleExpand(proposal.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: CHAT_SESSION_RESPONSE_GAP,
    gap: CHAT_SESSION_RESPONSE_GAP,
  },
});
