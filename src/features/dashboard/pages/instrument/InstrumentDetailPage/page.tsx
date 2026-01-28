/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/dashboard/pages/instrument/InstrumentDetailPage/page.tsx
import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import {
  fetchProgramsThunk,
  setProgramId,
  addRow,
  updateRow,
  deleteRow,
  markRowDeletedDraft,
  submitWizardThunk,
  prefillFromInstrumentThunk,
  submitWizardEditThunk,
  patchDraft,
  setSyllabusDraft,
  hydrateRowsAndSyllabus,
  loadRowsForInstrumentProgramThunk,
  setRowMeta, // 👈 TAMBAHAN
} from "@/features/slices/instrumentWizard/slice";

import {
  RiArrowLeftLine,
  RiBookOpenLine,
  RiAddLine,
  RiPencilFill,
  RiDeleteBinLine,
  RiCloseLine,
} from "react-icons/ri";

import SylabusModal from "@/features/dashboard/components/SylabusModal";
import AddInstrumentModal from "@/features/dashboard/components/AddInstrumentModal";
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";

// ✅ Gunakan tipe SyllabusDraft dari wizard sebagai sumber kebenaran
import type {
  SyllabusDraft as WizardSyllabusDraft,
  WizardRow,
} from "@/features/slices/instrumentWizard/types";

// Tipe rute dan payload edit (biarkan dari modul instruments)
import type {
  InstrumentRouteParams,
  EditInstrumentPayload,
} from "@/features/slices/instruments/types";
import { resolveImageUrl } from "@/utils/resolveImageUrl";

const toTitle = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
const formatRupiahInput = (n: number) =>
  `Rp. ${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)}`;

const hasValidSyllabus = (d?: WizardSyllabusDraft) =>
  !!(d && d.title?.trim() && (d.file_base64 || d.file_url || d.link_url));
const normalizeCompletionPts = (pts: unknown) => {
  if (!Array.isArray(pts) || pts.length === 0) return [];
  const labels = pts
    .map((p) => {
      if (typeof p === "string") return p;
      if (p && typeof p === "object") {
        const label = (p as any).label;
        return typeof label === "string" ? label : "";
      }
      return "";
    })
    .map((s) => s.trim())
    .filter(Boolean);
  return labels.map((label, idx) => ({
    key: `p${idx + 1}`,
    label,
    weight: 1,
  }));
};

const InstrumentDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { type: paramType = "piano" } = useParams<InstrumentRouteParams>();
  const [sp] = useSearchParams();

  const isNew = sp.get("new") === "1";
  const instrumentId = Number(sp.get("id") || "");
  const isEdit = !isNew && Number.isFinite(instrumentId) && instrumentId > 0;

  const dispatch = useDispatch<AppDispatch>();
  const wizard = useSelector((s: RootState) => s.instrumentWizard);

  const [typeSlug, setTypeSlug] = React.useState(paramType);
  const displayTitle = React.useMemo(
    () => toTitle(wizard.draftName || typeSlug),
    [wizard.draftName, typeSlug]
  );

  const resolveFileUrl = (v?: string | null) => {
    if (!v) return "";
    if (v.startsWith("http") || v.startsWith("data:")) return v;
    const base = import.meta.env.VITE_FILE_BASE_URL ?? "";
    const cleaned = v.startsWith("/") ? v : `/${v}`;
    return `${base}${cleaned}`;
  };

  const iconUrl = React.useMemo(() => {
    if (wizard.draftIconBase64) return resolveFileUrl(wizard.draftIconBase64);
    if (isEdit && wizard.existingIconUrl) return resolveImageUrl(wizard.existingIconUrl);
    return "/assets/icons/instruments/placeholder.svg";
  }, [isEdit, wizard.existingIconUrl, wizard.draftIconBase64]);

  // Modal state
  const [showSylabus, setShowSylabus] = React.useState(false);
  const [currentGrade, setCurrentGrade] = React.useState<string>("");
  const [currentRowIndex, setCurrentRowIndex] = React.useState<number>(-1);
  const [showEdit, setShowEdit] = React.useState(false);

  // Dropdown program
  const [programMenuOpen, setProgramMenuOpen] = React.useState(false);

  // Unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = React.useState(false);

  // ===== Program cache per id_program (rows & drafts) =====
  const programCacheRef = React.useRef<
    Record<
      number,
      {
        rows: WizardRow[];
        drafts: (WizardSyllabusDraft | undefined)[];
        deleted?: Record<number, boolean>;
      }
    >
  >({});

  // 1) load list program
  React.useEffect(() => {
    dispatch(fetchProgramsThunk());
  }, [dispatch]);

  // 2) EDIT → prefill instrument
  React.useEffect(() => {
    if (isEdit) dispatch(prefillFromInstrumentThunk({ instrumentId }));
  }, [dispatch, isEdit, instrumentId]);

  // 3) CREATE → default program ABK + baris default
  React.useEffect(() => {
    if (!isEdit && wizard.programs.length > 0) {
      const alreadyChosen = wizard.programId != null;
      if (!alreadyChosen) {
        const abk = wizard.programs.find(
          (p) => p.nama_program?.toLowerCase() === "abk"
        );
        if (abk) dispatch(setProgramId(abk.id));
      }
      if (wizard.rows.length === 0) dispatch(addRow());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isEdit, wizard.programs.length]);

  // 4) Tutup dropdown saat klik di luar
  React.useEffect(() => {
    if (!programMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest?.("[data-program-dropdown]")) return;
      setProgramMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [programMenuOpen]);

  const okNavigateHome = React.useCallback(() => {
    navigate("/dashboard-admin/instrument", { replace: true });
  }, [navigate]);

  // === Mode submit ===
  const isCreatingBrandNewInstrument = !isEdit;
  const isCreatingNewProgramForExistingInstrument =
    isEdit &&
    (wizard.existingProgramId == null ||
      (wizard.programId != null &&
        wizard.programId !== wizard.existingProgramId));

  const handleSubmit = React.useCallback(async () => {
    const thunkPromise = isCreatingBrandNewInstrument
      ? dispatch(submitWizardThunk())
      : dispatch(submitWizardEditThunk({ instrumentId }));

    const ok = await thunkPromise.unwrap().catch(() => null);
    if (!ok) return;

    setHasUnsavedChanges(false);
    okNavigateHome();
  }, [dispatch, instrumentId, isCreatingBrandNewInstrument, okNavigateHome]);

  const resolveType = (payload: EditInstrumentPayload) => {
    const t = payload?.type?.trim();
    if (t) return t;
    const nm = payload?.name?.trim();
    if (nm) return slugify(nm);
    return "";
  };

  const selectedProgramName =
    wizard.programs.find((p) => p.id === wizard.programId)?.nama_program ||
    "Pilih Program";

  const isSubmitting = wizard.status === "submitting";

  // Lazy load flag (grade + detail program + silabus)
  const isContentLoading = wizard.status === "loading";

  const handleToggleActive = () => {
    if (isSubmitting) return;
    setHasUnsavedChanges(true);
    dispatch(patchDraft({ isActive: !wizard.draftIsActive }));
  };

  const handleToggleAbk = () => {
    if (isSubmitting) return;
    setHasUnsavedChanges(true);
    dispatch(patchDraft({ isAbk: !wizard.draftIsAbk }));
  };

  // ====== Sylabus (draft) handlers ======
  const handleOpenSylabus = (idx: number) => {
    setCurrentRowIndex(idx);
    setCurrentGrade(wizard.rows[idx]?.nama_grade || `Grade ${idx + 1}`);
    setShowSylabus(true);
  };

  const handleSaveSylabusDraft = (draft: WizardSyllabusDraft) => {
    if (currentRowIndex < 0) return;

    const title =
      draft.title?.trim() ||
      `${displayTitle} - ${
        wizard.rows[currentRowIndex]?.nama_grade ?? ""
      }`;
    const prev = wizard.syllabusDrafts[currentRowIndex];

    setHasUnsavedChanges(true);

    dispatch(
      setSyllabusDraft({
        index: currentRowIndex,
        draft: {
          id: draft.id ?? prev?.id,
          id_detail_program: draft.id_detail_program ?? prev?.id_detail_program,
          ...(prev || {}),
          ...draft,
          title,
          completion_pts: normalizeCompletionPts(
            draft.completion_pts ?? prev?.completion_pts
          ),
        },
      })
    );
  };

  // kelengkapan silabus (abaikan baris yang ditandai hapus)
  const allSyllabusReady = React.useMemo(
    () =>
      wizard.rows.every((_, idx) =>
        wizard.deletedDraftRows[idx]
          ? true
          : hasValidSyllabus(wizard.syllabusDrafts[idx])
      ),
    [wizard.rows, wizard.syllabusDrafts, wizard.deletedDraftRows]
  );

  // ======= PROGRAM CHANGE FLOW =======
  const onChooseProgram = async (newProgramId: number) => {
    const prevProgramId = wizard.programId ?? undefined;

    // simpan cache program sebelumnya
    if (prevProgramId !== undefined) {
      programCacheRef.current[prevProgramId] = {
        rows: [...wizard.rows],
        drafts: [...wizard.syllabusDrafts],
        deleted: { ...wizard.deletedDraftRows },
      };
    }

    dispatch(setProgramId(newProgramId));
    setProgramMenuOpen(false);

    const cached = programCacheRef.current[newProgramId];
    if (cached) {
      dispatch(
        hydrateRowsAndSyllabus({
          rows: cached.rows,
          drafts: cached.drafts,
          deletedDraftRows: cached.deleted,
        })
      );
    } else if (isEdit) {
      await dispatch(
        loadRowsForInstrumentProgramThunk({
          instrumentId,
          programId: newProgramId,
        })
      );
    } else {
      dispatch(
        hydrateRowsAndSyllabus({
          rows: [],
          drafts: [],
          deletedDraftRows: {},
        })
      );
      dispatch(addRow());
    }
  };

  // Auto-cache setiap kali rows/drafts berubah
  React.useEffect(() => {
    if (wizard.programId != null) {
      programCacheRef.current[wizard.programId] = {
        rows: [...wizard.rows],
        drafts: [...wizard.syllabusDrafts],
        deleted: { ...wizard.deletedDraftRows },
      };
    }
  }, [
    wizard.programId,
    wizard.rows,
    wizard.syllabusDrafts,
    wizard.deletedDraftRows,
  ]);

  // ===== Handler perubahan (set hasUnsavedChanges) =====
  const handleChangeGrade = (index: number, value: string) => {
    setHasUnsavedChanges(true);

    const prevRow = wizard.rows[index];
    const oldGrade = prevRow?.nama_grade ?? "";
    const gradeChanged = value !== oldGrade;

    // update nama grade, dan kalau berubah reset id_grade supaya nggak pake gradeId lama
    dispatch(
      updateRow({
        index,
        patch: gradeChanged
          ? { nama_grade: value, id_grade: null }
          : { nama_grade: value },
      })
    );

    if (gradeChanged) {
      // 🔥 Grade berubah → anggap silabus baru, buang semua binding lama
      dispatch(
        setSyllabusDraft({
          index,
          draft: undefined,
        })
      );
      dispatch(
        setRowMeta({
          index,
          meta: undefined,
        })
      );
    }
  };

  const handleChangeHarga = (index: number, rawValue: string) => {
    setHasUnsavedChanges(true);
    const onlyDigits = rawValue.replace(/\D+/g, "");
    const num = onlyDigits === "" ? "" : Number(onlyDigits);
    dispatch(
      updateRow({ index, patch: { base_harga: num as any } })
    );
  };

  const handleAddRow = () => {
    setHasUnsavedChanges(true);
    dispatch(addRow());
  };

  const handleDeleteRow = (idx: number, isMarkedDelete: boolean) => {
    setHasUnsavedChanges(true);
    if (isEdit) {
      dispatch(
        markRowDeletedDraft({ index: idx, undo: isMarkedDelete })
      );
    } else {
      dispatch(deleteRow(idx));
    }
  };

  const handleProgramButtonClick = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      return;
    }
    setProgramMenuOpen((v) => !v);
  };

  return (
    <div className="rounded-2xl">
      {/* Header bar */}
      <div className="px-6 sm:px-8 lg:px-10 pt-4 pb-3 bg-white rounded-2xl mb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-6 h-10 text-[15px] font-semibold text-[var(--secondary-color,#0682DF)] hover:bg-[var(--accent-blue-light-color,#E7EFFD)]"
            disabled={isSubmitting}
          >
            <RiArrowLeftLine className="text-lg" />
            Kembali
          </button>

          <div className="flex items-center gap-3">
            <img
              src={iconUrl || ""}
              alt={displayTitle}
              className="h-8 w-8 object-contain"
            />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-[#0F172A]">
                  {displayTitle}
                </h1>
              </div>
              <p className="text-[13px] text-[#6B7E93]">
                Total Level: {Math.max(1, wizard.rows.length)}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    wizard.draftIsActive
                      ? "bg-[var(--accent-green-light-color)] text-[var(--accent-green-color)]"
                      : "bg-[var(--primary-light-color)] text-[var(--accent-red-color)]"
                  }`}
                  title={wizard.draftIsActive ? "Aktif" : "Nonaktif"}
                >
                  {wizard.draftIsActive ? "Aktif" : "Nonaktif"}
                </span>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  aria-pressed={wizard.draftIsActive}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full border transition disabled:opacity-60 ${
                    wizard.draftIsActive
                      ? "bg-[#10B981] border-[#10B981]"
                      : "bg-[#E6EDF5] border-[#C7D5E5]"
                  }`}
                  title={
                    wizard.draftIsActive
                      ? "Nonaktifkan instrumen"
                      : "Aktifkan instrumen"
                  }
                  disabled={isSubmitting}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                      wizard.draftIsActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                  <span className="sr-only">Toggle status instrumen</span>
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="h-10 w-10 rounded-2xl border border-[#B8C8DA] text-[var(--secondary-color)] grid place-items-center hover:bg-[#F4F8FC]"
              title="Edit nama/ikon instrumen"
              disabled={isSubmitting}
            >
              <RiPencilFill size={20} />
            </button>
          </div>

          <div
            className="flex items-center gap-3 relative"
            data-program-dropdown
          >
            <div className="flex items-center gap-2 rounded-full border border-[#B8C8DA] px-3 h-10">
              <span className="text-[13px] font-semibold text-[#6B7E93]">
                ABK
              </span>
              <button
                type="button"
                onClick={handleToggleAbk}
                aria-pressed={wizard.draftIsAbk}
                className={`relative inline-flex h-6 w-11 items-center rounded-full border transition disabled:opacity-60 ${
                  wizard.draftIsAbk
                    ? "bg-[var(--secondary-color,#0682DF)] border-[var(--secondary-color,#0682DF)]"
                    : "bg-[#E6EDF5] border-[#C7D5E5]"
                }`}
                title={wizard.draftIsAbk ? "Instrumen ABK" : "Instrumen reguler"}
                disabled={isSubmitting}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    wizard.draftIsAbk ? "translate-x-6" : "translate-x-1"
                  }`}
                />
                <span className="sr-only">Toggle instrumen ABK</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleProgramButtonClick}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-4 h-10 text-[15px] font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color,#E6F4FF)]"
              disabled={isSubmitting || isContentLoading}
            >
              {selectedProgramName} <span className="opacity-60">▾</span>
            </button>

            {programMenuOpen && (
              <div className="absolute top-12 right-28 w-56 bg-white border border-neutral-200 rounded-xl shadow-lg z-10">
                {wizard.programs.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-neutral-500">
                    Memuat / belum ada program
                  </div>
                ) : (
                  wizard.programs.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onChooseProgram(p.id)}
                      className={`w-full text-left px-4 py-2 hover:bg-neutral-50 ${
                        p.id === wizard.programId ? "font-semibold" : ""
                      }`}
                      disabled={isSubmitting}
                    >
                      {p.nama_program}
                    </button>
                  ))
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !allSyllabusReady}
              className="inline-flex items-center justify-center rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold px-6 h-10 hover:brightness-95 disabled:opacity-60"
              title={
                !allSyllabusReady
                  ? "Lengkapi silabus untuk semua grade terlebih dahulu"
                  : undefined
              }
            >
              {isSubmitting
                ? "Menyimpan..."
                : isCreatingBrandNewInstrument
                ? "Simpan (Buat Instrumen)"
                : isCreatingNewProgramForExistingInstrument
                ? "Simpan (Tambah Program)"
                : "Simpan (Perbarui)"}
            </button>
          </div>
        </div>

        {!allSyllabusReady && (
          <div className="mt-3 text-[13px] text-red-600">
            Silabus wajib diisi untuk setiap grade sebelum menyimpan.
          </div>
        )}
      </div>

      {/* Body */}
      <div>
        <div className="rounded-2xl bg-white p-4 sm:p-6">
          {isContentLoading ? (
            // Lazy load skeleton grade/detail program/silabus
            <div className="space-y-6">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="pb-6 border-b border-[#E5EDF6] last:border-none animate-pulse"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 md:gap-6 items-end">
                    <div>
                      <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                      <div className="h-11 w-full bg-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                      <div className="h-11 w-full bg-slate-200 rounded-xl" />
                    </div>
                    <div className="flex flex-col items-start md:items-end">
                      <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
                      <div className="flex gap-2">
                        <div className="h-10 w-28 bg-slate-200 rounded-full" />
                        <div className="h-10 w-28 bg-slate-200 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 h-3 w-40 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {wizard.rows.map((row, idx) => {
                  const draft = wizard.syllabusDrafts[idx];
                  const isMarkedDelete = !!wizard.deletedDraftRows[idx];
                  const canDeleteThisRow =
                    wizard.rows.length > 1 && !isSubmitting;

                  return (
                    <div
                      key={idx}
                      className="pb-6 border-b border-[#E5EDF6] last:border-none"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 md:gap-6 items-end">
                        {/* Instrument Grade */}
                        <div>
                          <label className="block text-[14px] font-semibold text-[#0F172A] mb-2">
                            Instrument Grade
                          </label>
                          <input
                            value={row.nama_grade}
                            onChange={(e) =>
                              handleChangeGrade(idx, e.target.value)
                            }
                            className="w-full rounded-xl border border-[#B8C8DA] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-neutral-200"
                            placeholder="Grade I"
                            disabled={isSubmitting || isMarkedDelete}
                          />
                        </div>

                        {/* Harga Per Sesi */}
                        <div>
                          <label className="block text-[14px] font-semibold text-[#0F172A] mb-2">
                            Harga Per Sesi
                          </label>
                          <input
                            value={
                              row.base_harga === "" || row.base_harga == null
                                ? ""
                                : formatRupiahInput(row.base_harga)
                            }
                            onChange={(e) =>
                              handleChangeHarga(idx, e.target.value)
                            }
                            className="w-full rounded-xl border border-[#B8C8DA] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-neutral-200"
                            placeholder="Rp. 0"
                            inputMode="numeric"
                            disabled={isSubmitting || isMarkedDelete}
                          />
                        </div>

                        {/* Aksi kanan */}
                        <div className="md:justify-self-end flex flex-col items-start md:items-end">
                          <span className="block text-[14px] font-semibold text-[#0F172A] mb-2">
                            Aksi
                          </span>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenSylabus(idx)}
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color,#0682DF)] text-[var(--secondary-color,#0682DF)] px-4 h-10 hover:bg-[var(--secondary-light-color,#E6F4FF)]"
                              disabled={isSubmitting || isMarkedDelete}
                            >
                              <RiBookOpenLine className="text-lg" />
                              {draft?.title ? "Edit Silabus" : "Silabus"}
                            </button>

                            {canDeleteThisRow && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteRow(idx, isMarkedDelete)
                                }
                                className={`inline-flex items-center gap-2 rounded-full px-4 h-10 ${
                                  isMarkedDelete
                                    ? "border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                                    : "border border-red-300 text-red-600 hover:bg-red-50"
                                }`}
                                title={
                                  isEdit
                                    ? isMarkedDelete
                                      ? "Batalkan penghapusan grade ini"
                                      : "Tandai grade ini untuk dihapus saat Simpan"
                                    : "Hapus grade dari draft"
                                }
                              >
                                <RiDeleteBinLine className="text-lg" />
                                {isMarkedDelete ? "Batal Hapus" : "Hapus Grade"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Indikator draft / delete */}
                      {isMarkedDelete ? (
                        <p className="mt-2 text-xs text-red-600">
                          Baris ini <strong>akan dihapus</strong> saat kamu
                          menekan Simpan.
                        </p>
                      ) : draft?.title ? (
                        <p className="mt-2 text-xs text-green-700">
                          Draft silabus tersimpan: {draft.title}
                          {draft.link_url
                            ? " (Link)"
                            : draft.file_url
                            ? " (PDF)"
                            : draft.file_base64
                            ? " (Gambar)"
                            : ""}
                          {Array.isArray(draft.completion_pts) &&
                          draft.completion_pts.length > 0
                            ? ` • ${draft.completion_pts.length} target`
                            : null}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-orange-700">
                          Belum ada draft silabus untuk grade ini.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tambah grade */}
              <div className="pt-5">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-2 rounded-full border border-[#B8C8DA] px-4 h-10 text-[15px] font-semibold text-[var(--secondary-color,#0682DF)] hover:bg-[var(--accent-blue-light-color,#E7EFFD)]"
                  disabled={isSubmitting}
                >
                  <RiAddLine className="text-lg" />
                  Tambah Grade
                </button>
              </div>

              {/* Error */}
              {wizard.status === "failed" && wizard.error && (
                <div className="mt-4 text-sm text-red-600">
                  {wizard.error}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODALS */}
      <SylabusModal
        open={showSylabus}
        onClose={() => setShowSylabus(false)}
        subtitle={`${displayTitle} - ${currentGrade || "Grade I"}`}
        initial={
          currentRowIndex >= 0
            ? wizard.syllabusDrafts[currentRowIndex]
            : undefined
        }
        onSaveDraft={handleSaveSylabusDraft}
      />

      <AddInstrumentModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        defaultName={displayTitle}
        title="Edit Instrumen"
        requireIcon={false}
        initialPreview={iconUrl}
        defaultIsAbk={wizard.draftIsAbk}
        onSubmit={(payload: EditInstrumentPayload) => {
          let changed = false;

          if (typeof payload.name === "string") {
            changed = true;
            dispatch(patchDraft({ name: payload.name }));
          }
          if (typeof payload.iconBase64 === "string") {
            changed = true;
            dispatch(patchDraft({ iconBase64: payload.iconBase64 }));
          }
          if (typeof payload.isAbk === "boolean") {
            if (payload.isAbk !== wizard.draftIsAbk) changed = true;
            dispatch(patchDraft({ isAbk: payload.isAbk }));
          }

          if (changed) setHasUnsavedChanges(true);

          const newType = resolveType(payload);
          if (newType && newType !== typeSlug) {
            setTypeSlug(newType);
            setShowEdit(false);
            navigate(
              `/dashboard-admin/instrument/${newType}${
                isNew ? "?new=1" : isEdit ? `?id=${instrumentId}` : ""
              }`
            );
          } else {
            setShowEdit(false);
          }
        }}
      />

      {/* Modal peringatan perubahan belum disimpan */}
      <ConfirmationModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        icon={<RiCloseLine />}
        iconTone="danger"
        title="Perubahan belum disimpan"
        texts={[
          "Mohon simpan perubahan terlebih dahulu sebelum berganti program.",
        ]}
        align="center"
        button1={{
          label: "Mengerti",
          onClick: () => setShowUnsavedModal(false),
          variant: "danger",
        }}
      />
    </div>
  );
};

export default InstrumentDetailPage;
