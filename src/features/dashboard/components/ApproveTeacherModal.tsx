'use client';

import React, { useEffect, useState } from 'react';
import {
  RiCloseLine,
  RiArrowRightSLine,
  RiMusic2Line,
} from 'react-icons/ri';
import type { CertificateItem } from '@/features/dashboard/components/ManageCertificateModal';
import type { EducationCertificateData } from '@/features/dashboard/components/EducationCertificateModal';
import type { AwardCertificateData } from '@/features/dashboard/components/AwardCertificateModal';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { getLanguageIcon } from '@/utils/getLanguageIcon';

export type ApproveMode = 'approved' | 'rejected';

export type ApproveTeacherPayload =
  | { mode: 'approved' }
  | { mode: 'rejected'; reason: string; attachment?: File | null };

type BaseData = {
  image?: string;
  name?: string;
  short_name?: string;
  email?: string;
  phone?: string;
  province?: string;
  city?: string;
  address?: string;
  videoUrl?: string;
  cvUrl?: string;
  certificateUrl?: string;
  awardCertificateUrl?: string;
  certificates?: CertificateItem[];
  languages?: Array<{ code: string; label: string }>;
  classInfo?: {
    title?: string;
    about?: string;
    values?: string[];
  };
  awards?: Array<{
    title?: string;
    organizer?: string;
    detail?: string;
    instrument?: string;
    instrumentIcon?: string;
    videoUrl?: string;
    certUrl?: string;
  }>;
  awardList?: AwardCertificateData[];
  educationList?: EducationCertificateData[];
};

type ApproveTeacherModalProps = {
  open: boolean;
  mode: ApproveMode;
  onClose: () => void;
  onSubmit: (payload: ApproveTeacherPayload) => void;
  data?: BaseData;
  onOpenCertificates?: (opts?: { instrumentName?: string | null }) => void;
  onOpenCertificateDetail?: (item: CertificateItem) => void;
  onOpenEducationDetail?: (item: EducationCertificateData) => void;
  onOpenAwardDetail?: (item: AwardCertificateData) => void;
  approveDisabled?: boolean;
  approveDisabledHint?: string;
};

const inputCls =
  'w-full h-11 rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 text-sm text-neutral-800 outline-none';
const labelCls = 'text-md text-neutral-900 mb-1 block';

const getDisplayCertStatus = (c: CertificateItem) => {
  if (c.draftStatus === 'approved') return 'Disetujui';
  if (c.draftStatus === 'rejected') return 'Tidak Disetujui';
  return c.status;
};

const ApproveTeacherModal: React.FC<ApproveTeacherModalProps> = ({
  open,
  mode,
  onClose,
  onSubmit,
  data,
  onOpenCertificates,
  onOpenCertificateDetail,
  onOpenEducationDetail,
  onOpenAwardDetail,
  approveDisabled = false,
  approveDisabledHint,
}) => {
  const [file] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (open && mode === 'approved') setStep(1);
  }, [open, mode]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const certs = data?.certificates ?? [];

  const [, setActiveInstrument] = useState<string | null>(null);

  if (!open) return null;

  const submitApproved = () => onSubmit({ mode: 'approved' });
  const submitRejected = () =>
    onSubmit({ mode: 'rejected', reason, attachment: file });

  const hasEducation =
    Array.isArray(data?.educationList) && data!.educationList!.length > 0;
  const hasAwards = Array.isArray(data?.awardList) && data!.awardList!.length > 0;
  const hasLanguages =
    Array.isArray(data?.languages) && data!.languages!.length > 0;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-[#0B1220]/60"
        onClick={onClose}
        aria-hidden
      />
      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[calc(100vh-2rem)] overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6EAF0]">
            <h3 className="text-lg font-semibold text-neutral-900">
              {mode === 'approved'
                ? 'Formulir Calon Tutor'
                : 'Formulir Penolakan Calon Tutor'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-neutral-100 cursor-pointer"
              aria-label="Tutup"
              title="Tutup"
            >
              <RiCloseLine className="text-2xl text-neutral-900" />
            </button>
          </div>

          {/* body */}
          {mode === 'approved' ? (
            <div className="px-5 pb-5 pt-4 max-h-[calc(100vh-7.5rem)] overflow-y-auto">
              <div className="mb-4 text-sm text-neutral-600">Step {step} dari 3</div>

              {step === 1 ? (
                <>
                  {/* Profile */}
                  <div className="mb-4">
                    <p className="text-md font-medium text-neutral-900 mb-2">
                      Data Pribadi
                    </p>
                    <div className="w-20 h-20 rounded-full overflow-hidden">
                      <img
                        src={data?.image ?? 'https://i.pravatar.cc/100?img=1'}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className={labelCls}>Nama Lengkap</label>
                        <input className={inputCls} value={data?.name ?? ''} readOnly />
                      </div>
                      <div className="w-1/2">
                        <label className={labelCls}>Nama Panggilan</label>
                        <input className={inputCls} value={data?.short_name ?? ''} readOnly />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className={labelCls}>Email</label>
                        <input className={inputCls} value={data?.email ?? ''} readOnly />
                      </div>
                      <div className="w-1/2">
                        <label className={labelCls}>No Telepon</label>
                        <input className={inputCls} value={data?.phone ?? ''} readOnly />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className={labelCls}>Kota</label>
                        <input className={inputCls} value={data?.city ?? ''} readOnly />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="h-11 px-6 rounded-full font-semibold bg-[var(--primary-color)] text-neutral-900 cursor-pointer"
                    >
                      Lanjut
                    </button>
                  </div>
                </>
              ) : step === 2 ? (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Bahasa */}
                    {hasLanguages && (
                      <div>
                        <label className={labelCls}>Bahasa</label>
                        <div className="flex flex-wrap gap-2">
                          {data!.languages!.map((lang) => (
                            <span
                              key={lang.code}
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-300 text-sm text-neutral-800"
                            >
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 border border-neutral-300 text-[11px] font-semibold text-neutral-700">
                              <img src={getLanguageIcon(lang.code)} alt={lang.label} className="w-4 h-4 object-contain" loading="lazy" />
                              </span>
                              {lang.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sertifikat instrumen (lokal/internasional) */}
                    <div>
                      <label className={labelCls}>
                        Sertifikat Instrumen (Lokal/Internasional)
                      </label>
                      <div className="rounded-xl border border-neutral-300 p-2">
                        {certs.length ? (
                          <ul className="space-y-2">
                            {certs.map((c) => (
                              <li
                                key={c.id}
                                className="rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50 cursor-pointer"
                                onClick={() => onOpenCertificateDetail?.(c)}
                              >
                              <div className="flex items-center gap-2">
                                {c.instrumentIcon ? (
                                  <img
                                    src={c.instrumentIcon}
                                    alt={c.instrument}
                                    className="h-5 w-5 object-contain"
                                    loading="lazy"
                                  />
                                ) : (
                                  <RiMusic2Line className="text-[var(--secondary-color)]" />
                                )}
                                <div className="font-medium text-neutral-900">
                                  {c.instrument} {c.grade ? `- ${c.grade}` : ''}
                                </div>
                                <span className="ml-auto text-xs font-medium text-neutral-700">
                                  {getDisplayCertStatus(c)}
                                </span>
                              </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="px-3 py-2 text-sm text-neutral-500">
                            Belum ada sertifikat instrumen.
                          </div>
                        )}
                        {!!certs.length && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveInstrument(null);
                              onOpenCertificates?.();
                            }}
                            className="mt-2 inline-flex items-center gap-2 px-3 py-2 text-sm text-[var(--secondary-color)] rounded-lg hover:bg-neutral-50"
                          >
                            Lihat Semua <RiArrowRightSLine size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sertifikat Penghargaan */}
                    {hasAwards && (
                      <div className="mt-3">
                        <label className={labelCls}>Sertifikat Penghargaan</label>
                        <div className="grid grid-cols-1 gap-3">
                          {data!.awardList!.map((a, idx) => (
                            <div
                              key={`${a.judul_penghargaan ?? 'award'}-${idx}`}
                              className="rounded-xl border border-neutral-200 p-3 hover:bg-neutral-50 cursor-pointer"
                              onClick={() => onOpenAwardDetail?.(a)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {a.instrument?.icon ? (
                                  <img
                                    src={resolveImageUrl(a.instrument?.icon) || ''}
                                    alt={a.instrument?.nama_instrumen ?? 'Instrumen'}
                                    className="h-5 w-5 object-contain"
                                  />
                                ) : (
                                  <RiMusic2Line className="text-[var(--secondary-color)]" />
                                )}
                                <span className="text-sm text-neutral-700">
                                  {a.instrument?.nama_instrumen || '-'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sertifikat Pendidikan */}
                    {hasEducation && (
                      <div className="mt-3">
                        <label className={labelCls}>Sertifikat Pendidikan</label>
                        <div className="grid grid-cols-1 gap-3">
                          {data!.educationList!.map((e, idx) => (
                            <div
                              key={String(e.id ?? idx)}
                              className="rounded-xl border border-neutral-200 p-3 hover:bg-neutral-50 cursor-pointer"
                              onClick={() => onOpenEducationDetail?.(e)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {e.majorInstrument?.icon ? (
                                  <img
                                    src={resolveImageUrl(e.majorInstrument?.icon) || ''}
                                    alt={e.majorInstrument?.nama_instrumen ?? 'Instrumen'}
                                    className="h-5 w-5 object-contain"
                                  />
                                ) : (
                                  <RiMusic2Line className="text-[var(--secondary-color)]" />
                                )}
                                <span className="text-sm text-neutral-700">
                                  {e.majorInstrument?.nama_instrumen || '-'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-11 px-6 rounded-full font-semibold border border-[#DDE3EA] text-neutral-900 hover:bg-neutral-50"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="h-11 px-6 rounded-full font-semibold bg-[var(--primary-color)] text-neutral-900 cursor-pointer"
                    >
                      Lanjut
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className={labelCls}>Judul Kelas</label>
                      <input
                        className={inputCls}
                        value={data?.classInfo?.title ?? ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Tentang Kelas</label>
                      <textarea
                        className="w-full min-h-[90px] rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 py-2 text-sm text-neutral-800 outline-none"
                        value={data?.classInfo?.about ?? ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Value Kelas</label>
                      <input
                        className={inputCls}
                        value={
                          Array.isArray(data?.classInfo?.values)
                            ? data!.classInfo!.values!.join(', ')
                            : ''
                        }
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="h-11 px-6 rounded-full font-semibold border border-[#DDE3EA] text-neutral-900 hover:bg-neutral-50"
                    >
                      Kembali
                    </button>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={submitApproved}
                        disabled={approveDisabled}
                        className={[
                          'h-11 px-6 rounded-full font-semibold text-neutral-900',
                          approveDisabled
                            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                            : 'bg-[var(--primary-color)] cursor-pointer',
                        ].join(' ')}
                      >
                        Setujui (Guru)
                      </button>
                      {approveDisabled && approveDisabledHint && (
                        <p className="mt-2 text-sm text-neutral-600">{approveDisabledHint}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="px-5 pb-5 pt-4 max-h-[calc(100vh-7.5rem)] overflow-y-auto">
              {/* Perihal */}
              <div className="mb-3">
                <p className="text-sm text-neutral-600">Perihal:</p>
                <p className="text-md text-neutral-900">
                  <span className="font-medium">
                    Hasil Seleksi Calon Tutor Guru Musik 
                  </span>
                </p>
              </div>

              {/* Reason */}
              <div className="mt-3">
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-[var(--secondary-color)] px-3 py-2 text-md outline-none"
                  placeholder="Masukkan keterangan Penolakan Calon Tutor"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {/* actions */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={submitRejected}
                  className="w-full h-11 rounded-full font-semibold bg-[var(--primary-color)] text-neutral-900 cursor-pointer"
                >
                  Kirim Laporan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApproveTeacherModal;
