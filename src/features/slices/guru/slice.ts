  /* eslint-disable @typescript-eslint/no-explicit-any */
  import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
  import {
    getGuruById,
    listGuru,
    type ListGuruParams,
    getGuruProfile,
    createGuruFromEntry,               // ← NEW
  } from '@/services/api/guru.api';
  import {
    type GuruState,
    type GuruDetailState,
    type GuruListState,
    type GuruDetailItem,
    type GuruListItem,
    type GuruRecap,
    type GuruStatusLabel,
    type GuruProfileResponse,
    type CreateGuruFromEntryPayload,    // ← NEW
    type CreateGuruFromEntryResponse,   // ← NEW
  } from './types';

  /* ========= PROFILE STATE ========= */
  type GuruProfileState = {
    data: GuruProfileResponse | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };

  const initialProfile: GuruProfileState = {
    data: null,
    status: 'idle',
    error: null,
  };

  /* ========= CREATE STATE (NEW) ========= */
  type GuruCreateState = {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    lastCreated: { id: number; nama: string; email: string } | null;
  };

  const initialCreate: GuruCreateState = {
    status: 'idle',
    error: null,
    lastCreated: null,
  };

  /* ========= INITIAL STATE ========= */
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
    hasPrev: false,
    hasNext: false,
    status: 'idle',
    error: null,
    lastQuery: {
      q: undefined,
      city: undefined,
      status: undefined,
      ratingBelow4: undefined,
    },
  };

  /** Perluasan tipe global state slice ini agar memuat 'profile' & 'create' */
  type GuruModuleState = GuruState & { profile: GuruProfileState; create: GuruCreateState };

  const initialState: GuruModuleState = {
    detail: initialDetail,
    list: initialList,
    profile: initialProfile,
    create: initialCreate,   // ← NEW
  };

  /* ========= ADAPTERS ========= */
  const statusMap: Record<string, GuruStatusLabel> = {
    aktif: 'Aktif',
    cuti: 'Cuti',
    non_aktif: 'Non-Aktif',
  };

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
    const ratingAvg = typeof u?.rating_avg === 'number' ? u.rating_avg : null;

    return {
      id: Number(u?.id),
      nama: String(u?.nama ?? u?.name ?? ''),
      phone: (u?.no_telp ?? null) as string | null,
      city: (u?.city ?? null) as string | null,
      status,
      rating: ratingAvg,
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

  function adaptListResponse(resp: any) {
    const isMetaPayload = (o: any) =>
      o && typeof o === 'object' && !Array.isArray(o) &&
      Array.isArray(o.data) && (
        'total' in o || 'count' in o || 'totalPages' in o ||
        'page' in o || 'limit' in o || 'hasPrev' in o || 'hasNext' in o || 'recap' in o
      );

    let root: any;
    if (isMetaPayload(resp)) root = resp;
    else if (isMetaPayload(resp?.data)) root = resp.data;
    else root = resp ?? {};

    const rows: any[] =
      Array.isArray(root.data) ? root.data :
      Array.isArray(root.rows) ? root.rows :
      Array.isArray(root) ? root : [];

    const toNum = (v: any, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
    const toPos = (v: any, d = 1) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.trunc(n) : d;
    };

    const total = 'total' in root ? toNum(root.total, rows.length)
                : 'count' in root ? toNum(root.count, rows.length)
                : rows.length;

    const page  = 'page'  in root ? toPos(root.page, 1) : 1;
    const limit = 'limit' in root ? toPos(root.limit, rows.length || 10) : (rows.length || 10);

    let totalPages = 'totalPages' in root ? toPos(root.totalPages, 0) : 0;
    if (!(totalPages >= 1)) totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

    const hasPrev = 'hasPrev' in root ? !!root.hasPrev : page > 1;
    const hasNext = 'hasNext' in root ? !!root.hasNext : page < totalPages;

    const items: GuruListItem[] = rows.map(adaptRow);

    const recap: GuruRecap = root.recap
      ? {
          active: toNum(root.recap.active, 0),
          inactive: toNum(root.recap.inactive, 0),
          onLeave: toNum(root.recap.onLeave, 0),
        }
      : computeRecap(items);

    return { items, total, page, limit, totalPages, hasPrev, hasNext, recap };
  }

  /* ========= THUNKS ========= */
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
        const r = await listGuru(params as any);
        return adaptListResponse(r);
      } catch (e: any) {
        return rejectWithValue(e?.message ?? 'Gagal memuat daftar guru');
      }
    }
  );

  export const fetchGuruProfileThunk = createAsyncThunk(
    'guru/profile',
    async (arg?: { id?: number | string } | number | string) => {
      try {
        const r = await getGuruProfile(arg as any);
        const data = (r as any)?.data ?? r;
        return data as GuruProfileResponse;
      } catch (e: any) {
        return (e?.message ?? 'Gagal memuat profil guru');
      }
    }
  );

  /** NEW: create guru from entry */
  export const createGuruFromEntryThunk = createAsyncThunk(
    'guru/createFromEntry',
    async (
      arg: { payload: CreateGuruFromEntryPayload; file?: File },
      { rejectWithValue }
    ) => {
      try {
        // ⬇⬇ HAPUS arg.file; sekarang kirim JSON
        const r = await createGuruFromEntry(arg.payload);
        const data = (r as any)?.data ?? r;
        return data as CreateGuruFromEntryResponse;
      } catch (e: any) {
        return rejectWithValue(e?.message ?? 'Gagal membuat guru');
      }
    }
  );

  /* ========= SLICE ========= */
  const slice = createSlice({
    name: 'guru',
    initialState,
    reducers: {
      // detail
      resetGuruDetail: (s) => { s.detail = initialDetail; },

      // list
      resetGuruList: (s) => { s.list = initialList; },
      setGuruPage: (s, a: PayloadAction<number | undefined>) => { s.list.page = Number(a.payload || 1); },
      setGuruLimit: (s, a: PayloadAction<number | undefined>) => { s.list.limit = Number(a.payload || 10); },

      // filters
      setGuruQuery: (s, a: PayloadAction<string | undefined>) => {
        const q = (a.payload ?? '').trim() || undefined;
        s.list.lastQuery = { ...(s.list.lastQuery ?? {}), q };
        s.list.page = 1;
      },
      setGuruCity: (s, a: PayloadAction<string | undefined>) => {
        const city = (a.payload ?? '').trim() || undefined;
        s.list.lastQuery = { ...(s.list.lastQuery ?? {}), city };
        s.list.page = 1;
      },
      setGuruStatus: (s, a: PayloadAction<'aktif' | 'non_aktif' | 'cuti' | undefined>) => {
        const status = a.payload ? a.payload : undefined;
        s.list.lastQuery = { ...(s.list.lastQuery ?? {}), status };
        s.list.page = 1;
      },
      setGuruRatingBelow4: (s, a: PayloadAction<boolean>) => {
        const flag = a.payload ? true : undefined;
        s.list.lastQuery = { ...(s.list.lastQuery ?? {}), ratingBelow4: flag };
        s.list.page = 1;
      },
      clearGuruFilters: (s) => {
        s.list.lastQuery = { q: undefined, city: undefined, status: undefined, ratingBelow4: undefined };
        s.list.page = 1;
      },

      // profile
      resetGuruProfile: (s) => { s.profile = initialProfile; },

      // create (NEW)
      resetGuruCreate: (s) => { s.create = initialCreate; },
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
        if ((a.meta.arg as any)?.page)  s.list.page  = (a.meta.arg as any).page!;
        if ((a.meta.arg as any)?.limit) s.list.limit = (a.meta.arg as any).limit!;
      });
      b.addCase(fetchGuruListThunk.fulfilled, (s, a) => {
        s.list.status = 'succeeded';
        s.list.items = a.payload.items;
        s.list.total = a.payload.total;
        s.list.page = a.payload.page || s.list.page;
        s.list.limit = a.payload.limit || s.list.limit;
        s.list.totalPages = a.payload.totalPages;
        s.list.hasPrev = a.payload.hasPrev;
        s.list.hasNext = a.payload.hasNext;
        s.list.recap = a.payload.recap;

        const arg = a.meta.arg as any;
        s.list.lastQuery = {
          ...s.list.lastQuery,
          q: arg?.q,
          city: arg?.city,
          status: arg?.status as any,
          ratingBelow4:
            arg?.ratingBelow4 !== undefined
              ? arg.ratingBelow4
              : (arg?.rating_lt != null ? true : s.list.lastQuery?.ratingBelow4),
        };
      });
      b.addCase(fetchGuruListThunk.rejected, (s, a) => {
        s.list.status = 'failed';
        s.list.error = (a.payload as string) ?? 'Gagal memuat daftar guru';
      });

      // profile
      b.addCase(fetchGuruProfileThunk.pending, (s) => {
        s.profile.status = 'loading';
        s.profile.error = null;
      });
      b.addCase(fetchGuruProfileThunk.fulfilled, (s, a) => {
        s.profile.status = 'succeeded';
        s.profile.data = a.payload;
      });
      b.addCase(fetchGuruProfileThunk.rejected, (s, a) => {
        s.profile.status = 'failed';
        s.profile.error = (a.payload as string) ?? 'Gagal memuat profil guru';
      });

      // create (NEW)
      b.addCase(createGuruFromEntryThunk.pending, (s) => {
        s.create.status = 'loading';
        s.create.error = null;
        s.create.lastCreated = null;
      });
      b.addCase(createGuruFromEntryThunk.fulfilled, (s, a) => {
        s.create.status = 'succeeded';
        s.create.error = null;
        s.create.lastCreated = {
          id: a.payload.user.id,
          nama: a.payload.user.nama,
          email: a.payload.user.email,
        };
      });
      b.addCase(createGuruFromEntryThunk.rejected, (s, a) => {
        s.create.status = 'failed';
        s.create.error = (a.payload as string) ?? 'Gagal membuat guru';
      });
    },
  });

  export const {
    resetGuruDetail,
    resetGuruList,
    setGuruPage,
    setGuruLimit,
    setGuruQuery,
    setGuruCity,
    setGuruStatus,
    setGuruRatingBelow4,
    clearGuruFilters,
    resetGuruProfile,

    // NEW
    resetGuruCreate,
  } = slice.actions;

  export default slice.reducer;

  /* ========= SELECTORS ========= */
  export const selectGuruDetail  = (state: any) => state.guru.detail as GuruDetailState;
  export const selectGuruList    = (state: any) => state.guru.list as GuruListState;
  export const selectGuruProfile = (state: any) => state.guru.profile as GuruProfileState;
  /** NEW */
  export const selectGuruCreate  = (state: any) => state.guru.create as GuruCreateState;
