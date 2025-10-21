// src/services/api/earnings.api.ts
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

/* ========================= TYPES ========================= */

export type EarningsChartPoint = {
  /** 'YYYY-MM' */
  month: string;
  /** nominal dari arus source_type='sesi' pada bulan tsb */
  kursus: number;
  /** nominal dari arus source_type='modul' pada bulan tsb */
  modul: number;
  /** kursus + modul (sudah dijumlah di backend) */
  total: number;
};

export type EarningsChartRange = {
  /** 'YYYY-MM' */
  start_month: string;
  /** 'YYYY-MM' */
  end_month: string;
};

export type GetEarningsChartParams = {
  /** 'YYYY-MM' (opsional) */
  start_month?: string;
  /** 'YYYY-MM' (opsional) */
  end_month?: string;
};

export type GetEarningsChartResp = {
  range: EarningsChartRange;
  points: EarningsChartPoint[];
};

/* ========================= API CALLS ========================= */

export async function getEarningsChart(params?: GetEarningsChartParams) {
  const qs = new URLSearchParams();
  if (params?.start_month) qs.set('start_month', params.start_month);
  if (params?.end_month) qs.set('end_month', params.end_month);
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<GetEarningsChartResp>(
    `${ENDPOINTS.EARNINGS.LIST}${qstr}`,
    { method: 'GET' }
  );
}
