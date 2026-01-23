// src/features/slices/earnings/types.ts

import type {
  AllTransactionsRecap,
  AllTransactionsRecapPoint,
  GetAllTransactionsRecapParams,
  GetAllTransactionsRecapResp,
} from '@/services/api/transaksi.api';

export type EarningsChartPoint = AllTransactionsRecapPoint;
export type EarningsRecap = AllTransactionsRecap;
export type EarningsChartRange = { start_month: string; end_month: string };
export type GetEarningsChartParams = GetAllTransactionsRecapParams;
export type GetEarningsChartResp = GetAllTransactionsRecapResp;

/** Status umum untuk async lifecycle di slice */
export type SliceStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type EarningsChartState = {
  /** Titik-titik chart per bulan dari BE */
  points: EarningsChartPoint[];
  /** Range yang dikembalikan BE (atau null sebelum fetch) */
  range: EarningsChartRange | null;
  /** Rekap untuk cards */
  recap: EarningsRecap | null;
  /** Rekap bulan sebelumnya (opsional jika butuh detail) */
  previousRecap: EarningsRecap | null;

  /** Filter terakhir yang dipakai (untuk kontrol UI) */
  start_month: string | null;
  end_month: string | null;

  status: SliceStatus;
  error?: string | null;
};
