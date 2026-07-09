/**
 * maps ai task proposals into a Task shape so TaskCard can render title + metadata read-only.
 */

import type { Task } from '@/types';
import type {
  CreateProposalPayload,
  DeleteProposalPayload,
  TaskProposal,
  TaskProposalPayload,
  UpdateProposalPayload,
} from '@/types/api/llm';

/** placeholder task fields for create previews and missing update/delete targets */
const PROPOSAL_PREVIEW_TASK_BASE: Task = {
  id: 'proposal-preview',
  userId: 'preview',
  listId: null,
  title: 'Untitled task',
  description: '',
  duration: 0,
  dueDate: null,
  isCompleted: false,
  completedAt: null,
  priorityLevel: 3,
  color: 'blue',
  routineType: 'once',
  sortOrder: 0,
  metadata: { subtasks: [], reminders: [] },
  softDeleted: false,
  createdAt: '',
  updatedAt: '',
};

function normalizeDueDate(dueDate?: string | null): string | null {
  if (!dueDate) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return `${dueDate}T12:00:00.000Z`;
  }
  return dueDate;
}

/** merge proposal payload with an optional existing task for display-only TaskCard rows */
export function buildDisplayTaskFromProposal(
  proposal: TaskProposal,
  payload: TaskProposalPayload,
  existingTask?: Task,
): Task {
  if (proposal.type === 'create') {
    const createPayload = payload as CreateProposalPayload;
    return {
      ...PROPOSAL_PREVIEW_TASK_BASE,
      id: `proposal-${proposal.id}`,
      title: createPayload.title?.trim() || 'Untitled task',
      description: createPayload.description ?? '',
      icon: createPayload.icon,
      time: createPayload.time,
      duration: createPayload.duration ?? 0,
      dueDate: normalizeDueDate(createPayload.dueDate),
      priorityLevel: createPayload.priorityLevel ?? 3,
      color: createPayload.color ?? 'blue',
      routineType: createPayload.routineType ?? 'once',
      listId: createPayload.listId ?? null,
      isCompleted: createPayload.isCompleted ?? false,
      metadata: createPayload.metadata ?? { subtasks: [], reminders: [] },
    };
  }

  if (proposal.type === 'update') {
    const updatePayload = payload as UpdateProposalPayload;
    const base =
      existingTask ??
      ({
        ...PROPOSAL_PREVIEW_TASK_BASE,
        id: updatePayload.taskId,
        title: 'Unknown task',
      } satisfies Task);
    const updates = updatePayload.updates ?? {};

    return {
      ...base,
      ...updates,
      listId: updates.listId !== undefined ? updates.listId : base.listId,
      dueDate:
        updates.dueDate !== undefined ? normalizeDueDate(updates.dueDate) : base.dueDate,
      metadata:
        updates.metadata !== undefined
          ? {
              ...base.metadata,
              ...updates.metadata,
              subtasks: updates.metadata.subtasks ?? base.metadata.subtasks,
              reminders: updates.metadata.reminders ?? base.metadata.reminders,
            }
          : base.metadata,
    };
  }

  const deletePayload = payload as DeleteProposalPayload;
  return (
    existingTask ?? {
      ...PROPOSAL_PREVIEW_TASK_BASE,
      id: deletePayload.taskId,
      title: 'Unknown task',
    }
  );
}
