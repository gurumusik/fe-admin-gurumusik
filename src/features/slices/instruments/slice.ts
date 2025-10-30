/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/instrument/slice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as API from '@/services/api/instrument.api';
import type {
  InstrumentState,
  ListInstrumentsParams,
  ListInstrumentsResponse,
} from '@/features/slices/instruments/types';

/* ========================= INITIAL ========================= */

const initialState: InstrumentState = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  q: '',
  status: 'idle',
  error: null,
};

/* ========================= THUNKS ========================= */

export const fetchInstrumentsThunk = createAsyncThunk<
  ListInstrumentsResponse,
  ListInstrumentsParams | undefined,
  { rejectValue: string }
>('instrument/fetchList', async (params, { rejectWithValue }) => {
  try {
    const res = await API.listInstruments(params);
    // cast ke tipe ListInstrumentsResponse (shape-nya sama)
    return res as unknown as ListInstrumentsResponse;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat instrumen');
  }
});

/**
 * Toggle/Set aktif/nonaktif instrumen via PUT /instruments/master/:id
 * Hanya mengubah kolom is_active
 */
export const setInstrumentActiveThunk = createAsyncThunk<
  { id: number | string; is_active: boolean },
  { id: number | string; is_active: boolean },
  { rejectValue: string }
>('instrument/setActive', async ({ id, is_active }, { rejectWithValue }) => {
  try {
    await API.setInstrumentActive(id, is_active);
    return { id, is_active };
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memperbarui status instrumen');
  }
});

/* ========================= SLICE ========================= */

const slice = createSlice({
  name: 'instrument',
  initialState,
  reducers: {
    setQuery(s, a: PayloadAction<string | undefined>) {
      s.q = a.payload ?? '';
    },
    setPage(s, a: PayloadAction<number | undefined>) {
      s.page = a.payload ?? 1;
    },
    setLimit(s, a: PayloadAction<number | undefined>) {
      s.limit = a.payload ?? 20;
    },
    resetState() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchInstrumentsThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchInstrumentsThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.items = a.payload.data;
      s.total = a.payload.total;
      s.page = a.payload.page;
      s.limit = a.payload.limit;
    });
    b.addCase(fetchInstrumentsThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Terjadi kesalahan';
    });

    // Update is_active pada item yang bersangkutan
    b.addCase(setInstrumentActiveThunk.fulfilled, (s, a) => {
      const { id, is_active } = a.payload;
      s.items = s.items.map((it) => {
        const left = (it as any).id?.toString?.() ?? String((it as any).id);
        const right = id?.toString?.() ?? String(id);
        return left === right ? { ...it, is_active } : it;
      });
    });
  },
});

export const { setQuery, setPage, setLimit, resetState } = slice.actions;
export default slice.reducer;
