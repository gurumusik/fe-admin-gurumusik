'use client';

import React, { useMemo, useState } from 'react';
import {
  RiCloseLine,
  RiDownloadLine,
  RiArrowRightSLine,
  RiMusic2Line,
} from 'react-icons/ri';
import type { CertificateItem } from '@/features/dashboard/components/ManageCertificateModal';

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
  city?: string;
  videoUrl?: string;
  cvUrl?: string;
  certificateUrl?: string;
  awardCertificateUrl?: string;
  certificates?: CertificateItem[];
  education?: {
    campusName?: string;
    majorMinor?: string;
    graduationCertUrl?: string;
  };
};

type ApproveTeacherModalProps = {
  open: boolean;
  mode: ApproveMode;
  onClose: () => void;
  onSubmit: (payload: ApproveTeacherPayload) => void;
  data?: BaseData;
  onOpenCertificates?: (opts?: { instrumentName?: string | null }) => void;
  approveDisabled?: boolean;
  approveDisabledHint?: string;
};

const inputCls =
  'w-full h-11 rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 text-sm text-neutral-800 outline-none';
const labelCls = 'text-md text-neutral-900 mb-1 block';

// style badge/link
const pillBase =
  'inline-flex items-center gap-2 h-8 px-3 rounded-full border text-sm';
const pillEnabled =
  'border-[var(--secondary-color)] text-[var(--secondary-color)] bg-white';
const pillDisabled =
  'border-neutral-300 text-neutral-400 bg-neutral-100 cursor-not-allowed pointer-events-none';

const resolveHttpsUrl = (raw?: string | null): string => {
  if (!raw) return '';
  const url = raw.trim();
  if (!url) return '';

  if (url.startsWith('https://')) {
    return url;
  }

  if (/^drive\.google\.com\//i.test(url)) {
    return `https://${url}`;
  }

  if (/^youtube\.com\//i.test(url)) {
    return `https://${url}`;
  }

  return '';
};



const ApproveTeacherModal: React.FC<ApproveTeacherModalProps> = ({
  open,
  mode,
  onClose,
  onSubmit,
  data,
  onOpenCertificates,
  approveDisabled = false,
  approveDisabledHint,
}) => {
  const [file] = useState<File | null>(null);
  const [reason, setReason] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const certs = data?.certificates ?? [];

  type InstrumentChip = { name: string; icon?: string; grade?: string };

  const instrumentChips = useMemo<InstrumentChip[]>(() => {
    const map = new Map<string, InstrumentChip>();
    certs.forEach((c) => {
      const key = (c.instrument || '').trim();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          icon: c.instrumentIcon,
          grade: c.grade,
        });
      }
    });
    return Array.from(map.values());
  }, [certs]);

  const [activeInstrument, setActiveInstrument] = useState<string | null>(null);

  if (!open) return null;

  const submitApproved = () => onSubmit({ mode: 'approved' });
  const submitRejected = () =>
    onSubmit({ mode: 'rejected', reason, attachment: file });

  // resolve URL backend (contoh: http://localhost:3000/uploads/cv/xxx.pdf)
  const cvResolved = resolveHttpsUrl(data?.cvUrl);
  const certResolved = resolveHttpsUrl(data?.certificateUrl);
  const awardResolved = resolveHttpsUrl(data?.awardCertificateUrl);
  const demoResolved = resolveHttpsUrl(data?.videoUrl);

  const cvDisabled = !cvResolved;
  const certDisabled = !certResolved;
  const awardDisabled = !awardResolved;
  const demoDisabled = !demoResolved;

  const edu = data?.education;
  const hasEducation =
    !!edu?.campusName || !!edu?.majorMinor || !!edu?.graduationCertUrl;

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
              {/* Profile */}
              <div className="mb-4">
                <p className="text-md font-medium text-neutral-900 mb-2">
                  Profile
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
                    <label className={labelCls}>Nama Calon Tutor</label>
                    <input
                      className={inputCls}
                      value={data?.name ?? ''}
                      readOnly
                    />
                  </div>
                  <div className="w-1/2">
                    <label className={labelCls}>Nama Panggilan</label>
                    <input
                      className={inputCls}
                      value={data?.short_name ?? ''}
                      readOnly
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className={labelCls}>Email</label>
                    <input
                      className={inputCls}
                      value={data?.email ?? ''}
                      readOnly
                    />
                  </div>
                  <div className="w-1/2">
                    <label className={labelCls}>No Telepon</label>
                    <input
                      className={inputCls}
                      value={data?.phone ?? ''}
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Asal Kota</label>
                  <input
                    className={inputCls}
                    value={data?.city ?? ''}
                    readOnly
                  />
                </div>

                {/* Sertifikat instrumen */}
                <div>
                  <label className={labelCls}>Sertifikat Instrumen</label>
                  <div className="flex flex-wrap gap-2 items-center rounded-xl border border-neutral-300 p-1.5">
                    {instrumentChips.length ? (
                      instrumentChips.map((ins) => (
                        <button
                          key={ins.name}
                          type="button"
                          onClick={() => {
                            setActiveInstrument(ins.name);
                            onOpenCertificates?.({
                              instrumentName: ins.name,
                            });
                          }}
                          className={[
                            'inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40',
                            activeInstrument === ins.name
                              ? 'bg-[var(--secondary-light-color)] text-neutral-900'
                              : 'text-black/80 hover:bg-neutral-50',
                          ].join(' ')}
                          title={
                            ins.grade ? `${ins.name} • ${ins.grade}` : ins.name
                          }
                        >
                          {ins.icon ? (
                            <img
                              src={ins.icon}
                              alt={ins.name}
                              className="h-5 w-5 object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <RiMusic2Line className="text-[var(--secondary-color)]" />
                          )}
                          <span>
                            {ins.name}
                            {ins.grade ? ` • ${ins.grade}` : ''}
                          </span>
                        </button>
                      ))
                    ) : (
                      <span className="px-3 py-2 text-sm text-black/50">
                        Belum ada sertifikat instrumen.
                      </span>
                    )}

                    {!!certs.length && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveInstrument(null);
                          onOpenCertificates?.(); // semua sertifikat
                        }}
                        className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-sm text-[var(--secondary-color)] rounded-lg hover:bg-neutral-50"
                      >
                        Lihat Semua <RiArrowRightSLine size={18} />
                      </button>
                    )}
                  </div>
                </div>

                

                {/* Pendidikan Guru */}
                {hasEducation && (
                  <div className="mt-3">
                    <label className={labelCls}>Pendidikan Guru</label>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className={labelCls}>Nama Kampus</label>
                        <input
                          className={inputCls}
                          value={edu?.campusName ?? ''}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          Prodi / Major / Minor
                        </label>
                        <input
                          className={inputCls}
                          value={edu?.majorMinor ?? ''}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          Sertifikat Kelulusan
                        </label>
                        <a
                          href={resolveHttpsUrl(edu?.graduationCertUrl) || '#'}
                          target={
                            resolveHttpsUrl(edu?.graduationCertUrl)
                              ? '_blank'
                              : undefined
                          }
                          rel={
                            resolveHttpsUrl(edu?.graduationCertUrl)
                              ? 'noopener noreferrer'
                              : undefined
                          }
                          aria-disabled={
                            !resolveHttpsUrl(edu?.graduationCertUrl)
                          }
                          onClick={(e) => {
                            if (!resolveHttpsUrl(edu?.graduationCertUrl))
                              e.preventDefault();
                          }}
                          className={`${pillBase} ${
                            resolveHttpsUrl(edu?.graduationCertUrl)
                              ? pillEnabled
                              : pillDisabled
                          }`}
                        >
                          <RiDownloadLine /> Lihat Sertifikat
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Pendukung */}
                <div className="mt-1">
                  <label className={labelCls}>File Pendukung</label>
                  <div className="flex items-center gap-3">
                    {/* CV */}
                    <a
                      href={cvResolved || '#'}
                      target={cvDisabled ? undefined : '_blank'}
                      rel={cvDisabled ? undefined : 'noopener noreferrer'}
                      aria-disabled={cvDisabled}
                      onClick={(e) => {
                        if (cvDisabled) e.preventDefault();
                      }}
                      className={`${pillBase} ${
                        cvDisabled ? pillDisabled : pillEnabled
                      }`}
                    >
                      <RiDownloadLine /> CV
                    </a>

                    {/* Sertifikat (legacy – dari portfolio_url kalau ada) */}
                    <a
                      href={certResolved || '#'}
                      target={certDisabled ? undefined : '_blank'}
                      rel={certDisabled ? undefined : 'noopener noreferrer'}
                      aria-disabled={certDisabled}
                      onClick={(e) => {
                        if (certDisabled) e.preventDefault();
                      }}
                      className={`${pillBase} ${
                        certDisabled ? pillDisabled : pillEnabled
                      }`}
                    >
                      <RiDownloadLine /> Portfolio
                    </a>

                    {/* Sertifikat Penghargaan */}
                    <a
                      href={awardResolved || '#'}
                      target={awardDisabled ? undefined : '_blank'}
                      rel={awardDisabled ? undefined : 'noopener noreferrer'}
                      aria-disabled={awardDisabled}
                      onClick={(e) => {
                        if (awardDisabled) e.preventDefault();
                      }}
                      className={`${pillBase} ${
                        awardDisabled ? pillDisabled : pillEnabled
                      }`}
                    >
                      <RiDownloadLine /> Sertifikat Penghargaan
                    </a>

                    {/* Video Demo */}
                    <a
                      href={demoResolved || '#'}
                      target={demoDisabled ? undefined : '_blank'}
                      rel={demoDisabled ? undefined : 'noopener noreferrer'}
                      aria-disabled={demoDisabled}
                      onClick={(e) => {
                        if (demoDisabled) e.preventDefault();
                      }}
                      className={`${pillBase} ${
                        demoDisabled ? pillDisabled : pillEnabled
                      }`}
                    >
                      <RiDownloadLine /> Video Perkenalan
                    </a>
                  </div>
                </div>
              </div>

              {/* actions */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={submitApproved}
                  disabled={approveDisabled}
                  className={[
                    "w-full h-11 rounded-full font-semibold text-neutral-900",
                    approveDisabled
                      ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                      : "bg-[var(--primary-color)] cursor-pointer",
                  ].join(" ")}
                >
                  Setujui
                </button>
                {approveDisabled && approveDisabledHint && (
                  <p className="mt-2 text-sm text-neutral-600">
                    {approveDisabledHint}
                  </p>
                )}
              </div>
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
