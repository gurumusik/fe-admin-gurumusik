// src/services/api/program.api.ts
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';
import type {
  Program,
  ProgramListResp,
  FetchProgramsParams,
  CreateProgramPayload,
} from '@/features/slices/program/types';

const unwrapProgram = (payload: Program | { data?: Program } | null | undefined): Program => {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data) {
    return payload.data;
  }
  return payload as Program;
};

export async function listPrograms(params?: FetchProgramsParams) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString() ? `?${q.toString()}` : '';

  return baseUrl.request<ProgramListResp>(
    `${ENDPOINTS.PROGRAMS.LIST}${qs}`,
    { method: 'GET' }
  );
}

export async function createProgram(payload: CreateProgramPayload) {
  const res = await baseUrl.request<Program | { message?: string; data: Program }>(
    ENDPOINTS.PROGRAMS.CREATE,
    {
      method: 'POST',
      json: payload,
    }
  );
  return unwrapProgram(res);
}

// (opsional) detail by id
export async function getProgramDetail(id: number | string) {
  const res = await baseUrl.request<Program | { data?: Program }>(ENDPOINTS.PROGRAMS.DETAIL(id), {
    method: 'GET',
  });
  return unwrapProgram(res);
}

export async function updateProgram(
  id: number | string,
  payload: Partial<CreateProgramPayload>
) {
  const res = await baseUrl.request<Program | { data?: Program }>(ENDPOINTS.PROGRAMS.UPDATE(id), {
    method: 'PUT',
    json: payload,
  });
  return unwrapProgram(res);
}

export async function deleteProgram(id: number | string) {
  return baseUrl.request<{ message: string }>(
    ENDPOINTS.PROGRAMS.DELETE(id),
    { method: 'DELETE' }
  );
}
