/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/guruApplication/slice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  GAListParams,
  GAListResp,
  GAListSortBy,
  GAListSortDir,
  GARecap,
  GAStatus,
  GuruApplicationDTO,
} from './types';
import { getGuruApplication, listGuruApplications } from '@/services/api/guruApplication.api';
import { decideApplication } from '@/services/api/recruitment.api';

/* ========================= STATE ========================= */

type ListState = {
  loading: boolean;
  error: string | null;

  // data list
  rows: GuruApplicationDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  // recap & sort dari server
  recap: GARecap;
  sort: { by: GAListSortBy; dir: GAListSortDir };

  // filters (client state -> dipakai untuk request)
  q: string;
  status: GAStatus | 'all';
  created_from?: string;
  created_to?: string;
};

type DetailState = {
  loading: boolean;
  error: string | null;
  data: GuruApplicationDTO | null;
};

export type GuruApplicationSliceState = {
  list: ListState;
  detail: DetailState;
};

const initialState: GuruApplicationSliceState = {
  list: {
    loading: false,
    error: null,

    rows: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,

    recap: { proses: 0, diterima: 0, ditolak: 0 },
    sort: { by: 'created_at', dir: 'DESC' },

    q: '',
    status: 'all',
    created_from: undefined,
    created_to: undefined,
  },
  detail: {
    loading: false,
    error: null,
    data: null,
  },
};

/* ========================= THUNKS ========================= */

export const fetchGuruApplicationsThunk = createAsyncThunk<
  GAListResp,
  void,
  { rejectValue: string; state: { guruApplication: GuruApplicationSliceState } }
>('guruApplication/list', async (_void, thunkApi) => {
  try {
    const s = thunkApi.getState().guruApplication.list;
    const params: GAListParams = {
      q: s.q || undefined,
      page: s.page,
      limit: s.limit,
      status: s.status === 'all' ? undefined : s.status,
      created_from: s.created_from,
      created_to: s.created_to,
      sortBy: s.sort.by,
      sortDir: s.sort.dir,
    };
    const resp = await listGuruApplications(params);
    return resp;
  } catch (err: any) {
    return thunkApi.rejectWithValue(err?.message || 'Gagal memuat guru applications');
  }
});

export const fetchGuruApplicationDetailThunk = createAsyncThunk<
  GuruApplicationDTO,
  number | string,
  { rejectValue: string }
>('guruApplication/detail', async (id, thunkApi) => {
  try {
    const resp = await getGuruApplication(id);
    return resp;
  } catch (err: any) {
    return thunkApi.rejectWithValue(err?.message || 'Gagal memuat detail guru application');
  }
});

export const approveApplicationThunk = createAsyncThunk<
  { message: string },
  { id: number | string; note?: string },
  { rejectValue: string }
>('guruApplication/approve', async ({ id, note }, thunkApi) => {
  try {
    const resp = await decideApplication(id, { decision: 'approve', note });
    return resp;
  } catch (err: any) {
    return thunkApi.rejectWithValue(err?.message || 'Gagal menyetujui aplikasi guru');
  }
});

export const rejectApplicationThunk = createAsyncThunk<
  { message: string },
  { id: number | string; note?: string },
  { rejectValue: string }
>('guruApplication/reject', async ({ id, note }, thunkApi) => {
  try {
    const resp = await decideApplication(id, { decision: 'reject', note });
    return resp;
  } catch (err: any) {
    return thunkApi.rejectWithValue(err?.message || 'Gagal menolak aplikasi guru');
  }
});

/* ========================= SLICE ========================= */

const slice = createSlice({
  name: 'guruApplication',
  initialState,
  reducers: {
    setGAQ(state, action: PayloadAction<string>) {
      state.list.q = action.payload;
      state.list.page = 1;
    },
    setGAStatus(state, action: PayloadAction<GAStatus | 'all'>) {
      state.list.status = action.payload;
      state.list.page = 1;
    },
    setGAPage(state, action: PayloadAction<number>) {
      state.list.page = action.payload > 0 ? action.payload : 1;
    },
    setGALimit(state, action: PayloadAction<number>) {
      state.list.limit = action.payload > 0 ? action.payload : 10;
      state.list.page = 1;
    },
    setGASort(
      state,
      action: PayloadAction<{ by: GAListSortBy; dir: GAListSortDir }>
    ) {
      state.list.sort = action.payload;
      state.list.page = 1;
    },
    setGADateRange(
      state,
      action: PayloadAction<{ created_from?: string; created_to?: string }>
    ) {
      state.list.created_from = action.payload.created_from;
      state.list.created_to = action.payload.created_to;
      state.list.page = 1;
    },
    resetGAFilters(state) {
      state.list.q = '';
      state.list.status = 'all';
      state.list.created_from = undefined;
      state.list.created_to = undefined;
      state.list.sort = { by: 'created_at', dir: 'DESC' };
      state.list.page = 1;
    },
    clearGADetail(state) {
      state.detail.data = null;
      state.detail.error = null;
      state.detail.loading = false;
    },
  },
  extraReducers: (builder) => {
    // LIST
    builder.addCase(fetchGuruApplicationsThunk.pending, (state) => {
      state.list.loading = true;
      state.list.error = null;
    });
    builder.addCase(fetchGuruApplicationsThunk.fulfilled, (state, action) => {
      state.list.loading = false;
      state.list.rows = action.payload.rows;
      state.list.total = action.payload.total;
      state.list.page = action.payload.page;
      state.list.limit = action.payload.limit;
      state.list.totalPages = action.payload.totalPages;
      state.list.recap = action.payload.recap;
      state.list.sort = action.payload.sort;
    });
    builder.addCase(fetchGuruApplicationsThunk.rejected, (state, action) => {
      state.list.loading = false;
      state.list.error = action.payload || 'Gagal memuat guru applications';
    });

    // DETAIL
    builder.addCase(fetchGuruApplicationDetailThunk.pending, (state) => {
      state.detail.loading = true;
      state.detail.error = null;
      state.detail.data = null;
    });
    builder.addCase(fetchGuruApplicationDetailThunk.fulfilled, (state, action) => {
      state.detail.loading = false;
      state.detail.data = action.payload;
    });
    builder.addCase(fetchGuruApplicationDetailThunk.rejected, (state, action) => {
      state.detail.loading = false;
      state.detail.error = action.payload || 'Gagal memuat detail guru application';
    });
  },
});

export const {
  setGAQ,
  setGAStatus,
  setGAPage,
  setGALimit,
  setGASort,
  setGADateRange,
  resetGAFilters,
  clearGADetail,
} = slice.actions;

export default slice.reducer;
