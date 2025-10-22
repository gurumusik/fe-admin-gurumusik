/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as InstrumentAPI from '@/services/api/instrument.api';
import * as GradeAPI from '@/services/api/grade.api';
import * as DPAPI from '@/services/api/detailProgram.api';
import * as ProgramAPI from '@/services/api/program.api';
import * as SilabusAPI from '@/services/api/silabus.api';

/* ========================= TYPES (import) ========================= */
import type {
  WizardRow,
  SyllabusDraft,
  ProgramLite,
  RowMeta,
  WizardState,
} from './types';

const initialState: WizardState = {
  isEditMode: false,

  draftName: '',
  draftIconBase64: null,
  existingIconUrl: null,

  programId: null,
  rows: [],
  programs: [],

  syllabusDrafts: {},
  rowMetas: {},

  deletedDraftRows: {},
  pendingDeletes: [],

  status: 'idle',
  error: null,
  createdInstrumentId: null,
};

/* ========================= HELPERS ========================= */

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const hasValidSyllabus = (d?: SyllabusDraft) =>
  !!(d && d.title?.trim() && (d.file_base64 || d.file_url || d.link_url));

/* ========================= THUNKS ========================= */

export const fetchProgramsThunk = createAsyncThunk<
  ProgramLite[],
  void,
  { rejectValue: string }
>('instrumentWizard/fetchPrograms', async (_, { rejectWithValue }) => {
  try {
    const res = await ProgramAPI.listPrograms();
    const list = Array.isArray(res) ? res : (res as any).data ?? [];
    return list as ProgramLite[];
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat program');
  }
});

/** CREATE (NEW) */
export const submitWizardThunk = createAsyncThunk<
  { instrumenId: number },
  void,
  { state: { instrumentWizard: WizardState }; rejectValue: string }
>('instrumentWizard/submit', async (_: void, { getState, rejectWithValue }) => {
  try {
    const s = getState().instrumentWizard;
    if (!s.draftName.trim()) return rejectWithValue('Nama instrumen wajib diisi');
    if (!s.programId) return rejectWithValue('Pilih program terlebih dahulu');
    if (!Array.isArray(s.rows) || s.rows.length === 0) {
      return rejectWithValue('Minimal satu grade');
    }

    // hanya baris aktif
    const allHasSyllabus = s.rows.every((_, idx) =>
      s.deletedDraftRows[idx] ? true : hasValidSyllabus(s.syllabusDrafts[idx])
    );
    if (!allHasSyllabus) {
      return rejectWithValue('Silabus wajib diisi untuk setiap grade sebelum menyimpan.');
    }

    // 1) instrument
    const ins = await InstrumentAPI.createInstrument({
      nama_instrumen: s.draftName.trim(),
      icon_base64: s.draftIconBase64 || undefined,
    });
    const instrumenId = (ins as any).data?.id ?? (ins as any).id;
    if (!instrumenId) return rejectWithValue('Gagal membuat instrumen');

    // 2) resolve grade ids
    const inputNames = s.rows
      .filter((_, i) => !s.deletedDraftRows[i])
      .map((r) => (r?.nama_grade ?? '').toString().trim())
      .filter(Boolean);
    const nameToIdMap = await GradeAPI.resolveOrCreateGradeIds(inputNames);

    // 3) create DPs (hindari duplikat)
    const dpIdByRow: Record<number, number> = {};
    const seen = new Set<number>();
    for (const [idx, r] of s.rows.entries()) {
      if (s.deletedDraftRows[idx]) continue; // baris dihapus di draft
      const key = norm((r?.nama_grade ?? '').toString());
      const id_grade = nameToIdMap[key];
      if (!id_grade || seen.has(id_grade)) continue;
      seen.add(id_grade);

      const created = await DPAPI.createDetailProgram({
        id_program: s.programId!,
        id_instrumen: Number(instrumenId),
        id_grade: Number(id_grade),
        base_harga: Number(r?.base_harga) || 0,
        harga_tambah_sesi: null,
        harga_ujian: null,
      });

      const dpId = (created as any)?.data?.id ?? (created as any)?.id;
      if (dpId) dpIdByRow[idx] = Number(dpId);
    }

    // 4) create silabus
    await Promise.all(
      Object.entries(dpIdByRow).map(async ([idxStr, dpId]) => {
        const idx = Number(idxStr);
        const d = s.syllabusDrafts[idx];
        if (!hasValidSyllabus(d)) return;
        await SilabusAPI.createSilabus({
          id_detail_program: dpId,
          title: d!.title.trim(),
          file_base64: d!.file_base64 ?? undefined,
          file_url: d!.file_url ?? undefined,
          link_url: d!.link_url ?? undefined,
          completion_pts: d!.completion_pts ?? undefined,
        });
      })
    );

    return { instrumenId: Number(instrumenId) };
  } catch (e: any) {
    const msg = e?.data?.message ?? e?.message ?? 'Gagal menyimpan data';
    return rejectWithValue(msg);
  }
});

/** PREFILL EDIT */
export const prefillFromInstrumentThunk = createAsyncThunk<
  { ok: true },
  { instrumentId: number },
  { rejectValue: string }
>('instrumentWizard/prefillFromInstrument', async ({ instrumentId }, { dispatch, rejectWithValue }) => {
  try {
    const proms = await ProgramAPI.listPrograms();
    const programs = Array.isArray(proms) ? proms : (proms as any).data ?? [];
    dispatch(setPrograms(programs as ProgramLite[]));

    const [ins, dpResp] = await Promise.all([
      InstrumentAPI.getInstrument(instrumentId),
      DPAPI.listByInstrument(instrumentId),
    ]);

    type DpItem = {
      id: number;
      id_program: number;
      id_grade: number;
      base_harga?: number;
      grade?: { id: number; nama_grade: string };
    };
    const dpItems: DpItem[] = (dpResp as any)?.items ?? [];

    const byProgram = new Map<number, WizardState['rows']>();
    for (const it of dpItems) {
      const pid = Number(it?.id_program);
      if (!Number.isFinite(pid)) continue;

      const arr = byProgram.get(pid) ?? [];
      arr.push({
        id_grade: Number(it?.id_grade) || Number(it?.grade?.id) || null,
        nama_grade: it?.grade?.nama_grade ?? `Grade ${arr.length + 1}`,
        base_harga: Number((it as any)?.base_harga) || 0,
      });
      byProgram.set(pid, arr);
    }

    const firstProgramId = byProgram.size > 0 ? [...byProgram.keys()][0] : null;
    const rows =
      firstProgramId && byProgram.get(firstProgramId)?.length
        ? (byProgram.get(firstProgramId) as WizardState['rows'])
        : [{ id_grade: null, nama_grade: 'Grade I', base_harga: 0 }];

    dispatch(
      hydrateFromExisting({
        name: (ins as any).nama_instrumen,
        icon: (ins as any).icon ?? null,
        programId: firstProgramId,
        rows,
      })
    );
    dispatch(setEditMode(true));
    dispatch(resetSyllabusDrafts());
    dispatch(resetRowMetas());
    dispatch(clearPendingDeletes());
    dispatch(clearDeletedFlags());

    // Prefill silabus utk program aktif
    if (firstProgramId && rows.length) {
      const mapGradeToDpId = new Map<string, number>();
      for (const it of dpItems) {
        if (Number(it.id_program) !== Number(firstProgramId)) continue;
        const gname = it?.grade?.nama_grade?.trim()?.toLowerCase();
        if (!gname) continue;
        mapGradeToDpId.set(gname, Number(it.id));
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const gradeId = Number(row.id_grade);
        if (!Number.isFinite(gradeId)) continue;

        const desiredDpId = mapGradeToDpId.get(String(row.nama_grade).trim().toLowerCase());
        if (desiredDpId) dispatch(setRowMeta({ index: i, meta: { dpId: desiredDpId } }));

        try {
          const res = await SilabusAPI.listPublicByInstrumentGrade(instrumentId, gradeId);
          const items: any[] = Array.isArray(res.items) ? res.items : [];

          const mine = desiredDpId
            ? items.filter((x) => Number(x.id_detail_program) === Number(desiredDpId))
            : items;

          const s0 = mine[0] ?? items[0];
          if (!s0) continue;

          const draft: SyllabusDraft = {
            id: Number(s0.id),
            id_detail_program: Number(s0.id_detail_program),
            title: s0.title || `${(ins as any).nama_instrumen} - ${row.nama_grade}`,
            completion_pts: Array.isArray(s0.completion_pts) ? (s0.completion_pts as string[]) : [],
            ...(s0.link_url
              ? { link_url: s0.link_url as string }
              : s0.file_path
              ? { file_url: s0.file_path as string }
              : {}),
          };

          dispatch(setSyllabusDraft({ index: i, draft }));
          dispatch(setRowMeta({ index: i, meta: { dpId: draft.id_detail_program ?? desiredDpId ?? null, silabusId: draft.id ?? null } }));
        } catch {
          // biarkan kosong kalau gagal fetch
        }
      }
    }

    return { ok: true };
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat data instrument');
  }
});

/** EDIT (PUT) + upsert rows, update/create silabus, eksekusi pending delete */
export const submitWizardEditThunk = createAsyncThunk<
  { instrumenId: number },
  { instrumentId: number },
  { state: { instrumentWizard: WizardState }; rejectValue: string }
>('instrumentWizard/submitEdit', async ({ instrumentId }, { getState, rejectWithValue }) => {
  try {
    const s = getState().instrumentWizard;
    if (!Number.isFinite(instrumentId) || instrumentId <= 0) throw new Error('Instrument ID tidak valid');
    if (!s.draftName.trim()) throw new Error('Nama instrumen wajib diisi');

    const allHasSyllabus = s.rows.every((_, idx) =>
      s.deletedDraftRows[idx] ? true : hasValidSyllabus(s.syllabusDrafts[idx])
    );
    if (!allHasSyllabus) throw new Error('Silabus wajib diisi untuk setiap grade sebelum menyimpan.');

    // 1) Update instrument (+rows untuk upsert DP di backend jika kamu dukung)
    const body: any = { nama_instrumen: s.draftName.trim() };
    if (s.draftIconBase64) body.icon_base64 = s.draftIconBase64;
    if (s.programId && Array.isArray(s.rows) && s.rows.length > 0) {
      body.program_id = s.programId;
      body.rows = s.rows
        .filter((_, i) => !s.deletedDraftRows[i]) // kirim hanya row aktif
        .map((r) => ({
          nama_grade: (r?.nama_grade ?? '').toString().trim() || 'Grade',
          base_harga: Number(r?.base_harga) || 0,
        }));
    }
    await InstrumentAPI.updateInstrument(instrumentId, body);

    // 2) Ambil ulang DP utk program aktif → map gradeName→dpId
    const dp = await DPAPI.listByInstrument(instrumentId);
    const mapGradeToDpId = new Map<string, number>();
    for (const it of ((dp as any).items ?? []) as any[]) {
      if (s.programId && Number(it?.id_program) !== Number(s.programId)) continue;
      const gname = it?.grade?.nama_grade ? norm(String(it.grade.nama_grade)) : '';
      if (!gname) continue;
      const dpId = Number((it as any)?.id);
      if (Number.isFinite(dpId)) mapGradeToDpId.set(gname, dpId);
    }

    // 3) Update/Create silabus untuk row aktif
    for (const [idx, row] of s.rows.entries()) {
      if (s.deletedDraftRows[idx]) continue; // dilewati
      const d = s.syllabusDrafts[idx];
      if (!hasValidSyllabus(d)) continue;

      const dpId = mapGradeToDpId.get(norm(String(row?.nama_grade ?? '')));
      if (!dpId) continue;

      const payload: any = {
        title: d!.title.trim(),
        completion_pts: d!.completion_pts ?? undefined,
      };
      if (d!.link_url !== undefined) payload.link_url = d!.link_url ?? null;
      if (d!.file_base64 !== undefined) payload.file_base64 = d!.file_base64 ?? undefined;
      if (d!.file_url !== undefined) payload.file_url = d!.file_url ?? undefined;

      // fallback ke rowMetas.silabusId jika id di draft tidak ada
      const draftId = d!.id ?? s.rowMetas[idx]?.silabusId ?? null;

      if (draftId) {
        await SilabusAPI.updateSilabus(draftId, payload);
      } else {
        await SilabusAPI.createSilabus({
          id_detail_program: dpId,
          ...payload,
        });
      }
    }

    // 4) Eksekusi pending delete (hapus DP dulu baru silabus)
    if (Array.isArray(s.pendingDeletes) && s.pendingDeletes.length > 0) {
      for (const del of s.pendingDeletes) {
        if (del.dpId) await DPAPI.deleteDetailProgram(del.dpId); 
        if (del.silabusId) await SilabusAPI.deleteSilabus(del.silabusId); 
      }
    }

    return { instrumenId: instrumentId };
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal menyimpan perubahan');
  }
});

/* ========================= SLICE ========================= */

const slice = createSlice({
  name: 'instrumentWizard',
  initialState,
  reducers: {
    setEditMode(state, a: PayloadAction<boolean>) {
      state.isEditMode = !!a.payload;
    },

    startDraft(state, a: PayloadAction<{ name: string; iconBase64?: string | null }>) {
      state.isEditMode = false;
      state.draftName = a.payload.name;
      state.draftIconBase64 = a.payload.iconBase64 ?? null;
      state.existingIconUrl = null;
      state.rows = [{ id_grade: null, nama_grade: 'Grade I', base_harga: 0 }];
      state.programId = null;
      state.createdInstrumentId = null;
      state.error = null;
      state.status = 'idle';
      state.syllabusDrafts = {};
      state.rowMetas = {};
      state.deletedDraftRows = {};
      state.pendingDeletes = [];
    },

    patchDraft(state, a: PayloadAction<{ name?: string; iconBase64?: string | null }>) {
      if (typeof a.payload.name === 'string') state.draftName = a.payload.name;
      if ('iconBase64' in a.payload) state.draftIconBase64 = a.payload.iconBase64 ?? null;
    },

    setPrograms(state, a: PayloadAction<ProgramLite[]>) {
      state.programs = a.payload ?? [];
    },
    setProgramId(state, a: PayloadAction<number | null | undefined>) {
      state.programId = a.payload ?? null;
    },

    replaceRows(state, a: PayloadAction<WizardRow[]>) {
      state.rows = Array.isArray(a.payload) ? a.payload : [];
    },
    addRow(state) {
      const idx = state.rows.length;
      state.rows.push({ id_grade: null, nama_grade: `Grade ${idx + 1}`, base_harga: 0 });
    },
    updateRow(state, a: PayloadAction<{ index: number; patch: Partial<WizardRow> }>) {
      const { index, patch } = a.payload;
      if (!state.rows[index]) return;
      state.rows[index] = { ...state.rows[index], ...patch };
    },

    /** CREATE MODE delete langsung dari draft */
    deleteRow(state, a: PayloadAction<number>) {
      const idx = a.payload;
      if (!state.rows[idx]) return;
      const oldRows = state.rows.slice();
      const oldDrafts = { ...state.syllabusDrafts };
      const oldMetas = { ...state.rowMetas };

      state.rows = oldRows.filter((_, i) => i !== idx);

      const newDrafts: Record<number, SyllabusDraft | undefined> = {};
      const newMetas: Record<number, RowMeta | undefined> = {};
      let j = 0;
      for (let i = 0; i < oldRows.length; i++) {
        if (i === idx) continue;
        if (oldDrafts[i]) newDrafts[j] = oldDrafts[i];
        if (oldMetas[i]) newMetas[j] = oldMetas[i];
        j++;
      }
      state.syllabusDrafts = newDrafts;
      state.rowMetas = newMetas;
    },

    /** EDIT MODE: tandai / batal tandai delete (soft delete) */
    markRowDeletedDraft(state, a: PayloadAction<{ index: number; undo?: boolean }>) {
      const { index, undo } = a.payload;
      if (!state.rows[index]) return;

      if (undo) {
        // batalkan
        delete state.deletedDraftRows[index];

        // hapus dari pendingDeletes
        const meta = state.rowMetas[index];
        const draft = state.syllabusDrafts[index];
        const dpId = meta?.dpId ?? draft?.id_detail_program ?? null;
        const silabusId = meta?.silabusId ?? draft?.id ?? null;
        state.pendingDeletes = state.pendingDeletes.filter(
          (x) => !(x.dpId === dpId && (silabusId ? x.silabusId === silabusId : true))
        );
        return;
      }

      // tandai
      state.deletedDraftRows[index] = true;

      // queue penghapusan
      const meta = state.rowMetas[index];
      const draft = state.syllabusDrafts[index];
      const dpId = meta?.dpId ?? draft?.id_detail_program ?? null;
      const silabusId = meta?.silabusId ?? draft?.id ?? null;
      if (dpId) {
        // hindari duplikat
        const existed = state.pendingDeletes.some(
          (x) => x.dpId === dpId && (silabusId ? x.silabusId === silabusId : true)
        );
        if (!existed) state.pendingDeletes.push({ dpId: Number(dpId), silabusId: silabusId ? Number(silabusId) : undefined });
      }
    },

    resetWizard() {
      return initialState;
    },

    hydrateFromExisting(
      state,
      a: PayloadAction<{
        name: string;
        icon?: string | null;
        programId: number | null;
        rows: WizardRow[];
      }>
    ) {
      state.draftName = a.payload.name ?? '';
      state.existingIconUrl = a.payload.icon ?? null;
      state.programId = typeof a.payload.programId === 'number' ? a.payload.programId : null;
      state.rows = Array.isArray(a.payload.rows) ? a.payload.rows : [];
      state.draftIconBase64 = null;
      state.status = 'idle';
      state.error = null;
    },

    // Draft silabus (MERGE, pertahankan id / id_detail_program)
    setSyllabusDraft(state, a: PayloadAction<{ index: number; draft?: SyllabusDraft }>) {
      const { index, draft } = a.payload;
      if (!state.rows[index]) return;
      if (!draft) { delete state.syllabusDrafts[index]; return; }

      const prev = state.syllabusDrafts[index];
      state.syllabusDrafts[index] = {
        id: draft.id ?? prev?.id,
        id_detail_program: draft.id_detail_program ?? prev?.id_detail_program,
        ...(prev || {}),
        ...draft,
        completion_pts: draft.completion_pts ?? prev?.completion_pts ?? [],
      };
    },
    resetSyllabusDrafts(state) { state.syllabusDrafts = {}; },

    // Meta per row
    setRowMeta(state, a: PayloadAction<{ index: number; meta?: RowMeta }>) {
      const { index, meta } = a.payload;
      if (!state.rows[index]) return;
      if (!meta) { delete state.rowMetas[index]; return; }
      state.rowMetas[index] = { ...(state.rowMetas[index] || {}), ...meta };
    },
    resetRowMetas(state) { state.rowMetas = {}; },

    // Deleted flags & pending deletes
    clearDeletedFlags(state) { state.deletedDraftRows = {}; },
    clearPendingDeletes(state) { state.pendingDeletes = []; },
  },
  extraReducers: (b) => {
    b.addCase(fetchProgramsThunk.fulfilled, (s, a) => {
      s.programs = a.payload ?? [];
    });

    b.addCase(submitWizardThunk.pending, (s) => { s.status = 'submitting'; s.error = null; });
    b.addCase(submitWizardThunk.fulfilled, (s, a) => { s.status = 'succeeded'; s.createdInstrumentId = a.payload.instrumenId; });
    b.addCase(submitWizardThunk.rejected, (s, a) => { s.status = 'failed'; s.error = (a.payload as string) ?? 'Gagal menyimpan data'; });

    b.addCase(prefillFromInstrumentThunk.pending, (s) => { s.status = 'loading'; s.error = null; });
    b.addCase(prefillFromInstrumentThunk.fulfilled, (s) => { s.status = 'idle'; });
    b.addCase(prefillFromInstrumentThunk.rejected, (s, a) => { s.status = 'failed'; s.error = (a.payload as string) ?? 'Gagal memuat data instrument'; });

    b.addCase(submitWizardEditThunk.pending, (s) => { s.status = 'submitting'; s.error = null; });
    b.addCase(submitWizardEditThunk.fulfilled, (s) => { s.status = 'succeeded'; s.pendingDeletes = []; s.deletedDraftRows = {}; });
    b.addCase(submitWizardEditThunk.rejected, (s, a) => { s.status = 'failed'; s.error = (a.payload as string) ?? 'Gagal menyimpan perubahan'; });
  },
});

export const {
  setEditMode,
  startDraft,
  patchDraft,
  setPrograms,
  setProgramId,
  replaceRows,
  addRow,
  updateRow,
  deleteRow,              // create-mode delete langsung
  markRowDeletedDraft,    // edit-mode soft delete / undo via {undo:true}
  resetWizard,
  hydrateFromExisting,
  setSyllabusDraft,
  resetSyllabusDrafts,
  setRowMeta,
  resetRowMetas,
  clearDeletedFlags,
  clearPendingDeletes,
} = slice.actions;

export default slice.reducer;
