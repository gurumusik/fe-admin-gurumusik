'use client';

import React, { useEffect, useState } from 'react';
import {
  RiArrowLeftSLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiMusic2Line,
} from 'react-icons/ri';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

export type AwardCertificateData = {
  id?: number | string | null;
  judul_penghargaan?: string | null;
  penyelenggara?: string | null;
  detail_penghargaan?: string | null;
  instrument_id?: number | string | null;
  instrument?: {
    id?: number | null;
    nama_instrumen?: string | null;
    icon?: string | null;
  } | null;
  files?: Array<{
    id?: number | null;
    file_url?: string | null;
    file_mime?: string | null;
    created_at?: string | null;
  }> | null;
  video_url?: string | null;
  draftStatus?: 'approved' | 'rejected' | 'revision' | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data?: AwardCertificateData | null;
  decisionStatus?: 'approved' | 'rejected' | 'revision' | null;
  onDecisionChange?: (status: 'approved' | 'rejected' | 'revision' | null) => void;
};

type DraftDecision = 'pending' | 'approved' | 'rejected' | 'revision';

const CERT_TYPE_OPTIONS = [
  { key: 'internasional', label: 'Internasional' },
  { key: 'lokal', label: 'Lokal' },
  { key: 'universitas', label: 'Universitas' },
  { key: 'penghargaan', label: 'Penghargaan' },
] as const;

const resolveHttpsUrl = (raw?: string | null): string => {
  if (!raw) return '';
  const url = raw.trim();
  if (!url) return '';
  if (url.startsWith('https://')) return url;
  if (/^https?:\/\//i.test(url)) return url.replace(/^http:\/\//i, 'https://');
  if (/^www\./i.test(url)) return `https://${url}`;
  if (
    /^(tiktok\.com|www\.tiktok\.com|youtu\.be|youtube\.com|www\.youtube\.com)\//i.test(url)
  ) {
    return `https://${url}`;
  }
  return '';
};

const getFileNameFromUrl = (raw?: string | null) => {
  if (!raw) return '-';
  try {
    const normalized = raw.split('?')[0] || raw;
    const fileName = normalized.split('/').pop() || normalized;
    return decodeURIComponent(fileName);
  } catch {
    return raw;
  }
};

const getInitialDecision = (
  status?: 'approved' | 'rejected' | 'revision' | null
): DraftDecision => {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'revision') return 'revision';
  return 'pending';
};

const AwardCertificateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  data,
  decisionStatus,
  onDecisionChange,
}) => {
  const [draftDecision, setDraftDecision] = useState<DraftDecision>('pending');

  useEffect(() => {
    if (!isOpen) return;
    setDraftDecision(getInitialDecision(decisionStatus ?? data?.draftStatus ?? null));
  }, [isOpen, decisionStatus, data?.draftStatus]);

  if (!isOpen) return null;

  const instrumentName = data?.instrument?.nama_instrumen || '-';
  const instrumentIcon = data?.instrument?.icon
    ? resolveImageUrl(data?.instrument?.icon ?? null)
    : null;
  const files = Array.isArray(data?.files) ? data.files : [];
  const firstFileUrl =
    (files.length > 0 && (resolveImageUrl(files[0]?.file_url ?? null) || files[0]?.file_url)) || '';
  const videoResolved = resolveHttpsUrl(data?.video_url ?? null);

  const saveDecision = () => {
    if (draftDecision === 'approved') onDecisionChange?.('approved');
    else if (draftDecision === 'rejected') onDecisionChange?.('rejected');
    else if (draftDecision === 'revision') onDecisionChange?.('revision');
    else onDecisionChange?.(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
      aria-modal="true"
      role="dialog"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <div className="grid grid-cols-3 items-center">
            <div className="justify-self-start">
              <button
                type="button"
                onClick={onClose}
                className="inline-grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-100"
                aria-label="Kembali"
              >
                <RiArrowLeftSLine className="text-xl text-neutral-900" />
              </button>
            </div>
            <div className="justify-self-center">
              <h3 className="text-[18px] font-semibold text-[#1D2433]">
                Pengajuan Sertifikasi
              </h3>
            </div>
            <div className="justify-self-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-100"
                aria-label="Tutup"
              >
                <RiCloseLine className="text-xl text-neutral-900" />
              </button>
            </div>
          </div>
        </div>

        <hr className="mx-5 mb-2 border-t border-[#DCE5EF]" />

        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto px-5 pb-5">
          <div className="mb-5">
            <p className="mb-3 text-[16px] font-semibold text-[#2D3445]">
              Tipe Sertifikasi
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {CERT_TYPE_OPTIONS.map((option) => {
                const checked = option.key === 'penghargaan';
                return (
                  <label
                    key={option.key}
                    className="inline-flex items-center gap-3 text-[15px] text-[#2D3445]"
                  >
                    <input
                      type="radio"
                      name="award-cert-type"
                      checked={checked}
                      readOnly
                      className="h-[18px] w-[18px] accent-[var(--secondary-color)]"
                    />
                    <span className={!checked ? 'text-[#8A94A6]' : undefined}>
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
              Judul Penghargaan
            </div>
            <div className="rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-[15px] text-[#334155]">
              {data?.judul_penghargaan || '-'}
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
              Penyelenggara
            </div>
            <div className="rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-[15px] text-[#334155]">
              {data?.penyelenggara || '-'}
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
              Detail Penghargaan
            </div>
            <textarea
              className="min-h-[96px] w-full resize-none rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-4 text-[15px] leading-7 text-[#334155] outline-none"
              value={data?.detail_penghargaan || '-'}
              readOnly
            />
          </div>

          <div className="mb-4">
            <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
              Instrumen
            </div>
            <div className="flex items-center gap-2 rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-[15px] text-[#334155]">
              <span className="inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white">
                {instrumentIcon ? (
                  <img
                    src={instrumentIcon}
                    alt={instrumentName}
                    className="h-4 w-4 object-contain"
                  />
                ) : (
                  <RiMusic2Line className="text-base" />
                )}
              </span>
              <span className="truncate">{instrumentName}</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
              Video Performa
            </div>
            <button
              type="button"
              disabled={!videoResolved}
              onClick={() => {
                if (!videoResolved) return;
                window.open(videoResolved, '_blank', 'noopener,noreferrer');
              }}
              className="flex w-full items-center gap-3 rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-left text-[15px] text-[#334155] transition hover:border-[var(--secondary-color)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="min-w-0 flex-1 truncate">
                {videoResolved || 'Video performa belum tersedia'}
              </span>
              <RiExternalLinkLine className="shrink-0 text-xl text-[#2D3445]" />
            </button>
          </div>

          <div className="mb-5">
            <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
              File Sertifikasi
            </div>
            <button
              type="button"
              disabled={!firstFileUrl}
              onClick={() => {
                if (!firstFileUrl) return;
                window.open(firstFileUrl, '_blank', 'noopener,noreferrer');
              }}
              className="flex w-full items-center gap-3 rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-left text-[15px] text-[#334155] transition hover:border-[var(--secondary-color)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="min-w-0 flex-1 truncate">
                {getFileNameFromUrl(firstFileUrl)}
              </span>
              <RiExternalLinkLine className="shrink-0 text-xl text-[#2D3445]" />
            </button>
          </div>

          {onDecisionChange ? (
          <div className="border-t border-[#DCE5EF] pt-4">
            <p className="mb-3 text-[16px] font-semibold text-[#2D3445]">
              Pilih Aksi Dibawah!!
            </p>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="grid flex-1 grid-cols-2 overflow-hidden rounded-full border border-[#D6E1EC] bg-white sm:grid-cols-4">
                <button
                  type="button"
                  disabled
                  className="h-10 border-r border-[#E4ECF4] bg-[#F7FAFD] px-4 text-xs font-medium text-[#9FB0C5] cursor-not-allowed"
                  title="Sedang maintenance"
                >
                  Ajukan Ujian
                </button>
                <button
                  type="button"
                  onClick={() => setDraftDecision('revision')}
                  className={[
                    'h-10 border-r border-[#E4ECF4] px-4 text-xs font-medium transition',
                    draftDecision === 'revision'
                      ? 'bg-[#E9F3FF] text-[var(--secondary-color)]'
                      : 'bg-white text-[#2D3445] hover:bg-[#F7FAFD]',
                  ].join(' ')}
                >
                  Revisi
                </button>
                <button
                  type="button"
                  onClick={() => setDraftDecision('rejected')}
                  className={[
                    'h-10 border-r border-[#E4ECF4] px-4 text-xs font-medium transition',
                    draftDecision === 'rejected'
                      ? 'bg-[#FFF1F5] text-[var(--accent-red-color)]'
                      : 'bg-white text-[#2D3445] hover:bg-[#F7FAFD]',
                  ].join(' ')}
                >
                  Tolak
                </button>
                <button
                  type="button"
                  onClick={() => setDraftDecision('approved')}
                  className={[
                    'h-10 px-4 text-xs font-medium transition',
                    draftDecision === 'approved'
                      ? 'bg-[#EEF9F2] text-[#18B968]'
                      : 'bg-white text-[#2D3445] hover:bg-[#F7FAFD]',
                  ].join(' ')}
                >
                  Setujui
                </button>
              </div>

              <button
                type="button"
                onClick={saveDecision}
                className="h-10 rounded-full bg-[var(--primary-color)] px-8 text-xs font-semibold text-neutral-900 transition hover:brightness-95 lg:min-w-[140px]"
              >
                Simpan
              </button>
            </div>
          </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AwardCertificateModal;
