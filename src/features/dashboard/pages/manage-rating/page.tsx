/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard-admin/tutor-list/ManageRatingPage.tsx
'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  RiStarFill,
  RiArrowRightUpLine,
  RiArrowRightDownLine,
  RiCalendar2Line,
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
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';

import {
  fetchPerformaMengajarGlobalThunk,
  fetchPerformaNilaiGlobalDailyThunk,
  selectPerformaMengajarGlobal,
  selectPerformaNilaiGlobalDaily,

  // List ratings
  fetchRatingsListThunk,
  selectRatingsList,
} from '@/features/slices/rating/slice';

import type { PerformaCard, RatingHistoryRow } from '@/features/slices/rating/types';

import ProgramAvatarBadge from '@/components/ui/badge/ProgramAvatarBadge';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

/** helper: local date -> "YYYY-MM-DD" (tanpa zona waktu UTC shift) */
const toLocalISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

/** parse "YYYY-MM-DD" → Date (local) */
const parseISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** label: "dd Okt" (Indo) dari "YYYY-MM-DD" */
const fmtDD_Spc_MMM_ID = (iso: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [, m, d] = iso.split('-');
  const mon = months[(Number(m) || 1) - 1] ?? m;
  return `${Number(d)} ${mon}`;
};

/** beda hari inklusif (21→27 = 7) */
const dayDiffInclusive = (startISO: string, endISO: string) => {
  const a = parseISO(startISO);
  const b = parseISO(endISO);
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / 86400000) + 1;
};

// ====== Page size tabel riwayat
const PAGE_SIZE = 5;

type RowWithIcon = RatingHistoryRow & { instrumentIcon?: string | null };

export default function ManageRatingPage() {
  const dispatch = useDispatch<AppDispatch>();

  // ====== GLOBAL SUMMARY (cards) ======
  const {
    data: globalPerf,
    status: globalStatus,
    error: globalError,
  } = useSelector((s: RootState) => selectPerformaMengajarGlobal(s as any));

  // ====== GLOBAL DAILY (timeseries chart) ======
  const {
    data: dailyPerf,
    status: dailyStatus,
    error: dailyError,
  } = useSelector((s: RootState) => selectPerformaNilaiGlobalDaily(s as any));

  // ====== LIST RATINGS (untuk tabel riwayat) ======
  const {
    data: listData,
    status: listStatus,
    error: listError,
  } = useSelector((s: RootState) => selectRatingsList(s as any));

  // ====== Range state (default 7 hari terakhir) ======
  const todayISO = useMemo(() => toLocalISODate(new Date()), []);
  const defaultStartISO = useMemo(() => {
    const t = new Date();
    const s = new Date(t);
    s.setDate(t.getDate() - 6);
    return toLocalISODate(s);
  }, []);

  const [selectedStart, setSelectedStart] = useState<string>(defaultStartISO);
  const [selectedEnd, setSelectedEnd] = useState<string>(todayISO);

  // Popover picker state
  const [showPicker, setShowPicker] = useState(false);
  const [tempStart, setTempStart] = useState<string>(defaultStartISO);
  const [tempEnd, setTempEnd] = useState<string>(todayISO);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Tutup popover jika klik di luar
  useEffect(() => {
    if (!showPicker) return;
    const onClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
        setRangeError(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showPicker]);

  // Fetch data saat mount — default 7 hari
  useEffect(() => {
    if (globalStatus === 'idle') {
      dispatch(fetchPerformaMengajarGlobalThunk(undefined));
    }
    if (dailyStatus === 'idle') {
      dispatch(
        fetchPerformaNilaiGlobalDailyThunk({
          start: selectedStart,
          end: selectedEnd,
        })
      );
    }
    // list ratings
    if (listStatus === 'idle') {
      dispatch(fetchRatingsListThunk({}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, globalStatus, dailyStatus, listStatus]);

  // Kalau user ganti selected range, refetch chart harian (tidak mempengaruhi list ratings)
  useEffect(() => {
    if (!selectedStart || !selectedEnd) return;
    dispatch(fetchPerformaNilaiGlobalDailyThunk({ start: selectedStart, end: selectedEnd }));
  }, [dispatch, selectedStart, selectedEnd]);

  const toDeltaText = (pct: number | null | undefined) =>
    pct == null ? '—' : `${pct > 0 ? '+' : ''}${pct}% dari bulan lalu`;

  const rangeLabel = useMemo(() => {
    if (!selectedStart || !selectedEnd) return '7 hari terakhir';
    if (selectedStart === selectedEnd) return fmtDD_Spc_MMM_ID(selectedStart);
    return `${fmtDD_Spc_MMM_ID(selectedStart)} – ${fmtDD_Spc_MMM_ID(selectedEnd)}`;
  }, [selectedStart, selectedEnd]);

  // ====== Build kartu dari API global ======
  const performance = useMemo(() => {
    // Nilai Kelas = fake rating
    const fakeRating = globalPerf?.average_rating?.fake_rating ?? null;
    const fakeDelta = globalPerf?.average_rating?.delta_percent_fake ?? null;

    const realRating = globalPerf?.average_rating?.real_rating ?? null;
    const realDelta = globalPerf?.average_rating?.delta_percent_real ?? null;

    const cat = (code: string): PerformaCard | undefined =>
      globalPerf?.categories?.find((c) => c.code === code);

    const discipline = cat('DISCIPLINE');
    const communication = cat('COMMUNICATION');
    const teaching = cat('TEACHING');

    const fakeIsDown = (fakeDelta ?? 0) < 0;
    const FakeTrendIcon = fakeIsDown ? RiArrowRightDownLine : RiArrowRightUpLine;
    const fakeTrendColor = fakeIsDown
      ? 'text-(--accent-red-color)'
      : 'text-(--accent-green-color)';

    return [
      {
        key: 'nilaiKelas',
        title: 'Nilai Kelas',
        value: (
          <span className="inline-flex items-center gap-2">
            <RiStarFill className="text-[var(--primary-color)]" />
            <span className="font-semibold">
              {fakeRating == null ? '—' : `${fakeRating.toFixed(1)}/5`}
            </span>
          </span>
        ),
        deltaNode: (
          <span className={`inline-flex items-center ${fakeTrendColor}`}>
            <FakeTrendIcon size={20} />
            <span className="text-md">{toDeltaText(fakeDelta)}</span>
          </span>
        ),
        bg: 'bg-[#E9F7F0]',
      },
      {
        key: 'nilaiAsli',
        title: 'Nilai Asli',
        value: (
          <span className="inline-flex items-center gap-2">
            <RiStarFill className="text-[var(--primary-color)]" />
            <span className="font-semibold">
              {realRating == null ? '—' : `${realRating.toFixed(1)}/5`}
            </span>
          </span>
        ),
        deltaNode: (
          <span
            className={`inline-flex items-center ${
              (realDelta ?? 0) < 0 ? 'text-(--accent-red-color)' : 'text-(--accent-green-color)'
            }`}
          >
            {(realDelta ?? 0) < 0 ? (
              <RiArrowRightDownLine size={20} />
            ) : (
              <RiArrowRightUpLine size={20} />
            )}
            <span className="text-md">{toDeltaText(realDelta)}</span>
          </span>
        ),
        bg: 'bg-[#FFF3E1]',
      },
      {
        key: 'kedisiplinan',
        title: 'Kedisiplinan',
        value: (
          <span className="font-semibold">
            {discipline?.this_month_percent == null
              ? '—'
              : `${discipline.this_month_percent}%`}
          </span>
        ),
        deltaNode: (
          <span
            className={`inline-flex items-center ${
              (discipline?.delta_percent ?? 0) < 0
                ? 'text-(--accent-red-color)'
                : 'text-(--accent-green-color)'
            }`}
          >
            {(discipline?.delta_percent ?? 0) < 0 ? (
              <RiArrowRightDownLine size={20} />
            ) : (
              <RiArrowRightUpLine size={20} />
            )}
            <span className="text-md">{discipline?.delta_label ?? '—'}</span>
          </span>
        ),
        bg: 'bg-[#FFE9EA]',
      },
      {
        key: 'komunikasi',
        title: 'Komunikasi',
        value: (
          <span className="font-semibold">
            {communication?.this_month_percent == null
              ? '—'
              : `${communication.this_month_percent}%`}
          </span>
        ),
        deltaNode: (
          <span
            className={`inline-flex items-center ${
              (communication?.delta_percent ?? 0) < 0
                ? 'text-(--accent-red-color)'
                : 'text-(--accent-green-color)'
            }`}
          >
            {(communication?.delta_percent ?? 0) < 0 ? (
              <RiArrowRightDownLine size={20} />
            ) : (
              <RiArrowRightUpLine size={20} />
            )}
            <span className="text-md">{communication?.delta_label ?? '—'}</span>
          </span>
        ),
        bg: 'bg-[#EEE9FF]',
      },
      {
        key: 'caraMengajar',
        title: 'Cara Mengajar',
        value: (
          <span className="font-semibold">
            {teaching?.this_month_percent == null
              ? '—'
              : `${teaching.this_month_percent}%`}
          </span>
        ),
        deltaNode: (
          <span
            className={`inline-flex items-center ${
              (teaching?.delta_percent ?? 0) < 0
                ? 'text-(--accent-red-color)'
                : 'text-(--accent-green-color)'
            }`}
          >
            {(teaching?.delta_percent ?? 0) < 0 ? (
              <RiArrowRightDownLine size={20} />
            ) : (
              <RiArrowRightUpLine size={20} />
            )}
            <span className="text-md">{teaching?.delta_label ?? '—'}</span>
          </span>
        ),
        bg: 'bg-[#E7F2FF]',
      },
    ] as const;
  }, [globalPerf]);

  // ====== Bentuk data chart (maksimal 7 hari) ======
  const scoreSeries = useMemo(() => {
    const arr = (dailyPerf?.days ?? []).slice(-7); // force max 7 data point
    return arr.map((p) => ({
      label: fmtDD_Spc_MMM_ID(p.day), // "27 Okt"
      kelas: p.avg_fake == null ? null : Number(p.avg_fake.toFixed(2)), // Nilai Kelas (fake)
      asli: p.avg_real == null ? null : Number(p.avg_real.toFixed(2)),  // Nilai Asli (real)
      count: p.count,
    }));
  }, [dailyPerf]);

  // ====== Riwayat (data dari endpoint) + filter lokal ======
  const [query, setQuery] = useState('');
  const [below4, setBelow4] = useState(false);

  // Map payload API → bentuk row tabel existing + icon backend
  const apiRows = useMemo<Array<RowWithIcon>>(() => {
    return (listData ?? []).map((i: any) => {
      const iconUrl = resolveImageUrl(i?.instrument?.icon ?? null);

      return {
        id: String(i.id),

        // avatar murid (fallback ke default)
        avatar: i?.student?.avatar_url ?? '/assets/images/student.png',

        // program & instrument dari backend
        program: i?.program?.nama_program ?? '-',              // ProgramAvatarBadge (pkg)
        name: i?.student?.nama ?? '(Tanpa Nama)',
        instrument: i?.instrument?.nama_instrumen ?? '-',      // label instrument
        instrumentIcon: iconUrl,                               // URL icon backend (sudah di-resolve)

        date: i?.date_display ?? '-',                          // dd/mm/yyyy dari backend
        scoreText: i?.rate_text ?? '-',
        scoreValue: typeof i?.rate === 'number' ? i.rate : Number(i?.rate ?? 0),
        visible: !!i?.is_show,
      };
    });
  }, [listData]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = apiRows;
    const byName = q ? base.filter((r) => r.name.toLowerCase().includes(q)) : base;
    const byScore = below4 ? byName.filter((r) => (r.scoreValue ?? 0) < 4) : byName;
    return byScore;
  }, [apiRows, query, below4]);

  // ====== Paginasi (5 item/halaman) ======
  const [page, setPage] = useState(1);

  // Reset page saat filter berubah
  useEffect(() => {
    setPage(1);
  }, [query, below4]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const pagedRows = useMemo(() => {
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, startIndex]);

  const from = totalItems === 0 ? 0 : startIndex + 1;
  const to = Math.min(totalItems, startIndex + PAGE_SIZE);

  // ====== Handlers popover ======
  const openPicker = () => {
    setTempStart(selectedStart);
    setTempEnd(selectedEnd);
    setRangeError(null);
    setShowPicker(true);
  };

  const onChangeStart = (v: string) => {
    setTempStart(v);
    setRangeError(null);
  };
  const onChangeEnd = (v: string) => {
    setTempEnd(v);
    setRangeError(null);
  };

  const validateRange = (s: string, e: string) => {
    if (!s || !e) return 'Tanggal belum lengkap.';
    if (parseISO(s) > parseISO(e)) return 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.';
    const len = dayDiffInclusive(s, e);
    if (len > 7) return 'Rentang maksimal 7 hari.';
    if (len < 1) return 'Rentang tidak valid.';
    return null;
  };

  const applyRange = () => {
    const err = validateRange(tempStart, tempEnd);
    if (err) {
      setRangeError(err);
      return;
    }
    setSelectedStart(tempStart);
    setSelectedEnd(tempEnd);
    setShowPicker(false);
  };

  const cancelRange = () => {
    setShowPicker(false);
    setRangeError(null);
  };

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

        {/* STATE info */}
        {globalStatus === 'loading' && (
          <div className="text-sm text-neutral-500 mb-3">Memuat data global…</div>
        )}
        {globalStatus === 'failed' && (
          <div className="text-sm text-(--accent-red-color) mb-3">
            {globalError ?? 'Gagal memuat data.'}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {performance.map((m) => (
            <div
              key={m.key}
              className={`rounded-2xl ${m.bg} p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]`}
            >
              <div className="text-md text-neutral-900 mb-2">{m.title}</div>
              <div className="text-2xl text-neutral-900">{m.value}</div>
              <div className="mt-1 inline-flex items-center">{m.deltaNode}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Performa Nilai (hanya 7 hari) ===== */}
      <section className="rounded-2xl bg-white p-4 md:p-6 mb-4 relative">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full bg-[var(--accent-green-color)] text-white w-9 h-9">
              <RiBarChart2Fill size={20} />
            </span>
            <h2 className="text-lg font-semibold text-neutral-900">Performa Nilai</h2>
          </div>

          {/* Rentang: klik untuk pilih tanggal (maks 7 hari) */}
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50"
          >
            <RiCalendar2Line className="text-(--secondary-color)" />
            <span>{rangeLabel}</span>
          </button>
        </div>

        {/* POPOVER Date Range */}
        {showPicker && (
          <>
            {/* overlay click-outside */}
            <div className="fixed inset-0 z-40" />
            <div
              ref={pickerRef}
              className="absolute right-4 top-16 z-50 w-[min(420px,90vw)] rounded-xl border border-black/10 bg-white p-4 shadow-xl"
            >
              <div className="mb-3 text-sm font-medium text-neutral-900">
                Pilih rentang tanggal (maks. 7 hari)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-600">Mulai</label>
                  <input
                    type="date"
                    value={tempStart}
                    max={todayISO}
                    onChange={(e) => onChangeStart(e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--secondary-light-color)"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-600">Sampai</label>
                  <input
                    type="date"
                    value={tempEnd}
                    max={todayISO}
                    onChange={(e) => onChangeEnd(e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--secondary-light-color)"
                  />
                </div>
              </div>

              {/* Error */}
              {rangeError && (
                <div className="mt-2 text-xs text-(--accent-red-color)">{rangeError}</div>
              )}

              {/* Hint durasi */}
              {!!tempStart && !!tempEnd && (
                <div className="mt-2 text-xs text-neutral-500">
                  Durasi: {Math.max(1, dayDiffInclusive(tempStart, tempEnd))} hari
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelRange}
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-sm hover:bg-neutral-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={applyRange}
                  className="rounded-lg bg-(--secondary-color) px-3 py-1.5 text-sm text-white hover:opacity-90"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </>
        )}

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
                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                  formatter={(val: any, name: any, p: any) => {
                    const cnt = p?.payload?.count ?? 0;
                    return [val ?? '—', `${name} (${cnt} rating)`];
                  }}
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
                  connectNulls
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
                  connectNulls
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

          {/* State kecil di bawah chart */}
          <div className="mt-2 text-xs text-neutral-500">
            {dailyStatus === 'loading' && 'Memuat data harian…'}
            {dailyStatus === 'failed' && (
              <span className="text-(--accent-red-color)">
                {dailyError ?? 'Gagal memuat data harian'}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ===== Riwayat Nilai (data dari endpoint) ===== */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        {/* Header + controls */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Riwayat Nilai</h2>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative w-[min(460px,90vw)]">
              <RiSearchLine
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                size={18}
              />
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
              {listStatus === 'loading' ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    Memuat data…
                  </td>
                </tr>
              ) : listStatus === 'failed' ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-(--accent-red-color)">
                    {listError ?? 'Gagal memuat daftar rating.'}
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    Tidak ada data yang cocok.
                  </td>
                </tr>
              ) : (
                pagedRows.map((r, idx) => (
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
                          {r.instrument && r.instrument !== '-' ? (
                            <>
                              <img
                                src={
                                  // pakai icon backend kalau ada, jika tidak fallback ke util local
                                  ((r as any).instrumentIcon as string | null) ??
                                  getInstrumentIcon((r.instrument || '').toLowerCase())
                                }
                                alt={r.instrument}
                                className="h-5 w-5"
                              />
                              <span className="text-md text-neutral-700">{r.instrument}</span>
                            </>
                          ) : (
                            <span className="text-md text-neutral-500">-</span>
                          )}
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

        {/* Pagination controls */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            Menampilkan {from}–{to} dari {totalItems} data
          </div>

          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-(--secondary-color) px-3 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color) disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>

            <span className="text-sm text-neutral-800">
              Hal {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalItems === 0}
              className="rounded-full border border-(--secondary-color) px-3 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color) disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
 