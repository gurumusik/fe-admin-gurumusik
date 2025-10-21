/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/registrasiGuru/slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as RegAPI from '@/services/api/registrasiGuru.api';
import type { RegistrasiGuruState, RegistrasiGuru } from './types';

const initialState: RegistrasiGuruState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  q: '',
  abk: null,
  status: 'idle',
  error: null,
  creating: false,
  updatingId: null,
  deletingId: null,
  approvingId: null,
};

export const fetchRegistrasiGuruThunk = createAsyncThunk(
  'registrasiGuru/fetchList',
  async (params?: { q?: string; page?: number; limit?: number; abk?: boolean }) => {
    try {
      const res = await RegAPI.listRegistrasi(params);
      return res; // RegistrasiListResp-like
    } catch (e: any) {
      return (e?.message ?? 'Gagal memuat pendaftar tutor');
    }
  }
);

export const createRegistrasiGuruThunk = createAsyncThunk(
  'registrasiGuru/create',
  async (payload: Parameters<typeof RegAPI.createRegistrasi>[0], { rejectWithValue }) => {
    try {
      const res = await RegAPI.createRegistrasi(payload);
      return res.data; // { id, nama, email, ... }
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal mengirim registrasi');
    }
  }
);

export const updateRegistrasiGuruThunk = createAsyncThunk(
  'registrasiGuru/update',
  async (
    args: { id: number; patch: Parameters<typeof RegAPI.updateRegistrasi>[1] },
    { rejectWithValue }
  ) => {
    try {
      const res = await RegAPI.updateRegistrasi(args.id, args.patch);
      return { id: args.id, patch: args.patch, server: res.data };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memperbarui registrasi');
    }
  }
);

export const deleteRegistrasiGuruThunk = createAsyncThunk(
  'registrasiGuru/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await RegAPI.deleteRegistrasi(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal menghapus registrasi');
    }
  }
);

const slice = createSlice({
  name: 'registrasiGuru',
  initialState,
  reducers: {
    setRegQuery(s, a) { s.q = a.payload ?? ''; },
    setRegPage(s, a) { s.page = a.payload ?? 1; },
    setRegLimit(s, a) { s.limit = a.payload ?? 10; },
    setRegAbk(s, a) { s.abk = a.payload as boolean | null; },
  },
  extraReducers: (b) => {
    // LIST
    b.addCase(fetchRegistrasiGuruThunk.pending, (s) => { s.status = 'loading'; s.error = null; });
    b.addCase(fetchRegistrasiGuruThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.items = a.payload.data as RegistrasiGuru[];
      s.total = a.payload.total as number;
      s.page = a.payload.page as number;
      s.limit = a.payload.limit as number;
    });
    b.addCase(fetchRegistrasiGuruThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal memuat pendaftar tutor';
    });

    // CREATE (public)
    b.addCase(createRegistrasiGuruThunk.pending, (s) => { s.creating = true; s.error = null; });
    b.addCase(createRegistrasiGuruThunk.fulfilled, (s) => { s.creating = false; });
    b.addCase(createRegistrasiGuruThunk.rejected, (s, a) => {
      s.creating = false;
      s.error = (a.payload as string) ?? 'Gagal mengirim registrasi';
    });

    // UPDATE
    b.addCase(updateRegistrasiGuruThunk.pending, (s, a) => {
      s.updatingId = (a.meta.arg as any)?.id ?? null;
      s.error = null;
    });
    b.addCase(updateRegistrasiGuruThunk.fulfilled, (s, a) => {
      const id = (a.payload as any).id as number;
      const patch = (a.payload as any).patch as Partial<RegAPI.RegistrasiGuru>;
      const i = s.items.findIndex((x) => x.id === id);
      if (i >= 0) s.items[i] = { ...s.items[i], ...patch };
      s.updatingId = null;
    });
    b.addCase(updateRegistrasiGuruThunk.rejected, (s, a) => {
      s.updatingId = null;
      s.error = (a.payload as string) ?? 'Gagal memperbarui registrasi';
    });

    // DELETE
    b.addCase(deleteRegistrasiGuruThunk.pending, (s, a) => {
      s.deletingId = (a.meta.arg as number) ?? null;
      s.error = null;
    });
    b.addCase(deleteRegistrasiGuruThunk.fulfilled, (s, a) => {
      const id = a.payload as number;
      s.items = s.items.filter((x) => x.id !== id);
      s.total = Math.max(0, s.total - 1);
      s.deletingId = null;
    });
    b.addCase(deleteRegistrasiGuruThunk.rejected, (s, a) => {
      s.deletingId = null;
      s.error = (a.payload as string) ?? 'Gagal menghapus registrasi';
    });
  },
});

export const { setRegQuery, setRegPage, setRegLimit, setRegAbk } = slice.actions;
export default slice.reducer;
