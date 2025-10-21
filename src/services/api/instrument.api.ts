// src/services/api/instrument.api.ts
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

/* ========================= TYPES ========================= */

export type InstrumentDTO = {
  id: number;
  nama_instrumen: string;
  icon: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ListInstrumentsResp = {
  total: number;
  page: number;
  limit: number;
  data: InstrumentDTO[];
};

export type CreateInstrumentPayload = {
  nama_instrumen: string;
  icon_base64?: string;
  icon_url?: string;
};

/**
 * Payload untuk PUT /instruments/master/:id
 * - Bisa hanya update nama/icon
 * - Atau sekaligus jalankan “wizard sync” bila kirim program_id + rows
 */
export type UpdateInstrumentPayload = {
  nama_instrumen?: string;
  icon_base64?: string | null;
  icon_url?: string | null;

  // Optional wizard fields (sinkronisasi detail_program)
  program_id?: number;
  rows?: Array<{
    nama_grade: string;
    base_harga: number;
  }>;
};

/** (Opsional) Payload khusus jika tetap ingin pakai endpoint wizard terpisah */
export type UpdateInstrumentWizardPayload = {
  instrument_id: number;
  nama_instrumen: string;
  icon_base64?: string | null;
  program_id: number;
  rows: Array<{ nama_grade: string; base_harga: number }>;
};

/* ========================= API CALLS ========================= */

export async function listInstruments(params?: { q?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const qstr = qs.toString() ? `?${qs.toString()}` : '';
  return baseUrl.request<ListInstrumentsResp>(
    `${ENDPOINTS.INSTRUMENTS.LIST}${qstr}`,
    { method: 'GET' }
  );
}

export async function getInstrument(id: number) {
  return baseUrl.request<InstrumentDTO>(
    ENDPOINTS.INSTRUMENTS.GET(id),
    { method: 'GET' }
  );
}

export async function createInstrument(payload: CreateInstrumentPayload) {
  return baseUrl.request<{ message: string; data: InstrumentDTO }>(
    ENDPOINTS.INSTRUMENTS.CREATE,
    { method: 'POST', json: payload }
  );
}

export async function updateInstrument(id: number | string, payload: UpdateInstrumentPayload) {
  return baseUrl.request<{ message: string; data: InstrumentDTO }>(
    ENDPOINTS.INSTRUMENTS.UPDATE(id),
    { method: 'PUT', json: payload }
  );
}

export async function deleteInstrument(id: number | string) {
  return baseUrl.request<{ message: string }>(
    ENDPOINTS.INSTRUMENTS.DELETE(id),
    { method: 'DELETE' }
  );
}

/**
 * (Opsional) Endpoint wizard terpisah.
 * Rekomendasi saat ini: gunakan `updateInstrument(id, payload)` saja,
 * karena backend-mu sudah mendukung wizard via PUT /master/:id.
 */
export async function updateInstrumentWizard(payload: UpdateInstrumentWizardPayload) {
  return baseUrl.request<{ message: string; data?: { id: number } }>(
    ENDPOINTS.INSTRUMENTS.WIZARD,
    { method: 'PUT', json: payload }
  );
}

/* ========================= HELPERS ========================= */

export function resolveIconUrl(icon: string | null): string | null {
  if (!icon) return null;
  if (/^https?:\/\//i.test(icon)) return icon;
  const base =
    import.meta.env.VITE_API_BASE_URL
      ?.replace(/\/api\/v1\/?$/, '')
      ?.replace(/\/$/, '') ?? '';
  return icon.startsWith('/') ? `${base}${icon}` : `${base}/${icon}`;
}
