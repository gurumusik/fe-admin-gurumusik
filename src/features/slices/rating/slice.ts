// src/features/slices/rating/performaMengajarAdminSlice.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getPerformaMengajar } from '@/services/api/rating.api';
import type { PerformaMengajar, PerformaMengajarState } from './types';

const initialState: PerformaMengajarState = {
  data: null,
  status: 'idle',
  error: null,
  lastGuruId: null,
  lastMonth: null,
};

/**
 * Thunk:
 * - Guru: panggil dengan { month } saja (tanpa guruId)
 * - Admin: panggil dengan { guruId, month }
 * - Khusus murid: { muridId } (opsional)
 */
export const fetchPerformaMengajarAdminThunk = createAsyncThunk(
  'rating/performaMengajarAdmin/fetch',
  async (
    params: { guruId?: number | string; month?: string; muridId?: number | string }, // ⬅️ NEW
    { rejectWithValue }
  ) => {
    try {
      const res = await getPerformaMengajar({
        guruId: params.guruId,
        month: params.month,
        muridId: params.muridId, // ⬅️ NEW
      });
      const data = (res as any)?.data ?? res;
      return { payload: data as PerformaMengajar, meta: params };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat performa mengajar');
    }
  }
);

const slice = createSlice({
  name: 'performaMengajarAdmin',
  initialState,
  reducers: {
    resetPerformaMengajarAdmin: () => initialState,
  },
  extraReducers: (b) => {
    b.addCase(fetchPerformaMengajarAdminThunk.pending, (s, a) => {
      s.status = 'loading';
      s.error = null;
      s.lastGuruId = a.meta.arg.guruId ?? null;
      s.lastMonth = a.meta.arg.month ?? null;
    });
    b.addCase(fetchPerformaMengajarAdminThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.data = a.payload.payload; // sesuai pola res kamu
    });
    b.addCase(fetchPerformaMengajarAdminThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal memuat performa mengajar';
    });
  },
});

export const { resetPerformaMengajarAdmin } = slice.actions;
export default slice.reducer;

export const selectPerformaMengajarAdmin = (state: any) =>
  state.performaMengajarAdmin as PerformaMengajarState;
