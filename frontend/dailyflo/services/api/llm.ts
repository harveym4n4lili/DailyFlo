/**
 * LLM API Service
 *
 * Calls Django POST /llm/assistant/ — never talks to Gemini directly.
 * The backend holds GOOGLE_AI_API_KEY; this service only needs the user's JWT
 * (added automatically by apiClient, same as tasks and auth).
 *
 * Flow: AI tab hook → llmApiService.assistantChat() → Django → Gemini → proposals
 */

import axios, { AxiosError } from 'axios';
import apiClient from './client';
import type { AssistantRequest, AssistantResponse } from '../../types/api/llm';

/** LLM calls can take longer than normal CRUD — 60s timeout on this route only */
const LLM_REQUEST_TIMEOUT_MS = 60000;

class LlmApiService {
  /**
   * Send chat messages and receive assistant reply + task proposals.
   * Proposals are suggestions only — confirm in UI before dispatching Redux CRUD.
   */
  async assistantChat(body: AssistantRequest): Promise<AssistantResponse> {
    const response = await apiClient.post<AssistantResponse>('/llm/assistant/', body, {
      timeout: LLM_REQUEST_TIMEOUT_MS,
    });
    return response.data;
  }
}

const llmApiService = new LlmApiService();
export default llmApiService;

/**
 * Map axios / Django errors to short user-facing strings for the AI tab.
 */
export function mapLlmErrorToUserMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong. Please try again.';
  }

  const axiosError = error as AxiosError<{ detail?: string }>;
  const status = axiosError.response?.status;
  const detail = axiosError.response?.data?.detail;

  if (axiosError.code === 'ECONNABORTED' || status === 504) {
    return 'The assistant took too long to respond. Please try again.';
  }

  if (!axiosError.response) {
    return 'Could not reach the assistant. Check your connection.';
  }

  if (status === 401) {
    return 'Your session expired. Please log in again.';
  }

  if (status === 400 && detail) {
    return detail;
  }

  if (status === 503) {
    return detail || 'The assistant is unavailable right now. Please try again later.';
  }

  if (detail) {
    return detail;
  }

  return 'Something went wrong. Please try again.';
}
