/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/module/detailSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getModuleDetailAdmin,
  updateModuleAdmin,
  updateModuleAdminMultipart
} from '@/services/api/module.api';

import type { ApiModuleDetail, ModuleForm } from './types';

// ---------- State ----------
export type ModuleDetailStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type ModuleDetailState = {
  item: ApiModuleDetail | null;
  status: ModuleDetailStatus;
  error: string | null;

  saving?: boolean;
  saveError?: string | null;
  lastSavedAt?: number | null;
};

const initialState: ModuleDetailState = {
  item: null,
  status: 'idle',
  error: null,
  saving: false,
  saveError: null,
  lastSavedAt: null,
};

// ---------- URL helper ----------
const API_BASE = (import.meta as any)?.env?.VITE_FILE_BASE_URL || '';
const toPublicUrl = (p?: string | null) =>
  !p ? '' : /^https?:\/\//i.test(p) ? p : `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`;

// normalisasi semua path relatif → absolut
function normalizeDetailPaths(d: ApiModuleDetail): ApiModuleDetail {
  return {
    ...d,
    thumbnail_path: toPublicUrl(d.thumbnail_path),
    instrument: d.instrument
      ? {
          ...d.instrument,
          icon: toPublicUrl((d.instrument as any).icon || (d.instrument as any).icon_url),
        }
      : d.instrument,
    playlists: Array.isArray(d.playlists) ? d.playlists : [],
    ebooks: Array.isArray(d.ebooks)
      ? d.ebooks.map((e: any) => ({ ...e, ebook_path: toPublicUrl(e.ebook_path) }))
      : [],
    previews: Array.isArray(d.previews)
      ? d.previews.map((p: any) => ({ ...p, file_path: toPublicUrl(p.file_path) }))
      : [],
  };
}

// ---------- Thunks ----------
export const fetchModuleAdminDetailThunk = createAsyncThunk<
  ApiModuleDetail,
  number,
  { rejectValue: string }
>('moduleAdminDetail/fetch', async (id, { rejectWithValue }) => {
  try {
    const res = await getModuleDetailAdmin(id);
    const raw: ApiModuleDetail = (res as any)?.data ?? (res as any);
    return normalizeDetailPaths(raw);
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat detail modul');
  }
});

// helper – hitung % diskon dari salePrice & promoPrice
const calcPercentDiscount = (sale?: number | '', promo?: number | '') => {
  const s = typeof sale === 'number' ? sale : 0;
  const p = typeof promo === 'number' ? promo : 0;
  if (!s || !p || p >= s) return 0;
  return Math.round(((1 - p / s) * 100) * 100) / 100;
};

// bersihkan playlists dari input UI → hanya link non-kosong
const sanitizePlaylists = (arr: string[] | undefined | null) =>
  (arr ?? [])
    .map((s) => (s ?? '').trim())
    .filter((s) => s.length > 0);

// baca File → data URL base64 (untuk thumbnail)
const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = () => reject(fr.error || new Error('Gagal membaca file thumbnail'));
    fr.readAsDataURL(file);
  });

// mapping UI form → body API (tanpa thumbnail; thumbnail diproses terpisah)
const formToBody = (form: ModuleForm) => {
  const body: any = {
    judul: (form.title ?? '').trim(),
    deskripsi: form.description ?? '',
    preview_class: form.previewUrl ?? '',
    appropriate_module: form.audience ?? '',
    harga: typeof form.basePrice === 'number' ? form.basePrice : undefined,
    harga_bid: typeof form.salePrice === 'number' ? form.salePrice : undefined,
    harga_discount: typeof form.promoPrice === 'number' ? form.promoPrice : 0,
    percent_discount: calcPercentDiscount(form.salePrice, form.promoPrice),
    playlists: sanitizePlaylists(form.playlists),
  };

  if (typeof form.instrumentId === 'number') body.instrument_id = form.instrumentId;
  if (typeof form.gradeId === 'number') body.grade_id = form.gradeId;

  return body;
};

// simpan perubahan (PUT /module/admin/module/:id)
// src/features/slices/module/detailSlice.ts

export const saveModuleAdminThunk = createAsyncThunk<
  true,
  { id: number; form: ModuleForm; ebookFiles?: File[]; ebookIdsToDelete?: number[]; previewFiles?: File[] },
  { rejectValue: string }
>(
  'moduleAdminDetail/save',
  async ({ id, form, ebookFiles, ebookIdsToDelete, previewFiles }, { rejectWithValue, dispatch }) => {
    try {
      const body: any = formToBody(form);

      // thumbnail → data URL
      if (form.thumbnail instanceof File) {
        const dataUrl = await fileToDataUrl(form.thumbnail);
        body.thumbnail_path = dataUrl;
      }

      // mark e-book server untuk dihapus
      if (Array.isArray(ebookIdsToDelete) && ebookIdsToDelete.length) {
        body.ebook_ids_to_delete = ebookIdsToDelete.map(Number).filter(Boolean);
      }

      // convert image previews -> data URL buat dikirim ke backend
      if (Array.isArray(previewFiles) && previewFiles.length) {
        const dataUrls: string[] = [];
        for (const f of previewFiles) {
          // filter keamanan ringan: hanya image
          if (f && (f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f.name))) {
            const d = await fileToDataUrl(f);
            dataUrls.push(d);
          }
        }
        if (dataUrls.length) {
          body.preview_files_base64_append = dataUrls;
        }
      }

      // 1) update kolom JSON + preview base64
      await updateModuleAdmin(id, body);

      // 2) e-book PDF via multipart (agar file tersimpan di server)
      if (ebookFiles && ebookFiles.length > 0) {
        await updateModuleAdminMultipart(id, {}, ebookFiles);
      }

      // 3) refresh detail
      await dispatch(fetchModuleAdminDetailThunk(id));
      return true;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Gagal menyimpan modul');
    }
  }
);

/** SETUJUI modul (status → aktif) + optional update harga */
export const approveModuleAdminThunk = createAsyncThunk<
  true,
  { id: number; salePrice: number; promoPrice?: number | null; percentDiscount?: number | null },
  { rejectValue: string }
>('moduleAdminDetail/approve', async (args, { rejectWithValue }) => {
  try {
    const { id, salePrice, promoPrice, percentDiscount } = args;
    await updateModuleAdmin(id, {
      status: 'aktif',
      harga_bid: Math.max(0, Number(salePrice || 0)),
      harga_discount: Math.max(0, Number(promoPrice || 0)),
      percent_discount: Math.max(0, Number(percentDiscount || 0)),
    } as any);
    return true;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal menyetujui modul');
  }
});

/** TOLAK modul (status → non_aktif) */
export const rejectModuleAdminThunk = createAsyncThunk<
  true,
  number,
  { rejectValue: string }
>('moduleAdminDetail/reject', async (id, { rejectWithValue }) => {
  try {
    await updateModuleAdmin(id, { status: 'non_aktif' } as any);
    return true;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal menolak modul');
  }
});

// ---------- Slice ----------
const detailSlice = createSlice({
  name: 'moduleAdminDetail',
  initialState,
  reducers: {
    resetModuleAdminDetail(state) {
      state.item = null;
      state.status = 'idle';
      state.error = null;
      state.saving = false;
      state.saveError = null;
      state.lastSavedAt = null;
    },
  },
  extraReducers: (b) => {
    // fetch detail
    b.addCase(fetchModuleAdminDetailThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchModuleAdminDetailThunk.fulfilled, (s, a) => {
      s.item = a.payload;
      s.status = 'succeeded';
    });
    b.addCase(fetchModuleAdminDetailThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = a.payload ?? 'Gagal memuat detail modul';
    });

    // save
    b.addCase(saveModuleAdminThunk.pending, (s) => {
      s.saving = true;
      s.saveError = null;
    });
    b.addCase(saveModuleAdminThunk.fulfilled, (s) => {
      s.saving = false;
      s.lastSavedAt = Date.now();
    });
    b.addCase(saveModuleAdminThunk.rejected, (s, a) => {
      s.saving = false;
      s.saveError = a.payload ?? 'Gagal menyimpan modul';
    });

    // approve
    b.addCase(approveModuleAdminThunk.pending, (s) => {
      s.error = null;
    });
    b.addCase(approveModuleAdminThunk.rejected, (s, a) => {
      s.error = a.payload ?? 'Gagal menyetujui modul';
    });

    // reject
    b.addCase(rejectModuleAdminThunk.pending, (s) => {
      s.error = null;
    });
    b.addCase(rejectModuleAdminThunk.rejected, (s, a) => {
      s.error = a.payload ?? 'Gagal menolak modul';
    });
  },
});

export const { resetModuleAdminDetail } = detailSlice.actions;
export default detailSlice.reducer;
