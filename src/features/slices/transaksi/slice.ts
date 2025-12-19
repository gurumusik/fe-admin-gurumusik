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

const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
  range: 'ALL',         // ⬅️ default waktu = ALL
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
  monthlyrecap: null,
};

/* ========================= THUNKS ========================= */

// === LIST BY PROMO (full dgn normalisasi params)
export const fetchTxByPromoThunk = createAsyncThunk<
  ListTxByPromoResponse,
  FetchTxByPromoArgs,
  { rejectValue: string }
>('transaksi/byPromo/fetchList', async ({ promoId, params }, { rejectWithValue }) => {
  try {
    const p: any = { ...(params || {}) };

    // normalisasi angka
    if (p.page != null) p.page = Number(p.page) || 1;
    if (p.limit != null) p.limit = Number(p.limit) || 10;

    // SEARCH -> kirim 'q' & 'query'
    if (p.q) {
      p.q = String(p.q).trim();
      if (!p.query) p.query = p.q;
    }

    // STATUS: map label UI -> raw BE
    if (p.status_label && p.status_label !== 'ALL') {
      const raw = labelToRawStatus(p.status_label);
      if (raw) p.status = raw;
    }
    delete p.status_label;

    // RANGE/TANGGAL
    if (p.range === 'ALL') {
      delete p.date_from;
      delete p.date_to;
    } else if (p.range && (!p.date_from || !p.date_to)) {
      const end = new Date(); end.setHours(0,0,0,0);
      const start = new Date(end);
      if (p.range === '30D') start.setDate(end.getDate() - 29);
      if (p.range === '90D') start.setDate(end.getDate() - 89);
      p.date_from = toYmd(start);
      p.date_to = toYmd(end);
    }

    // CATEGORY: kalau ALL, jangan kirim
    if (p.category === 'ALL') delete p.category;

    // bersihkan kosong
    Object.keys(p).forEach((k) => {
      if (p[k] == null || (typeof p[k] === 'string' && p[k].trim() === '')) delete p[k];
    });

    const res = await listTransactionsByPromo(promoId, p);
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
    const root = getState() as any;
    const s = (root.transaksi ?? root.transaksiByPromo ?? {}) as Partial<TransaksiByPromoState>;

    const rawCategory: 'paket' | 'modul' | 'all' =
      s?.category === 'Modul' ? 'modul' : 'all';

    // ⬇️ gunakan "ov" biar bisa akses field custom seperti net
    const ov: any = overrideParams || {};

    const req: any = {
      page: ov.page ?? s?.page ?? 1,
      limit: ov.limit ?? s?.limit ?? 10,
      q: (ov.q ?? s?.q) || undefined,
      category: ov.category ?? rawCategory,
      status: ov.status ?? (s?.statusFilter ? labelToRawStatus(s.statusFilter) : undefined),
      date_from: ov.date_from ?? (s?.date_from || undefined),
      date_to: ov.date_to ?? (s?.date_to || undefined),

      // ⬇️ NEW: teruskan net ke service kalau dikirim dari FE
      net: typeof ov.net === 'boolean' ? ov.net : undefined,
    };

    // bersihkan kosong (net=false tidak akan dihapus, dan itu oke)
    Object.keys(req).forEach((k) => {
      const v = req[k];
      if (v == null || (typeof v === 'string' && v.trim() === '')) delete req[k];
    });

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
      s.range = 'ALL';   // ⬅️ reset ke ALL juga
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
      s.allRecap = (a.payload as any).recap ?? null;

      const p: any = a.payload as any;
      s.monthlyrecap = p.monthlyrecap ?? null;
      let monthlyFromPayload: MonthlyRecapPoint[] | null =
        p.monthlyRecap ?? p.recap?.monthly ?? p.recap?.by_month ?? null;

      if (!monthlyFromPayload) {
        const box = p?.monthlyrecap?.['this year'] || p?.monthlyrecap?.thisYear;
        if (box && typeof box === 'object') {
          const MONTHS = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'] as const;
          const year = new Date().getFullYear();
          monthlyFromPayload = MONTHS.map((name, i) => {
            const agg = box[name] || {};
            const course_count = Number(agg?.course_count ?? 0);
            const module_count = Number(agg?.module_count ?? 0);
            const promo_tx_count = Number(agg?.promo_tx_count ?? 0);
            const count = Number(
              agg?.course_and_module_count ?? (course_count + module_count)
            );
            return { year, month: i + 1, count, course_count, module_count, promo_tx_count };
          });
        }
      }
      s.allMonthlyRecap = Array.isArray(monthlyFromPayload) ? monthlyFromPayload : null;

      if ((p as any).page) s.page = (p as any).page;
      if ((p as any).limit) s.limit = (p as any).limit;
    });
    b.addCase(fetchAllTxThunk.rejected, (s, a) => {
      s.allStatus = 'failed';
      s.allError = (a.payload as string) ?? 'Terjadi kesalahan';
      s.allItems = [];
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
