/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/grades/slice.ts
import { createSlice, createAsyncThunk, type PayloadAction, createSelector } from '@reduxjs/toolkit';
import * as API from '@/services/api/grade.api';
import type { GradeState, ListGradesParams, ListGradesResponse } from './types';
import type { RootState } from '@/app/store';

const initialState: GradeState = {
  items: [],
  total: 0,
  page: 1,
  limit: 100,
  q: '',
  status: 'idle',
  error: null,
};

export const fetchGradesThunk = createAsyncThunk<
  ListGradesResponse,
  ListGradesParams | undefined,
  { rejectValue: string }
>('grades/fetchList', async (params, { rejectWithValue }) => {
  try {
    const res = await API.listGrades(params);
    return res as ListGradesResponse;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat grade');
  }
});

const slice = createSlice({
  name: 'grades',
  initialState,
  reducers: {
    setQuery(s, a: PayloadAction<string | undefined>) {
      s.q = a.payload ?? '';
    },
    setPage(s, a: PayloadAction<number | undefined>) {
      s.page = a.payload ?? 1;
    },
    setLimit(s, a: PayloadAction<number | undefined>) {
      s.limit = a.payload ?? 100;
    },
    resetState() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchGradesThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    })
      .addCase(fetchGradesThunk.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.items = a.payload.data;
        s.total = a.payload.total;
        s.page = a.payload.page;
        s.limit = a.payload.limit;
      })
      .addCase(fetchGradesThunk.rejected, (s, a) => {
        s.status = 'failed';
        s.error = (a.payload as string) ?? 'Terjadi kesalahan';
      });
  },
});

export const { setQuery, setPage, setLimit, resetState } = slice.actions;
export default slice.reducer;

/* ===== Selectors ===== */
export const selectGradesState = (s: RootState) => (s as any).grades as GradeState;

/** Opsi dropdown ter-normalisasi: {id, nama}  */
export const selectGradeOptions = createSelector(selectGradesState, (st) =>
  (st.items ?? []).map((g) => ({ id: g.id, nama: g.nama_grade }))
);
