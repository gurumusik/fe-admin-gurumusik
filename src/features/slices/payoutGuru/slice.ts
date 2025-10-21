/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from '@/app/store';
import { listPayoutGuru, decidePayoutGuru } from '@/services/api/payoutGuru.api';
import type {
  ListPayoutGuruParams,
  PayoutGuruDTO,
  Recap,
  RecapMonthly,
} from '@/features/slices/payoutGuru/types';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export const fetchPayoutGuruListThunk = createAsyncThunk(
  'payoutGuru/list',
  async (params: ListPayoutGuruParams | undefined, { rejectWithValue }) => {
    try {
      const res = await listPayoutGuru(params);
      return res; // { total, page, limit, data, recap?, recapmonthly? }
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat payout guru');
    }
  }
);

/** NEW: approve / reject */
export const decidePayoutGuruThunk = createAsyncThunk(
  'payoutGuru/decide',
  async (
    args: { id: number | string; action: 'approve' | 'reject'; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await decidePayoutGuru(args.id, {
        action: args.action,
        reason: args.reason,
      });
      return res; // { message, data }
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memproses keputusan payout');
    }
  }
);

type PayoutGuruState = {
  items: PayoutGuruDTO[];
  total: number;
  page: number;
  limit: number;
  status: Status;
  error: string | null;
  lastQuery: ListPayoutGuruParams | null;
  recap: Recap | null;
  recapmonthly: RecapMonthly | null;

  // NEW: status untuk approve/reject
  decideStatus: Status;
  decideError: string | null;
};

const initialState: PayoutGuruState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  status: 'idle',
  error: null,
  lastQuery: null,
  recap: null,
  recapmonthly: null,

  decideStatus: 'idle',
  decideError: null,
};

const payoutGuruSlice = createSlice({
  name: 'payoutGuru',
  initialState,
  reducers: {
    setPage(state, action) {
      state.page = Number(action.payload || 1);
    },
    setLimit(state, action) {
      state.limit = Number(action.payload || 10);
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // LIST
      .addCase(fetchPayoutGuruListThunk.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.lastQuery = action.meta.arg ?? null;
      })
      .addCase(fetchPayoutGuruListThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data ?? [];
        state.total = action.payload.total ?? 0;
        state.page = action.payload.page ?? state.page;
        state.limit = action.payload.limit ?? state.limit;
        state.recap = action.payload.recap ?? null;
        state.recapmonthly = action.payload.recapmonthly ?? null;
      })
      .addCase(fetchPayoutGuruListThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Gagal memuat payout guru';
        state.items = [];
        state.recap = null;
        state.recapmonthly = null;
      })

      // DECIDE (approve / reject)
      .addCase(decidePayoutGuruThunk.pending, (state) => {
        state.decideStatus = 'loading';
        state.decideError = null;
      })
      .addCase(decidePayoutGuruThunk.fulfilled, (state, action) => {
        state.decideStatus = 'succeeded';
        const updated: PayoutGuruDTO = action.payload.data;

        // Jika daftar sedang menampilkan status=requested, maka
        // item yang berubah status harus dikeluarkan dari list.
        const wasInList = state.items.some((x) => x.id === updated.id);
        if (wasInList) {
          if (state.lastQuery?.status === 'requested' && updated.status !== 'requested') {
            state.items = state.items.filter((x) => x.id !== updated.id);
            state.total = Math.max(0, state.total - 1);
          } else {
            state.items = state.items.map((x) => (x.id === updated.id ? updated : x));
          }
        }
      })
      .addCase(decidePayoutGuruThunk.rejected, (state, action) => {
        state.decideStatus = 'failed';
        state.decideError = (action.payload as string) ?? 'Gagal memproses keputusan payout';
      });
  },
});

export const { setPage, setLimit, reset } = payoutGuruSlice.actions;
export default payoutGuruSlice.reducer;

// selectors
export const selectPayoutGuruState = (state: RootState) => state.payoutGuru;
export type PayoutGuruDispatch = AppDispatch;
