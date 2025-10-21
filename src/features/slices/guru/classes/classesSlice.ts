// src/features/slices/guru/classesSlice.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as API from '@/services/api/guruClasses.api';
import type {
  GuruClassDTO,
  ListGuruClassesParams,
  ListGuruClassesResp,
} from '@/services/api/guruClasses.api';

export type GuruClassesState = {
  items: GuruClassDTO[];
  total: number;
  page: number;
  limit: number;
  q: string;
  sort_by: NonNullable<ListGuruClassesParams['sort_by']>;
  sort_dir: NonNullable<ListGuruClassesParams['sort_dir']>; // 'asc' | 'desc'
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: GuruClassesState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  q: '',
  sort_by: 'jadwal_mulai',
  sort_dir: 'asc',
  status: 'idle',
  error: null,
};

export const fetchGuruClassesThunk = createAsyncThunk<
  ListGuruClassesResp,
  ListGuruClassesParams | undefined,
  { rejectValue: string }
>('guruClasses/fetchList', async (params, { rejectWithValue }) => {
  try {
    if (!params?.guruId) throw new Error('guruId wajib diisi');
    const res = await API.listGuruClasses(params);
    return res as ListGuruClassesResp;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat kelas guru');
  }
});

const slice = createSlice({
  name: 'guruClasses',
  initialState,
  reducers: {
    setQuery(s, a: PayloadAction<string | undefined>) {
      s.q = a.payload ?? '';
    },
    setPage(s, a: PayloadAction<number | undefined>) {
      s.page = a.payload ?? 1;
    },
    setLimit(s, a: PayloadAction<number | undefined>) {
      s.limit = a.payload ?? 10;
    },
    setSortBy(s, a: PayloadAction<GuruClassesState['sort_by'] | undefined>) {
      s.sort_by = (a.payload ?? 'jadwal_mulai') as GuruClassesState['sort_by'];
    },
    setSortDir(s, a: PayloadAction<GuruClassesState['sort_dir'] | undefined>) {
      s.sort_dir = String(a.payload ?? 'asc').toLowerCase() as 'asc' | 'desc';
    },
    resetState() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchGuruClassesThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    })
      .addCase(fetchGuruClassesThunk.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.items = a.payload.data;
        s.total = a.payload.total;
        // ⛔️ Jangan overwrite page/limit/sort/q dari payload agar dependency useEffect tidak berubah-ubah
        // (kalau ingin, boleh sinkron tapi WAJIB normalisasi: String(...).toLowerCase()).
      })
      .addCase(fetchGuruClassesThunk.rejected, (s, a) => {
        s.status = 'failed';
        s.error = (a.payload as string) ?? 'Terjadi kesalahan';
      });
  },
});

export const {
  setQuery,
  setPage,
  setLimit,
  setSortBy,
  setSortDir,
  resetState,
} = slice.actions;

export const selectGuruClasses = (s: any) => s.guruClasses as GuruClassesState;

export default slice.reducer;
