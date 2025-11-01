/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/instrumentWizard/slice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as InstrumentAPI from '@/services/api/instrument.api';
import * as GradeAPI from '@/services/api/grade.api';
import * as DPAPI from '@/services/api/detailProgram.api';
import * as ProgramAPI from '@/services/api/program.api';
import * as SilabusAPI from '@/services/api/silabus.api';

import type {
  WizardRow,
  SyllabusDraft,
  ProgramLite,
  RowMeta,
  WizardState,
} from './types';

/* ========================= INITIAL ========================= */
const initialState: WizardState & {
  existingProgramId: number | null;
} = {
  // mode
  isEditMode: false,

  // instrument
  draftName: '',
  draftIconBase64: null,
  existingIconUrl: null,

  // program/rows
  programId: null,
  rows: [],
  programs: [],

  // per-row
  syllabusDrafts: [],
  rowMetas: [],

  // edit helpers
  deletedDraftRows: {},
  pendingDeletes: [],

  // meta
  status: 'idle',
  error: null,
  createdInstrumentId: null,

  // track program yang “asli” saat masuk ke halaman edit
  existingProgramId: null,
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

/**
 * Muat rows & silabus berdasarkan kombinasi (instrumentId, programId).
 * Draft silabus diikat per-index ke DP terkait via dpId (BUKAN nama grade).
 */
export const loadRowsForInstrumentProgramThunk = createAsyncThunk<
  {
    programId: number;
    rows: WizardRow[];
    drafts: (SyllabusDraft | undefined)[];
    rowMetas: (RowMeta | undefined)[];
    isExisting: boolean;
  },
  { instrumentId: number; programId: number },
  { rejectValue: string }
>('instrumentWizard/loadRowsForInstrumentProgram', async ({ instrumentId, programId }, { rejectWithValue }) => {
  try {
    const dpResp = await DPAPI.listByInstrument(instrumentId);
    type DpItem = {
      id: number;
      id_program: number;
      id_grade: number;
      base_harga?: number;
      grade?: { id: number; nama_grade: string };
    };
    const dpItems: DpItem[] = (dpResp as any)?.items ?? [];

    const related = dpItems.filter((it) => Number(it?.id_program) === Number(programId));
    const isExisting = related.length > 0;

    if (!isExisting) {
      return {
        programId,
        rows: [],
        drafts: [],
        rowMetas: [],
        isExisting: false,
      };
    }

    // Bentuk rows dari DP (urutannya SELARAS dengan 'related')
    const rows: WizardRow[] = related.map((it, idx) => ({
      id_grade: Number(it?.id_grade) || Number(it?.grade?.id) || null,
      nama_grade: it?.grade?.nama_grade ?? `Grade ${idx + 1}`,
      base_harga: Number((it as any)?.base_harga) || 0,
    }));

    const drafts: (SyllabusDraft | undefined)[] = [];
    const rowMetas: (RowMeta | undefined)[] = [];

    // Ambil silabus per row, filter tegas berdasarkan dpId terkait baris itu
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const gradeId = Number(row.id_grade);
      const dpIdForRow = Number(related[i]?.id) || null; // KUNCI: pakai DP.id per-index

      if (!Number.isFinite(gradeId)) {
        drafts[i] = undefined;
        rowMetas[i] = { dpId: dpIdForRow ?? null, silabusId: null };
        continue;
      }

      try {
        const res = await SilabusAPI.listPublicByInstrumentGrade(instrumentId, gradeId);
        const items: any[] = Array.isArray((res as any).items) ? (res as any).items : [];

        const mine = dpIdForRow
          ? items.filter((x) => Number(x.id_detail_program) === Number(dpIdForRow))
          : items;

        const s0 = mine[0] ?? items[0];
        if (s0) {
          drafts[i] = {
            id: Number(s0.id),
            id_detail_program: Number(s0.id_detail_program),
            title: s0.title || `Silabus - ${row.nama_grade}`,
            completion_pts: Array.isArray(s0.completion_pts) ? (s0.completion_pts as string[]) : [],
            ...(s0.link_url
              ? { link_url: s0.link_url as string }
              : s0.file_path
              ? { file_url: s0.file_path as string }
              : {}),
          };
          rowMetas[i] = {
            dpId: drafts[i]!.id_detail_program ?? dpIdForRow ?? null,
            silabusId: drafts[i]!.id ?? null,
          };
        } else {
          drafts[i] = undefined;
          rowMetas[i] = { dpId: dpIdForRow ?? null, silabusId: null };
        }
      } catch {
        drafts[i] = undefined;
        rowMetas[i] = { dpId: dpIdForRow ?? null, silabusId: null };
      }
    }

    return { programId, rows, drafts, rowMetas, isExisting: true };
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat detail program');
  }
});

/** CREATE (instrumen baru) */
export const submitWizardThunk = createAsyncThunk<
  { instrumenId: number },
  void,
  { state: { instrumentWizard: WizardState & { existingProgramId: number | null } }; rejectValue: string }
>('instrumentWizard/submit', async (_: void, { getState, rejectWithValue }) => {
  try {
    const s = getState().instrumentWizard;
    if (!s.draftName.trim()) return rejectWithValue('Nama instrumen wajib diisi');
    if (!s.programId) return rejectWithValue('Pilih program terlebih dahulu');
    if (!Array.isArray(s.rows) || s.rows.length === 0) {
      return rejectWithValue('Minimal satu grade');
    }

    const allHasSyllabus = s.rows.every((_, idx) =>
      s.deletedDraftRows[idx] ? true : hasValidSyllabus(s.syllabusDrafts[idx])
    );
    if (!allHasSyllabus) {
      return rejectWithValue('Silabus wajib diisi untuk setiap grade sebelum menyimpan.');
    }

    // 1) Buat instrument
    const ins = await InstrumentAPI.createInstrument({
      nama_instrumen: s.draftName.trim(),
      icon_base64: s.draftIconBase64 || undefined,
    });
    const instrumenId = (ins as any).data?.id ?? (ins as any).id;
    if (!instrumenId) return rejectWithValue('Gagal membuat instrumen');

    // 2) Resolve/buat grade IDs
    const inputNames = s.rows
      .filter((_, i) => !s.deletedDraftRows[i])
      .map((r) => (r?.nama_grade ?? '').toString().trim())
      .filter(Boolean);
    const nameToIdMap = await GradeAPI.resolveOrCreateGradeIds(inputNames);

    // 3) Buat DetailProgram (hindari duplikat grade di program yang sama)
    const dpIdByRow: Record<number, number> = {};
    const seen = new Set<number>();
    for (const [idx, r] of s.rows.entries()) {
      if (s.deletedDraftRows[idx]) continue;
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

    // 4) Buat Silabus
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

/** PREFILL EDIT (ambil state dari instrumen + pilih program awal) */
export const prefillFromInstrumentThunk = createAsyncThunk<
  { ok: true },
  { instrumentId: number },
  { rejectValue: string }
>('instrumentWizard/prefillFromInstrument', async ({ instrumentId }, { dispatch, rejectWithValue }) => {
  try {
    // program list
    const proms = await ProgramAPI.listPrograms();
    const programs = Array.isArray(proms) ? proms : (proms as any).data ?? [];
    dispatch(setPrograms(programs as ProgramLite[]));

    // instrument + semua DP
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

    // Kelompokkan DP per program (urut tambah = stabil → bisa index-align)
    const byProgram = new Map<number, WizardState['rows']>();
    const dpByProgram = new Map<number, DpItem[]>();
    for (const it of dpItems) {
      const pid = Number(it?.id_program);
      if (!Number.isFinite(pid)) continue;

      const rowsArr = byProgram.get(pid) ?? [];
      rowsArr.push({
        id_grade: Number(it?.id_grade) || Number(it?.grade?.id) || null,
        nama_grade: it?.grade?.nama_grade ?? `Grade ${rowsArr.length + 1}`,
        base_harga: Number((it as any)?.base_harga) || 0,
      });
      byProgram.set(pid, rowsArr);

      const dpsArr = dpByProgram.get(pid) ?? [];
      dpsArr.push(it);
      dpByProgram.set(pid, dpsArr);
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
    dispatch(setExistingProgramId(firstProgramId ?? null));

    // Prefill silabus utk program aktif (index-align ke DP program tsb)
    if (firstProgramId && rows.length) {
      const dps = dpByProgram.get(firstProgramId) ?? [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const gradeId = Number(row.id_grade);
        const dpIdForRow = Number(dps[i]?.id) || null; // KUNCI: pakai DP.id per-index

        if (dpIdForRow) dispatch(setRowMeta({ index: i, meta: { dpId: dpIdForRow } }));

        if (!Number.isFinite(gradeId)) continue;

        try {
          const res = await SilabusAPI.listPublicByInstrumentGrade(instrumentId, gradeId);
          const items: any[] = Array.isArray((res as any).items) ? (res as any).items : [];

          const mine = dpIdForRow
            ? items.filter((x) => Number(x.id_detail_program) === Number(dpIdForRow))
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
          dispatch(
            setRowMeta({
              index: i,
              meta: { dpId: draft.id_detail_program ?? dpIdForRow, silabusId: draft.id ?? null },
            })
          );
        } catch {
          // optional
        }
      }
    }

    return { ok: true };
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Gagal memuat data instrument');
  }
});

/** EDIT: update instrument + upsert silabus ke DP yang tepat (berdasarkan dpId/gradeId) */
export const submitWizardEditThunk = createAsyncThunk<
  { instrumenId: number },
  { instrumentId: number },
  { state: { instrumentWizard: WizardState & { existingProgramId: number | null } }; rejectValue: string }
>('instrumentWizard/submitEdit', async ({ instrumentId }, { getState, rejectWithValue }) => {
  try {
    const s = getState().instrumentWizard;
    if (!Number.isFinite(instrumentId) || instrumentId <= 0) throw new Error('Instrument ID tidak valid');
    if (!s.draftName.trim()) throw new Error('Nama instrumen wajib diisi');

    const allHasSyllabus = s.rows.every((_, idx) =>
      s.deletedDraftRows[idx] ? true : hasValidSyllabus(s.syllabusDrafts[idx])
    );
    if (!allHasSyllabus) throw new Error('Silabus wajib diisi untuk setiap grade sebelum menyimpan.');

    // 1) Update instrument (tetap instrumen yang sama → hindari "nama instrumen sudah dipakai")
    const body: any = { nama_instrumen: s.draftName.trim() };
    if (s.draftIconBase64) body.icon_base64 = s.draftIconBase64;
    if (s.programId && Array.isArray(s.rows) && s.rows.length > 0) {
      body.program_id = s.programId;
      body.rows = s.rows
        .filter((_, i) => !s.deletedDraftRows[i])
        .map((r) => ({
          nama_grade: (r?.nama_grade ?? '').toString().trim() || 'Grade',
          base_harga: Number(r?.base_harga) || 0,
        }));
    }
    await InstrumentAPI.updateInstrument(instrumentId, body);

    // 2) Ambil ulang DP utk program aktif → buat map gradeId → dpId
    const dp = await DPAPI.listByInstrument(instrumentId);
    const dpItems = (((dp as any).items) ?? []) as any[];
    const dpIdByGrade = new Map<number, number>();
    const dpIdByGradeName = new Map<string, number>(); // fallback

    for (const it of dpItems) {
      if (s.programId && Number(it?.id_program) !== Number(s.programId)) continue;
      const gid = Number(it?.id_grade ?? it?.grade?.id);
      const did = Number(it?.id);
      const gname = it?.grade?.nama_grade ? norm(String(it.grade.nama_grade)) : '';
      if (Number.isFinite(gid) && Number.isFinite(did)) dpIdByGrade.set(gid, did);
      if (gname && Number.isFinite(did)) dpIdByGradeName.set(gname, did);
    }

    // 3) Update/Create silabus untuk setiap row aktif
    for (const [idx, row] of s.rows.entries()) {
      if (s.deletedDraftRows[idx]) continue;
      const d = s.syllabusDrafts[idx];
      if (!hasValidSyllabus(d)) continue;

      const gradeId = Number(row?.id_grade);
      const byGrade = Number.isFinite(gradeId) ? dpIdByGrade.get(gradeId) : undefined;

      const dpId =
        byGrade ??
        (s.rowMetas[idx]?.dpId ?? undefined) ??
        (d?.id_detail_program ?? undefined) ??
        dpIdByGradeName.get(norm(String(row?.nama_grade ?? ''))) ??
        null;

      if (!dpId) continue;

      const payload: any = {
        title: d!.title.trim(),
        completion_pts: d!.completion_pts ?? undefined,
      };
      if (d!.link_url !== undefined) payload.link_url = d!.link_url ?? null;
      if (d!.file_base64 !== undefined) payload.file_base64 = d!.file_base64 ?? undefined;
      if (d!.file_url !== undefined) payload.file_url = d!.file_url ?? undefined;

      const draftId = d!.id ?? (s.rowMetas[idx]?.silabusId ?? null);

      if (draftId) {
        await SilabusAPI.updateSilabus(draftId, payload);
      } else {
        await SilabusAPI.createSilabus({
          id_detail_program: Number(dpId),
          ...payload,
        });
      }
    }

    // 4) Eksekusi pending delete (optional)
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
      state.existingProgramId = null;
      state.createdInstrumentId = null;

      state.error = null;
      state.status = 'idle';

      state.syllabusDrafts = [];
      state.rowMetas = [];
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
    setExistingProgramId(state, a: PayloadAction<number | null>) {
      state.existingProgramId = a.payload ?? null;
    },

    /**
     * Dipakai page saat:
     * - switch program dari cache lokal
     * - memulai create mode program baru (kosong → addRow())
     */
    hydrateRowsAndSyllabus(
      state,
      a: PayloadAction<{
        rows: WizardRow[];
        drafts: (SyllabusDraft | undefined)[];
        deletedDraftRows?: Record<number, boolean>;
        rowMetas?: (RowMeta | undefined)[];
      }>
    ) {
      state.rows = Array.isArray(a.payload.rows) ? a.payload.rows : [];
      state.syllabusDrafts = Array.isArray(a.payload.drafts) ? a.payload.drafts : [];
      state.deletedDraftRows = a.payload.deletedDraftRows ?? {};
      // Reset rowMetas untuk mencegah kebocoran dpId/silabusId dari program sebelumnya
      state.rowMetas = Array.isArray(a.payload.rowMetas) ? a.payload.rowMetas : [];
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

    /** CREATE MODE: delete langsung dari draft (reindex draft & metas) */
    deleteRow(state, a: PayloadAction<number>) {
      const idx = a.payload;
      if (!state.rows[idx]) return;

      state.rows.splice(idx, 1);
      state.syllabusDrafts.splice(idx, 1);
      state.rowMetas.splice(idx, 1);

      // perbaiki index di deletedDraftRows
      const next: Record<number, boolean> = {};
      Object.keys(state.deletedDraftRows).forEach((k) => {
        const i = Number(k);
        if (i < idx) next[i] = state.deletedDraftRows[i];
        else if (i > idx) next[i - 1] = state.deletedDraftRows[i];
      });
      state.deletedDraftRows = next;
    },

    /** EDIT MODE: tandai/batal tandai delete (soft delete) */
    markRowDeletedDraft(state, a: PayloadAction<{ index: number; undo?: boolean }>) {
      const { index, undo } = a.payload;
      if (!state.rows[index]) return;

      if (undo) {
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
        const existed = state.pendingDeletes.some(
          (x) => x.dpId === dpId && (silabusId ? x.silabusId === silabusId : true)
        );
        if (!existed) {
          state.pendingDeletes.push({
            dpId: Number(dpId),
            silabusId: silabusId ? Number(silabusId) : undefined,
          });
        }
      }
    },

    resetWizard() {
      return { ...initialState };
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

      state.syllabusDrafts = []; // akan di-prefill setelah ini (lihat thunk)
      state.rowMetas = [];
      state.deletedDraftRows = {};
      state.pendingDeletes = [];
    },

    // Draft silabus (MERGE, pertahankan id / id_detail_program)
    setSyllabusDraft(state, a: PayloadAction<{ index: number; draft?: SyllabusDraft }>) {
      const { index, draft } = a.payload;
      if (!state.rows[index]) return;

      if (!draft) {
        state.syllabusDrafts[index] = undefined;
        return;
      }

      const prev = state.syllabusDrafts[index];
      state.syllabusDrafts[index] = {
        id: draft.id ?? prev?.id,
        id_detail_program: draft.id_detail_program ?? prev?.id_detail_program,
        ...(prev || {}),
        ...draft,
        completion_pts: draft.completion_pts ?? prev?.completion_pts ?? [],
      };
    },
    resetSyllabusDrafts(state) { state.syllabusDrafts = []; },

    // Meta per row
    setRowMeta(state, a: PayloadAction<{ index: number; meta?: RowMeta }>) {
      const { index, meta } = a.payload;
      if (!state.rows[index]) return;
      state.rowMetas[index] = meta ? { ...(state.rowMetas[index] || {}), ...meta } : undefined;
    },
    resetRowMetas(state) { state.rowMetas = []; },

    // Deleted flags & pending deletes
    clearDeletedFlags(state) { state.deletedDraftRows = {}; },
    clearPendingDeletes(state) { state.pendingDeletes = []; },
  },
  extraReducers: (b) => {
    b.addCase(fetchProgramsThunk.fulfilled, (s, a) => {
      s.programs = a.payload ?? [];
    });

    b.addCase(loadRowsForInstrumentProgramThunk.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(loadRowsForInstrumentProgramThunk.fulfilled, (s, a) => {
      const { programId, rows, drafts, rowMetas, isExisting } = a.payload;
      s.status = 'idle';
      s.programId = programId;
      s.rows = rows;
      s.syllabusDrafts = drafts ?? [];
      s.rowMetas = rowMetas ?? [];
      s.deletedDraftRows = {};
      if (isExisting && s.existingProgramId == null) {
        s.existingProgramId = programId;
      }
    });
    b.addCase(loadRowsForInstrumentProgramThunk.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) ?? 'Gagal memuat detail program';
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
  setExistingProgramId,
  hydrateRowsAndSyllabus,
  replaceRows,
  addRow,
  updateRow,
  deleteRow,
  markRowDeletedDraft,
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
