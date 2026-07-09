/**
 * LLM Assistant API Types
 *
 * Shapes for POST /llm/assistant/ — matches Django apps.llm serializers.
 * camelCase fields align with frontend Task types (CreateTaskInput, etc.).
 */

import type { CreateTaskInput, PriorityLevel, TaskColor, RoutineType } from '../common/Task';

/** one message in the chat history sent to the backend */
export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessageInput {
  role: ChatMessageRole;
  content: string;
}

/** payload for a create proposal — same fields as CreateTaskInput */
export type CreateProposalPayload = CreateTaskInput & {
  /** timed tasks only — maps to metadata.reminders after backend validation */
  alertIds?: string[];
};

/** payload for an update proposal */
export interface UpdateProposalPayload {
  taskId: string;
  updates: Partial<{
    title: string;
    description: string;
    dueDate: string | null;
    time: string | null;
    listId: string | null;
    priorityLevel: PriorityLevel;
    color: TaskColor;
    routineType: RoutineType;
    duration: number;
    isCompleted: boolean;
    /** timed tasks only — replaces reminders on confirm (merged with existing metadata) */
    alertIds?: string[];
    metadata?: Partial<CreateTaskInput['metadata']>;
  }>;
}

/** payload for a delete proposal */
export interface DeleteProposalPayload {
  taskId: string;
}

export type ProposalType = 'create' | 'update' | 'delete';

export type TaskProposalPayload =
  | CreateProposalPayload
  | UpdateProposalPayload
  | DeleteProposalPayload;

/** one suggested action from the assistant — not executed until user confirms */
export interface TaskProposal {
  id: string;
  type: ProposalType;
  summary: string;
  payload: TaskProposalPayload;
}

/** request body for POST /llm/assistant/ */
export interface AssistantRequest {
  messages: ChatMessageInput[];
}

/** response from POST /llm/assistant/ */
export interface AssistantResponse {
  reply: string;
  proposals: TaskProposal[];
  meta?: {
    provider?: string;
    model?: string;
  };
}

/** chat bubble in the AI tab UI (local state — includes optional proposals) */
export interface AiChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  proposals?: TaskProposal[];
  /** set after user confirms or dismisses proposals on this turn */
  proposalStatuses?: Record<string, 'pending' | 'confirmed' | 'dismissed' | 'failed'>;
}

export type ProposalStatus = 'pending' | 'confirming' | 'confirmed' | 'failed' | 'dismissed' | 'undoing';
