'use client';

import React from 'react';
import { RiCloseLine, RiCalendar2Line } from 'react-icons/ri';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import { getPackageColor } from '@/utils/getPackageColor';
import { getStatusColor } from '@/utils/getStatusColor';

export type TutorClassReportRow = {
  no: number | string;
  timestamp: string;
  progress: string;
};

type TutorClassReportModalProps = {
  open: boolean;
  onClose: () => void;

  tutorImage: string;
  tutorName: string;
  statusLabel?: string;
  programLabel?: string;
  instrumentLabel?: string;
  schedule?: string;
  sesiLabel?: string;

  loading?: boolean;
  error?: string | null;
  rows?: TutorClassReportRow[];
};

function toDDMMYYYYHHmm(input?: string | Date | null) {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(String(input));
  if (Number.isNaN(d.getTime())) return String(input);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

const TutorClassReportModal: React.FC<TutorClassReportModalProps> = ({
  open,
  onClose,
  tutorImage,
  tutorName,
  statusLabel = 'Aktif',
  programLabel = '—',
  instrumentLabel = '—',
  schedule = '—',
  sesiLabel = '—',
  loading = false,
  error = null,
  rows = [],
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-[101] max-w-[650px] rounded-3xl bg-white shadow-2xl border border-black/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <h3 className="text-xl font-semibold text-neutral-900">Laporan Kelas</h3>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5"
            aria-label="Close"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="px-6 pt-5 pb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={tutorImage}
                alt={tutorName}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-black/5"
              />
              <div className="flex flex-col">
                <div className="text-xl font-semibold text-neutral-900 leading-5">{tutorName}</div>
                <div className={`text-md font-medium capitalize ${getStatusColor(statusLabel)} mt-1`}>
                  {statusLabel}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-neutral-500">Sesi</span>
              <span className="text-sm font-semibold text-neutral-900">{sesiLabel}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-black/10">
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

            <div className="p-4">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-neutral-100 text-left text-md rounded-xl">
                    <th className="w-[60px] p-5 font-medium">No</th>
                    <th className="w-[190px] p-5 font-medium">Timestamp</th>
                    <th className="p-5 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-neutral-500">
                        Memuat…
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-neutral-500">
                        Tidak ada data.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={`row-${r.no}`} className="border-t border-black/5 text-md">
                        <td className="px-4 py-4">{r.no}</td>
                        <td className="px-4 py-4">{toDDMMYYYYHHmm(r.timestamp)}</td>
                        <td className="px-4 py-4">{r.progress}</td>
                      </tr>
                    ))
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

export default TutorClassReportModal;

