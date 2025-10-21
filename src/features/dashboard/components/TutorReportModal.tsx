'use client';

import React from 'react';
import { RiCloseLine, RiStarFill, RiCalendar2Line } from 'react-icons/ri';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import { getPackageColor } from '@/utils/getPackageColor';

export type TutorReportRow = {
  no: number | string;
  nilai: string;
  date: string;
  status: string;
};

type TutorReportModalProps = {
  open: boolean;
  onClose: () => void;

  tutorImage: string;
  tutorName: string;
  statusLabel?: string;
  programLabel?: string;
  instrumentLabel?: string;
  schedule?: string;
  nilaiKelas?: string;
  nilaiAsli?: string;

  rows?: TutorReportRow[];

  // <-- callback untuk membuka TutorReviewModal
  onReview?: (row: TutorReportRow) => void;
};

const TutorReportModal: React.FC<TutorReportModalProps> = ({
  open,
  onClose,
  tutorImage,
  tutorName,
  statusLabel = 'Aktif',
  programLabel = 'ABK',
  instrumentLabel = 'Piano',
  schedule = 'Setiap Kamis | 14.00 - 14.45',
  nilaiKelas = '4.5/5',
  nilaiAsli = '4.5/5',
  rows = [
    { no: 1, nilai: '4.5/5', date: '04/08/2025', status: 'Tampil' },
    { no: 2, nilai: '4.5/5', date: '04/08/2025', status: 'Tampil' },
  ],
  onReview, // ✅ benar (bukan nReview)
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-[101] max-w-[650px] rounded-3xl bg-white shadow-2xl border border-black/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <h3 className="text-xl font-semibold text-neutral-900">Riwayat Penilaian</h3>
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5" aria-label="Close">
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="px-6 pt-5 pb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={tutorImage} alt={tutorName} className="h-16 w-16 rounded-full object-cover ring-2 ring-black/5" />
              <div className="flex flex-col">
                <div className="text-xl font-semibold text-neutral-900 leading-5">{tutorName}</div>
                <div className="text-md font-medium text-(--accent-green-color) mt-1">{statusLabel}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col rounded-xl bg-[#EAF8F1] px-4 py-3 text-md font-semibold text-neutral-900 inline-flex items-center gap-2">
                <span className="opacity-80">Nilai Kelas</span>
                <span className="inline-flex items-center gap-1">
                  <RiStarFill className="text-[var(--primary-color)]" />
                  {nilaiKelas}
                </span>
              </div>
              <div className="flex flex-col rounded-xl bg-[#FFF3E1] px-4 py-3 text-md font-semibold text-neutral-900 inline-flex items-center gap-2">
                <span className="opacity-80">Nilai Asli</span>
                <span className="inline-flex items-center gap-1">
                  <RiStarFill className="text-[var(--primary-color)]" />
                  {nilaiAsli}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-black/10 overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-md text-neutral-500">Program</span>
                  <div className="mt-2 text-center">
                    <span className={`inline-flex items-center rounded-lg text-xs font-semibold px-2.5 py-1 ${getPackageColor(programLabel, 'solid')}`}>
                      {programLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-md text-neutral-500">Alat Musik</span>
                  <div className="mt-2 inline-flex items-center gap-2 text-neutral-900">
                    <img src={getInstrumentIcon((instrumentLabel || '').toLowerCase())} alt={instrumentLabel} className="h-5 w-5" />
                    <span className="font-medium">{instrumentLabel}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-md text-neutral-500">Jadwal</span>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <RiCalendar2Line className="text-(--secondary-color)" />
                    <span className="font-medium text-(--secondary-color)">{schedule}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-neutral-100 text-left text-md rounded-xl">
                    <th className="w-[60px] p-5 font-medium">No</th>
                    <th className="p-5 font-medium">Nilai</th>
                    <th className="p-5 font-medium">Tanggal</th>
                    <th className="p-5 font-medium">Status</th>
                    <th className="w-[120px] p-5 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`row-${r.no}`} className="border-t border-black/5 text-md">
                      <td className="px-4 py-4">{r.no}</td>
                      <td className="px-4 py-4 inline-flex items-center gap-2">
                        <RiStarFill className="text-[var(--primary-color)]" />
                        {r.nilai}
                      </td>
                      <td className="px-4 py-4">{r.date}</td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-(--accent-green-color)">{r.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => onReview?.(r)}   // ✅ panggil callback
                          className="rounded-full border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-neutral-500">
                        Tidak ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorReportModal;
