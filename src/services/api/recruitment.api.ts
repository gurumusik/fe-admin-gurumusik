/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';
import type { GuruApplicationDTO } from '@/features/slices/guruApplication/types';

/* ========================= TYPES ========================= */

export type DecideApplicationPayload = {
  decision: 'approve' | 'reject';
  note?: string;
  cert_decisions?: Array<{
    id: number | string;
    status: 'approved' | 'rejected';
    alasan_penolakan?: string | null;
  }>;
};

export type RecruitmentListResp = {
  total: number;
  data: GuruApplicationDTO[];
};

/* ========================= API CALLS ========================= */

/**
 * GET /recruitment/applications
 * Query: ?status=proses|diterima|ditolak (opsional)
 */
export async function listRecruitmentApplications(params?: { status?: 'proses' | 'diterima' | 'ditolak' }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  const resp = await baseUrl.request<any>(
    `${ENDPOINTS.RECRUITMENT.LIST}${qstr}`,
    { method: 'GET' }
  );

  // Controller mengembalikan { total, data }, tapi jaga-jaga jika dibungkus { data: {...} }
  const data: RecruitmentListResp = resp?.total !== undefined && resp?.data
    ? resp
    : (resp?.data as RecruitmentListResp);

  return data;
}

/**
 * PATCH /recruitment/applications/:id/decision
 * Body: { decision: 'approve'|'reject', note?: string }
 */
export async function decideApplication(
  id: number | string,
  payload: DecideApplicationPayload
) {
  return baseUrl.request<{ message: string }>(
    ENDPOINTS.RECRUITMENT.DECIDE(id),
    { method: 'PATCH', json: payload }
  );
}
