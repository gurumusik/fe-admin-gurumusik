// src/components/ui/common/TeacherVacationModal.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RiQuestionFill, RiCalendar2Line, RiArrowDownSLine } from 'react-icons/ri';

export type TeacherVacationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { startDate: string; endDate: string }) => void;
  /** optional default values (YYYY-MM-DD) */
  defaultStartDate?: string;
  defaultEndDate?: string;
  widthClass?: string; // e.g. "max-w-lg"
};

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

const TeacherVacationModal: React.FC<TeacherVacationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultStartDate = '',
  defaultEndDate = '',
  widthClass = 'max-w-lg',
}) => {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // reset values every time opened
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setTouched(false);

    const t = setTimeout(() => confirmRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const minEnd = useMemo(() => (startDate ? startDate : undefined), [startDate]);

  const validation = useMemo(() => {
    if (!startDate || !endDate) return { ok: false, msg: 'Pilih tanggal awal & akhir cuti.' };
    if (endDate < startDate) return { ok: false, msg: 'Tanggal akhir harus setelah tanggal awal.' };
    return { ok: true, msg: '' };
  }, [startDate, endDate]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cls('w-full rounded-2xl bg-white shadow-2xl border border-neutral-200', widthClass)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Close icon optional – sengaja tidak ditampilkan seperti di desain */}

          {/* Icon big ring */}
          <div className="mx-auto grid place-items-center w-14 h-14 rounded-full ring-[14px] ring-yellow-100">
            <RiQuestionFill className="w-[130%] h-[130%] -m-[10%] text-[var(--primary-color)]" />
          </div>

          {/* Title */}
          <h3 className="text-center text-lg font-semibold text-neutral-900 mt-6">
            Yakin…Mau Mencutikan Guru?
          </h3>

          {/* Description */}
          <p className="text-center text-md text-neutral-700 mt-2">
            Selama periode cuti, guru tidak akan muncul di landing page dan tidak bisa dipesan murid.
            Setelah periode cuti berakhir, guru otomatis aktif kembali.
          </p>

          <div className="my-4 h-px bg-neutral-200" />

          {/* Subtitle */}
          <p className="text-center text-md font-semibold text-neutral-900 mb-3">
            Tentukan Periode Cuti
          </p>

          {/* Fields */}
          <div className="space-y-4">
            {/* Start */}
            <div>
              <div className="text-sm text-neutral-500 mb-1">Dari</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <RiCalendar2Line />
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setTouched(true);
                    if (endDate && e.target.value && endDate < e.target.value) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="w-full h-11 pl-10 pr-9 rounded-xl border border-neutral-300 focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  placeholder="Pilih Tanggal Awal Cuti"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <RiArrowDownSLine />
                </span>
              </div>
            </div>

            {/* End */}
            <div>
              <div className="text-sm text-neutral-500 mb-1">Ke</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <RiCalendar2Line />
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setTouched(true);
                  }}
                  min={minEnd}
                  className="w-full h-11 pl-10 pr-9 rounded-xl border border-neutral-300 focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  placeholder="Pilih Tanggal Akhir Cuti"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <RiArrowDownSLine />
                </span>
              </div>
            </div>

            {/* Error */}
            {!validation.ok && touched && (
              <p className="text-sm text-[var(--accent-red-color)]">{validation.msg}</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full font-semibold py-3 border border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-blue-50"
            >
              Ga Jadi Deh
            </button>
            <button
              type="button"
              ref={confirmRef}
              onClick={() => onConfirm({ startDate, endDate })}
              disabled={!validation.ok}
              className={cls(
                'w-full rounded-full font-semibold py-3 bg-[var(--primary-color)] hover:bg-yellow-500 text-neutral-900 transition disabled:opacity-60 disabled:cursor-not-allowed'
              )}
            >
              Ya, Saya Yakin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherVacationModal;
