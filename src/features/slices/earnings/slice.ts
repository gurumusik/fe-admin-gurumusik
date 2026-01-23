// src/features/slices/earnings/slice.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getAllTransactionsRecap } from '@/services/api/transaksi.api';
import type {
  EarningsChartState,
  GetEarningsChartParams,
  GetEarningsChartResp,
} from './types';

const initialState: EarningsChartState = {
  points: [],
  range: null,
  start_month: null,
  end_month: null,
  recap: null,
  previousRecap: null,
  status: 'idle',
  error: null,
};

export const fetchEarningsChartThunk = createAsyncThunk<
  GetEarningsChartResp,
  GetEarningsChartParams | undefined,
  { rejectValue: string }
>('earnings/chart/fetch', async (params, { rejectWithValue }) => {
  try {
    const res = await getAllTransactionsRecap(params);
    return res as GetEarningsChartResp;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat chart pendapatan');
  }
});

const earningsChartSlice = createSlice({
  name: 'earningsChart',
  initialState,
  reducers: {
    /** Set filter range lokal (belum fetch) */
    setRange(state, action: PayloadAction<{ start_month?: string | null; end_month?: string | null }>) {
      const { start_month = null, end_month = null } = action.payload || {};
      state.start_month = start_month;
      state.end_month = end_month;
    },
    /** Reset ke kondisi awal */
    resetChartState() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchEarningsChartThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchEarningsChartThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.points = a.payload.points || [];
      s.range = a.payload.range || null;
      s.recap = a.payload.recap ?? null;
      s.previousRecap = a.payload.previous_total_recap ?? null;

      // Simpan kembali range yang efektif dipakai
      const effStart = a.meta.arg?.start_month ?? a.payload.range?.start_month ?? null;
      const effEnd = a.meta.arg?.end_month ?? a.payload.range?.end_month ?? null;
      s.start_month = effStart;
      s.end_month = effEnd;
    });
    b.addCase(fetchEarningsChartThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Terjadi kesalahan saat memuat chart';
    });
  },
});

export const { setRange, resetChartState } = earningsChartSlice.actions;
export default earningsChartSlice.reducer;
