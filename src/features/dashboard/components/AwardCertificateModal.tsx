'use client';

import React from 'react';
import { RiCloseLine, RiDownloadLine, RiMusic2Line } from 'react-icons/ri';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

export type AwardCertificateData = {
  id?: number | string | null;
  judul_penghargaan?: string | null;
  penyelenggara?: string | null;
  detail_penghargaan?: string | null;
  instrument_id?: number | string | null;
  instrument?: { id?: number | null; nama_instrumen?: string | null; icon?: string | null } | null;
  files?: Array<{ id?: number | null; file_url?: string | null; file_mime?: string | null; created_at?: string | null }> | null;
  video_url?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data?: AwardCertificateData | null;
};

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
  if (url.startsWith('https://')) return url;
  if (/^https?:\/\//i.test(url)) return url.replace(/^http:\/\//i, 'https://');
  if (/^www\./i.test(url)) return `https://${url}`;
  if (/^(tiktok\.com|www\.tiktok\.com|youtu\.be|youtube\.com|www\.youtube\.com)\//i.test(url)) {
    return `https://${url}`;
  }
  return '';
};

const AwardCertificateModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const instrumentName = data?.instrument?.nama_instrumen || '-';
  const instrumentIcon = data?.instrument?.icon ? resolveImageUrl(data?.instrument?.icon ?? null) : null;
  const files = Array.isArray(data?.files) ? data!.files! : [];

  const videoResolved = resolveHttpsUrl(data?.video_url ?? null);
  const videoDisabled = !videoResolved;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4" aria-modal="true" role="dialog">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[calc(100vh-2rem)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6EAF0]">
          <h3 className="text-lg font-semibold text-neutral-900">Sertifikat Penghargaan</h3>
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

        <div className="px-5 pb-5 pt-4 max-h-[calc(100vh-7.5rem)] overflow-y-auto">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-md text-neutral-900 mb-1 block">Judul Penghargaan</label>
              <input className="w-full h-11 rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 text-sm text-neutral-800 outline-none" value={data?.judul_penghargaan ?? '-'} readOnly />
            </div>
            <div>
              <label className="text-md text-neutral-900 mb-1 block">Penyelenggara</label>
              <input className="w-full h-11 rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 text-sm text-neutral-800 outline-none" value={data?.penyelenggara ?? '-'} readOnly />
            </div>
            <div>
              <label className="text-md text-neutral-900 mb-1 block">Detail Penghargaan</label>
              <textarea className="w-full min-h-[90px] rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 py-2 text-sm text-neutral-800 outline-none" value={data?.detail_penghargaan ?? '-'} readOnly />
            </div>
            <div>
              <label className="text-md text-neutral-900 mb-1 block">Instrument</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 py-2">
                {instrumentIcon ? (
                  <img src={instrumentIcon} alt={instrumentName} className="h-5 w-5 object-contain" />
                ) : (
                  <RiMusic2Line className="text-[var(--secondary-color)]" />
                )}
                <span className="text-sm text-neutral-800">{instrumentName}</span>
              </div>
            </div>
            <div>
              <label className="text-md text-neutral-900 mb-1 block">Video Penghargaan</label>
              <a
                href={videoResolved || '#'}
                target={videoDisabled ? undefined : '_blank'}
                rel={videoDisabled ? undefined : 'noopener noreferrer'}
                aria-disabled={videoDisabled}
                onClick={(e) => {
                  if (videoDisabled) e.preventDefault();
                }}
                className={`${pillBase} ${videoDisabled ? pillDisabled : pillEnabled}`}
              >
                <RiDownloadLine /> Lihat Video
              </a>
            </div>
            <div>
              <label className="text-md text-neutral-900 mb-1 block">File Sertifikat Penghargaan</label>
              {files.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {files.map((f, idx) => {
                    const resolved = resolveImageUrl(f.file_url ?? null) || f.file_url || '';
                    const disabled = !resolved;
                    return (
                      <a
                        key={String(f.id ?? idx)}
                        href={resolved || '#'}
                        target={disabled ? undefined : '_blank'}
                        rel={disabled ? undefined : 'noopener noreferrer'}
                        aria-disabled={disabled}
                        onClick={(e) => {
                          if (disabled) e.preventDefault();
                        }}
                        className={`${pillBase} ${disabled ? pillDisabled : pillEnabled}`}
                      >
                        <RiDownloadLine /> File {idx + 1}
                      </a>
                    );
                  })}
                </div>
              ) : (
                <span className="text-sm text-neutral-500">Tidak ada file.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwardCertificateModal;
