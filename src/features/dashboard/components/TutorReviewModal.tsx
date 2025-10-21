'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  RiCloseLine,
  RiStarFill,
  RiCalendar2Line,
  RiInformationLine,
} from 'react-icons/ri';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import type { TutorReportRow } from './TutorReportModal';
import Landscape from '@/assets/images/Landscape.png';
import teacherFallback from '@/assets/images/teacher-demo.png';
import ProgramAvatarBadge from '@/components/ui/badge/ProgramAvatarBadge';

type TutorReviewModalProps = {
  open: boolean;
  onClose: () => void;

  tutorImage: string;
  tutorName: string;
  instrumentLabel?: string;
  schedule?: string;
  programLabel?: string; // <-- dipakai ProgramAvatarBadge

  nilaiKelas?: string;
  nilaiAsli?: string;

  row?: TutorReportRow | null;
  defaultVisible?: boolean;
};

const TutorReviewModal: React.FC<TutorReviewModalProps> = ({
  open,
  onClose,
  tutorImage,
  tutorName,
  instrumentLabel = 'Vocal',
  schedule = 'Setiap Kamis | 14.00 - 14.45',
  programLabel = 'ABK',
  row,
  defaultVisible = true,
}) => {
  // Hooks harus selalu dipanggil sebelum return kondisional
  const ratingValue = useMemo(() => {
    const s = String(row?.nilai ?? '4/5').split('/')[0] || '4';
    const n = parseFloat(s);
    if (Number.isFinite(n)) return Math.max(0, Math.min(5, n));
    return 4;
  }, [row?.nilai]);
  const fullStars = Math.round(ratingValue);

  const [isVisible, setIsVisible] = useState(defaultVisible);

  useEffect(() => {
    if (open) setIsVisible(defaultVisible);
  }, [open, defaultVisible]);

  const reasons = useMemo(
    () => [
      { label: 'Tepat Waktu', selected: false },
      { label: 'Komunikasi Jelas & Tanggap', selected: true },
      { label: 'Cara Mengajar Efektif', selected: true },
    ],
    []
  );

  const thumbs = useMemo(() => [Landscape, Landscape, Landscape], []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* modal */}
      <div className="relative z-[131] w-[min(720px,95vw)] rounded-3xl bg-white shadow-2xl border border-black/10">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          {/* left: avatar + name + instrument + schedule */}
          <div className="flex items-center gap-3">
            {/* ✅ gunakan ProgramAvatarBadge */}
            <ProgramAvatarBadge
              src={tutorImage || teacherFallback}
              alt={tutorName}
              pkg={programLabel}
              size={56} // ~h-14 w-14
            />

            <div className="flex flex-col">
              <div className="text-md font-semibold text-neutral-900 flex items-center gap-2">
                {tutorName} |{' '}
                <span className="inline-flex items-center gap-1 text-sm text-neutral-900">
                  <img
                    src={getInstrumentIcon((instrumentLabel || '').toLowerCase())}
                    alt={instrumentLabel}
                    className="h-6 w-6"
                  />
                  {instrumentLabel}
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-2 text-sm">
                <RiCalendar2Line size={20} className="text-[var(--secondary-color)]" />
                {schedule}
              </div>
            </div>
          </div>

          {/* right: close */}
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5"
            aria-label="Close"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* content */}
        <div className="px-6 pt-5 pb-6">
          {/* row: rating stars + toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <RiStarFill
                  key={i}
                  className={i < fullStars ? 'text-[var(--primary-color)]' : 'text-neutral-300'}
                  size={40}
                />
              ))}
            </div>

            {/* toggle tampilkan */}
            <label className="flex items-center gap-3 select-none">
              <span className="text-sm text-neutral-700">Tampilkan</span>
              <button
                type="button"
                onClick={() => setIsVisible((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  isVisible ? 'bg-(--secondary-color)' : 'bg-neutral-300'
                }`}
                aria-pressed={isVisible}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    isVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <RiInformationLine size={25} className="text-[var(--accent-red-color)]" />
            </label>
          </div>

          {/* reasons chips */}
          <div className="mt-5">
            <div className="text-lg font-semibold text-neutral-900 mb-2">Alasan:</div>
            <div className="flex flex-wrap gap-2">
              {reasons.map((r) => (
                <span
                  key={r.label}
                  className={`rounded-full px-5 py-2 text-sm border bg-white text-(--secondary-color) border-neutral-300 ${
                    r.selected ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  {r.label}
                </span>
              ))}
            </div>
          </div>

          {/* thumbnails */}
          <div className="mt-4 flex items-center gap-3 overflow-x-auto">
            {thumbs.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`thumb-${i + 1}`}
                className="h-24 w-38 rounded-xl object-cover ring-1 ring-black/10"
              />
            ))}
          </div>

          {/* note box */}
          <div className="mt-4 rounded-xl border border-black/10 bg-white p-3">
            <p className="text-md text-neutral-700 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum mollis nunc a molestie
              dictum. Mauris venenatis, felis scelerisque aliquet lacinia, nulla nisi venenatis odio,
              id blandit mauris ipsum id sapien. Vestibulum malesuada orci sit amet pretium facilisis.
              In lobortis congue augue, a commodo libero tincidunt scelerisque.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorReviewModal;
