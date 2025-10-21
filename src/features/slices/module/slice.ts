// src/features/slices/module/slice.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { listModulesAdmin, updateModuleStatusAdmin } from '@/services/api/module.api';
import type {
  ModuleSliceState,
  ModuleRow,
  ModuleType,
  ModuleListItemApi,
  ApiModuleType,
} from './types';

const initialState: ModuleSliceState = {
  items: [],
  total: 0,
  counts: { active: 0, inactive: 0, requests: 0 },
  status: 'idle',
  error: null,
  filters: {
    q: '',
    type: 'ALL',
  },
};

// helper mapping
const toUiType = (t: ApiModuleType): ModuleType => (t === 'ebook' ? 'E-Book' : 'Video');

/** Mapping API -> UI row */
function adaptApiToRow(m: ModuleListItemApi): ModuleRow {
  return {
    id: m.id,
    uuid: `mod-${m.id}`,
    title: m.judul,
    image: m.thumbnail_path,
    price: Number(m.harga_bid),
    sold: m.terjual,
    type: toUiType(m.tipe),
    status: m.status === 'Aktif' ? 'Aktif' : 'Non-Aktif',
    statusRaw: m.status,
    created_at: m.created_at,
    updated_at: m.updated_at,
    guru: m.guru,
  };
}

/** Hitung ringkasan dari label status API (toleran variasi) */
function computeCounts(apiItems: ModuleListItemApi[]) {
  let active = 0, inactive = 0, requests = 0;
  for (const m of apiItems) {
    const s = String(m.status ?? '').trim().toLowerCase();
    if (s.includes('diperiksa')) requests++;
    else if (s === 'aktif') active++;
    else inactive++; // "non aktif" / "non_aktif" / "non-aktif" → masuk sini
  }
  return { active, inactive, requests };
}

// === Thunk: fetch list admin ===
export const fetchModulesAdminThunk = createAsyncThunk(
  'modulesAdmin/fetchList',
  async (_: void, { getState, rejectWithValue }) => {
    try {
      const s = getState() as { modulesAdmin: ModuleSliceState };
      const { q, type } = s.modulesAdmin.filters;
      const apiType: ApiModuleType | undefined =
        type === 'ALL' ? undefined : (type === 'E-Book' ? 'ebook' : 'video');

      const res = await listModulesAdmin({ q, type: apiType });
      return res; // ModuleListRespApi
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memuat modul (admin)');
    }
  }
);

// === Thunk: update status admin (aktif / non_aktif) ===
export const updateModuleStatusAdminThunk = createAsyncThunk(
  'modulesAdmin/updateStatus',
  async (
    args: { id: number; mode: 'activate' | 'deactivate' },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const status = args.mode === 'activate' ? 'aktif' : 'non_aktif' as const;
      await updateModuleStatusAdmin(args.id, status);

      // refresh list (menggunakan filter yang ada)
      // cukup dispatch fetch thunk; dia akan baca filter dari state sendiri
      dispatch(fetchModulesAdminThunk());
      return { id: args.id, status };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal memperbarui status modul');
    }
  }
);

const slice = createSlice({
  name: 'modulesAdmin',
  initialState,
  reducers: {
    setModuleQuery(s, a) {
      s.filters.q = (a.payload ?? '').trim();
    },
    setModuleType(s, a) {
      s.filters.type = a.payload as ModuleSliceState['filters']['type'];
    },
    resetModuleFilters(s) {
      s.filters = { q: '', type: 'ALL' };
    },
  },
  extraReducers: (b) => {
    // fetch list
    b.addCase(fetchModulesAdminThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchModulesAdminThunk.fulfilled, (s, a) => {
      const api = a.payload as any;
      const apiItems: ModuleListItemApi[] = api?.data ?? [];
      s.items = apiItems.map(adaptApiToRow);
      s.total = Number(api?.total ?? s.items.length);
      s.counts = computeCounts(apiItems);
      s.status = 'succeeded';
    });
    b.addCase(fetchModulesAdminThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal memuat modul (admin)';
    });

    // update status (opsional: bisa dipakai untuk indikator state global)
    b.addCase(updateModuleStatusAdminThunk.pending, (s) => {
      // boleh set flag lain kalau mau; dibiarkan kosong juga nggak apa-apa
      s.error = null;
    });
    b.addCase(updateModuleStatusAdminThunk.rejected, (s, a) => {
      s.error = (a.payload as string) ?? 'Gagal memperbarui status modul';
    });
  },
});

export const { setModuleQuery, setModuleType, resetModuleFilters } = slice.actions;
export default slice.reducer;
