/**
 * Lists API — talks to Django /lists/ (apps.lists).
 * Django sends snake_case; we map to the app List type (camelCase + Date objects).
 */

import axios from 'axios';
import apiClient from './client';
import type { List, CreateListInput, UpdateListInput } from '@/types';

/** raw JSON from ListSerializer (snake_case) */
export type ListApiRecord = Record<string, unknown>;

export function getListApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const d = error.response?.data as Record<string, unknown> | string | undefined;
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') {
      if (typeof d.detail === 'string') return d.detail;
      if (Array.isArray(d.detail)) return JSON.stringify(d.detail);
      if (typeof d.message === 'string') return d.message;
      const firstKey = Object.keys(d)[0];
      if (firstKey && Array.isArray(d[firstKey])) return `${firstKey}: ${(d[firstKey] as string[]).join(', ')}`;
    }
    return error.message || 'Request failed';
  }
  return error instanceof Error ? error.message : 'Request failed';
}

/** turn one DRF list object into our List shape */
export function mapApiListToList(raw: ListApiRecord): List {
  const metaIn = (raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(raw.id ?? ''),
    userId: String(raw.user ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    color: (raw.color as List['color']) || 'blue',
    icon: String(raw.icon ?? ''),
    isDefault: Boolean(raw.is_default),
    sortOrder: Number(raw.sort_order ?? 0),
    metadata: {
      ...metaIn,
      taskCount: Number(raw.task_count ?? metaIn.taskCount ?? 0),
      completedTaskCount: Number(raw.completed_task_count ?? metaIn.completedTaskCount ?? 0),
    },
    softDeleted: Boolean(raw.soft_deleted),
    createdAt: new Date(String(raw.created_at ?? '')),
    updatedAt: new Date(String(raw.updated_at ?? '')),
  };
}

function toCreateBody(data: CreateListInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: data.name,
    description: data.description ?? '',
    color: data.color ?? 'blue',
    icon: data.icon ?? '',
  };
  if (data.sortOrder !== undefined) body.sort_order = data.sortOrder;
  if (data.metadata && Object.keys(data.metadata).length > 0) body.metadata = data.metadata;
  return body;
}

function toPatchBody(updates: Omit<UpdateListInput, 'id'>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.color !== undefined) body.color = updates.color;
  if (updates.icon !== undefined) body.icon = updates.icon;
  if (updates.sortOrder !== undefined) body.sort_order = updates.sortOrder;
  if (updates.metadata !== undefined) body.metadata = updates.metadata;
  return body;
}

class ListsApiService {
  async fetchLists(): Promise<List[]> {
    const { data } = await apiClient.get<ListApiRecord[]>('/lists/');
    const rows = Array.isArray(data) ? data : [];
    return rows.map((row) => mapApiListToList(row));
  }

  async createList(input: CreateListInput): Promise<List> {
    const { data } = await apiClient.post<ListApiRecord>('/lists/', toCreateBody(input));
    return mapApiListToList(data);
  }

  async patchList(id: string, updates: Omit<UpdateListInput, 'id'>): Promise<List> {
    const { data } = await apiClient.patch<ListApiRecord>(`/lists/${id}/`, toPatchBody(updates));
    return mapApiListToList(data);
  }

  /** PATCH each id with sort_order index (after local reorder) */
  async patchSortOrders(orderedIds: string[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        apiClient.patch(`/lists/${id}/`, { sort_order: index })
      )
    );
  }

  async deleteList(id: string): Promise<void> {
    await apiClient.delete(`/lists/${id}/`);
  }

  /** tasks for a list — raw snake_case rows (use transformApiTaskToTask in UI/slice) */
  async fetchTasksForList(listId: string): Promise<unknown[]> {
    const { data } = await apiClient.get<unknown[]>(`/lists/${listId}/tasks/`);
    return Array.isArray(data) ? data : [];
  }
}

const listsApiService = new ListsApiService();
export default listsApiService;
