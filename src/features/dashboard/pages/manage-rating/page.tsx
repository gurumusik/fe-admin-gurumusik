/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard-admin/tutor-list/ManageRatingPage.tsx
'use client';

import { useMemo, useState } from 'react';
import {
  RiStarFill,
  RiArrowRightUpLine,
  RiCalendar2Line,
  RiArrowDownSLine,
  RiBarChart2Fill,
  RiSearchLine,
} from 'react-icons/ri';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import ProgramAvatarBadge from '@/components/ui/badge/ProgramAvatarBadge';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';

export default function ManageRatingPage() {
  // ——— sama persis seperti di ClassListTutorPage ———
  const performance = [
    {
      key: 'nilaiKelas',
      title: 'Nilai Kelas',
      value: (
        <span className="inline-flex items-center gap-2">
          <RiStarFill className="text-[var(--primary-color)]" />
          <span className="font-semibold">4.5/5</span>
        </span>
      ),
      delta: '+25% dari bulan lalu',
      bg: 'bg-[#E9F7F0]',
      badgeBg: 'bg-[#F7FBEA]',
    },
    {
      key: 'nilaiAsli',
      title: 'Nilai Asli',
      value: (
        <span className="inline-flex items-center gap-2">
          <RiStarFill className="text-[var(--primary-color)]" />
          <span className="font-semibold">4.0/5</span>
        </span>
      ),
      delta: '+25% dari bulan lalu',
      bg: 'bg-[#FFF3E1]',
      badgeBg: 'bg-[#FFF9E8]',
    },
    {
      key: 'kedisiplinan',
      title: 'Kedisiplinan',
      value: <span className="font-semibold">100%</span>,
      delta: '+25% dari bulan lalu',
      bg: 'bg-[#FFE9EA]',
      badgeBg: 'bg-[#FFF2F3]',
    },
    {
      key: 'komunikasi',
      title: 'Komunikasi',
      value: <span className="font-semibold">90%</span>,
      delta: '+25% dari bulan lalu',
      bg: 'bg-[#EEE9FF]',
      badgeBg: 'bg-[#F5F1FF]',
    },
    {
      key: 'caraMengajar',
      title: 'Cara Mengajar',
      value: <span className="font-semibold">80.7%</span>,
      delta: '+25% dari bulan lalu',
      bg: 'bg-[#E7F2FF]',
      badgeBg: 'bg-[#EFF7FF]',
    },
  ];

  // ——— dummy data untuk grafik (label sesuai contoh) ———
  const scoreSeries = [
    { label: 'Mei 28', kelas: 2.2, asli: 1.5 },
    { label: 'Mei 29', kelas: 3.2, asli: 2.1 },
    { label: 'Mei 30', kelas: 3.8, asli: 2.8 },
    { label: 'Juni 1', kelas: 3.9, asli: 2.9 },
    { label: 'Juni 2', kelas: 3.5, asli: 2.6 },
    { label: 'Juni 3', kelas: 4.6, asli: 3.7 },
  ];

  // ——— dummy data Riwayat Nilai (sesuai tampilan) ———
  type HistoryRow = {
    id: string;
    avatar: string; // url atau path
    program: string;
    name: string;
    instrument: string;
    date: string; // dd/mm/yyyy
    scoreText: string; // "4,00/5" (sesuai desain koma)
    scoreValue: number; // angka untuk filter
    visible: boolean; // tampil / tidak tampil
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const historyRows: HistoryRow[] = [
    {
      id: 'r-1',
      avatar: '/assets/images/student.png',
      program: 'Internasional',
      name: 'Isabella Fernández',
      instrument: 'Piano',
      date: '01/08/2025',
      scoreText: '4,00/5',
      scoreValue: 4.0,
      visible: true,
    },
    {
      id: 'r-2',
      avatar: '/assets/images/student.png',
      program: 'Reguler',
      name: 'Isabella Fernández',
      instrument: 'Piano',
      date: '01/08/2025',
      scoreText: '4,75/5',
      scoreValue: 4.75,
      visible: false,
    },
    {
      id: 'r-3',
      avatar: '/assets/images/student.png',
      program: 'Hobby',
      name: 'Isabella Fernández',
      instrument: 'Piano',
      date: '01/08/2025',
      scoreText: '4,75/5',
      scoreValue: 4.75,
      visible: true,
    },
    {
      id: 'r-4',
      avatar: '/assets/images/student.png',
      program: 'ABK',
      name: 'Isabella Fernández',
      instrument: 'Piano',
      date: '01/08/2025',
      scoreText: '4,75/5',
      scoreValue: 4.75,
      visible: false,
    },
    {
      id: 'r-5',
      avatar: '/assets/images/student.png',
      program: 'Intern',
      name: 'Isabella Fernández',
      instrument: 'Piano',
      date: '01/08/2025',
      scoreText: '4,75/5',
      scoreValue: 4.75,
      visible: true,
    },
  ];

  // ——— state filter & search ———
  const [query, setQuery] = useState('');
  const [below4, setBelow4] = useState(false);

  const filteredRows = useMemo(() => {
    return historyRows.filter((r) => {
      const matchName = r.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchScore = below4 ? r.scoreValue < 4 : true;
      return matchName && matchScore;
    });
  }, [historyRows, query, below4]);

  return (
    <div className="w-full">
      {/* ===== Performa Mengajar ===== */}
      <section className="rounded-2xl bg-white p-4 md:p-6 mb-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-[var(--primary-color)] text-white w-9 h-9">
            <RiStarFill size={20} />
          </span>
          <h2 className="text-lg font-semibold text-neutral-900">Performa Mengajar</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {performance.map((m) => (
            <div
              key={m.key}
              className={`rounded-2xl ${m.bg} p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]`}
            >
              <div className="text-md text-neutral-900 mb-2">{m.title}</div>
              <div className="text-2xl text-neutral-900">{m.value}</div>
              <div className="mt-1 inline-flex items-center text-[var(--accent-green-color)]">
                <RiArrowRightUpLine size={20} />
                <span className="text-md">{m.delta}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Performa Nilai ===== */}
      <section className="rounded-2xl bg-white p-4 md:p-6 mb-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full bg-[var(--accent-green-color)] text-white w-9 h-9">
              <RiBarChart2Fill size={20} />
            </span>
            <h2 className="text-lg font-semibold text-neutral-900">Performa Nilai</h2>
          </div>

        {/* Date range (static demo) */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50"
          >
            <RiCalendar2Line className="text-(--secondary-color)" />
            Jan 2025 – Agu 2025
            <RiArrowDownSLine className="text-neutral-500" />
          </button>
        </div>

        {/* Chart */}
        <div className="rounded-2xl bg-neutral-50 p-4 md:p-5">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreSeries} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="gradKelas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.06} />
                  </linearGradient>
                  <linearGradient id="gradAsli" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.06} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 6" stroke="#D6D3D1" />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} tickMargin={10} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                  formatter={(val: any, name: any) => [val, name]}
                />
                <Area
                  type="monotone"
                  dataKey="kelas"
                  name="Nilai Kelas"
                  stroke="#10B981"
                  strokeWidth={3}
                  fill="url(#gradKelas)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="asli"
                  name="Nilai Asli"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fill="url(#gradAsli)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-8">
            <div className="inline-flex items-center gap-2 text-sm text-neutral-700">
              <span className="inline-block h-4 w-4" style={{ background: '#10B981' }} />
              Nilai Kelas
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-neutral-700">
              <span className="inline-block h-4 w-4" style={{ background: '#F59E0B' }} />
              Nilai Asli
            </div>
          </div>
        </div>
      </section>

      {/* ===== Riwayat Nilai ===== */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        {/* Header + controls */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Riwayat Nilai</h2>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative w-[min(460px,90vw)]">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari Murid: cth: Isabella Fernández"
                className="w-full rounded-full border border-black/10 bg-white pl-9 pr-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-(--secondary-light-color)"
              />
            </div>

            {/* Checkbox filter */}
            <label className="inline-flex items-center gap-2 text-sm text-neutral-900 select-none">
              <input
                type="checkbox"
                checked={below4}
                onChange={(e) => setBelow4(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-(--secondary-color) focus:ring-(--secondary-color)"
              />
              Nilai di bawah 4
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md">
                <th className="w-[110px] p-5 font-medium">Profile</th>
                <th className="p-5 font-medium">Nama Siswa</th>
                <th className="p-5 font-medium">Tanggal</th>
                <th className="p-5 font-medium">Nilai</th>
                <th className="p-5 font-medium">Status</th>
                <th className="p-5 font-medium">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    Tidak ada data yang cocok.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={idx === 0 ? 'text-md' : 'border-t border-black/5 text-md'}
                  >
                    {/* Profile */}
                    <td className="px-4 py-4">
                      <ProgramAvatarBadge src={r.avatar} alt={r.name} pkg={r.program} size={55} />
                    </td>

                    {/* Nama + instrument */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900">{r.name}</span>
                        <div className="mt-1 inline-flex items-center gap-2">
                          <img
                            src={getInstrumentIcon((r.instrument || '').toLowerCase())}
                            alt={r.instrument}
                            className="h-5 w-5"
                          />
                          <span className="text-md text-neutral-700">{r.instrument}</span>
                        </div>
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td className="px-4 py-4 text-neutral-800">{r.date}</td>

                    {/* Nilai */}
                    <td className="px-4 py-4 text-neutral-800">{r.scoreText}</td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {r.visible ? (
                        <span className="text-[var(--accent-green-color)] font-semibold">Tampil</span>
                      ) : (
                        <span className="text-[var(--accent-red-color)] font-semibold leading-4 block">
                          Tidak Tampil
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        className="inline-block rounded-full border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                      >
                        Lihat Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
