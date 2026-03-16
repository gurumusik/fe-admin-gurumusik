/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';
import type {
  ListReferralCommissionsParams,
  ListReferralCommissionsResp,
  ListReferralReferrersParams,
  ListReferralReferrersResp,
} from '@/features/slices/referrals/types';

export async function listReferralReferrers(params?: ListReferralReferrersParams) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<ListReferralReferrersResp>(
    `${ENDPOINTS.REFERRALS.REFERRERS}${qstr}`,
    { method: 'GET' }
  );
}

export async function listReferralCommissions(params?: ListReferralCommissionsParams) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (typeof params?.referrer_user_id === 'number') qs.set('referrer_user_id', String(params.referrer_user_id));
  if (typeof params?.referred_user_id === 'number') qs.set('referred_user_id', String(params.referred_user_id));
  if (typeof params?.transaksi_id === 'number') qs.set('transaksi_id', String(params.transaksi_id));
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<ListReferralCommissionsResp>(
    `${ENDPOINTS.REFERRALS.COMMISSIONS}${qstr}`,
    { method: 'GET' }
  );
}

