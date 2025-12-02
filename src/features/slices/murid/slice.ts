/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/murid/slice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as API from '@/services/api/murid.api';
import type {
  StudentListState,
  ListStudentsParams as UIListParams,
  ListStudentsResponse,
  StudentHeader,
  StudentClassesState,
  MuridClassSessionRow,
} from './types';

/* ========================= Helpers ========================= */
function mapStatusLabelToRaw(s?: string) {
  if (s === 'Aktif') return 'aktif';
  if (s === 'Non-Aktif') return 'non_aktif';
  if (s === 'Cuti') return 'cuti';
  return undefined;
}
const undefIfEmpty = (v?: string) => {
  const t = (v ?? '').trim();
  return t ? t : undefined;
};

/* ========================= Detail/Classes types ========================= */
export type StudentDetailState = {
  item: StudentHeader | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentUuid?: string | null;
};

/* ========================= Combined state ========================= */
export type MuridState = StudentListState & {
  detail: StudentDetailState;
  classes: StudentClassesState;
};

/* ========================= Initial state ========================= */
const initialState: MuridState = {
  // list
  items: [],
  recap: { active: 0, inactive: 0, onLeave: 0 },
  cities: [],
  statuses: ['Aktif', 'Non-Aktif', 'Cuti'],

  total: 0,
  page: 1,
  limit: 5,
  totalPages: 1,

  q: '',
  city: '',
  statusLabel: '',

  status: 'idle',
  error: null,

  // detail
  detail: { item: null, status: 'idle', error: null, currentUuid: null },

  // classes (per sesi)
  classes: {
    items: [],
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
    instrument: '',
    program: '',
    status: 'idle',
    error: null,
  },
};

/* ========================= Thunks ========================= */
// LIST
export const fetchStudentsThunk = createAsyncThunk<
  ListStudentsResponse,
  UIListParams | undefined,
  { rejectValue: string }
>('murid/fetchList', async (params, { getState, rejectWithValue }) => {
  try {
    const s = getState() as any;
    const st: MuridState = s?.murid ?? initialState;
    const q = undefIfEmpty(params?.q ?? st.q);
    const city = undefIfEmpty(params?.city ?? st.city);
    const status = mapStatusLabelToRaw(params?.statusLabel ?? st.statusLabel);
    const res = await API.listStudents({
      q,
      city,
      status,
      page: params?.page ?? st.page,
      limit: params?.limit ?? st.limit,
      sort_by: 'created_at',
      sort_dir: 'desc',
    });
    return res as unknown as ListStudentsResponse;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat daftar murid');
  }
});

// HEADER
export const fetchStudentHeaderThunk = createAsyncThunk<
  { student: StudentHeader },
  string,
  { rejectValue: string }
>('murid/fetchHeader', async (uuid, { rejectWithValue }) => {
  try {
    const res = await API.getStudentByUuid(uuid);
    return res;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat detail murid');
  }
});

// CLASSES (per sesi) – bisa pakai muridId atau uuid
export const fetchStudentClassesThunk = createAsyncThunk<
  { data: MuridClassSessionRow[]; total: number; page: number; limit: number; totalPages: number },
  { muridId?: number | string; uuid?: string } | undefined,
  { rejectValue: string }
>('murid/fetchClasses', async (args, { getState, rejectWithValue }) => {
  try {
    const s = getState() as any;
    const st: MuridState = s?.murid ?? initialState;

    const res = await API.listMuridClassesById({
      muridId: args?.muridId, // boleh undefined, kita tetap pakai 0 di service
      uuid: args?.uuid ?? st.detail.currentUuid ?? undefined,
      page: st.classes.page,
      limit: st.classes.limit,
      instrument: (st.classes.instrument || '').trim() || undefined,
      program: (st.classes.program || '').trim() || undefined,
      view: 'latest_done', // ⬅️ MODE BARU
    });
    return res;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat kelas murid');
  }
});

/* ========================= Slice ========================= */
const slice = createSlice({
  name: 'murid',
  initialState,
  reducers: {
    // list controls
    setQuery(s, a: PayloadAction<string | undefined>) {
      s.q = a.payload ?? '';
    },
    setCity(s, a: PayloadAction<string | undefined>) {
      s.city = a.payload ?? '';
    },
    setStatusLabel(s, a: PayloadAction<MuridState['statusLabel'] | undefined>) {
      s.statusLabel = (a.payload ?? '') as MuridState['statusLabel'];
    },
    setPage(s, a: PayloadAction<number | undefined>) {
      s.page = a.payload ?? 1;
    },
    setLimit(s, a: PayloadAction<number | undefined>) {
      s.limit = a.payload ?? 5;
    },

    // detail controls
    resetStudentDetail(s) {
      s.detail = { item: null, status: 'idle', error: null, currentUuid: null };
    },

    // classes controls
    setClassesPage(s, a: PayloadAction<number | undefined>) {
      s.classes.page = a.payload ?? 1;
    },
    setClassesLimit(s, a: PayloadAction<number | undefined>) {
      s.classes.limit = a.payload ?? 5;
    },
    setClassesInstrument(s, a: PayloadAction<string | undefined>) {
      s.classes.instrument = a.payload ?? '';
      s.classes.page = 1;
    },
    setClassesProgram(s, a: PayloadAction<string | undefined>) {
      s.classes.program = a.payload ?? '';
      s.classes.page = 1;
    },

    resetState() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    // list
    b.addCase(fetchStudentsThunk.pending, (s) => {
      s.status = 'loading'; s.error = null;
    }).addCase(fetchStudentsThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.items = a.payload.students;
      s.recap = a.payload.recap;
      s.cities = a.payload.cities ?? [];
      s.statuses = a.payload.statuses ?? ['Aktif','Non-Aktif','Cuti'];
      s.total = a.payload.total;
      s.page = a.payload.page;
      s.limit = a.payload.limit;
      s.totalPages = a.payload.totalPages;
    }).addCase(fetchStudentsThunk.rejected, (s, a) => {
      s.status = 'failed'; s.error = (a.payload as string) ?? 'Terjadi kesalahan';
    });

    // header
    b.addCase(fetchStudentHeaderThunk.pending, (s, a) => {
      s.detail.status = 'loading';
      s.detail.error = null;
      s.detail.currentUuid = a.meta.arg;
    }).addCase(fetchStudentHeaderThunk.fulfilled, (s, a) => {
      s.detail.status = 'succeeded';
      s.detail.item = a.payload.student;
    }).addCase(fetchStudentHeaderThunk.rejected, (s, a) => {
      s.detail.status = 'failed';
      s.detail.error = (a.payload as string) ?? 'Gagal memuat detail murid';
    });

    // classes
    b.addCase(fetchStudentClassesThunk.pending, (s) => {
      s.classes.status = 'loading';
      s.classes.error = null;
    }).addCase(fetchStudentClassesThunk.fulfilled, (s, a) => {
      s.classes.status = 'succeeded';
      s.classes.items = a.payload.data;
      s.classes.total = a.payload.total;
      s.classes.page = a.payload.page;
      s.classes.limit = a.payload.limit;
      s.classes.totalPages = a.payload.totalPages;
    }).addCase(fetchStudentClassesThunk.rejected, (s, a) => {
      s.classes.status = 'failed';
      s.classes.error = (a.payload as string) ?? 'Gagal memuat kelas murid';
    });
  },
});

export const {
  // list
  setQuery, setCity, setStatusLabel, setPage, setLimit,
  // detail
  resetStudentDetail,
  // classes
  setClassesPage, setClassesLimit, setClassesInstrument, setClassesProgram,
  // all
  resetState,
} = slice.actions;

export default slice.reducer;

/* ========================= Selectors ========================= */
export const selectStudentList = (st: any) => st.murid as StudentListState;
export const selectStudentDetail = (st: any) => (st.murid as MuridState).detail;
export const selectStudentClasses = (st: any) => (st.murid as MuridState).classes;
