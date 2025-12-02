/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  RiCloseLine,
  RiArrowLeftSLine,
  RiPencilFill,
  RiMusic2Line,
} from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import { fetchInstrumentsThunk } from '@/features/slices/instruments/slice';
import { fetchGradesThunk } from '@/features/slices/grades/slice';
import { resolveIconUrl } from '@/services/api/instrument.api';
import { getStatusColor } from '@/utils/getStatusColor';

/** ===== TYPES ===== */
export type CertStatus = 'Menunggu Verifikasi' | 'Disetujui' | 'Tidak Disetujui';

export type CertificateItem = {
  id: string | number;
  title: string;
  school: string;
  instrument_id: number;
  grade_id: number;
  status: CertStatus;
  link?: string; // url (image/pdf)
};

type InstrumentOption = { id: number; label: string; icon: string | null };
type GradeOption = { id: number; label: string };

export type CreateCertPayloadIds = {
  title: string;
  school: string;
  instrument_id: number;
  grade_id: number;
  file: File;
};

export type UpdateCertPayloadIds = {
  id: string | number;
  title: string;
  school: string;
  instrument_id: number;
  grade_id: number;
  /** Optional; jika tidak diisi, file lama tetap dipakai */
  file?: File | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;

  /** List sertifikat milik page (pakai id, bukan nama) */
  certificates?: CertificateItem[];
  title?: string;

  onCreate?: (payload: CreateCertPayloadIds) => void | Promise<void>;
  onUpdate?: (payload: UpdateCertPayloadIds) => void | Promise<void>;
};

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

const BtnSquare: React.FC<React.PropsWithChildren<{ bordered?: boolean; onClick?: () => void; ariaLabel: string }>> = ({
  bordered = true,
  onClick,
  ariaLabel,
  children,
}) => (
  <button
    aria-label={ariaLabel}
    onClick={onClick}
    className={cls(
      'inline-grid place-items-center w-10 h-10 rounded-xl bg-white transition active:scale-95',
      bordered ? 'border border-neutral-300 hover:bg-neutral-50' : 'hover:bg-neutral-50'
    )}
  >
    {children}
  </button>
);

/** ================= EntryCertificateModal (Add + Edit, fetch dari store) ================= */
const EntryCertificateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  certificates,
  title = 'Kelola Sertifikat',
  onCreate,
  onUpdate,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  /** ===== Instruments & Grades dari Redux ===== */
  const instrumentsState = useSelector((s: RootState) => (s as any).instrument);
  const gradesState = useSelector((s: RootState) => (s as any).grades);

  useEffect(() => {
    if (!isOpen) return;
    if (instrumentsState?.status === 'idle') {
      dispatch(fetchInstrumentsThunk(undefined) as any);
    }
    if (gradesState?.status === 'idle') {
      dispatch(fetchGradesThunk(undefined) as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

const instrumentOptions = useMemo<InstrumentOption[]>(
  () =>
    (instrumentsState?.items ?? []).map((it: any) => ({
      id: it.id as number,
      label: it.nama_instrumen as string,
      icon: resolveIconUrl?.(it.icon) ?? it.icon ?? null,
    })),
  [instrumentsState?.items]
);

const gradeOptions = useMemo<GradeOption[]>(
  () =>
    (gradesState?.items ?? []).map((g: any) => ({
      id: g.id as number,
      label: (g.nama_grade as string) || (g.nama as string) || '',
    })),
  [gradesState?.items]
);

  /** Items yang ditampilkan di list (dari props) */
  const [items, setItems] = useState<CertificateItem[]>(() => certificates ?? []);
  useEffect(() => {
    setItems(certificates ?? []);
  }, [certificates]);

  /** ===== PHASES ===== */
  const [phase, setPhase] = useState<'list' | 'create' | 'edit'>('list');
  const [selected, setSelected] = useState<CertificateItem | null>(null);

  /** ====== FORM STATE (dipakai create & edit) ====== */
  const [titleInput, setTitleInput] = useState('');
  const [schoolInput, setSchoolInput] = useState('');
  const [instrumentIdInput, setInstrumentIdInput] = useState<number | ''>('');
  const [gradeIdInput, setGradeIdInput] = useState<number | ''>('');
  const [fileInput, setFileInput] = useState<File | null>(null);

  const [formErr, setFormErr] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const resetForm = () => {
    setTitleInput('');
    setSchoolInput('');
    setInstrumentIdInput('');
    setGradeIdInput('');
    setFileInput(null);
    setFormErr(null);
    setWorking(false);
  };

  const handleClose = () => {
    setPhase('list');
    setSelected(null);
    resetForm();
    onClose?.();
  };

  const openCreate = () => {
    setSelected(null);
    resetForm();
    setPhase('create');
  };

  const openEdit = (item: CertificateItem) => {
    setSelected(item);
    setTitleInput(item.title || '');
    setSchoolInput(item.school || '');
    setInstrumentIdInput(item.instrument_id || '');
    setGradeIdInput(item.grade_id || '');
    setFileInput(null);
    setFormErr(null);
    setWorking(false);
    setPhase('edit');
  };

  /** ===== VALIDATION ===== */
  const validate = (needFile: boolean) => {
    const e: string[] = [];
    if (!titleInput.trim()) e.push('Nama Sertifikasi wajib diisi.');
    if (!schoolInput.trim()) e.push('Penyelenggara Sertifikasi wajib diisi.');
    if (!instrumentIdInput) e.push('Pilih Instrumen.');
    if (!gradeIdInput) e.push('Pilih Grade.');
    if (needFile && !fileInput) e.push('File Sertifikasi wajib diunggah.');
    if (fileInput) {
      const okTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!okTypes.includes(fileInput.type)) e.push('Format file harus JPEG, PNG, atau PDF.');
    }
    return e;
  };

  /** ===== CREATE ===== */
  const handleCreate = async () => {
    const errs = validate(true);
    if (errs.length) {
      setFormErr(errs[0]);
      return;
    }
    try {
      setWorking(true);
      if (onCreate && fileInput && instrumentIdInput && gradeIdInput) {
        await onCreate({
          title: titleInput.trim(),
          school: schoolInput.trim(),
          instrument_id: instrumentIdInput as number,
          grade_id: gradeIdInput as number,
          file: fileInput,
        });
      }
      const link = fileInput ? URL.createObjectURL(fileInput) : undefined;
      setItems((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          title: titleInput.trim(),
          school: schoolInput.trim(),
          instrument_id: instrumentIdInput as number,
          grade_id: gradeIdInput as number,
          status: 'Menunggu Verifikasi',
          link,
        },
      ]);
      setPhase('list');
      resetForm();
    } catch {
      setFormErr('Gagal menyimpan. Coba lagi.');
    } finally {
      setWorking(false);
    }
  };

  /** ===== UPDATE ===== */
  const handleUpdate = async () => {
    if (!selected) return;
    const errs = validate(false);
    if (errs.length) {
      setFormErr(errs[0]);
      return;
    }
    try {
      setWorking(true);
      if (onUpdate) {
        await onUpdate({
          id: selected.id,
          title: titleInput.trim(),
          school: schoolInput.trim(),
          instrument_id: instrumentIdInput as number,
          grade_id: gradeIdInput as number,
          file: fileInput || undefined,
        });
      }
      const newLink = fileInput ? URL.createObjectURL(fileInput) : undefined;
      setItems((prev) =>
        prev.map((it) =>
          it.id === selected.id
            ? {
                ...it,
                title: titleInput.trim(),
                school: schoolInput.trim(),
                instrument_id: instrumentIdInput as number,
                grade_id: gradeIdInput as number,
                link: newLink ?? it.link,
              }
            : it
        )
      );
      setPhase('list');
      setSelected(null);
      resetForm();
    } catch {
      setFormErr('Gagal mengubah data. Coba lagi.');
    } finally {
      setWorking(false);
    }
  };

  /** Helpers untuk render label dari id */
  const labelOfInstrument = (id?: number | null) =>
    instrumentOptions.find((o: InstrumentOption) => o.id === id)?.label ?? '—';

  const iconOfInstrument = (id?: number | null) =>
    instrumentOptions.find((o: InstrumentOption) => o.id === id)?.icon ?? null;

  const labelOfGrade = (id?: number | null) =>
    gradeOptions.find((g: GradeOption) => g.id === id)?.label ?? '—';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
      onMouseDown={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ================= LIST ================= */}
        {phase === 'list' && (
          <>
            <div className="flex items-start gap-3 p-5 pb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                <p className="text-md text-neutral-600 mt-1">{items.length} Sertifikat</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openCreate}
                  className="rounded-full px-4 py-2 text-sm font-medium border border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/5"
                >
                  Tambah Sertifikat
                </button>
                <button
                  aria-label="Tutup"
                  onClick={handleClose}
                  className="shrink-0 inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100"
                  title="Tutup"
                >
                  <RiCloseLine size={25} className="text-neutral-800" />
                </button>
              </div>
            </div>
            <hr className="border-t border-neutral-300 mb-2 mx-5" />
            <div className="px-5 pb-5">
              <ul>
                {items.map((item) => (
                  <li key={item.id} className="py-3 border-b border-neutral-300 px-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-semibold text-neutral-900 leading-tight">
                          {item.title}
                        </div>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <div className="text-md text-neutral-600 leading-tight">{item.school}</div>
                          <span className="inline-flex items-center gap-1 text-md text-neutral-800">
                            {iconOfInstrument(item.instrument_id) ? (
                              <img
                                src={iconOfInstrument(item.instrument_id)!}
                                alt={labelOfInstrument(item.instrument_id)}
                                className="w-4 h-4 object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <RiMusic2Line />
                            )}
                            <span className="font-medium">{labelOfInstrument(item.instrument_id)}</span>
                            <span className="text-neutral-400">•</span>
                            <span className="font-medium">{labelOfGrade(item.grade_id)}</span>
                          </span>
                          <span className={cls('text-md font-medium', getStatusColor(item.status))}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      {/* Aksi: Edit */}
                      <BtnSquare ariaLabel="Edit sertifikat" onClick={() => openEdit(item)} bordered>
                        <RiPencilFill size={20} className="text-[var(--secondary-color)]" />
                      </BtnSquare>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* ================= CREATE / EDIT ================= */}
        {(phase === 'create' || phase === 'edit') && (
          <>
            <div className="px-5 pt-5 pb-3">
              <div className="grid grid-cols-3 items-center">
                <div className="justify-self-start">
                  <button
                    onClick={() => {
                      setPhase('list');
                      setSelected(null);
                      resetForm();
                    }}
                    className="inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100"
                    aria-label="Kembali"
                  >
                    <RiArrowLeftSLine size={20} className="text-neutral-800" />
                  </button>
                </div>
                <div className="justify-self-center">
                  <h3 className="text-[18px] font-semibold text-neutral-900">
                    {phase === 'create' ? 'Tambahkan Sertifikasi' : 'Edit Sertifikasi'}
                  </h3>
                </div>
                <div className="justify-self-end">
                  <button
                    aria-label="Tutup"
                    onClick={handleClose}
                    className="inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100"
                    title="Tutup"
                  >
                    <RiCloseLine size={20} className="text-neutral-800" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              {/* Nama Sertifikasi */}
              <div className="mb-4">
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">Nama Sertifikasi</div>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="cth: ABRSM Grade 5"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
                />
              </div>

              {/* Penyelenggara */}
              <div className="mb-4">
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">Penyelenggara Sertifikasi</div>
                <input
                  type="text"
                  value={schoolInput}
                  onChange={(e) => setSchoolInput(e.target.value)}
                  placeholder="cth: ABRSM / Trinity / Javas Music School"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
                />
              </div>

              {/* Alat Musik & Grade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-[15px] font-semibold text-neutral-900 mb-2">Alat Musik</div>
                  <select
                    value={instrumentIdInput}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : '';
                      setInstrumentIdInput(v);
                    }}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
                  >
                    <option value="">Pilih Instrumen</option>
                      {instrumentOptions.map((opt: InstrumentOption) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                  </select>
                  {(instrumentsState?.status === 'loading') && (
                    <div className="mt-1 text-xs text-neutral-500">Memuat daftar instrumen…</div>
                  )}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-neutral-900 mb-2">Grade</div>
                  <select
                    value={gradeIdInput}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : '';
                      setGradeIdInput(v);
                    }}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
                  >
                    <option value="">Pilih Grade</option>
                      {gradeOptions.map((g: GradeOption) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                  </select>
                  {(gradesState?.status === 'loading') && (
                    <div className="mt-1 text-xs text-neutral-500">Memuat daftar grade…</div>
                  )}
                </div>
              </div>

              {/* File Sertifikasi */}
              <div className="mb-2">
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">
                  File Sertifikasi {phase === 'edit' && <span className="text-neutral-500">(opsional)</span>}
                </div>

                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 border text-[14px]
                             border-[var(--secondary-color)] text-[var(--secondary-color)]
                             hover:bg-[var(--secondary-color)]/5 cursor-pointer"
                >
                  {phase === 'create' ? 'Upload Sertifikat' : 'Ganti File'}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0] || null;
                    setFileInput(f);
                  }}
                />
                <div className="mt-2 text-xs text-neutral-500">
                  Supported formats: JPEG, PNG, JPG, PDF
                </div>

                {fileInput && (
                  <div className="mt-2 text-sm text-neutral-700">
                    Dipilih: <span className="font-medium">{fileInput.name}</span>
                  </div>
                )}
              </div>

              {formErr && <div className="mt-3 text-sm text-red-600">{formErr}</div>}

              {/* Actions */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPhase('list');
                    setSelected(null);
                    resetForm();
                  }}
                  className="rounded-full px-6 py-3 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                >
                  Batal
                </button>
                {phase === 'create' ? (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={working}
                    className="rounded-full px-6 py-3 font-semibold bg-[var(--primary-color)] text-neutral-900 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {working ? 'Menyimpan…' : 'Simpan'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={working}
                    className="rounded-full px-6 py-3 font-semibold bg-[var(--primary-color)] text-neutral-900 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {working ? 'Menyimpan…' : 'Simpan Perubahan'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EntryCertificateModal;
