/**
 * useAiAssistant — chat + proposal state for the AI tab.
 *
 * Flow:
 * 1. sendMessage → llmApiService (Django → Gemini) → append assistant reply + proposals
 * 2. updateProposalPayload → local edits before confirm (no API yet)
 * 3. confirmProposal → dispatch existing Redux task thunks (create/update/delete)
 * 4. dismissProposal → hide proposal without touching tasks
 */

import { useCallback, useMemo, useState } from 'react';
import llmApiService, { mapLlmErrorToUserMessage } from '@/services/api/llm';
import { useAppDispatch } from '@/store';
import { createTask, deleteTask, updateTask } from '@/store/slices/tasks/tasksSlice';
import type {
  AiChatMessage,
  CreateProposalPayload,
  DeleteProposalPayload,
  ProposalStatus,
  TaskProposal,
  TaskProposalPayload,
  UpdateProposalPayload,
} from '@/types/api/llm';
import type { CreateTaskInput } from '@/types/common/Task';

/** build a stable key for proposal UI state maps */
function proposalKey(messageId: string, proposalId: string): string {
  return `${messageId}:${proposalId}`;
}

function newMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** gemini sometimes returns YYYY-MM-DD — redux/tasks expect ISO strings */
function normalizeDueDateForCreate(dueDate?: string): string | undefined {
  if (!dueDate) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return `${dueDate}T12:00:00.000Z`;
  }
  return dueDate;
}

function toCreateTaskInput(payload: CreateProposalPayload): CreateTaskInput {
  return {
    title: payload.title.trim(),
    description: payload.description,
    icon: payload.icon,
    time: payload.time,
    duration: payload.duration,
    dueDate: normalizeDueDateForCreate(payload.dueDate),
    priorityLevel: payload.priorityLevel,
    color: payload.color,
    routineType: payload.routineType,
    listId: payload.listId ?? undefined,
    sortOrder: payload.sortOrder,
    metadata: payload.metadata,
    isCompleted: payload.isCompleted,
  };
}

export function useAiAssistant() {
  const dispatch = useAppDispatch();

  // chat bubbles shown in the AI tab
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // edited proposal payloads before user taps Confirm
  const [editedPayloads, setEditedPayloads] = useState<Record<string, TaskProposalPayload>>({});
  // per-proposal UI status (pending → confirming → confirmed / failed / dismissed)
  const [proposalStatuses, setProposalStatuses] = useState<Record<string, ProposalStatus>>({});
  const [proposalErrors, setProposalErrors] = useState<Record<string, string>>({});

  const getProposalPayload = useCallback(
    (messageId: string, proposal: TaskProposal): TaskProposalPayload => {
      const key = proposalKey(messageId, proposal.id);
      return editedPayloads[key] ?? proposal.payload;
    },
    [editedPayloads]
  );

  const getProposalStatus = useCallback(
    (messageId: string, proposalId: string): ProposalStatus => {
      return proposalStatuses[proposalKey(messageId, proposalId)] ?? 'pending';
    },
    [proposalStatuses]
  );

  const getProposalError = useCallback(
    (messageId: string, proposalId: string): string | undefined => {
      return proposalErrors[proposalKey(messageId, proposalId)];
    },
    [proposalErrors]
  );

  const updateProposalPayload = useCallback(
    (messageId: string, proposalId: string, payload: TaskProposalPayload) => {
      const key = proposalKey(messageId, proposalId);
      setEditedPayloads((prev) => ({ ...prev, [key]: payload }));
    },
    []
  );

  const dismissProposal = useCallback((messageId: string, proposalId: string) => {
    const key = proposalKey(messageId, proposalId);
    setProposalStatuses((prev) => ({ ...prev, [key]: 'dismissed' }));
    setProposalErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const confirmProposal = useCallback(
    async (messageId: string, proposal: TaskProposal) => {
      const key = proposalKey(messageId, proposal.id);
      const status = proposalStatuses[key] ?? 'pending';
      if (status === 'confirming' || status === 'confirmed' || status === 'dismissed') {
        return;
      }

      const payload = editedPayloads[key] ?? proposal.payload;

      setProposalStatuses((prev) => ({ ...prev, [key]: 'confirming' }));
      setProposalErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      try {
        if (proposal.type === 'create') {
          const createPayload = payload as CreateProposalPayload;
          if (!createPayload.title?.trim()) {
            throw new Error('Title is required.');
          }
          // reuse the same createTask thunk as TaskQuickAddForm
          await dispatch(createTask(toCreateTaskInput(createPayload))).unwrap();
        } else if (proposal.type === 'update') {
          const updatePayload = payload as UpdateProposalPayload;
          await dispatch(
            updateTask({ id: updatePayload.taskId, updates: updatePayload.updates })
          ).unwrap();
        } else {
          const deletePayload = payload as DeleteProposalPayload;
          await dispatch(deleteTask(deletePayload.taskId)).unwrap();
        }

        setProposalStatuses((prev) => ({ ...prev, [key]: 'confirmed' }));
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not apply this change. Try again.';
        setProposalStatuses((prev) => ({ ...prev, [key]: 'failed' }));
        setProposalErrors((prev) => ({ ...prev, [key]: message }));
      }
    },
    [dispatch, editedPayloads, proposalStatuses]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setIsLoading(true);

      const userMessage: AiChatMessage = {
        id: newMessageId(),
        role: 'user',
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);

      // send prior turns + new user line so gemini can follow context
      const historyForApi = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await llmApiService.assistantChat({ messages: historyForApi });

        const assistantMessage: AiChatMessage = {
          id: newMessageId(),
          role: 'assistant',
          content: response.reply || 'Done.',
          proposals: response.proposals ?? [],
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // seed edited payloads from model output so forms start pre-filled
        if (assistantMessage.proposals?.length) {
          setEditedPayloads((prev) => {
            const next = { ...prev };
            for (const p of assistantMessage.proposals!) {
              next[proposalKey(assistantMessage.id, p.id)] = p.payload;
            }
            return next;
          });
        }
      } catch (err: unknown) {
        setError(mapLlmErrorToUserMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const clearError = useCallback(() => setError(null), []);

  /** wipe chat + proposal state — used when leaving the ai tab or tapping back to prompt */
  const resetSession = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setError(null);
    setEditedPayloads({});
    setProposalStatuses({});
    setProposalErrors({});
  }, []);

  const hasMessages = messages.length > 0;

  return useMemo(
    () => ({
      messages,
      isLoading,
      error,
      hasMessages,
      sendMessage,
      resetSession,
      getProposalPayload,
      updateProposalPayload,
      confirmProposal,
      dismissProposal,
      getProposalStatus,
      getProposalError,
      clearError,
      resetSession,
    }),
    [
      messages,
      isLoading,
      error,
      hasMessages,
      sendMessage,
      resetSession,
      getProposalPayload,
      updateProposalPayload,
      confirmProposal,
      dismissProposal,
      getProposalStatus,
      getProposalError,
      clearError,
    ]
  );
}

export type UseAiAssistantReturn = ReturnType<typeof useAiAssistant>;
