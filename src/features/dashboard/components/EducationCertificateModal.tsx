'use client';

import React from 'react';
import { RiCloseLine, RiDownloadLine, RiMusic2Line } from 'react-icons/ri';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

export type EducationCertificateData = {
  id?: number | string | null;
  nama_kampus?: string | null;
  major_instrument_id?: number | string | null;
  minor_instrument_id?: number | string | null;
  majorInstrument?: { id?: number | null; nama_instrumen?: string | null; icon?: string | null } | null;
  minorInstrument?: { id?: number | null; nama_instrumen?: string | null; icon?: string | null } | null;
  url_sertifikat_kelulusan?: string | null;
  video_url?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data?: EducationCertificateData | null;
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

const EducationCertificateModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const certResolved =
    resolveImageUrl(data?.url_sertifikat_kelulusan ?? null) ||
    data?.url_sertifikat_kelulusan ||
    '';
  const certDisabled = !certResolved;

  const videoResolved = resolveHttpsUrl(data?.video_url ?? null);
  const videoDisabled = !videoResolved;

  const majorName = data?.majorInstrument?.nama_instrumen || '-';
  const minorName = data?.minorInstrument?.nama_instrumen || '-';
  const majorIcon = data?.majorInstrument?.icon ? resolveImageUrl(data?.majorInstrument?.icon ?? null) : null;
  const minorIcon = data?.minorInstrument?.icon ? resolveImageUrl(data?.minorInstrument?.icon ?? null) : null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4" aria-modal="true" role="dialog">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[calc(100vh-2rem)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6EAF0]">
          <h3 className="text-lg font-semibold text-neutral-900">Sertifikat Pendidikan</h3>
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
              <label className="text-md text-neutral-900 mb-1 block">Nama Kampus</label>
              <input className="w-full h-11 rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 text-sm text-neutral-800 outline-none" value={data?.nama_kampus ?? '-'} readOnly />
            </div>

            <div>
              <label className="text-md text-neutral-900 mb-1 block">Major Instrument</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 py-2">
                {majorIcon ? (
                  <img src={majorIcon} alt={majorName} className="h-5 w-5 object-contain" />
                ) : (
                  <RiMusic2Line className="text-[var(--secondary-color)]" />
                )}
                <span className="text-sm text-neutral-800">{majorName}</span>
              </div>
            </div>

            <div>
              <label className="text-md text-neutral-900 mb-1 block">Minor Instrument</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 py-2">
                {minorIcon ? (
                  <img src={minorIcon} alt={minorName} className="h-5 w-5 object-contain" />
                ) : (
                  <RiMusic2Line className="text-[var(--secondary-color)]" />
                )}
                <span className="text-sm text-neutral-800">{minorName}</span>
              </div>
            </div>

            <div>
              <label className="text-md text-neutral-900 mb-1 block">Sertifikat Kelulusan</label>
              <a
                href={certResolved || '#'}
                target={certDisabled ? undefined : '_blank'}
                rel={certDisabled ? undefined : 'noopener noreferrer'}
                aria-disabled={certDisabled}
                onClick={(e) => {
                  if (certDisabled) e.preventDefault();
                }}
                className={`${pillBase} ${certDisabled ? pillDisabled : pillEnabled}`}
              >
                <RiDownloadLine /> Lihat Sertifikat
              </a>
            </div>

            <div>
              <label className="text-md text-neutral-900 mb-1 block">Video Performa</label>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationCertificateModal;
