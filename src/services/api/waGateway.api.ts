/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFetchClient } from '../http/fetcher';

const ROOT_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '') ?? '';

const rootUrl = createFetchClient({ baseUrl: ROOT_BASE });

export type WaAgentSettings = {
  enabled: boolean;
  use_ai: boolean;
  block_after_handoff: boolean;
  handoff_ttl_ms: number;
};

export async function getWaAgentSettings() {
  return rootUrl.request<WaAgentSettings>('/wa/agent/settings', { method: 'GET' });
}

export async function updateWaAgentSettings(payload: {
  enabled?: boolean;
  use_ai?: boolean;
  useAI?: boolean;
  block_after_handoff?: boolean;
  blockAfterHandoff?: boolean;
  handoff_ttl_ms?: number;
  handoffTtlMs?: number;
}) {
  return rootUrl.request<WaAgentSettings>('/wa/agent/settings', {
    method: 'POST',
    json: payload,
  });
}
