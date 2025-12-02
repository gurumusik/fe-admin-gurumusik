// src/features/dashboard/components/StudentReportModal.tsx
'use client';

import React from 'react';
import { RiCloseLine, RiStarFill, RiCalendar2Line } from 'react-icons/ri';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import { getPackageColor } from '@/utils/getPackageColor';
import { getStatusColor } from '@/utils/getStatusColor';

export type StudentReportRow = {
  no: number | string;
  nilai: string;      // contoh: "4.5/5" atau "−"
  date: string;       // ISO/yyy-mm-dd juga boleh (akan diformat dd/mm/yyyy)
  status: string;     // contoh: "Tampil" | "Tidak Tampil"
};

type StudentReportModalProps = {
  open: boolean;
  onClose: () => void;

  /** header kelas (guru & kelas) */
  teacherImage: string;
  teacherName: string;
  statusLabel?: string;      // status murid (mis. "Aktif"), boleh dikosongkan
  programLabel?: string;
  instrumentLabel?: string;
  schedule?: string;
  nilaiKelas?: string;       // opsional, kalau mau tampilkan ringkas rata-rata
  nilaiAsli?: string;        // opsional

  rows?: StudentReportRow[];
  loading?: boolean;         // ⬅️ NEW: tampilkan “Memuat data…”

  onReview?: (row: StudentReportRow) => void;
};

/** Format ke dd/mm/yyyy dari berbagai input aman (ISO, Date, dst). */
function toDDMMYYYY(input?: string | Date | null) {
  if (!input) return '—';
  const s = String(input).trim();
  if (!s || s === '—') return '—';
  // Sudah dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  // Ambil bagian tanggal ISO (YYYY-MM-DD) jika ada waktu di belakang
  const first10 = s.slice(0, 10);

  // ISO murni
  if (/^\d{4}-\d{2}-\d{2}$/.test(first10)) {
    const [y, m, d] = first10.split('-');
    return `${d}/${m}/${y}`;
  }

  // Coba parse Date biasa sebagai fallback
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s; // kalau gagal parse, tampilkan apa adanya

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

const StudentReportModal: React.FC<StudentReportModalProps> = ({
  open,
  onClose,
  teacherImage,
  teacherName,
  statusLabel = 'Aktif',
  programLabel = 'ABK',
  instrumentLabel = 'Piano',
  schedule = 'Setiap Kamis | 14.00 - 14.45',
  nilaiAsli = '4.5/5',
  rows = [],
  loading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-[101] max-w-[650px] rounded-3xl bg-white shadow-2xl border border-black/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <h3 className="text-xl font-semibold text-neutral-900">Riwayat Penilaian</h3>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5"
            aria-label="Close"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="px-6 pt-5 pb-6">
          {/* Header guru & ringkasan nilai */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={teacherImage}
                alt={teacherName}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-black/5"
              />
              <div className="flex flex-col">
                <div className="text-xl font-semibold text-neutral-900 leading-5">{teacherName}</div>
                {!!statusLabel && (
                  <div className={`text-md font-medium capitalize ${getStatusColor(statusLabel)} mt-1`}>
                    {statusLabel}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col rounded-xl bg-[#FFF3E1] px-4 py-3 text-md font-semibold text-neutral-900 inline-flex items-center gap-2">
                <span className="opacity-80">Nilai Asli</span>
                <span className="inline-flex items-center gap-1">
                  <RiStarFill className="text-[var(--primary-color)]" />
                  {nilaiAsli}
                </span>
              </div>
            </div>
          </div>

          {/* Ringkas program / alat musik / jadwal */}
          <div className="mt-5 rounded-2xl border border-black/10 overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-md text-neutral-500">Program</span>
                  <div className="mt-2 text-center">
                    <span
                      className={`inline-flex items-center rounded-lg text-xs font-semibold px-2.5 py-1 ${getPackageColor(
                        programLabel,
                        'solid'
                      )}`}
                    >
                      {programLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-md text-neutral-500">Alat Musik</span>
                  <div className="mt-2 inline-flex items-center gap-2 text-neutral-900">
                    <img
                      src={getInstrumentIcon((instrumentLabel || '').toLowerCase())}
                      alt={instrumentLabel}
                      className="h-5 w-5"
                    />
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

            {/* Tabel riwayat penilaian */}
            <div className="p-4">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-neutral-100 text-left text-md rounded-xl">
                    <th className="w-[60px] p-5 font-medium">No</th>
                    <th className="p-5 font-medium">Nilai</th>
                    <th className="p-5 font-medium">Tanggal</th>
                    <th className="p-5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-neutral-500">Memuat data…</td>
                    </tr>
                  )}

                  {!loading && rows.map((r) => (
                    <tr key={`row-${r.no}`} className="border-t border-black/5 text-md">
                      <td className="px-4 py-4">{r.no}</td>
                      <td className="px-4 py-4 inline-flex items-center gap-2">
                        <RiStarFill className="text-[var(--primary-color)]" />
                        {r.nilai}
                      </td>
                      <td className="px-4 py-4">{toDDMMYYYY(r.date)}</td>
                      <td className="px-4 py-4">
                        <span className={`font-semibold capitalize ${getStatusColor(r.status)} `}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-neutral-500">
                        Tidak ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* /ringkas */}
        </div>
      </div>
    </div>
  );
};

export default StudentReportModal;
