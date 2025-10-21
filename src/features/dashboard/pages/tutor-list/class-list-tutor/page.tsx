/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard-admin/tutor-list/ClassListTutorPage.tsx
'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  RiStarFill,
  RiArrowLeftLine,
  RiArrowRightUpLine,
  RiArrowRightDownLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/app/store';

// ⬇️ UPDATED: import selector dari slice guru
import { fetchGuruByIdThunk, selectGuruDetail } from '@/features/slices/guru/slice';
import { getStatusColor } from '@/utils/getStatusColor';

// performa admin (endpoint performa mengajar)
import {
  fetchPerformaMengajarAdminThunk,
  selectPerformaMengajarAdmin,
} from '@/features/slices/rating/slice';

// list kelas (redux)
import {
  fetchGuruClassesThunk,
  selectGuruClasses,
  setPage as setKelasPage,
  setLimit as setKelasLimit,
  setQuery as setKelasQuery,
  setSortBy as setKelasSortBy,
  setSortDir as setKelasSortDir,
} from '@/features/slices/guru/classes/classesSlice';

// UI utils
import ProgramAvatarBadge from '@/components/ui/badge/ProgramAvatarBadge';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';

// ————————————————————————
// Helpers UI
// ————————————————————————
const fmtStar = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) ? `${n.toFixed(1)}/5` : '–';

const fmtPct = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) ? `${n}%` : '–';

const trendColor = (t: 'naik' | 'turun' | 'tetap' | null | undefined) =>
  t === 'naik'
    ? 'text-[var(--accent-green-color)]'
    : t === 'turun'
    ? 'text-[var(--accent-red-color)]'
    : 'text-black/50';

const TrendIcon = ({ trend }: { trend: 'naik' | 'turun' | 'tetap' | null | undefined }) => {
  if (trend === 'turun') return <RiArrowRightDownLine size={20} />;
  if (trend === 'tetap') return <RiArrowRightSLine size={20} />;
  return <RiArrowRightUpLine size={20} />; // default 'naik' / null
};

const dayName = (d?: number | string | null) => {
  if (d == null) return '–';
  if (typeof d === 'string') return d;
  const map = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return map[d] ?? String(d);
};

const hhmm = (t?: string | null) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  return [h ?? '00', m ?? '00'].slice(0, 2).join('.'); // HH.mm
};

const timeRange = (start?: string | null, end?: string | null) =>
  start && end ? `${hhmm(start)} - ${hhmm(end)}` : '–';

const pageWindow = (total: number, current: number) => {
  const out: (number | '…')[] = [];
  const push = (x: number | '…') => {
    if (out[out.length - 1] !== x) out.push(x);
  };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '…') push('…');
  }
  return out;
};

type LocationState = { guruId?: number };

// ————————————————————————
// Component
// ————————————————————————
export default function ClassListTutorPage() {
  const { state } = useLocation() as { state?: LocationState };
  const dispatch = useDispatch<AppDispatch>();

  // Ambil guruId dari state → query (?guru_id / ?id)
  const search =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams('');
  const guruIdFromQuery = Number(search.get('guru_id')) || Number(search.get('id')) || undefined;
  const monthFromQuery = search.get('month') || undefined;

  const guruId = state?.guruId ?? guruIdFromQuery;

  // === Store: detail guru (UPDATED: pakai state.guru.detail via selector)
  const guruDetail = useSelector(selectGuruDetail);
  const guru = guruDetail.item;

  // === Store: performa admin (performa mengajar)
  const performa = useSelector(selectPerformaMengajarAdmin);

  // === Store: list kelas (per sesi)
  const kelas = useSelector(selectGuruClasses);

  // ====== Local filter state (dropdown) ======
  const [instrumentId, setInstrumentId] = useState<number | 'all'>('all');
  const [programId, setProgramId] = useState<number | 'all'>('all');

  // ===== bootstrap: set kontrol awal (tanpa fetch)
  useEffect(() => {
    if (!guruId) return;
    dispatch(fetchGuruByIdThunk(Number(guruId)));
    // Admin akan mengirim ?guru_id pada service; Guru tidak perlu (backend pakai req.user.id)
    dispatch(fetchPerformaMengajarAdminThunk({ guruId: Number(guruId), month: monthFromQuery }));
    dispatch(setKelasLimit(5));
    dispatch(setKelasSortBy('jadwal_mulai'));
    dispatch(setKelasSortDir('asc'));
    dispatch(setKelasPage(1));
  }, [dispatch, guruId, monthFromQuery]);

  // ===== fetch: sekali tiap kontrol berubah
  const lastKey = useRef<string>('');
  useEffect(() => {
    if (!guruId) return;
    const key = `${guruId}-${kelas.page}-${kelas.limit}-${kelas.q}-${kelas.sort_by}-${kelas.sort_dir}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    dispatch(
      fetchGuruClassesThunk({
        guruId: Number(guruId),
        page: kelas.page,
        limit: kelas.limit, // 5
        q: kelas.q,
        sort_by: kelas.sort_by,
        sort_dir: kelas.sort_dir,
      })
    );
  }, [dispatch, guruId, kelas.page, kelas.limit, kelas.q, kelas.sort_by, kelas.sort_dir]);

  // Cards performa — data dari endpoint performa mengajar
  const nilaiAsli = performa.data?.average_rating?.this_month ?? null;
  const nilaiAsliDelta = performa.data?.average_rating?.delta_label ?? '—';
  const nilaiAsliTrend = performa.data?.average_rating?.trend ?? null;

  const nilaiKelas = performa.data?.class_rating?.this_month ?? null;
  const nilaiKelasDelta = performa.data?.class_rating?.delta_label ?? '—';
  const nilaiKelasTrend = performa.data?.class_rating?.trend ?? null;

  const findCat = (code: string) => performa.data?.categories?.find((c) => c.code === code);

  const discipline = findCat('DISCIPLINE');
  const comm = findCat('COMMUNICATION');
  const teach = findCat('TEACHING');

  const cards = useMemo(() => {
    return [
      {
        key: 'nilaiKelas',
        title: 'Nilai Kelas',
        value: (
          <span className="inline-flex items-center gap-2">
            <RiStarFill className="text-[var(--primary-color)]" />
            <span className="font-semibold">{fmtStar(nilaiKelas)}</span>
          </span>
        ),
        delta: nilaiKelasDelta ?? '—',
        trend: nilaiKelasTrend as any,
        bg: 'bg-[#E9F7F0]',
      },
      {
        key: 'nilaiAsli',
        title: 'Nilai Asli',
        value: (
          <span className="inline-flex items-center gap-2">
            <RiStarFill className="text-[var(--primary-color)]" />
            <span className="font-semibold">{fmtStar(nilaiAsli)}</span>
          </span>
        ),
        delta: nilaiAsliDelta ?? '—',
        trend: nilaiAsliTrend as any,
        bg: 'bg-[#FFF3E1]',
      },
      {
        key: 'kedisiplinan',
        title: 'Kedisiplinan',
        value: <span className="font-semibold">{fmtPct(discipline?.this_month_percent)}</span>,
        delta:
          discipline?.delta_label ?? (discipline?.delta_percent == null ? '—' : `${discipline.delta_percent}%`),
        trend: (discipline?.trend as any) ?? null,
        bg: 'bg-[#FFE9EA]',
      },
      {
        key: 'komunikasi',
        title: 'Komunikasi',
        value: <span className="font-semibold">{fmtPct(comm?.this_month_percent)}</span>,
        delta: comm?.delta_label ?? (comm?.delta_percent == null ? '—' : `${comm?.delta_percent}%`),
        trend: (comm?.trend as any) ?? null,
        bg: 'bg-[#EEE9FF]',
      },
      {
        key: 'caraMengajar',
        title: 'Cara Mengajar',
        value: <span className="font-semibold">{fmtPct(teach?.this_month_percent)}</span>,
        delta: teach?.delta_label ?? (teach?.delta_percent == null ? '—' : `${teach?.delta_percent}%`),
        trend: (teach?.trend as any) ?? null,
        bg: 'bg-[#E7F2FF]',
      },
    ];
  }, [
    nilaiAsli,
    nilaiAsliDelta,
    nilaiAsliTrend,
    nilaiKelas,
    nilaiKelasDelta,
    nilaiKelasTrend,
    discipline?.this_month_percent,
    discipline?.delta_label,
    discipline?.delta_percent,
    discipline?.trend,
    comm?.this_month_percent,
    comm?.delta_label,
    comm?.delta_percent,
    comm?.trend,
    teach?.this_month_percent,
    teach?.delta_label,
    teach?.delta_percent,
    teach?.trend,
  ]);

  // Status (UPDATED: pakai guruDetail dari state.guru.detail)
  const headerLoading = guruDetail.status === 'loading';
  const headerError = guruDetail.status === 'failed' ? guruDetail.error : null;

  const perfLoading = performa.status === 'loading';
  const perfError = performa.status === 'failed' ? performa.error : null;

  const statusLabel = (guru as any)?.status_label ?? 'Aktif';

  // ===== Derived options untuk filter dropdown =====
  const { instrumentOptions, programOptions } = useMemo(() => {
    const iMap = new Map<number, string>();
    const pMap = new Map<number, string>();
    (kelas.items || []).forEach((r: any) => {
      const ins = r?.detail_program?.instrument;
      if (ins?.id != null) iMap.set(ins.id, ins.nama ?? '');
      const p = r?.program;
      if (p?.id != null) pMap.set(p.id, p.nama ?? '');
      // fallback lama
      if (!ins && r?.instrument?.id != null) iMap.set(r.instrument.id, r.instrument.nama ?? '');
    });
    return {
      instrumentOptions: Array.from(iMap.entries()).map(([id, nama]) => ({ id, nama })),
      programOptions: Array.from(pMap.entries()).map(([id, nama]) => ({ id, nama })),
    };
  }, [kelas.items]);

  // ===== Filtering FE (AND) =====
  const pageRows = useMemo(() => {
    let rows: any[] = kelas.items || [];
    if (instrumentId !== 'all') {
      rows = rows.filter((r) => {
        const idNew = r?.detail_program?.instrument?.id ?? null;
        const idOld = r?.instrument?.id ?? null;
        return (idNew ?? idOld) === instrumentId;
      });
    }
    if (programId !== 'all') rows = rows.filter((r) => (r?.program?.id ?? null) === programId);
    return rows;
  }, [kelas.items, instrumentId, programId]);

  // ===== Pagination footer =====
  const totalPages = useMemo(() => {
    const total = kelas.total || 0;
    const lim = Math.max(1, kelas.limit || 5);
    return Math.max(1, Math.ceil(total / lim));
  }, [kelas.total, kelas.limit]);
  const hasPrev = kelas.page > 1;
  const hasNext = kelas.page < totalPages;

  const goTo = useCallback(
    (p: number) => {
      const np = Math.min(Math.max(1, p), totalPages);
      dispatch(setKelasPage(np));
    },
    [dispatch, totalPages]
  );

  const prev = () => hasPrev && dispatch(setKelasPage(kelas.page - 1));
  const next = () => hasNext && dispatch(setKelasPage(kelas.page + 1));

  // ===== Handlers filter: update q untuk bantu server =====
  const onInstrumentChange = (val: string) => {
    const v = val === 'all' ? 'all' : Number(val);
    setInstrumentId(v as any);
    dispatch(setKelasPage(1));
    const insName = v === 'all' ? '' : instrumentOptions.find((op) => op.id === v)?.nama ?? '';
    const progName = programId === 'all' ? '' : programOptions.find((op) => op.id === programId)?.nama ?? '';
    dispatch(setKelasQuery([insName, progName].filter(Boolean).join(' ')));
  };

  const onProgramChange = (val: string) => {
    const v = val === 'all' ? 'all' : Number(val);
    setProgramId(v as any);
    dispatch(setKelasPage(1));
    const progName = v === 'all' ? '' : programOptions.find((op) => op.id === v)?.nama ?? '';
    const insName = instrumentId === 'all' ? '' : instrumentOptions.find((op) => op.id === instrumentId)?.nama ?? '';
    dispatch(setKelasQuery([insName, progName].filter(Boolean).join(' ')));
  };

  const renderRating = (v: number | null) =>
    typeof v === 'number' && Number.isFinite(v) ? (
      <span className="inline-flex items-center gap-1 text-black/80">
        <RiStarFill size={20} className="text-[var(--primary-color)]" />
        {v.toFixed(1)} <span className="text-black/60">/5</span>
      </span>
    ) : (
      <span className="text-black/70">-</span>
    );

  return (
    <div className="w-full">
      {/* ================= HEADER ================= */}
      <header className="sticky top-20 z-40 -m-6 mb-6 px-6 border-t bg-white border-black/10 rounded-b-3xl">
        <div className="py-3 flex items-center justify-between gap-4">
          <Link
            to="/dashboard-admin/tutor-list"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-3 py-1.5 text-sm text-[var(--secondary-color)] hover:bg-black/5"
          >
            <RiArrowLeftLine className="text-lg" />
            Kembali
          </Link>

          <div className="flex-1 flex items-center justify-center">
            {headerLoading ? (
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-black/10 animate-pulse" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-40 bg-black/10 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-black/10 rounded animate-pulse" />
                </div>
              </div>
            ) : headerError ? (
              <div className="text-red-600 text-sm">{headerError}</div>
            ) : guru ? (
              <div className="flex items-center gap-3">
                <img
                  src={(guru as any).profile_pic_url || '/avatar-placeholder.png'}
                  alt={(guru as any).nama}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-black/5"
                />
                <div className="flex flex-col">
                  <div className="font-semibold text-md text-neutral-900">{(guru as any).nama}</div>
                  <span className={`inline-block text-sm font-semibold ${getStatusColor(statusLabel)}`}>
                    {statusLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-black/60">Guru tidak ditemukan.</div>
            )}
          </div>

          <Link
            to={`/dashboard-admin/tutor-list/class-list-tutor/profile-tutor`}
            state={{ guruId }}
            className="rounded-full bg-(--primary-color) px-6 py-2 text-sm font-semibold text-black hover:brightness-95"
          >
            Profil Guru
          </Link>
        </div>
      </header>

      {/* ================= PERFORMA MENGAJAR ================= */}
      <section className="rounded-2xl bg-white p-4 md:p-6 mb-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-[var(--primary-color)] text-white w-9 h-9">
            <RiStarFill size={20} />
          </span>
          <h2 className="text-lg font-semibold text-neutral-900">Performa Mengajar</h2>
        </div>

        {perfLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4 border border-black/5 bg-black/5 animate-pulse">
                <div className="h-4 w-24 bg-black/10 rounded mb-3" />
                <div className="h-6 w-20 bg-black/10 rounded mb-2" />
                <div className="h-4 w-32 bg-black/10 rounded" />
              </div>
            ))}
          </div>
        ) : perfError ? (
          <div className="text-red-600 text-sm">{perfError}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {cards.map((m) => (
              <div key={m.key} className={`rounded-2xl ${m.bg} p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]`}>
                <div className="text-md text-neutral-900 mb-2">{m.title}</div>
                <div className="text-2xl text-neutral-900">{m.value}</div>
                <div className={`mt-1 inline-flex items-center ${trendColor(m.trend as any)}`}>
                  <TrendIcon trend={m.trend as any} />
                  <span className="text-md ml-1">{m.delta}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= LIST KELAS ================= */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">List Kelas</h2>

          <div className="flex items-center gap-3">
            {/* Pilih Alat Musik */}
            <select
              className="rounded-xl border w-[200px] border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              value={instrumentId === 'all' ? 'all' : String(instrumentId)}
              onChange={(e) => onInstrumentChange(e.target.value)}
            >
              <option value="all">Pilih Alat Musik</option>
              {instrumentOptions.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nama || `Instrumen #${op.id}`}
                </option>
              ))}
            </select>

            {/* Pilih Program */}
            <select
              className="rounded-xl border w-[200px] border-black/10 bg-white px-3 py-2 text-sm text-black/80 focus:border-(--secondary-color)"
              value={programId === 'all' ? 'all' : String(programId)}
              onChange={(e) => onProgramChange(e.target.value)}
            >
              <option value="all">Pilih Program</option>
              {programOptions.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nama || `Program #${op.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md">
                <th className="w-[120px] p-5 font-medium">Profile</th>
                <th className="p-5 font-medium">Nama Murid</th>
                <th className="p-5 font-medium">Jadwal</th>
                <th className="p-5 font-medium">Sesi</th>
                <th className="p-5 font-medium">Nilai Kelas</th>
                <th className="p-5 font-medium">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {kelas.status === 'loading' && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    memuat data…
                  </td>
                </tr>
              )}

              {kelas.status === 'failed' && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-red-600">
                    {kelas.error || 'Gagal memuat data'}
                  </td>
                </tr>
              )}

              {kelas.status !== 'loading' && pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    Belum ada data.
                  </td>
                </tr>
              )}

              {kelas.status !== 'loading' &&
                pageRows.map((row: any) => {
                  const instr = row?.detail_program?.instrument || row?.instrument || null;
                  const instrName = instr?.nama ?? '';
                  const instrIcon = getInstrumentIcon(instrName);

                  return (
                    <tr key={row.sesi_id} className="border-b border-black/5">
                      <td className="px-4 py-4">
                        <ProgramAvatarBadge
                          src={row.murid.profile_pic_url || '/avatar-placeholder.png'}
                          alt={row.murid.nama || 'murid'}
                          pkg={row.program?.nama || ''}
                          size={55}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-black">{row.murid.nama || '—'}</span>
                          <div className="mt-1 flex items-center gap-2">
                            {instrName ? (
                              <>
                                <img src={instrIcon} alt={instrName} className="h-5 w-5" />
                                <span className="text-md text-black/80">{instrName}</span>
                              </>
                            ) : (
                              <span className="text-md text-black/50">—</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-black/80">
                        {`Setiap ${dayName(row.jadwal.hari)} | ${timeRange(
                          row.jadwal.waktu_mulai,
                          row.jadwal.waktu_selesai
                        )}`}
                      </td>
                      <td className="px-4 py-4 text-black">{row.sesi_label}</td>
                      <td className="px-4 py-4">{renderRating(row.rating.value)}</td>
                      <td className="px-4 py-4">
                        <Link
                          to={`/dashboard-admin/tutor-list/class-list-tutor/detail-class`}
                          state={{ guruId, transaksiId: row.transaksi_id, sesiId: row.sesi_id }}
                          className="inline-block rounded-full border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                        >
                          Detail Class
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination: 5 per page */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => prev()}
            disabled={!hasPrev || kelas.status === 'loading'}
            className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
            aria-label="Previous page"
          >
            &lt;
          </button>

          {pageWindow(totalPages, kelas.page).map((p, i) =>
            p === '…' ? (
              <span key={`dots-${i}`} className="px-3 py-2 text-md text-black/40">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`rounded-xl border border-[var(--secondary-color)] px-3 py-1 text-md ${
                  p === kelas.page
                    ? 'border-(--secondary-color) bg-(--secondary-light-color) text-(--secondary-color)'
                    : 'text-black/70 hover:bg-black/5'
                }`}
                aria-current={p === kelas.page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => next()}
            disabled={!hasNext || kelas.status === 'loading'}
            className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      </section>
    </div>
  );
}
