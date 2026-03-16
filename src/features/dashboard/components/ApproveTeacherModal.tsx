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
  home_lat?: string | number | null;
  home_lng?: string | number | null;
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

  // optional: revision reporting (admin verify tutor)
  revisionSelected?: Record<string, true>;
  onToggleRevisionField?: (field_key: string, label: string, next: boolean) => void;
  onOpenRevisionComposer?: () => void;
};

const inputCls =
  'w-full h-11 rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 text-sm text-neutral-800 outline-none';
const textareaCls =
  'w-full min-h-[84px] rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 py-2 text-sm text-neutral-800 outline-none resize-none';
const labelCls = 'text-md text-neutral-900 mb-1 block';

const RevisionToggle: React.FC<{
  field_key: string;
  label: string;
  checked?: boolean;
  onToggle?: (field_key: string, label: string, next: boolean) => void;
}> = ({ field_key, label, checked, onToggle }) => {
  if (!onToggle) return null;
  const active = !!checked;
  return (
    <button
      type="button"
      onClick={() => onToggle(field_key, label, !active)}
      className={[
        'ml-auto h-7 px-3 rounded-full text-xs font-semibold border transition cursor-pointer',
        active
          ? 'bg-[var(--accent-red-light-color)] text-[var(--accent-red-color)] border-[var(--accent-red-light-color)]'
          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50',
      ].join(' ')}
      title={active ? 'Ditandai untuk revisi' : 'Tandai untuk revisi'}
    >
      {active ? 'Perlu revisi' : 'Tandai revisi'}
    </button>
  );
};

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
  revisionSelected,
  onToggleRevisionField,
  onOpenRevisionComposer,
}) => {
  const [file] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (open && mode === 'approved') setStep(1);
  }, [open, mode]);

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

  const latNum =
    data?.home_lat === null || data?.home_lat === undefined || data?.home_lat === ''
      ? null
      : Number(data.home_lat);
  const lngNum =
    data?.home_lng === null || data?.home_lng === undefined || data?.home_lng === ''
      ? null
      : Number(data.home_lng);
  const hasCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);
  const coordText = hasCoords ? `${latNum}, ${lngNum}` : '';
  const gmapsQuery = hasCoords ? `${latNum},${lngNum}` : '';
  const gmapsUrl = hasCoords ? `https://www.google.com/maps?q=${encodeURIComponent(gmapsQuery)}` : '';
  const gmapsEmbedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${encodeURIComponent(gmapsQuery)}&z=15&output=embed`
    : '';

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
            <div className="flex items-center gap-2">
              {mode === 'approved' && onOpenRevisionComposer && (
                <button
                  type="button"
                  onClick={onOpenRevisionComposer}
                  className="h-9 px-4 rounded-full font-semibold border border-neutral-300 text-neutral-900 hover:bg-neutral-50 cursor-pointer"
                >
                  Laporan Kesalahan
                  {revisionSelected && Object.keys(revisionSelected).length > 0
                    ? ` (${Object.keys(revisionSelected).length})`
                    : ''}
                </button>
              )}
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
                        <div className="flex items-center gap-2">
                          <label className={labelCls}>Nama Lengkap</label>
                          <RevisionToggle
                            field_key="profile.nama"
                            label="Nama lengkap"
                            checked={!!revisionSelected?.['profile.nama']}
                            onToggle={onToggleRevisionField}
                          />
                        </div>
                        <input className={inputCls} value={data?.name ?? ''} readOnly />
                      </div>
                      <div className="w-1/2">
                        <div className="flex items-center gap-2">
                          <label className={labelCls}>Nama Panggilan</label>
                          <RevisionToggle
                            field_key="profile.nama_panggilan"
                            label="Nama panggilan"
                            checked={!!revisionSelected?.['profile.nama_panggilan']}
                            onToggle={onToggleRevisionField}
                          />
                        </div>
                        <input className={inputCls} value={data?.short_name ?? ''} readOnly />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <div className="flex items-center gap-2">
                          <label className={labelCls}>Email</label>
                          <RevisionToggle
                            field_key="profile.email"
                            label="Email"
                            checked={!!revisionSelected?.['profile.email']}
                            onToggle={onToggleRevisionField}
                          />
                        </div>
                        <input className={inputCls} value={data?.email ?? ''} readOnly />
                      </div>
                      <div className="w-1/2">
                        <div className="flex items-center gap-2">
                          <label className={labelCls}>No Telepon</label>
                          <RevisionToggle
                            field_key="profile.phone"
                            label="Nomor telepon"
                            checked={!!revisionSelected?.['profile.phone']}
                            onToggle={onToggleRevisionField}
                          />
                        </div>
                        <input className={inputCls} value={data?.phone ?? ''} readOnly />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <div className="flex items-center gap-2">
                          <label className={labelCls}>Provinsi</label>
                          <RevisionToggle
                            field_key="location.province"
                            label="Provinsi"
                            checked={!!revisionSelected?.['location.province']}
                            onToggle={onToggleRevisionField}
                          />
                        </div>
                        <input className={inputCls} value={data?.province ?? ''} readOnly />
                      </div>
                      <div className="w-1/2">
                        <div className="flex items-center gap-2">
                          <label className={labelCls}>Kota</label>
                          <RevisionToggle
                            field_key="location.city"
                            label="Kota"
                            checked={!!revisionSelected?.['location.city']}
                            onToggle={onToggleRevisionField}
                          />
                        </div>
                        <input className={inputCls} value={data?.city ?? ''} readOnly />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <label className={labelCls}>Alamat</label>
                        <RevisionToggle
                          field_key="location.address"
                          label="Alamat"
                          checked={!!revisionSelected?.['location.address']}
                          onToggle={onToggleRevisionField}
                        />
                      </div>
                      <textarea className={textareaCls} value={data?.address ?? ''} readOnly />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <label className={labelCls}>Titik Koordinat</label>
                        <RevisionToggle
                          field_key="location.coordinates"
                          label="Titik koordinat"
                          checked={!!revisionSelected?.['location.coordinates']}
                          onToggle={onToggleRevisionField}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            className={inputCls}
                            value={coordText || '-'}
                            readOnly
                          />
                          {hasCoords ? (
                            <a
                              href={gmapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="h-11 px-4 inline-flex items-center rounded-lg border border-neutral-300 bg-white text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                            >
                              Buka Maps
                            </a>
                          ) : null}
                        </div>

                        {hasCoords ? (
                          <div className="overflow-hidden rounded-xl border border-neutral-200">
                            <iframe
                              title="Lokasi tutor"
                              src={gmapsEmbedUrl}
                              className="w-full h-[220px]"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-500">
                            Koordinat belum diisi oleh tutor.
                          </p>
                        )}
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
                        <div className="flex items-center gap-2">
                          <label className={labelCls}>Bahasa</label>
                          <RevisionToggle
                            field_key="languages"
                            label="Bahasa"
                            checked={!!revisionSelected?.languages}
                            onToggle={onToggleRevisionField}
                          />
                        </div>
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
                      <div className="flex items-center gap-2">
                        <label className={labelCls}>
                          Sertifikat Instrumen (Lokal/Internasional)
                        </label>
                        <RevisionToggle
                          field_key="certificates.instrument"
                          label="Sertifikat instrumen"
                          checked={!!revisionSelected?.['certificates.instrument']}
                          onToggle={onToggleRevisionField}
                        />
                      </div>
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
                        <div className="flex items-center gap-2">
                          <label className={labelCls}>Sertifikat Penghargaan</label>
                          <RevisionToggle
                            field_key="certificates.award"
                            label="Sertifikat penghargaan"
                            checked={!!revisionSelected?.['certificates.award']}
                            onToggle={onToggleRevisionField}
                          />
                        </div>
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
                                <span
                                  className={[
                                    'ml-auto text-xs font-medium',
                                    a.draftStatus === 'approved'
                                      ? 'text-[#18A957]'
                                      : a.draftStatus === 'rejected'
                                      ? 'text-[#F14A7E]'
                                      : 'text-neutral-500',
                                  ].join(' ')}
                                >
                                  {a.draftStatus === 'approved'
                                    ? 'Disetujui'
                                    : a.draftStatus === 'rejected'
                                    ? 'Tidak Disetujui'
                                    : 'Menunggu Verifikasi'}
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
                        <div className="flex items-center gap-2">
                          <label className={labelCls}>Sertifikat Pendidikan</label>
                          <RevisionToggle
                            field_key="certificates.education"
                            label="Sertifikat pendidikan"
                            checked={!!revisionSelected?.['certificates.education']}
                            onToggle={onToggleRevisionField}
                          />
                        </div>
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
                                <span
                                  className={[
                                    'ml-auto text-xs font-medium',
                                    e.draftStatus === 'approved'
                                      ? 'text-[#18A957]'
                                      : e.draftStatus === 'rejected'
                                      ? 'text-[#F14A7E]'
                                      : 'text-neutral-500',
                                  ].join(' ')}
                                >
                                  {e.draftStatus === 'approved'
                                    ? 'Disetujui'
                                    : e.draftStatus === 'rejected'
                                    ? 'Tidak Disetujui'
                                    : 'Menunggu Verifikasi'}
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
                      <div className="flex items-center gap-2">
                        <label className={labelCls}>Judul Kelas</label>
                        <RevisionToggle
                          field_key="class.title"
                          label="Judul kelas"
                          checked={!!revisionSelected?.['class.title']}
                          onToggle={onToggleRevisionField}
                        />
                      </div>
                      <input
                        className={inputCls}
                        value={data?.classInfo?.title ?? ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label className={labelCls}>Tentang Kelas</label>
                        <RevisionToggle
                          field_key="class.about"
                          label="Tentang kelas"
                          checked={!!revisionSelected?.['class.about']}
                          onToggle={onToggleRevisionField}
                        />
                      </div>
                      <textarea
                        className="w-full min-h-[90px] rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 py-2 text-sm text-neutral-800 outline-none"
                        value={data?.classInfo?.about ?? ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label className={labelCls}>Value Kelas</label>
                        <RevisionToggle
                          field_key="class.values"
                          label="Value kelas"
                          checked={!!revisionSelected?.['class.values']}
                          onToggle={onToggleRevisionField}
                        />
                      </div>
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
