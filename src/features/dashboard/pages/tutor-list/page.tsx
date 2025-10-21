'use client';

import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiUser2Fill, RiSearchLine, RiStarFill } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/store';

import { fetchGuruListThunk, setGuruPage } from '@/features/slices/guru/slice';
import type { GuruListItem } from '@/features/slices/guru/slice';
import { getStatusColor } from '@/utils/getStatusColor';
import defaultUser from '@/assets/images/default-user.png'

// Komponen StatCard tetap sama
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

// page window (elipsis) tetap
function pageWindow(total: number, current: number) {
  const out: (number | '…')[] = [];
  const push = (x: number | '…') => { if (out[out.length - 1] !== x) out.push(x); };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '…') push('…');
  }
  return out;
}

export default function TutorListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items, status, error, recap, page, totalPages } = useSelector(
    (s: RootState) => s.guru.list
  );
  // Ikuti UI lama: 5 baris per halaman
  const PAGE_SIZE = 5;

  // Fetch saat mount & saat ganti page
  useEffect(() => {
    dispatch(fetchGuruListThunk({ page, limit: PAGE_SIZE }));
     
  }, [dispatch, page]);

  const rows: GuruListItem[] = useMemo(() => items, [items]);

  const goTo = (p: number) => dispatch(setGuruPage(Math.min(Math.max(1, p), totalPages || 1)));
  const prev = () => goTo(page - 1);
  const next = () => goTo(page + 1);

  const renderBody = () => {
    if (status === 'loading') {
      return (
        <tbody>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <tr key={`skeleton-${i}`}>
              <td className="px-4 py-4" colSpan={7}>
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
            <td className="px-4 py-6 text-red-600" colSpan={7}>
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
            <td className="px-4 py-6 text-neutral-900" colSpan={7}>
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
            <td className="px-4 py-4">
              <div className="h-12 w-12 overflow-hidden rounded-full">
                <img
                  src={t.image || defaultUser}
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
                    state: { guruId: t.id }, // ganti ke id guru
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
      <section className="mt-6 rounded-2xl bg-white p-4 md:p-6">
        {/* Header + Filters (UI only) */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-black">List Guru</h3>

          <div className="flex flex-1 items-center gap-3 md:justify-end text-md">
            <label className="relative w-full max-w-[460px]">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
              <input
                className="w-full rounded-xl border border-black/10 bg-white py-2 pl-10 pr-3 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                placeholder="| Cari Nama Guru, cth: Dicka Taksa"
                readOnly
              />
            </label>

            <select
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              defaultValue=""
              disabled
            >
              <option value="">Pilih Asal Kota</option>
            </select>

            <select
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              defaultValue=""
              disabled
            >
              <option value="">Pilih Status</option>
            </select>

            <label className="flex select-none items-center gap-2 rounded-xl px-2 py-1 text-md 60">
              <input type="checkbox" className="h-4 w-4 accent-(--secondary-color)" disabled />
              <span className="text-black">Rating dibawah 4</span>
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl ">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md text-neutral-900">
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

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={prev}
            disabled={page === 1}
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
            disabled={page === totalPages}
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
