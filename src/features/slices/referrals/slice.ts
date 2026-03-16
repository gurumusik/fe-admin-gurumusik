/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { listReferralCommissions, listReferralReferrers } from '@/services/api/referrals.api';
import type {
  ListReferralCommissionsParams,
  ListReferralCommissionsResp,
  ListReferralReferrersParams,
  ListReferralReferrersResp,
  ReferralCommissionRow,
  ReferralReferrerSummaryRaw,
  Status,
} from '@/features/slices/referrals/types';

export const fetchReferralReferrersThunk = createAsyncThunk(
  'referrals/referrers',
  async (params: ListReferralReferrersParams | undefined, { rejectWithValue }) => {
    try {
      return await listReferralReferrers(params);
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat ringkasan referral');
    }
  }
);

export const fetchReferralCommissionsThunk = createAsyncThunk(
  'referrals/commissions',
  async (params: ListReferralCommissionsParams | undefined, { rejectWithValue }) => {
    try {
      return await listReferralCommissions(params);
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat riwayat komisi referral');
    }
  }
);

type ReferrersState = {
  items: ReferralReferrerSummaryRaw[];
  total: number;
  page: number;
  limit: number;
  status: Status;
  error: string | null;
  lastQuery: ListReferralReferrersParams | null;
};

type CommissionsState = {
  items: ReferralCommissionRow[];
  total: number;
  page: number;
  limit: number;
  status: Status;
  error: string | null;
  lastQuery: ListReferralCommissionsParams | null;
};

type ReferralsState = {
  referrers: ReferrersState;
  commissions: CommissionsState;
};

const initialState: ReferralsState = {
  referrers: {
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    status: 'idle',
    error: null,
    lastQuery: null,
  },
  commissions: {
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    status: 'idle',
    error: null,
    lastQuery: null,
  },
};

const referralsSlice = createSlice({
  name: 'referrals',
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // Referrers
      .addCase(fetchReferralReferrersThunk.pending, (state, action) => {
        state.referrers.status = 'loading';
        state.referrers.error = null;
        state.referrers.lastQuery = action.meta.arg ?? null;
      })
      .addCase(fetchReferralReferrersThunk.fulfilled, (state, action: { payload: ListReferralReferrersResp }) => {
        state.referrers.status = 'succeeded';
        state.referrers.items = action.payload.data ?? [];
        state.referrers.total = action.payload.total ?? 0;
        state.referrers.page = action.payload.page ?? state.referrers.page;
        state.referrers.limit = action.payload.limit ?? state.referrers.limit;
      })
      .addCase(fetchReferralReferrersThunk.rejected, (state, action: any) => {
        state.referrers.status = 'failed';
        state.referrers.error = (action.payload as string) ?? 'Gagal memuat ringkasan referral';
        state.referrers.items = [];
      })

      // Commissions
      .addCase(fetchReferralCommissionsThunk.pending, (state, action) => {
        state.commissions.status = 'loading';
        state.commissions.error = null;
        state.commissions.lastQuery = action.meta.arg ?? null;
      })
      .addCase(fetchReferralCommissionsThunk.fulfilled, (state, action: { payload: ListReferralCommissionsResp }) => {
        state.commissions.status = 'succeeded';
        state.commissions.items = action.payload.data ?? [];
        state.commissions.total = action.payload.total ?? 0;
        state.commissions.page = action.payload.page ?? state.commissions.page;
        state.commissions.limit = action.payload.limit ?? state.commissions.limit;
      })
      .addCase(fetchReferralCommissionsThunk.rejected, (state, action: any) => {
        state.commissions.status = 'failed';
        state.commissions.error = (action.payload as string) ?? 'Gagal memuat riwayat komisi referral';
        state.commissions.items = [];
      });
  },
});

export const { reset } = referralsSlice.actions;
export default referralsSlice.reducer;

export const selectReferralsState = (state: RootState) => state.referrals;

