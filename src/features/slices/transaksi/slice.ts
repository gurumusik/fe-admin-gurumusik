/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/transaksi/slice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  listTransactionsByPromo,
  getTransaksiDetail,
  listAllTransactions, // NEW
} from '@/services/api/transaksi.api';

import type {
  TransaksiByPromoState,
  FetchTxByPromoArgs,
  ListTxByPromoResponse,
  GetTxDetailArgs,
  TxCategoryChip,
  TxRange,
  TxStatusLabel,
  TxStatusRaw,
  ListAllTxParams,
  ListPromoTransactionsResp,
  MonthlyRecapPoint,
} from './types';

/* ========================= HELPERS ========================= */

function labelToRawStatus(label?: TxStatusLabel | 'ALL'): TxStatusRaw | undefined {
  if (!label || label === 'ALL') return undefined;
  if (label === 'Success') return 'lunas';
  if (label === 'On Progress') return 'pending';
  if (label === 'Expired') return 'expired';
  if (label === 'Failed') return 'gagal';
  return undefined; // Canceled -> no raw, ignore
}

/* ========================= INITIAL ========================= */

const initialState: TransaksiByPromoState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,

  // default filters
  q: '',
  statusFilter: 'ALL',
  category: 'ALL',
  range: '30D',
  date_from: null,
  date_to: null,

  status: 'idle',
  error: null,

  detail: null,
  detailStatus: 'idle',
  detailError: null,

  // === state untuk “ALL transactions”
  allItems: [],
  allTotal: 0,
  allStatus: 'idle',
  allError: null,

  allRecap: null,          // rekap agregat
  allMonthlyRecap: null,   // rekap bulanan (chart)
};

/* ========================= THUNKS ========================= */

// === LIST BY PROMO (existing)
export const fetchTxByPromoThunk = createAsyncThunk<
  ListTxByPromoResponse,
  FetchTxByPromoArgs,
  { rejectValue: string }
>('transaksi/byPromo/fetchList', async ({ promoId, params }, { rejectWithValue }) => {
  try {
    const res = await listTransactionsByPromo(promoId, params);
    return res as ListTxByPromoResponse;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat transaksi');
  }
});

// === DETAIL (existing)
export const getTxDetailThunk = createAsyncThunk<
  Awaited<ReturnType<typeof getTransaksiDetail>>,
  GetTxDetailArgs,
  { rejectValue: string }
>('transaksi/detail/fetchOne', async ({ id }, { rejectWithValue }) => {
  try {
    const res = await getTransaksiDetail(id);
    return res;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat detail transaksi');
  }
});

// === LIST SEMUA TRANSAKSI (earning page)
export const fetchAllTxThunk = createAsyncThunk<
  ListPromoTransactionsResp,
  Partial<ListAllTxParams> | void,
  { rejectValue: string; state: any }
>('transaksi/all/fetchList', async (overrideParams, { rejectWithValue, getState }) => {
  try {
    const s = (getState() as any).transaksi as TransaksiByPromoState;

    // Tab "Modul" => kirim 'modul'; selain itu => 'all'
    const rawCategory: 'paket' | 'modul' | 'all' = s.category === 'Modul' ? 'modul' : 'all';

    const req: ListAllTxParams = {
      page: s.page,
      limit: s.limit,
      q: s.q || undefined,
      category: rawCategory,
      status: labelToRawStatus(s.statusFilter),
      date_from: s.date_from || undefined,
      date_to: s.date_to || undefined,
      ...(overrideParams || {}),
    };

    const res = await listAllTransactions(req);
    return res;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat semua transaksi');
  }
});

/* ========================= SLICE ========================= */

const slice = createSlice({
  name: 'transaksiByPromo',
  initialState,
  reducers: {
    setQuery(s, a: PayloadAction<string | undefined>) {
      s.q = a.payload ?? '';
      s.page = 1;
    },
    setStatusFilter(s, a: PayloadAction<TxStatusLabel | 'ALL'>) {
      s.statusFilter = a.payload;
      s.page = 1;
    },
    setCategory(s, a: PayloadAction<TxCategoryChip>) {
      s.category = a.payload;
      s.page = 1;
    },
    setRange(s, a: PayloadAction<TxRange>) {
      s.range = a.payload;
      s.page = 1;
    },
    setDateRange(
      s,
      a: PayloadAction<{ from?: string | null; to?: string | null } | undefined>
    ) {
      s.date_from = a.payload?.from ?? null;
      s.date_to = a.payload?.to ?? null;
      s.page = 1;
    },
    setPage(s, a: PayloadAction<number | undefined>) {
      s.page = a.payload ?? 1;
    },
    setLimit(s, a: PayloadAction<number | undefined>) {
      s.limit = a.payload ?? 10;
      s.page = 1;
    },
    clearDetail(s) {
      s.detail = null;
      s.detailStatus = 'idle';
      s.detailError = null;
    },
    resetFilters(s) {
      s.q = '';
      s.statusFilter = 'ALL';
      s.category = 'ALL';
      s.range = '30D';
      s.date_from = null;
      s.date_to = null;
      s.page = 1;
    },
    resetState() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    // === list by promo
    b.addCase(fetchTxByPromoThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchTxByPromoThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.items = a.payload.data ?? [];
      s.total = a.payload.total ?? 0;
      if ((a.payload as any).page) s.page = (a.payload as any).page;
      if ((a.payload as any).limit) s.limit = (a.payload as any).limit;
    });
    b.addCase(fetchTxByPromoThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Terjadi kesalahan';
      s.items = [];
      s.total = 0;
    });

    // === detail
    b.addCase(getTxDetailThunk.pending, (s) => {
      s.detailStatus = 'loading';
      s.detailError = null;
    });
    b.addCase(getTxDetailThunk.fulfilled, (s, a) => {
      s.detailStatus = 'succeeded';
      s.detail = a.payload;
    });
    b.addCase(getTxDetailThunk.rejected, (s, a) => {
      s.detailStatus = 'failed';
      s.detailError = (a.payload as string) ?? 'Terjadi kesalahan';
      s.detail = null;
    });

    // === all transactions
    b.addCase(fetchAllTxThunk.pending, (s) => {
      s.allStatus = 'loading';
      s.allError = null;
    });
    b.addCase(fetchAllTxThunk.fulfilled, (s, a) => {
      s.allStatus = 'succeeded';
      s.allItems = a.payload.data ?? [];
      s.allTotal = a.payload.total ?? 0;

      // rekap agregat
      s.allRecap = (a.payload as any).recap ?? null;

      // === monthly recap (NEW format): payload.monthlyrecap["this year"] { januari: {...}, ... }
      const p: any = a.payload as any;

      // Compatibility lama (kalau BE lama masih kirim array):
      let monthlyFromPayload: MonthlyRecapPoint[] | null =
        p.monthlyRecap ??
        p.recap?.monthly ??
        p.recap?.by_month ??
        null;

      // Parser untuk format baru
      if (!monthlyFromPayload) {
        const box = p?.monthlyrecap?.['this year'] || p?.monthlyrecap?.thisYear;
        if (box && typeof box === 'object') {
          const MONTHS = [
            'januari','februari','maret','april','mei','juni',
            'juli','agustus','september','oktober','november','desember'
          ] as const;
          const year = new Date().getFullYear();

          const arr: MonthlyRecapPoint[] = MONTHS.map((name, i) => {
            const agg = box[name] || {};
            const course_count = Number(agg?.course_count ?? 0);
            const module_count = Number(agg?.module_count ?? 0);
            const promo_tx_count = Number(agg?.promo_tx_count ?? 0);
            const count = Number(
              agg?.course_and_module_count ??
              (course_count + module_count)
            );
            return {
              year,
              month: i + 1,        // 1..12
              count,
              course_count,
              module_count,
              promo_tx_count,
            };
          });

          monthlyFromPayload = arr;
        }
      }

      s.allMonthlyRecap = Array.isArray(monthlyFromPayload) ? monthlyFromPayload : null;

      if (p.page) s.page = p.page;
      if (p.limit) s.limit = p.limit;
    });
  },
});

export const {
  setQuery,
  setStatusFilter,
  setCategory,
  setRange,
  setDateRange,
  setPage,
  setLimit,
  clearDetail,
  resetFilters,
  resetState,
} = slice.actions;

export default slice.reducer;
