/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';
import type { GAQueue, GuruApplicationDTO } from '@/features/slices/guruApplication/types';

/* ========================= TYPES ========================= */

export type DecideApplicationPayload = {
  decision: 'approve' | 'revision' | 'reject' | 'offer_certification';
  note?: string;
  revision_fields?: Array<{
    field_key: string;
    message?: string | null;
  }>;
  certification_criteria?: {
    high_skill_video: boolean;
    stable_technique: boolean;
    assessable_audio_visual: boolean;
    growth_potential: boolean;
  };
  cert_decisions?: Array<{
    id: number | string;
    status: 'approved' | 'rejected';
    alasan_penolakan?: string | null;
  }>;
  education_decisions?: Array<{
    id: number | string;
    status: 'approved' | 'rejected';
    alasan_penolakan?: string | null;
  }>;
  award_decisions?: Array<{
    id: number | string;
    status: 'approved' | 'rejected';
    alasan_penolakan?: string | null;
  }>;
};

export type RecruitmentListResp = {
  total: number;
  data: GuruApplicationDTO[];
  recap?: {
    screening?: number;
    revision?: number;
    certification?: number;
    certification_offered?: number;
    manual_certification?: number;
  };
};

/* ========================= API CALLS ========================= */

/**
 * GET /guru-applications/applications
 * Query: ?status=proses|diterima|ditolak&queue=screening|revision|certification (opsional)
 */
export async function listRecruitmentApplications(params?: {
  status?: 'proses' | 'diterima' | 'ditolak';
  queue?: GAQueue;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.queue) qs.set('queue', params.queue);
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
 * PATCH /guru-applications/applications/:id/decision
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
