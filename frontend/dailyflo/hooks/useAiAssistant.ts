/**
 * useAiAssistant — chat + proposal state for the AI tab.
 *
 * Flow:
 * 1. sendMessage → llmApiService (Django → Gemini) → append assistant reply + proposals
 * 2. updateProposalPayload → local edits before confirm (no API yet)
 * 3. confirmProposal → dispatch existing Redux task thunks (create/update/delete)
 * 4. dismissProposal → hide proposal without touching tasks
 * 5. undoProposal → reverse a confirmed create/update/delete
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import llmApiService, { mapLlmErrorToUserMessage } from '@/services/api/llm';
import tasksApiService from '@/services/api/tasks';
import store, { useAppDispatch } from '@/store';
import {
  createTask,
  deleteTask,
  fetchTasks,
  optimisticUpdateTask,
  optimisticUpsertTask,
  updateTask,
} from '@/store/slices/tasks/tasksSlice';
import type {
  AiChatMessage,
  CreateProposalPayload,
  DeleteProposalPayload,
  ProposalStatus,
  TaskProposal,
  TaskProposalPayload,
  UpdateProposalPayload,
} from '@/types/api/llm';
import type { CreateTaskInput, Task } from '@/types/common/Task';

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
    // backend validator turns alertIds into metadata.reminders — keep subtasks array for api shape
    metadata: {
      subtasks: [],
      reminders: [],
      ...payload.metadata,
    },
    isCompleted: payload.isCompleted,
  };
}

/** merge partial metadata from ai updates so we do not wipe subtasks on reminder-only patches */
function mergeUpdateProposalUpdates(
  existingTask: Task,
  updates: UpdateProposalPayload['updates'],
): UpdateProposalPayload['updates'] {
  if (!updates?.metadata) {
    return updates;
  }
  return {
    ...updates,
    metadata: {
      ...existingTask.metadata,
      ...updates.metadata,
      subtasks: updates.metadata.subtasks ?? existingTask.metadata.subtasks ?? [],
      reminders: updates.metadata.reminders ?? existingTask.metadata.reminders ?? [],
    },
  };
}

/** pending + failed proposals can still be applied from Accept All */
function isProposalActionable(status: ProposalStatus): boolean {
  return status === 'pending' || status === 'failed';
}

/** snapshot stored after confirm so Undo can reverse the redux change */
type ProposalUndoRecord =
  | { kind: 'create'; createdTaskId: string }
  | { kind: 'update'; taskId: string; previousTask: Task }
  | { kind: 'delete'; taskId: string; previousTask: Task };

function buildReverseUpdateFields(
  previousTask: Task,
  appliedUpdates: UpdateProposalPayload['updates'],
): UpdateProposalPayload['updates'] {
  const reverseUpdates: UpdateProposalPayload['updates'] = {};
  for (const field of Object.keys(appliedUpdates ?? {}) as Array<
    keyof UpdateProposalPayload['updates']
  >) {
    reverseUpdates[field] = previousTask[field] as never;
  }
  return reverseUpdates;
}

function cloneTaskSnapshot(task: Task): Task {
  return {
    ...task,
    metadata: {
      ...task.metadata,
      subtasks: [...(task.metadata.subtasks ?? [])],
      reminders: [...(task.metadata.reminders ?? [])],
      tags: task.metadata.tags ? [...task.metadata.tags] : undefined,
      recurrence_completions: task.metadata.recurrence_completions
        ? [...task.metadata.recurrence_completions]
        : undefined,
      recurrence_exceptions: task.metadata.recurrence_exceptions
        ? [...task.metadata.recurrence_exceptions]
        : undefined,
    },
  };
}

/** strip proposal ui maps for one assistant message — used when replacing a turn on resend */
function withoutProposalStateForMessage(
  messageId: string,
  editedPayloads: Record<string, TaskProposalPayload>,
  proposalStatuses: Record<string, ProposalStatus>,
  proposalErrors: Record<string, string>,
  proposalUndoRecords: Record<string, ProposalUndoRecord>,
) {
  const prefix = `${messageId}:`;
  const stripKeys = <T extends Record<string, unknown>>(map: T): T => {
    const next = { ...map };
    for (const key of Object.keys(next)) {
      if (key.startsWith(prefix)) {
        delete next[key];
      }
    }
    return next;
  };

  return {
    editedPayloads: stripKeys(editedPayloads),
    proposalStatuses: stripKeys(proposalStatuses),
    proposalErrors: stripKeys(proposalErrors),
    proposalUndoRecords: stripKeys(proposalUndoRecords),
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
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  // saved after confirm — powers per-proposal Undo
  const [proposalUndoRecords, setProposalUndoRecords] = useState<Record<string, ProposalUndoRecord>>({});

  // ref stays in sync so confirmAll can read fresh status mid-async loop
  const proposalStatusesRef = useRef(proposalStatuses);
  proposalStatusesRef.current = proposalStatuses;
  const proposalUndoRecordsRef = useRef(proposalUndoRecords);
  proposalUndoRecordsRef.current = proposalUndoRecords;
  // tracks in-flight create so undo during api can cancel the new task
  const createInFlightRef = useRef<Record<string, Promise<string>>>({});

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

  const getPendingProposals = useCallback(
    (messageId: string): TaskProposal[] => {
      const message = messages.find((entry) => entry.id === messageId);
      if (!message?.proposals?.length) return [];
      return message.proposals.filter((proposal) =>
        isProposalActionable(
          proposalStatusesRef.current[proposalKey(messageId, proposal.id)] ?? 'pending',
        ),
      );
    },
    [messages],
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
    const next = { ...proposalStatusesRef.current, [key]: 'dismissed' as const };
    proposalStatusesRef.current = next;
    setProposalStatuses(next);
    setProposalErrors((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    const nextUndoRecords = { ...proposalUndoRecordsRef.current };
    delete nextUndoRecords[key];
    proposalUndoRecordsRef.current = nextUndoRecords;
    setProposalUndoRecords(nextUndoRecords);
  }, []);

  const confirmProposal = useCallback(
    (messageId: string, proposal: TaskProposal) => {
      const key = proposalKey(messageId, proposal.id);
      const status = proposalStatusesRef.current[key] ?? 'pending';
      if (status === 'confirmed' || status === 'dismissed') {
        return;
      }

      const payload = editedPayloads[key] ?? proposal.payload;
      setProposalErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      let undoRecord: ProposalUndoRecord | undefined;

      try {
        if (proposal.type === 'create') {
          const createPayload = payload as CreateProposalPayload;
          if (!createPayload.title?.trim()) {
            throw new Error('Title is required.');
          }
        } else if (proposal.type === 'update') {
          const updatePayload = payload as UpdateProposalPayload;
          const existingTask = store
            .getState()
            .tasks.tasks.find((task) => task.id === updatePayload.taskId);
          if (!existingTask) {
            throw new Error('Task not found.');
          }
          undoRecord = {
            kind: 'update',
            taskId: updatePayload.taskId,
            previousTask: cloneTaskSnapshot(existingTask),
          };
          const mergedUpdates = mergeUpdateProposalUpdates(existingTask, updatePayload.updates);
          // updateTask.pending applies changes immediately in redux
          dispatch(updateTask({ id: updatePayload.taskId, updates: mergedUpdates }));
        } else {
          const deletePayload = payload as DeleteProposalPayload;
          const existingTask = store
            .getState()
            .tasks.tasks.find((task) => task.id === deletePayload.taskId);
          if (!existingTask) {
            throw new Error('Task not found.');
          }
          undoRecord = {
            kind: 'delete',
            taskId: deletePayload.taskId,
            previousTask: cloneTaskSnapshot(existingTask),
          };
          dispatch(
            optimisticUpdateTask({
              id: deletePayload.taskId,
              updates: { softDeleted: true },
            }),
          );
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not apply this change. Try again.';
        const nextFailed = { ...proposalStatusesRef.current, [key]: 'failed' as const };
        proposalStatusesRef.current = nextFailed;
        setProposalStatuses(nextFailed);
        setProposalErrors((prev) => ({ ...prev, [key]: message }));
        return;
      }

      if (undoRecord) {
        const nextUndo = { ...proposalUndoRecordsRef.current, [key]: undoRecord };
        proposalUndoRecordsRef.current = nextUndo;
        setProposalUndoRecords(nextUndo);
      }

      // confirmed immediately — indicator/pill cross-fades without waiting on api
      const nextConfirmed = { ...proposalStatusesRef.current, [key]: 'confirmed' as const };
      proposalStatusesRef.current = nextConfirmed;
      setProposalStatuses(nextConfirmed);

      void (async () => {
        try {
          if (proposal.type === 'create') {
            const createPayload = payload as CreateProposalPayload;
            const createPromise = dispatch(createTask(toCreateTaskInput(createPayload)))
              .unwrap()
              .then((createdTask) => {
                if (proposalStatusesRef.current[key] === 'pending') {
                  void dispatch(deleteTask(createdTask.id));
                  return createdTask.id;
                }
                const createUndo: ProposalUndoRecord = {
                  kind: 'create',
                  createdTaskId: createdTask.id,
                };
                const nextUndo = { ...proposalUndoRecordsRef.current, [key]: createUndo };
                proposalUndoRecordsRef.current = nextUndo;
                setProposalUndoRecords(nextUndo);
                return createdTask.id;
              })
              .finally(() => {
                delete createInFlightRef.current[key];
              });
            createInFlightRef.current[key] = createPromise;
            await createPromise;
          } else if (proposal.type === 'update') {
            const updatePayload = payload as UpdateProposalPayload;
            const existingTask = store
              .getState()
              .tasks.tasks.find((task) => task.id === updatePayload.taskId);
            const mergedUpdates = existingTask
              ? mergeUpdateProposalUpdates(existingTask, updatePayload.updates)
              : updatePayload.updates;
            await dispatch(
              updateTask({ id: updatePayload.taskId, updates: mergedUpdates }),
            ).unwrap();
          } else {
            const deletePayload = payload as DeleteProposalPayload;
            await dispatch(deleteTask(deletePayload.taskId)).unwrap();
          }
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Could not apply this change. Try again.';

          if (proposal.type === 'update' && undoRecord?.kind === 'update') {
            const updatePayload = payload as UpdateProposalPayload;
            dispatch(
              optimisticUpdateTask({
                id: undoRecord.taskId,
                updates: buildReverseUpdateFields(
                  undoRecord.previousTask,
                  updatePayload.updates ?? {},
                ),
              }),
            );
          } else if (proposal.type === 'delete' && undoRecord?.kind === 'delete') {
            dispatch(optimisticUpsertTask(undoRecord.previousTask));
          } else if (proposal.type === 'create') {
            delete createInFlightRef.current[key];
          }

          const nextFailed = { ...proposalStatusesRef.current, [key]: 'failed' as const };
          proposalStatusesRef.current = nextFailed;
          setProposalStatuses(nextFailed);
          setProposalErrors((prev) => ({ ...prev, [key]: message }));

          const nextUndoRecords = { ...proposalUndoRecordsRef.current };
          delete nextUndoRecords[key];
          proposalUndoRecordsRef.current = nextUndoRecords;
          setProposalUndoRecords(nextUndoRecords);
        }
      })();
    },
    [dispatch, editedPayloads],
  );

  const confirmAllProposals = useCallback(
    async (messageId: string) => {
      if (isConfirmingAll) return;

      setIsConfirmingAll(true);
      try {
        const message = messages.find((entry) => entry.id === messageId);
        if (!message?.proposals?.length) return;

        // apply each pending/failed proposal in order — ref keeps status fresh between awaits
        while (true) {
          const pending = message.proposals.filter((proposal) =>
            isProposalActionable(
              proposalStatusesRef.current[proposalKey(messageId, proposal.id)] ?? 'pending',
            ),
          );
          if (pending.length === 0) break;
          confirmProposal(messageId, pending[0]);
        }
      } finally {
        setIsConfirmingAll(false);
      }
    },
    [confirmProposal, isConfirmingAll, messages],
  );

  const undoProposal = useCallback(
    (messageId: string, proposal: TaskProposal) => {
      const key = proposalKey(messageId, proposal.id);
      const status = proposalStatusesRef.current[key] ?? 'pending';
      if (status !== 'confirmed') {
        return;
      }

      const undoRecord = proposalUndoRecordsRef.current[key];
      const updatePayload = (editedPayloads[key] ?? proposal.payload) as UpdateProposalPayload;

      // pending immediately — indicator/pill cross-fades without waiting on api
      const nextPending = { ...proposalStatusesRef.current, [key]: 'pending' as const };
      proposalStatusesRef.current = nextPending;
      setProposalStatuses(nextPending);
      setProposalErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      const nextUndoRecords = { ...proposalUndoRecordsRef.current };
      delete nextUndoRecords[key];
      proposalUndoRecordsRef.current = nextUndoRecords;
      setProposalUndoRecords(nextUndoRecords);

      if (proposal.type === 'update' && undoRecord?.kind === 'update') {
        dispatch(
          updateTask({
            id: undoRecord.taskId,
            updates: buildReverseUpdateFields(
              undoRecord.previousTask,
              updatePayload.updates ?? {},
            ),
          }),
        );
      } else if (proposal.type === 'delete' && undoRecord?.kind === 'delete') {
        dispatch(optimisticUpsertTask({ ...undoRecord.previousTask, softDeleted: false }));
      }

      void (async () => {
        try {
          if (proposal.type === 'create') {
            let createdTaskId =
              undoRecord?.kind === 'create' ? undoRecord.createdTaskId : undefined;
            if (!createdTaskId) {
              const inFlight = createInFlightRef.current[key];
              if (inFlight) {
                createdTaskId = await inFlight;
              }
            }
            if (!createdTaskId) {
              throw new Error('Could not undo this change. Try again.');
            }
            dispatch(
              optimisticUpdateTask({
                id: createdTaskId,
                updates: { softDeleted: true },
              }),
            );
            await dispatch(deleteTask(createdTaskId)).unwrap();
          } else if (proposal.type === 'update' && undoRecord?.kind === 'update') {
            await dispatch(
              updateTask({
                id: undoRecord.taskId,
                updates: buildReverseUpdateFields(
                  undoRecord.previousTask,
                  updatePayload.updates ?? {},
                ),
              }),
            ).unwrap();
          } else if (proposal.type === 'delete' && undoRecord?.kind === 'delete') {
            await tasksApiService.restoreTask(undoRecord.taskId);
            await dispatch(fetchTasks()).unwrap();
          }
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Could not undo this change. Try again.';

          if (proposal.type === 'update' && undoRecord?.kind === 'update') {
            dispatch(
              updateTask({ id: undoRecord.taskId, updates: updatePayload.updates ?? {} }),
            );
          } else if (proposal.type === 'delete' && undoRecord?.kind === 'delete') {
            dispatch(
              optimisticUpdateTask({
                id: undoRecord.taskId,
                updates: { softDeleted: true },
              }),
            );
          }

          const nextConfirmed = { ...proposalStatusesRef.current, [key]: 'confirmed' as const };
          proposalStatusesRef.current = nextConfirmed;
          setProposalStatuses(nextConfirmed);

          if (undoRecord) {
            const restoredUndo = { ...proposalUndoRecordsRef.current, [key]: undoRecord };
            proposalUndoRecordsRef.current = restoredUndo;
            setProposalUndoRecords(restoredUndo);
          }

          setProposalErrors((prev) => ({ ...prev, [key]: message }));
        }
      })();
    },
    [dispatch, editedPayloads],
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

  /** resend edited prompt — only the new user line goes to the api (saves tokens) */
  const resendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setIsLoading(true);

      // edited prompt is a fresh request — clear old proposal ui state from the previous reply
      setEditedPayloads({});
      setProposalStatuses({});
      proposalStatusesRef.current = {};
      setProposalErrors({});
      setProposalUndoRecords({});
      proposalUndoRecordsRef.current = {};
      createInFlightRef.current = {};
      setIsConfirmingAll(false);

      const userMessage: AiChatMessage = {
        id: newMessageId(),
        role: 'user',
        content: trimmed,
      };

      // local chat state mirrors what we send — one user line, then a new assistant reply
      setMessages([userMessage]);

      try {
        const response = await llmApiService.assistantChat({
          messages: [{ role: 'user', content: trimmed }],
        });

        const assistantMessage: AiChatMessage = {
          id: newMessageId(),
          role: 'assistant',
          content: response.reply || 'Done.',
          proposals: response.proposals ?? [],
        };

        setMessages((prev) => [...prev, assistantMessage]);

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
    [isLoading],
  );

  const clearError = useCallback(() => setError(null), []);

  /** wipe chat + proposal state — used when leaving the ai tab or tapping back to prompt */
  const resetSession = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setError(null);
    setEditedPayloads({});
    setProposalStatuses({});
    proposalStatusesRef.current = {};
    setProposalErrors({});
    setProposalUndoRecords({});
    proposalUndoRecordsRef.current = {};
    createInFlightRef.current = {};
    setIsConfirmingAll(false);
  }, []);

  const hasMessages = messages.length > 0;

  return useMemo(
    () => ({
      messages,
      isLoading,
      error,
      hasMessages,
      isConfirmingAll,
      sendMessage,
      resendMessage,
      resetSession,
      getProposalPayload,
      updateProposalPayload,
      confirmProposal,
      confirmAllProposals,
      dismissProposal,
      undoProposal,
      getProposalStatus,
      getProposalError,
      getPendingProposals,
      clearError,
    }),
    [
      messages,
      isLoading,
      error,
      hasMessages,
      isConfirmingAll,
      sendMessage,
      resendMessage,
      resetSession,
      getProposalPayload,
      updateProposalPayload,
      confirmProposal,
      confirmAllProposals,
      dismissProposal,
      undoProposal,
      getProposalStatus,
      getProposalError,
      getPendingProposals,
      clearError,
    ]
  );
}

export type UseAiAssistantReturn = ReturnType<typeof useAiAssistant>;
