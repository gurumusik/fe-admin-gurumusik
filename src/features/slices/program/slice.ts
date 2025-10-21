/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/program/slice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as ProgramAPI from '@/services/api/program.api';
import type {
  ProgramState,
  Program,
  FetchProgramsParams,
  ListProgramsResponse,
  CreateProgramPayload,
} from './types';

/** ===== Initial State ===== */
const initialState: ProgramState = {
  items: [],
  total: 0,
  page: 1,
  limit: 50,
  q: '',
  status: 'idle',
  error: null,
  creating: false,
};

/** ===== Thunks ===== */
export const fetchProgramsThunk = createAsyncThunk<
  ListProgramsResponse,
  FetchProgramsParams | undefined,
  { rejectValue: string }
>('program/fetchList', async (params, { rejectWithValue }) => {
  try {
    // Sesuaikan tipe return dari API ke bentuk yang dipakai slice
    const res = await ProgramAPI.listPrograms(params);
    return res as ListProgramsResponse;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat program');
  }
});

export const createProgramThunk = createAsyncThunk<
  Program,
  CreateProgramPayload,
  { rejectValue: string }
>('program/create', async (payload, { rejectWithValue }) => {
  try {
    const res = await ProgramAPI.createProgram(payload);
    return res.data as Program; // Program baru
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal membuat program');
  }
});

/** ===== Slice ===== */
const slice = createSlice({
  name: 'program',
  initialState,
  reducers: {
    setQuery(s, a: PayloadAction<string | undefined>) {
      s.q = a.payload ?? '';
    },
    setPage(s, a: PayloadAction<number | undefined>) {
      s.page = a.payload ?? 1;
    },
    // (opsional) kalau ingin set limit dari UI
    setLimit(s, a: PayloadAction<number | undefined>) {
      s.limit = a.payload ?? s.limit;
    },
  },
  extraReducers: (b) => {
    // fetch list
    b.addCase(fetchProgramsThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchProgramsThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.items = a.payload.data;
      s.total = a.payload.total;
      s.page = a.payload.page;
      s.limit = a.payload.limit;
    });
    b.addCase(fetchProgramsThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal memuat program';
    });

    // create
    b.addCase(createProgramThunk.pending, (s) => {
      s.creating = true;
      s.error = null;
    });
    b.addCase(createProgramThunk.fulfilled, (s, a) => {
      s.creating = false;
      // Prepend supaya langsung muncul di dropdown/list
      s.items = [a.payload, ...s.items];
      s.total += 1;
    });
    b.addCase(createProgramThunk.rejected, (s, a) => {
      s.creating = false;
      s.error = (a.payload as string) ?? 'Gagal membuat program';
    });
  },
});

export const { setQuery, setPage, setLimit } = slice.actions;
export default slice.reducer;
