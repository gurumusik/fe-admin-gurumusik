'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { RiCloseLine, RiStarFill, RiCalendar2Line, RiInformationLine } from 'react-icons/ri';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import type { TutorReportRow } from './TutorReportModal';
import teacherFallback from '@/assets/images/teacher-demo.png';
import ProgramAvatarBadge from '@/components/ui/badge/ProgramAvatarBadge';
import { updateRatingIsShow } from '@/services/api/guruClasses.api';

// ⬇️ util untuk lampiran
import { resolveImageUrl } from '@/utils/resolveImageUrl';

// ⬇️ tipe bantu (sesuai types.ts)
import type {
  RatingSelectedIndicatorItem,
  RatingAttachmentItem,
} from '@/features/slices/guru/classes/types';

type TutorReviewModalProps = {
  open: boolean;
  onClose: () => void;

  tutorImage: string;
  tutorName: string;
  instrumentLabel?: string;
  schedule?: string;
  programLabel?: string;

  nilaiKelas?: string;
  nilaiAsli?: string;

  row?: TutorReportRow | null;

  // kontrol toggle
  onSetShown?: (next: boolean) => Promise<void> | void;
  submitting?: boolean;
  errorText?: string | null;

  // fallback PUT
  guruId?: number | string;
  ratingId?: number | string;

  // toggle state awal (datang dari page -> selectedRating?.is_show)
  defaultVisible?: boolean;

  // ⬇️ DATA BARU
  selectedIndicators?: RatingSelectedIndicatorItem[];
  attachments?: RatingAttachmentItem[];
  feedbackText?: string | null;
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
  onSetShown,
  submitting = false,
  guruId,
  ratingId,
  defaultVisible = false,

  // data baru
  selectedIndicators = [],
  attachments = [],
  feedbackText = '',
}) => {
  // rating bintang (UI tetap)
  const ratingValue = useMemo(() => {
    const s = String(row?.nilai ?? '4/5').split('/')[0] || '4';
    const n = parseFloat(s);
    if (Number.isFinite(n)) return Math.max(0, Math.min(5, n));
    return 4;
  }, [row?.nilai]);
  const fullStars = Math.round(ratingValue);

  // visible dari props (prioritas defaultVisible)
  const propVisible = useMemo(() => {
    if (typeof defaultVisible === 'boolean') return defaultVisible;
    const label = (row?.status ?? '').toLowerCase();
    return /tampil/.test(label);
  }, [defaultVisible, row?.status]);

  const [isVisible, setIsVisible] = useState<boolean>(propVisible);
  const [savingLocal, setSavingLocal] = useState<boolean>(false);

  // sync saat modal dibuka / nilai sumber berubah
  useEffect(() => {
    if (open) setIsVisible(propVisible);
  }, [open, propVisible]);

  const handleToggle = useCallback(async () => {
    if (submitting || savingLocal) return;
    const next = !isVisible;

    setIsVisible(next);          // optimistic
    setSavingLocal(true);
    try {
      if (onSetShown) {
        await onSetShown(next);
      } else if (guruId != null && ratingId != null) {
        await updateRatingIsShow(guruId, ratingId, next);
      } else {
        setIsVisible(!next);     // revert jika tidak ada handler/id
      }
    } catch {
      setIsVisible(!next);       // revert jika gagal
    } finally {
      setSavingLocal(false);
    }
  }, [isVisible, submitting, savingLocal, onSetShown, guruId, ratingId]);

  // ====== DATA BARU: reasons dari selectedIndicators (pakai label)
  const reasonLabels = useMemo(
    () =>
      (selectedIndicators ?? [])
        .map((it) => it?.indicator?.label)
        .filter((lbl): lbl is string => !!lbl && !!String(lbl).trim()),
    [selectedIndicators]
  );

  // ====== DATA BARU: thumbs dari rating_attachment (resolve URL)
  const thumbs = useMemo(
    () =>
      (attachments ?? [])
        .map((a) => resolveImageUrl(a?.url ?? null))
        .filter((u): u is string => !!u),
    [attachments]
  );

  // ====== DATA BARU: feedback untuk deskripsi
  const description = (feedbackText ?? '').trim();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* modal */}
      <div className="relative z-[131] w-[min(720px,95vw)] rounded-3xl bg-white shadow-2xl border border-black/10">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <div className="flex items-center gap-3">
            <ProgramAvatarBadge
              src={tutorImage || teacherFallback}
              alt={tutorName}
              pkg={programLabel}
              size={56}
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
                onClick={handleToggle}
                disabled={submitting || savingLocal}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  isVisible ? 'bg-(--secondary-color)' : 'bg-neutral-300'
                } disabled:opacity-50`}
                aria-pressed={isVisible}
                aria-busy={submitting || savingLocal}
                title={submitting || savingLocal ? 'Menyimpan…' : isVisible ? 'Sembunyikan' : 'Tampilkan'}
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

          {/* ====== Alasan: dari selectedIndicators */}
          <div className="mt-5">
            <div className="text-lg font-semibold text-neutral-900 mb-2">Alasan:</div>
            <div className="flex flex-wrap gap-2">
              {reasonLabels.length > 0 ? (
                reasonLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full px-5 py-2 text-sm border bg-white text-(--secondary-color) border-neutral-300"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-sm text-neutral-500">—</span>
              )}
            </div>
          </div>

          {/* ====== Lampiran: dari rating_attachment (gambar) */}
          {thumbs.length > 0 && (
            <div className="mt-4 flex items-center gap-3 overflow-x-auto">
              {thumbs.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`lampiran-${i + 1}`}
                  className="h-24 w-38 rounded-xl object-cover ring-1 ring-black/10"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {/* ====== Deskripsi: dari feedback */}
          <div className="mt-4 rounded-xl border border-black/10 bg-white p-3">
            <p className="text-md text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {description || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorReviewModal;
