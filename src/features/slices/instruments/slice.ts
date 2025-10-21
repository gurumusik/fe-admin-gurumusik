/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/instrument/slice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as API from '@/services/api/instrument.api';
import type {
  InstrumentState,
  ListInstrumentsParams,
  ListInstrumentsResponse,
  DeleteInstrumentResult,
} from '@/features/slices/instruments/types';

const initialState: InstrumentState = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  q: '',
  status: 'idle',
  error: null,
};

export const fetchInstrumentsThunk = createAsyncThunk<
  ListInstrumentsResponse,
  ListInstrumentsParams | undefined,
  { rejectValue: string }
>('instrument/fetchList', async (params, { rejectWithValue }) => {
  try {
    const res = await API.listInstruments(params);
    return res as ListInstrumentsResponse;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat instrumen');
  }
});

export const deleteInstrumentThunk = createAsyncThunk<
  DeleteInstrumentResult,
  number | string,
  { rejectValue: string }
>('instrument/delete', async (id, { rejectWithValue }) => {
  try {
    const res = await API.deleteInstrument(id);
    return { id, message: res.message } as DeleteInstrumentResult;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal menghapus instrumen');
  }
});

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
    })
      .addCase(fetchInstrumentsThunk.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.items = a.payload.data;
        s.total = a.payload.total;
        s.page = a.payload.page;
        s.limit = a.payload.limit;
      })
      .addCase(fetchInstrumentsThunk.rejected, (s, a) => {
        s.status = 'failed';
        s.error = (a.payload as string) ?? 'Terjadi kesalahan';
      })
      .addCase(deleteInstrumentThunk.fulfilled, (s, a) => {
        const removedId = a.payload.id;
        s.items = s.items.filter((it) => {
          // antisipasi perbedaan tipe id (number|string)
          const left = (it as any).id?.toString?.() ?? String((it as any).id);
          const right = removedId?.toString?.() ?? String(removedId);
          return left !== right;
        });
        s.total = Math.max(0, s.total - 1);
      });
  },
});

export const { setQuery, setPage, setLimit, resetState } = slice.actions;
export default slice.reducer;
