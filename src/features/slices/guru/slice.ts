/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/guru/slice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getGuruById, listGuru, type ListGuruParams } from '@/services/api/guru.api';
import type { TUserLite } from '@/features/slices/user/types';

/* =========================
   TYPES
   ========================= */
export type GuruStatusLabel = 'Aktif' | 'Cuti' | 'Non-Aktif';

export type GuruListItem = {
  id: number;
  nama: string;
  phone: string | null;
  city: string | null;
  status: GuruStatusLabel;
  rating: number | null;   // 0..5 atau null
  image: string | null;    // profile_pic_url
};

export type GuruRecap = {
  active: number;
  inactive: number;
  onLeave: number;
};

// ⬇️ Detail item sekarang membawa status utk header
export type GuruDetailItem = TUserLite & {
  status_akun?: string | null;
  status_label?: GuruStatusLabel;
};

export type GuruDetailState = {
  item: GuruDetailItem | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentId?: number | null;
};

export type GuruListState = {
  items: GuruListItem[];
  recap: GuruRecap;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastQuery?: Omit<ListGuruParams, 'page' | 'limit'>;
};

export type GuruState = {
  detail: GuruDetailState;
  list: GuruListState;
};

/* =========================
   INITIAL STATE
   ========================= */
const initialDetail: GuruDetailState = {
  item: null,
  status: 'idle',
  error: null,
  currentId: null,
};

const initialList: GuruListState = {
  items: [],
  recap: { active: 0, inactive: 0, onLeave: 0 },
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  status: 'idle',
  error: null,
  lastQuery: undefined,
};

const initialState: GuruState = {
  detail: initialDetail,
  list: initialList,
};

/* =========================
   ADAPTERS
   ========================= */
const statusMap: Record<string, GuruStatusLabel> = {
  aktif: 'Aktif',
  cuti: 'Cuti',
  non_aktif: 'Non-Aktif',
};

// a) { user: {...} }  b) { ... }
function adaptGuru(resp: any): GuruDetailItem {
  const data = resp?.data ?? resp;
  const u = data?.user ?? data;
  const raw = String(u?.status_akun ?? '').toLowerCase();
  const status_label: GuruStatusLabel = statusMap[raw] ?? 'Aktif';

  return {
    id: Number(u?.id),
    nama: String(u?.nama ?? ''),
    profile_pic_url: u?.profile_pic_url ?? null,
    status_akun: u?.status_akun ?? null,
    status_label,
  };
}

function adaptRow(u: any): GuruListItem {
  const rawStatus = String(u?.status_akun ?? '').toLowerCase();
  const status: GuruStatusLabel = statusMap[rawStatus] ?? 'Aktif';
  const ratingNum =
    typeof u?.rating_avg === 'number' ? u.rating_avg :
    typeof u?.rating === 'number' ? u.rating :
    null;

  return {
    id: Number(u?.id),
    nama: String(u?.nama ?? u?.name ?? ''),
    phone: (u?.no_telp ?? null) as string | null,
    city: (u?.city ?? null) as string | null,
    status,
    rating: ratingNum,
    image: (u?.profile_pic_url ?? null) as string | null,
  };
}

function computeRecap(items: GuruListItem[]): GuruRecap {
  let active = 0, inactive = 0, onLeave = 0;
  for (const t of items) {
    if (t.status === 'Aktif') active++;
    else if (t.status === 'Non-Aktif') inactive++;
    else if (t.status === 'Cuti') onLeave++;
  }
  return { active, inactive, onLeave };
}

/** Respons fleksibel:
 *  A) { total, page, limit, data: [...], recap? }
 *  B) { users: [...], total? }
 *  C) [ ... ]
 *  D) { rows: [...], count: n }
 */
function adaptListResponse(resp: any) {
  const data = resp?.data ?? resp;

  let rows: any[] = [];
  let total = 0, page = 1, limit = 10, totalPages = 1;
  let recap: GuruRecap | null = null;

  if (Array.isArray(data)) {
    rows = data;
    total = rows.length;
  } else if (data?.data && Array.isArray(data.data)) {
    rows = data.data;
    total = Number(data?.total ?? rows.length);
    page = Number(data?.page ?? 1);
    // ⚠️ Parentesis untuk hindari mixing ?? dan ||
    limit = Number((data?.limit ?? rows.length) || 10);
    totalPages = Math.max(1, Math.ceil(total / (limit || 1)));
    if (data?.recap) {
      recap = {
        active: Number(data.recap.active ?? 0),
        inactive: Number(data.recap.inactive ?? 0),
        onLeave: Number(data.recap.onLeave ?? 0),
      };
    }
  } else if (Array.isArray(data?.users)) {
    rows = data.users;
    total = Number(data?.total ?? rows.length);
    page = Number(data?.page ?? 1);
    limit = Number((data?.limit ?? rows.length) || 10);
    totalPages = Math.max(1, Math.ceil(total / (limit || 1)));
  } else if (Array.isArray(data?.rows)) {
    rows = data.rows;
    total = Number(data?.count ?? rows.length);
    page = Number(data?.page ?? 1);
    limit = Number((data?.limit ?? rows.length) || 10);
    totalPages = Math.max(1, Math.ceil(total / (limit || 1)));
  }

  const items: GuruListItem[] = rows.map(adaptRow);
  if (!recap) recap = computeRecap(items);
  if (!totalPages) totalPages = Math.max(1, Math.ceil((total || items.length) / (limit || 10)));

  return { items, total, page, limit, totalPages, recap };
}

/* =========================
   THUNKS
   ========================= */
export const fetchGuruByIdThunk = createAsyncThunk(
  'guru/detailById',
  async (id: number, { rejectWithValue }) => {
    try {
      const r = await getGuruById(id);
      return adaptGuru(r);
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat guru');
    }
  }
);

export const fetchGuruListThunk = createAsyncThunk(
  'guru/list',
  async (params: ListGuruParams, { rejectWithValue }) => {
    try {
      const r = await listGuru(params);
      return adaptListResponse(r);
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat daftar guru');
    }
  }
);

/* =========================
   SLICE
   ========================= */
const slice = createSlice({
  name: 'guru',
  initialState,
  reducers: {
    // detail
    resetGuruDetail: (s) => { s.detail = initialDetail; },

    // list
    resetGuruList: (s) => { s.list = initialList; },
    setGuruPage: (s, a) => { s.list.page = Number(a.payload || 1); },
    setGuruLimit: (s, a) => { s.list.limit = Number(a.payload || 10); },
  },
  extraReducers: (b) => {
    // detail
    b.addCase(fetchGuruByIdThunk.pending, (s, a) => {
      s.detail.status = 'loading';
      s.detail.error = null;
      s.detail.currentId = a.meta.arg;
    });
    b.addCase(fetchGuruByIdThunk.fulfilled, (s, a) => {
      s.detail.status = 'succeeded';
      s.detail.item = a.payload;
    });
    b.addCase(fetchGuruByIdThunk.rejected, (s, a) => {
      s.detail.status = 'failed';
      s.detail.error = (a.payload as string) ?? 'Gagal memuat guru';
    });

    // list
    b.addCase(fetchGuruListThunk.pending, (s, a) => {
      s.list.status = 'loading';
      s.list.error = null;
      if (a.meta.arg.page) s.list.page = a.meta.arg.page!;
      if (a.meta.arg.limit) s.list.limit = a.meta.arg.limit!;
      s.list.lastQuery = {
        q: a.meta.arg.q,
        city: a.meta.arg.city,
        status: a.meta.arg.status,
        ratingBelow4: a.meta.arg.ratingBelow4,
      };
    });
    b.addCase(fetchGuruListThunk.fulfilled, (s, a) => {
      s.list.status = 'succeeded';
      s.list.items = a.payload.items;
      s.list.total = a.payload.total;
      s.list.page = a.payload.page || s.list.page;
      s.list.limit = a.payload.limit || s.list.limit;
      s.list.totalPages =
        a.payload.totalPages || Math.max(1, Math.ceil((s.list.total || 0) / (s.list.limit || 1)));
      s.list.recap = a.payload.recap;
    });
    b.addCase(fetchGuruListThunk.rejected, (s, a) => {
      s.list.status = 'failed';
      s.list.error = (a.payload as string) ?? 'Gagal memuat daftar guru';
    });
  },
});

export const {
  resetGuruDetail,
  resetGuruList,
  setGuruPage,
  setGuruLimit,
} = slice.actions;

export default slice.reducer;

/* =========================
   SELECTORS
   ========================= */
export const selectGuruDetail = (state: any) => state.guru.detail as GuruDetailState;
export const selectGuruList = (state: any) => state.guru.list as GuruListState;
