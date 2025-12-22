// src/services/api/paket.api.ts
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';
import type {
  Paket,
  ListPaketResponse,
  FetchPaketParams,
  CreatePaketPayload,
} from '@/features/slices/paket/types';

export async function listPaket(_params?: FetchPaketParams) {
  return listPaketGrouped();
}

export async function listPaketGrouped() {
  return baseUrl.request<ListPaketResponse>(ENDPOINTS.PAKET.GROUPED, {
    method: 'GET',
  });
}

export async function createPaket(payload: CreatePaketPayload) {
  return baseUrl.request<Paket>(ENDPOINTS.PAKET.CREATE, {
    method: 'POST',
    json: payload,
  });
}

export async function getPaketDetail(id: number | string) {
  return baseUrl.request<Paket>(ENDPOINTS.PAKET.DETAIL(id), {
    method: 'GET',
  });
}

export async function updatePaket(
  id: number | string,
  payload: Partial<CreatePaketPayload>
) {
  return baseUrl.request<Paket>(ENDPOINTS.PAKET.UPDATE(id), {
    method: 'PUT',
    json: payload,
  });
}

export async function deletePaket(id: number | string) {
  return baseUrl.request<{ message?: string; id?: number | string }>(
    ENDPOINTS.PAKET.DELETE(id),
    { method: 'DELETE' }
  );
}
