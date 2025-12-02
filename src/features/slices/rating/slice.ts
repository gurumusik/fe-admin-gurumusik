/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/rating/slice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getPerformaMengajarAdmin,
  getPerformaMengajarGlobal,
  getPerformaNilaiGlobalDaily,
  listRatings,
} from '@/services/api/rating.api';
import type {
  PerformaMengajar,
  PerformaMengajarState,
  PerformaMengajarSliceState,
  RatingDailyResponse,
  RatingsListQuery,
  RatingsListResponse,
  RatingsListMeta,
  ApiRatingItem,
} from './types';

/** ===== Initial State ===== */
const initialState: PerformaMengajarSliceState & {
  daily: RatingDailyResponse | null;
  dailyStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  dailyError: string | null;

  // LIST RATINGS
  list: ApiRatingItem[];
  listMeta: RatingsListMeta | null;
  listStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  listError: string | null;
  listQuery: RatingsListQuery;
} = {
  // ADMIN
  data: null,
  status: 'idle',
  error: null,
  lastGuruId: null,
  lastMonth: null,

  // GLOBAL (summary)
  globalData: null,
  globalStatus: 'idle',
  globalError: null,
  lastMonthGlobal: null,

  // GLOBAL (daily timeseries)
  daily: null,
  dailyStatus: 'idle',
  dailyError: null,

  // LIST RATINGS (table)
  list: [],
  listMeta: null,
  listStatus: 'idle',
  listError: null,
  listQuery: {
    page: 1,
    limit: 10,
    sort: 'created_at',
    order: 'desc',
    q: '',
    // filter default biarkan undefined agar tidak membatasi
    guru_id: undefined,
    murid_id: undefined,
    visible: undefined,
    date_from: undefined,
    date_to: undefined,
    min_rate: undefined,
    max_rate: undefined,
  },
};

/** ===== Thunks ===== */

/** ADMIN */
export const fetchPerformaMengajarAdminThunk = createAsyncThunk(
  'rating/performaMengajarAdmin/fetch',
  async (
    params: { guruId: number | string; month?: string; muridId?: number | string },
    { rejectWithValue }
  ) => {
    try {
      const res = await getPerformaMengajarAdmin(params.guruId, {
        month: params.month,
        murid_id: params.muridId,
      });
      const data = (res as any)?.data ?? res;
      return { data: data as PerformaMengajar, meta: params };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat performa mengajar');
    }
  }
);

/** GLOBAL (summary) */
export const fetchPerformaMengajarGlobalThunk = createAsyncThunk(
  'rating/performaMengajarGlobal/fetch',
  async (params: { month?: string } | undefined, { rejectWithValue }) => {
    try {
      const res = await getPerformaMengajarGlobal({ month: params?.month });
      const data = (res as any)?.data ?? res;
      return { data: data as PerformaMengajar, meta: params };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat performa mengajar (global)');
    }
  }
);

/** GLOBAL (daily timeseries untuk chart) */
export const fetchPerformaNilaiGlobalDailyThunk = createAsyncThunk(
  'rating/performaNilaiGlobalDaily/fetch',
  async (params: { start?: string; end?: string } | undefined, { rejectWithValue }) => {
    try {
      const res = await getPerformaNilaiGlobalDaily(params);
      const data = (res as any)?.data ?? res;
      return data as RatingDailyResponse;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat performa nilai harian (global)');
    }
  }
);

/** LIST RATINGS (table) */
export const fetchRatingsListThunk = createAsyncThunk(
  'rating/list/fetch',
  async (params: RatingsListQuery | undefined, { rejectWithValue }) => {
    try {
      const res = await listRatings(params);
      const meta: RatingsListMeta = (res as RatingsListResponse)?.meta ?? (res as any)?.meta;
      const data: ApiRatingItem[] = (res as RatingsListResponse)?.data ?? (res as any)?.data ?? [];
      return { meta, data };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat daftar rating');
    }
  }
);

/** ===== Slice ===== */
const slice = createSlice({
  name: 'performaMengajar',
  initialState,
  reducers: {
    resetPerformaMengajarAdmin: (s) => {
      s.data = null;
      s.status = 'idle';
      s.error = null;
      s.lastGuruId = null;
      s.lastMonth = null;
    },
    resetPerformaMengajarGlobal: (s) => {
      s.globalData = null;
      s.globalStatus = 'idle';
      s.globalError = null;
      s.lastMonthGlobal = null;
    },
    resetPerformaNilaiGlobalDaily: (s) => {
      s.daily = null;
      s.dailyStatus = 'idle';
      s.dailyError = null;
    },

    /** Filters & paging untuk LIST RATINGS */
    setRatingsPage: (s, a: { payload: number }) => {
      s.listQuery.page = a.payload || 1;
    },
    setRatingsLimit: (s, a: { payload: number | 'all' }) => {
      s.listQuery.limit = a.payload;
      // reset page biar ga out-of-range
      s.listQuery.page = 1;
    },
    setRatingsSearch: (s, a: { payload: string }) => {
      s.listQuery.q = a.payload ?? '';
      s.listQuery.page = 1;
    },
    setRatingsVisible: (s, a: { payload: boolean | undefined }) => {
      s.listQuery.visible = a.payload;
      s.listQuery.page = 1;
    },
    setRatingsGuruId: (s, a: { payload: number | string | undefined }) => {
      s.listQuery.guru_id = a.payload;
      s.listQuery.page = 1;
    },
    setRatingsMuridId: (s, a: { payload: number | string | undefined }) => {
      s.listQuery.murid_id = a.payload;
      s.listQuery.page = 1;
    },
    setRatingsDateRange: (s, a: { payload: { from?: string; to?: string } }) => {
      s.listQuery.date_from = a.payload?.from;
      s.listQuery.date_to = a.payload?.to;
      s.listQuery.page = 1;
    },
    setRatingsRateRange: (s, a: { payload: { min?: number; max?: number } }) => {
      s.listQuery.min_rate = a.payload?.min;
      s.listQuery.max_rate = a.payload?.max;
      s.listQuery.page = 1;
    },
    setRatingsSort: (s, a: { payload: { sort?: 'id' | 'rate' | 'created_at'; order?: 'asc' | 'desc' } }) => {
      if (a.payload?.sort) s.listQuery.sort = a.payload.sort;
      if (a.payload?.order) s.listQuery.order = a.payload.order;
      s.listQuery.page = 1;
    },
    resetRatingsList: (s) => {
      s.list = [];
      s.listMeta = null;
      s.listStatus = 'idle';
      s.listError = null;
      s.listQuery = { page: 1, limit: 10, sort: 'created_at', order: 'desc', q: '' };
    },
  },
  extraReducers: (b) => {
    /** ADMIN */
    b.addCase(fetchPerformaMengajarAdminThunk.pending, (s, a) => {
      s.status = 'loading';
      s.error = null;
      s.lastGuruId = a.meta.arg.guruId ?? null;
      s.lastMonth = a.meta.arg.month ?? null;
    });
    b.addCase(fetchPerformaMengajarAdminThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.data = a.payload.data;
    });
    b.addCase(fetchPerformaMengajarAdminThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal memuat performa mengajar';
    });

    /** GLOBAL (summary) */
    b.addCase(fetchPerformaMengajarGlobalThunk.pending, (s, a) => {
      s.globalStatus = 'loading';
      s.globalError = null;
      s.lastMonthGlobal = a.meta.arg?.month ?? null;
    });
    b.addCase(fetchPerformaMengajarGlobalThunk.fulfilled, (s, a) => {
      s.globalStatus = 'succeeded';
      s.globalData = a.payload.data;
    });
    b.addCase(fetchPerformaMengajarGlobalThunk.rejected, (s, a) => {
      s.globalStatus = 'failed';
      s.globalError = (a.payload as string) ?? 'Gagal memuat performa mengajar (global)';
    });

    /** GLOBAL (daily timeseries) */
    b.addCase(fetchPerformaNilaiGlobalDailyThunk.pending, (s) => {
      s.dailyStatus = 'loading';
      s.dailyError = null;
    });
    b.addCase(fetchPerformaNilaiGlobalDailyThunk.fulfilled, (s, a) => {
      s.dailyStatus = 'succeeded';
      s.daily = a.payload;
    });
    b.addCase(fetchPerformaNilaiGlobalDailyThunk.rejected, (s, a) => {
      s.dailyStatus = 'failed';
      s.dailyError = (a.payload as string) ?? 'Gagal memuat performa nilai harian (global)';
    });

    /** LIST RATINGS */
    b.addCase(fetchRatingsListThunk.pending, (s) => {
      s.listStatus = 'loading';
      s.listError = null;
    });
    b.addCase(fetchRatingsListThunk.fulfilled, (s, a) => {
      s.listStatus = 'succeeded';
      s.list = a.payload.data ?? [];
      s.listMeta = a.payload.meta ?? null;
    });
    b.addCase(fetchRatingsListThunk.rejected, (s, a) => {
      s.listStatus = 'failed';
      s.listError = (a.payload as string) ?? 'Gagal memuat daftar rating';
    });
  },
});

export const {
  resetPerformaMengajarAdmin,
  resetPerformaMengajarGlobal,
  resetPerformaNilaiGlobalDaily,

  // list filters
  setRatingsPage,
  setRatingsLimit,
  setRatingsSearch,
  setRatingsVisible,
  setRatingsGuruId,
  setRatingsMuridId,
  setRatingsDateRange,
  setRatingsRateRange,
  setRatingsSort,
  resetRatingsList,
} = slice.actions;

export default slice.reducer;

/** ===== Selectors (defensif) ===== */

/** ADMIN */
export const selectPerformaMengajarAdmin = (state: any) => {
  const s = (state?.performaMengajar ??
    state?.rating ??
    state?.ratings) as PerformaMengajarSliceState | undefined;

  const safe: PerformaMengajarState = {
    data: s?.data ?? null,
    status: (s?.status ?? 'idle') as 'idle' | 'loading' | 'succeeded' | 'failed',
    error: s?.error ?? null,
    lastGuruId: s?.lastGuruId ?? null,
    lastMonth: s?.lastMonth ?? null,
  };
  return safe;
};

/** GLOBAL (summary) */
export const selectPerformaMengajarGlobal = (state: any) => {
  const s = (state?.performaMengajar ??
    state?.rating ??
    state?.ratings) as PerformaMengajarSliceState | undefined;

  return {
    data: s?.globalData ?? null,
    status: (s?.globalStatus ?? 'idle') as 'idle' | 'loading' | 'succeeded' | 'failed',
    error: s?.globalError ?? null,
    lastMonth: s?.lastMonthGlobal ?? null,
  };
};

/** GLOBAL (daily timeseries) */
export const selectPerformaNilaiGlobalDaily = (state: any) => {
  const s = (state?.performaMengajar ??
    state?.rating ??
    state?.ratings) as (PerformaMengajarSliceState & {
      daily: RatingDailyResponse | null;
      dailyStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
      dailyError: string | null;
    }) | undefined;

  return {
    data: s?.daily ?? null,
    status: (s?.dailyStatus ?? 'idle') as 'idle' | 'loading' | 'succeeded' | 'failed',
    error: s?.dailyError ?? null,
  };
};

/** LIST RATINGS (table) */
export const selectRatingsList = (state: any) => {
  const s = state?.performaMengajar ?? state?.rating ?? state?.ratings;
  return {
    data: (s?.list ?? []) as ApiRatingItem[],
    meta: (s?.listMeta ?? null) as RatingsListMeta | null,
    status: (s?.listStatus ?? 'idle') as 'idle' | 'loading' | 'succeeded' | 'failed',
    error: (s?.listError ?? null) as string | null,
    query: (s?.listQuery ?? {}) as RatingsListQuery,
  };
};
