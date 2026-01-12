import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';
import type {
  ListPayoutGuruResp,
  ListPayoutGuruParams,
  PayoutGuruDTO,
  DecidePayoutGuruReq,
  DecidePayoutGuruResp,
  SendSlipKomisiReq,
  SendSlipKomisiResp,
} from '@/features/slices/payoutGuru/types';

/* ========================= API CALLS ========================= */

export async function listPayoutGuru(params?: ListPayoutGuruParams) {
  const qs = new URLSearchParams();

  // dukung "q" maupun "search" → kirim sebagai "search" ke backend
  if (params?.q) qs.set('search', params.q);
  if (params?.search) qs.set('search', params.search);

  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.id_guru) qs.set('id_guru', String(params.id_guru));
  if (params?.status) qs.set('status', params.status);
  if (params?.metode) qs.set('metode', params.metode);
  if (params?.type) qs.set('type', params.type);
  if (params?.requested_from) qs.set('requested_from', params.requested_from);
  if (params?.requested_to) qs.set('requested_to', params.requested_to);
  if (params?.sort_by) qs.set('sort_by', params.sort_by);
  if (params?.sort_dir) qs.set('sort_dir', params.sort_dir);

  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<ListPayoutGuruResp>(
    `${ENDPOINTS.PAYOUT_GURU.LIST()}${qstr}`,
    { method: 'GET' }
  );
}

/** Detail by id (opsional) */
export async function getPayoutGuru(id: number | string) {
  return baseUrl.request<PayoutGuruDTO>(
    ENDPOINTS.PAYOUT_GURU.ITEM(id),
    { method: 'GET' }
  );
}

/**
 * PUT keputusan approve / reject
 * - approve: { action: 'approve' }
 * - reject : { action: 'reject', reason: 'alasan wajib' }
 *
 * Catatan:
 * - backend membaca user aktif dari auth / header `x-user-id` (diinterceptor global).
 */
export async function decidePayoutGuru(
  id: number | string,
  payload: DecidePayoutGuruReq
) {
  // kalau pakai wrapper fetch sendiri yang otomatis set JSON, cukup kirim body: payload.
  // di bawah ini aman untuk kebanyakan wrapper (set JSON body + header).
  return baseUrl.request<DecidePayoutGuruResp>(
    ENDPOINTS.PAYOUT_GURU.DECISION(id),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
}

/** helper: approve */
export async function approvePayoutGuru(id: number | string) {
  return decidePayoutGuru(id, { action: 'approve' });
}

/** helper: reject (reason wajib) */
export async function rejectPayoutGuru(id: number | string, reason: string) {
  return decidePayoutGuru(id, { action: 'reject', reason });
}

/**
 * POST kirim slip komisi (update payout ke paid)
 */
export async function sendSlipKomisi(payload: SendSlipKomisiReq) {
  return baseUrl.request<SendSlipKomisiResp>(
    ENDPOINTS.PAYOUT_GURU.SEND_SLIP(),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
}

/* ========================= HELPERS (opsional) ========================= */

export function formatIDRCurrency(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return String(n);
  }
}

export function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base =
    import.meta.env.VITE_API_BASE_URL
      ?.replace(/\/api\/v1\/?$/, '')
      ?.replace(/\/$/, '') ?? '';
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}
