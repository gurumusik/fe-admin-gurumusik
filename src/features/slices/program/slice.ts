/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/program/slice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as ProgramAPI from '@/services/api/program.api';
import type {
  ProgramState,
  Program,
  FetchProgramsParams,
  ListProgramsResponse,
  CreateProgramPayload,
  UpdateProgramPayload,
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

export const updateProgramThunk = createAsyncThunk<
  Program,
  UpdateProgramPayload,
  { rejectValue: string }
>('program/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await ProgramAPI.updateProgram(id, data);
    return res as Program;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal mengubah program');
  }
});

export const deleteProgramThunk = createAsyncThunk<
  { id: number | string },
  number | string,
  { rejectValue: string }
>('program/delete', async (id, { rejectWithValue }) => {
  try {
    await ProgramAPI.deleteProgram(id);
    return { id };
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal menghapus program');
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
      // Prepend supaya langsung muncul di list
      s.items = [a.payload, ...s.items];
      s.total += 1;
    });
    b.addCase(createProgramThunk.rejected, (s, a) => {
      s.creating = false;
      s.error = (a.payload as string) ?? 'Gagal membuat program';
    });

    // update
    b.addCase(updateProgramThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(updateProgramThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      const updated = a.payload;
      s.items = s.items.map((p) =>
        p.id === updated.id ? { ...p, ...updated } : p
      );
    });
    b.addCase(updateProgramThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal mengubah program';
    });

    // delete
    b.addCase(deleteProgramThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(deleteProgramThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      const id = a.payload.id;
      s.items = s.items.filter((p) => p.id !== id);
      if (s.total > 0) s.total -= 1;
    });
    b.addCase(deleteProgramThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal menghapus program';
    });
  },
});

export const { setQuery, setPage, setLimit } = slice.actions;
export default slice.reducer;
