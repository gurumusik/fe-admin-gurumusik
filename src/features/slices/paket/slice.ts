/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/paket/slice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as PaketAPI from '@/services/api/paket.api';
import type {
  PaketState,
  Paket,
  ListPaketResponse,
  CreatePaketPayload,
  UpdatePaketPayload,
  GroupedPaket,
} from './types';

const makeEmptyGrouped = (): GroupedPaket => ({
  general: [],
  hobby: [],
  internasional: [],
});

const initialState: PaketState = {
  items: [],
  grouped: makeEmptyGrouped(),
  total: 0,
  page: 1,
  limit: 50,
  search: '',
  status: 'idle',
  error: null,
  creating: false,
};

export const fetchPaketThunk = createAsyncThunk<
  ListPaketResponse,
  void,
  { rejectValue: string }
>('paket/fetchList', async (_, { rejectWithValue }) => {
  try {
    const res = await PaketAPI.listPaketGrouped();
    return res as ListPaketResponse;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat paket');
  }
});

export const createPaketThunk = createAsyncThunk<
  Paket,
  CreatePaketPayload,
  { rejectValue: string }
>('paket/create', async (payload, { rejectWithValue }) => {
  try {
    const res = await PaketAPI.createPaket(payload);
    return res as Paket;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal membuat paket');
  }
});

export const updatePaketThunk = createAsyncThunk<
  Paket,
  UpdatePaketPayload,
  { rejectValue: string }
>('paket/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await PaketAPI.updatePaket(id, data);
    return res as Paket;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal mengubah paket');
  }
});

export const deletePaketThunk = createAsyncThunk<
  { id: number | string },
  number | string,
  { rejectValue: string }
>('paket/delete', async (id, { rejectWithValue }) => {
  try {
    await PaketAPI.deletePaket(id);
    return { id };
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal menghapus paket');
  }
});

const sortByJumlahSesi = (a: Paket, b: Paket) =>
  (a?.jumlah_sesi ?? 0) - (b?.jumlah_sesi ?? 0);

const resolveGroupKey = (paket: Paket): keyof GroupedPaket => {
  if (paket?.is_internasional) return 'internasional';
  if (paket?.is_hobby) return 'hobby';
  return 'general';
};

const rebuildFlatItems = (grouped: GroupedPaket): Paket[] => [
  ...grouped.general,
  ...grouped.hobby,
  ...grouped.internasional,
];

const slice = createSlice({
  name: 'paket',
  initialState,
  reducers: {
    setSearch(s, a: PayloadAction<string | undefined>) {
      s.search = a.payload ?? '';
    },
    setPage(s, a: PayloadAction<number | undefined>) {
      s.page = a.payload ?? 1;
    },
    setLimit(s, a: PayloadAction<number | undefined>) {
      s.limit = a.payload ?? s.limit;
    },
  },
  extraReducers: (b) => {
    // fetch list
    b.addCase(fetchPaketThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchPaketThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.grouped = a.payload ?? makeEmptyGrouped();
      s.items = rebuildFlatItems(s.grouped);
      s.total = s.items.length;
      s.page = 1;
      s.limit = s.total || s.limit;
    });
    b.addCase(fetchPaketThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal memuat paket';
    });

    // create
    b.addCase(createPaketThunk.pending, (s) => {
      s.creating = true;
      s.error = null;
    });
    b.addCase(createPaketThunk.fulfilled, (s, a) => {
      s.creating = false;
      const groupKey = resolveGroupKey(a.payload);
      s.grouped[groupKey] = [...s.grouped[groupKey], a.payload].sort(
        sortByJumlahSesi
      );
      s.items = rebuildFlatItems(s.grouped);
      s.total = s.items.length;
    });
    b.addCase(createPaketThunk.rejected, (s, a) => {
      s.creating = false;
      s.error = (a.payload as string) ?? 'Gagal membuat paket';
    });

    // update
    b.addCase(updatePaketThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(updatePaketThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      const updated = a.payload;
      (Object.keys(s.grouped) as (keyof GroupedPaket)[]).forEach((key) => {
        s.grouped[key] = s.grouped[key].filter((p) => p.id !== updated.id);
      });
      const groupKey = resolveGroupKey(updated);
      s.grouped[groupKey] = [...s.grouped[groupKey], updated].sort(
        sortByJumlahSesi
      );
      s.items = rebuildFlatItems(s.grouped);
    });
    b.addCase(updatePaketThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal mengubah paket';
    });

    // delete
    b.addCase(deletePaketThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(deletePaketThunk.fulfilled, (s, a) => {
      s.status = 'succeeded';
      const id = a.payload.id;
      (Object.keys(s.grouped) as (keyof GroupedPaket)[]).forEach((key) => {
        s.grouped[key] = s.grouped[key].filter((p) => p.id !== id);
      });
      s.items = rebuildFlatItems(s.grouped);
      s.total = s.items.length;
    });
    b.addCase(deletePaketThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal menghapus paket';
    });
  },
});

export const { setSearch, setPage, setLimit } = slice.actions;
export default slice.reducer;
