// src/features/slices/earnings/types.ts

import type {
  EarningsChartPoint,
  EarningsChartRange,
  GetEarningsChartParams,
  GetEarningsChartResp,
} from '@/services/api/earnings.api';

/** Status umum untuk async lifecycle di slice */
export type SliceStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type EarningsChartState = {
  /** Titik-titik chart per bulan dari BE */
  points: EarningsChartPoint[];
  /** Range yang dikembalikan BE (atau null sebelum fetch) */
  range: EarningsChartRange | null;

  /** Filter terakhir yang dipakai (untuk kontrol UI) */
  start_month: string | null;
  end_month: string | null;

  status: SliceStatus;
  error?: string | null;
};

/** Re-exports supaya gampang diimport */
export type {
  EarningsChartPoint,
  EarningsChartRange,
  GetEarningsChartParams,
  GetEarningsChartResp,
};
