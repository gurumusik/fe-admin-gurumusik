/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiUser2Fill, RiSearchLine, RiStarFill } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/store';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import DateRangeFilter from '@/components/ui/common/DateRangeFilter';

import {
  fetchGuruListThunk,
  setGuruPage,
  setGuruLimit,
  setGuruQuery,
  setGuruCity,
  setGuruStatus,
  setGuruDateRange,
  setGuruRatingBelow4,
  clearGuruFilters,
  updateBulkGuruStatusThunk,
} from '@/features/slices/guru/slice';
import type { GuruListItem } from '@/features/slices/guru/types';
import { getStatusColor } from '@/utils/getStatusColor';
import defaultUser from '@/assets/images/default-user.png';

/* =========================
   KOMONEN KECIL
   ========================= */
const StatCard: React.FC<{
  label: string;
  value: number | string;
  tone: 'green' | 'red' | 'orange';
}> = ({ label, value, tone }) => {
  const toneBg =
    tone === 'green'
      ? 'bg-(--accent-green-light-color)'
      : tone === 'red'
      ? 'bg-(--accent-red-light-color)'
      : 'bg-(--primary-light-color)';

  return (
    <div className={`rounded-xl ${toneBg} p-5`}>
      <p className="text-md text-neutral-900">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-black">{value}</p>
    </div>
  );
};

// window pagination (ellipsis)
function pageWindow(total: number, current: number) {
  const out: (number | '…')[] = [];
  const push = (x: number | '…') => { if (out[out.length - 1] !== x) out.push(x); };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '…') push('…');
  }
  return out;
}

/* =========================
   PAGE
   ========================= */
export default function TutorListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const {
    items, status, error, recap,
    limit, page, totalPages, hasPrev, hasNext,
    lastQuery,
  } = useSelector((s: RootState) => s.guru.list);

  const PAGE_SIZE = limit || 5;

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setGuruLimit(parseInt(e.target.value, 10)));
    dispatch(setGuruPage(1));
  };

  // Ambil nilai filter terakhir (pakai primitif agar dep effect stabil)
  const q = lastQuery?.q ?? '';
  const city = lastQuery?.city ?? '';
  const statusFilterRaw = (lastQuery?.status ?? '') as '' | 'aktif' | 'non_aktif' | 'cuti';
  const startDate = lastQuery?.start_date ?? '';
  const endDate = lastQuery?.end_date ?? '';
  const ratingBelow4 = !!lastQuery?.ratingBelow4;

  // ==== Deduplicate request (StrictMode & rerender) ====
  // ratingBelow4 ikut key agar refetch saat toggle
  const sentKeyRef = useRef<string>('');
  useEffect(() => {
    const key = `${page}|${PAGE_SIZE}|${q}|${city}|${statusFilterRaw}|${startDate}|${endDate}|${ratingBelow4 ? 'rb4' : 'all'}`;
    if (sentKeyRef.current === key) return;
    sentKeyRef.current = key;

    dispatch(
      fetchGuruListThunk({
        q: q || undefined,
        city: city || undefined,
        status: statusFilterRaw || undefined, // raw backend: 'aktif' | 'non_aktif' | 'cuti'
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        // kirim ke server supaya server yang filter & paginate ulang
        rating_lt: ratingBelow4 ? 4 : undefined,
        page,
        limit: PAGE_SIZE,
      }) as any
    );
  }, [dispatch, page, PAGE_SIZE, q, city, statusFilterRaw, startDate, endDate, ratingBelow4]);

  // ==== Search input dengan debounce ====
  const [searchText, setSearchText] = useState<string>(q ?? '');
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    setSearchText(q ?? '');
  }, [q]);

  const onSearchChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = e.target.value;
    setSearchText(val);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      dispatch(setGuruPage(1));
      dispatch(setGuruQuery(val));
    }, 350) as unknown as number;
  };

  // ==== Opsi kota (diambil dari data tampil saat ini) ====
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      if (it.city && it.city.trim()) set.add(it.city.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  // ==== Rows: fallback client-side filter jika backend belum support ====
  const rows: GuruListItem[] = useMemo(() => {
    if (!ratingBelow4) return items;
    return items.filter(it => typeof it.rating === 'number' && it.rating < 4);
  }, [items, ratingBelow4]);

  // ==== Tabel Checkbox Handlers ====
  const allSelectableIds = rows.map((r) => r.id);
  const isAllSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(selectedIds);
      allSelectableIds.forEach((id) => newSet.add(id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectRow = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkStatus = async (newStatus: 'aktif' | 'non_aktif') => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Anda yakin ingin mengubah ${selectedIds.size} guru menjadi ${newStatus}?`)) return;

    setIsBulkLoading(true);
    try {
      await dispatch(
        updateBulkGuruStatusThunk({
          guru_ids: Array.from(selectedIds),
          status_akun: newStatus,
        })
      ).unwrap();
      
      setSelectedIds(new Set());
      // Refetch
      dispatch(fetchGuruListThunk({
        q: q || undefined,
        city: city || undefined,
        status: statusFilterRaw || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        rating_lt: ratingBelow4 ? 4 : undefined,
        page,
        limit: PAGE_SIZE,
      }) as any);
    } catch (err: any) {
      alert(err?.message || 'Gagal mengubah status massal');
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Helpers pindah halaman
  const goTo = (p: number) => {
    const safe = Math.min(Math.max(1, p), totalPages || 1);
    if (safe !== page) dispatch(setGuruPage(safe));
  };
  const prev = () => goTo(page - 1);
  const next = () => goTo(page + 1);

  const renderBody = () => {
    if (status === 'loading') {
      return (
        <tbody>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <tr key={`skeleton-${i}`}>
              <td className="px-4 py-4" colSpan={8}>
                <div className="h-5 w-full animate-pulse rounded bg-black/10" />
              </td>
            </tr>
          ))}
        </tbody>
      );
    }
    if (status === 'failed') {
      return (
        <tbody>
          <tr>
            <td className="px-4 py-6 text-red-600 text-center" colSpan={8}>
              {error ?? 'Gagal memuat data.'}
            </td>
          </tr>
        </tbody>
      );
    }
    if (!rows.length) {
      return (
        <tbody>
          <tr>
            <td className="px-4 py-6 text-neutral-900 text-center" colSpan={8}>
              Belum ada data guru.
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {rows.map((t, idx) => (
          <tr key={t.id} className={idx === 0 ? 'text-md' : ''}>
            <td className="px-4 py-4 text-center">
              <input
                type="checkbox"
                className="h-4 w-4 accent-(--secondary-color) cursor-pointer"
                checked={selectedIds.has(t.id)}
                onChange={() => toggleSelectRow(t.id)}
              />
            </td>
            <td className="px-4 py-4">
              <div className="h-12 w-12 overflow-hidden rounded-full">
                <img
                  src={resolveImageUrl(t.image) || defaultUser}
                  alt={t.nama}
                  className="h-12 w-12 object-cover"
                />
              </div>
            </td>
            <td className="px-4 py-4 text-black">{t.nama}</td>
            <td className="px-4 py-4 text-neutral-900">{t.phone ?? '-'}</td>
            <td className="px-4 py-4 text-neutral-900">{t.city ?? '-'}</td>
            <td className="px-4 py-4">
              <span className={`font-medium ${getStatusColor(t.status)}`}>{t.status}</span>
            </td>
            <td className="px-4 py-4">
              <span className="inline-flex items-center gap-1 text-neutral-900">
                <RiStarFill size={20} className="inline-block text-[var(--primary-color)]" />{' '}
                {typeof t.rating === 'number'
                  ? `${t.rating.toFixed(2).replace('.', ',')}/5`
                  : '—'}
              </span>
            </td>
            <td className="px-4 py-4">
              <button
                onClick={() =>
                  navigate('/dashboard-admin/tutor-list/class-list-tutor', {
                    state: { guruId: t.id },
                  })
                }
                className="rounded-full cursor-pointer border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
              >
                Detail
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className="w-full">
      {/* SECTION: Rekap Guru */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-(--primary-color)">
            <RiUser2Fill size={25} className="text-black" />
          </div>
          <h2 className="text-lg font-semibold text-black">Rekap Guru</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Total Guru Aktif" value={recap.active} tone="green" />
          <StatCard label="Total Guru Non-Aktif" value={recap.inactive} tone="red" />
          <StatCard label="Total Guru Cuti" value={recap.onLeave} tone="orange" />
        </div>
      </section>

      {/* SECTION: List Guru */}
      <section className="mt-6 rounded-2xl bg-white p-4 md:p-6 relative">
        {/* Header + Filters */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-black">List Guru</h3>
            
            {/* Bulk Actions Menu */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 border-l border-black/10 pl-4 animate-in fade-in transition-all">
                <span className="text-sm font-medium text-black/60">{selectedIds.size} dipilih:</span>
                <button
                  onClick={() => handleBulkStatus('aktif')}
                  disabled={isBulkLoading}
                  className="rounded-xl bg-(--accent-green-color) px-3 py-1.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
                >
                  Set Aktif
                </button>
                <button
                  onClick={() => handleBulkStatus('non_aktif')}
                  disabled={isBulkLoading}
                  className="rounded-xl bg-(--accent-red-color) px-3 py-1.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
                >
                  Set Non-Aktif
                </button>
              </div>
            )}
          </div>

          <div className={`flex flex-1 items-center gap-3 md:justify-end text-md transition-opacity ${selectedIds.size > 0 ? 'opacity-30 pointer-events-none xl:opacity-100 xl:pointer-events-auto' : ''}`}>
            {/* Search by name */}
            <label className="relative w-full max-w-[320px]">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
              <input
                className="w-full rounded-xl border border-black/10 bg-white py-2 pl-10 pr-3 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                placeholder="| Cari Nama Guru, cth: Dicka Taksa"
                value={searchText}
                onChange={onSearchChange}
              />
            </label>

            {/* Filter Kota */}
            <select
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              value={city}
              onChange={(e) => {
                dispatch(setGuruPage(1));
                dispatch(setGuruCity(e.target.value || undefined));
              }}
            >
              <option value="">Semua Kota</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Filter Status (pakai RAW backend value) */}
            <select
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              value={statusFilterRaw}
              onChange={(e) => {
                dispatch(setGuruPage(1));
                dispatch(setGuruStatus((e.target.value as any) || undefined));
              }}
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="non_aktif">Non-Aktif</option>
              <option value="cuti">Cuti</option>
            </select>

            <DateRangeFilter
              startDate={startDate || undefined}
              endDate={endDate || undefined}
              onChange={({ startDate: nextStartDate, endDate: nextEndDate }) => {
                dispatch(
                  setGuruDateRange({
                    start_date: nextStartDate,
                    end_date: nextEndDate,
                  }),
                );
              }}
            />

            {/* Checkbox rating < 4 */}
            <label className="flex select-none items-center gap-2 rounded-xl px-2 py-1 text-md 60">
              <input
                type="checkbox"
                className="h-4 w-4 accent-(--secondary-color)"
                checked={ratingBelow4}
                onChange={(e) => {
                  dispatch(setGuruPage(1));                // balik ke page 1
                  dispatch(setGuruRatingBelow4(e.target.checked));
                }}
              />
              <span className="text-black">Rating di bawah 4</span>
            </label>

            {/* Clear */}
            <button
              onClick={() => {
                dispatch(setGuruPage(1));
                dispatch(clearGuruFilters());
              }}
              className="rounded-xl border border-black/15 px-3 py-2 text-sm text-black hover:bg-black/5"
              type="button"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl ">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md text-neutral-900">
                <th className="w-[60px] p-4 font-semibold text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-(--secondary-color) cursor-pointer"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    disabled={status === 'loading' || rows.length === 0}
                  />
                </th>
                <th className="w-[120px] p-4 font-semibold">Profile</th>
                <th className="p-4 font-semibold">Nama Guru</th>
                <th className="p-4 font-semibold">No Telepon</th>
                <th className="p-4 font-semibold">Asal Kota</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Rating</th>
                <th className="w-[120px] p-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            {renderBody()}
          </table>
        </div>

        {/* Pagination (server-side) */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-black/70">
            <span>Show</span>
            <select
              className="rounded-xl border border-black/10 bg-white px-2 py-1 outline-none focus:border-(--secondary-color)"
              value={PAGE_SIZE}
              onChange={handleLimitChange}
            >
              {[5, 10, 25, 50, 100].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2">
            <button
            onClick={prev}
            disabled={!hasPrev}
            className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
            aria-label="Previous page"
          >
            &lt;
          </button>

          {pageWindow(totalPages || 1, page).map((p, i) =>
            p === '…' ? (
              <span key={`dots-${i}`} className="px-3 py-2 text-md text-black/40 border-[var(--secondary-color)]">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`rounded-xl border border-[var(--secondary-color)] px-3 py-1 text-md ${
                  p === page
                    ? 'border-(--secondary-color) bg-(--secondary-light-color) text-(--secondary-color)'
                    : 'text-black/70 hover:bg-black/5'
                }`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={next}
            disabled={!hasNext}
            className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
            aria-label="Next page"
          >
            &gt;
          </button>
          </div>
        </div>
      </section>
    </div>
  );
}
