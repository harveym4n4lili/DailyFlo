/**
 * Scrollable chat history — bubbles + proposal cards under assistant turns.
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { FlatList, StyleSheet, ListRenderItem } from 'react-native';
import type { AiChatMessage, ProposalStatus, TaskProposal, TaskProposalPayload } from '@/types/api/llm';
import type { Task } from '@/types/common/Task';
import { AiMessageBubble } from './AiMessageBubble';
import { AiProposalCard } from './AiProposalCard';
import { Paddings } from '@/constants/Paddings';

type ListItem =
  | { kind: 'message'; message: AiChatMessage }
  | { kind: 'proposal'; messageId: string; proposal: TaskProposal };

export interface AiMessageListProps {
  messages: AiChatMessage[];
  getProposalPayload: (messageId: string, proposal: TaskProposal) => TaskProposalPayload;
  getProposalStatus: (messageId: string, proposalId: string) => ProposalStatus;
  getProposalError: (messageId: string, proposalId: string) => string | undefined;
  onUpdateProposalPayload: (
    messageId: string,
    proposalId: string,
    payload: TaskProposalPayload
  ) => void;
  onConfirmProposal: (messageId: string, proposal: TaskProposal) => void;
  onDismissProposal: (messageId: string, proposalId: string) => void;
  tasks: Task[];
}

function buildListItems(messages: AiChatMessage[]): ListItem[] {
  const items: ListItem[] = [];
  for (const message of messages) {
    items.push({ kind: 'message', message });
    if (message.role === 'assistant' && message.proposals?.length) {
      for (const proposal of message.proposals) {
        items.push({ kind: 'proposal', messageId: message.id, proposal });
      }
    }
  }
  return items;
}

export function AiMessageList({
  messages,
  getProposalPayload,
  getProposalStatus,
  getProposalError,
  onUpdateProposalPayload,
  onConfirmProposal,
  onDismissProposal,
  tasks,
}: AiMessageListProps) {
  const listRef = useRef<FlatList<ListItem>>(null);
  const items = buildListItems(messages);

  useEffect(() => {
    if (items.length === 0) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(t);
  }, [items.length, messages]);

  const resolveTaskTitle = useCallback(
    (taskId: string) => tasks.find((t) => t.id === taskId)?.title ?? 'Unknown task',
    [tasks]
  );

  const renderItem: ListRenderItem<ListItem> = useCallback(
    ({ item }) => {
      if (item.kind === 'message') {
        return <AiMessageBubble role={item.message.role} content={item.message.content} />;
      }

      const { messageId, proposal } = item;
      const payload = getProposalPayload(messageId, proposal);
      const taskId =
        proposal.type === 'update' || proposal.type === 'delete'
          ? (payload as { taskId: string }).taskId
          : undefined;

      return (
        <AiProposalCard
          proposal={proposal}
          payload={payload}
          status={getProposalStatus(messageId, proposal.id)}
          errorMessage={getProposalError(messageId, proposal.id)}
          taskTitle={taskId ? resolveTaskTitle(taskId) : undefined}
          onChangePayload={(next) => onUpdateProposalPayload(messageId, proposal.id, next)}
          onConfirm={() => onConfirmProposal(messageId, proposal)}
          onDismiss={() => onDismissProposal(messageId, proposal.id)}
        />
      );
    },
    [
      getProposalPayload,
      getProposalStatus,
      getProposalError,
      onUpdateProposalPayload,
      onConfirmProposal,
      onDismissProposal,
      resolveTaskTitle,
    ]
  );

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    if (item.kind === 'message') return item.message.id;
    return `prop-${item.messageId}-${item.proposal.id}-${index}`;
  }, []);

  return (
    <FlatList
      ref={listRef}
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.list}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingBottom: Paddings.groupedListIconTextSpacing,
  },
});
