/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiUser2Fill, RiSearchLine } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/app/store';
import {
  fetchStudentsThunk,
  selectStudentList,
  setQuery,
  setCity,
  setStatusLabel,
  setPage,
  setLimit,
} from '@/features/slices/murid/slice';
import { resolveIconUrl } from '@/utils/resolveIconUrl'; // ⬅️ tambahkan ini
import defaultUser from '@/assets/images/default-user.png'

type StudentRecap = {
  active: number;
  inactive: number;
  onLeave: number;
};

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

const statusClass = (s: string) =>
  s === 'Aktif'
    ? 'text-(--accent-green-color)'
    : s === 'Non-Aktif'
    ? 'text-(--accent-red-color)'
    : 'text-(--accent-orange-color)';

function pageWindow(total: number, current: number) {
  const out: (number | '…')[] = [];
  const push = (x: number | '…') => {
    if (out[out.length - 1] !== x) out.push(x);
  };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '…') push('…');
  }
  return out;
}

export default function StudentListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const list = useSelector(selectStudentList);

  useEffect(() => {
    dispatch(setLimit(5));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchStudentsThunk(undefined));
  }, [dispatch, list.q, list.city, list.statusLabel, list.page, list.limit]);

  const recap: StudentRecap = list.recap;
  const rows = useMemo(() => list.items, [list.items]);
  const totalPages = Math.max(1, list.totalPages || Math.ceil((list.total || 0) / (list.limit || 1)));

  const goTo = (p: number) => dispatch(setPage(Math.min(Math.max(1, p), totalPages)));
  const prev = () => goTo(list.page - 1);
  const next = () => goTo(list.page + 1);

  return (
    <div className="w-full">
      {/* Rekap */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-(--primary-color)">
            <RiUser2Fill size={25} className="text-black" />
          </div>
          <h2 className="text-lg font-semibold text-black">Rekap Murid</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Total Murid Aktif" value={recap.active} tone="green" />
          <StatCard label="Total Murid Non-Aktif" value={recap.inactive} tone="red" />
          <StatCard label="Total Murid Cuti" value={recap.onLeave} tone="orange" />
        </div>
      </section>

      {/* List */}
      <section className="mt-6 rounded-2xl bg-white p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-black">List Murid</h3>

          <div className="flex flex-1 items-center gap-3 md:justify-end text-md">
            <label className="relative w-full max-w-[420px]">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
              <input
                className="w-full rounded-xl border border-black/10 bg-white py-2 pl-10 pr-3 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                placeholder="| Cari Nama/Email/Telepon"
                value={list.q}
                onChange={(e) => {
                  dispatch(setQuery(e.target.value));
                  dispatch(setPage(1));
                }}
              />
            </label>

            <select
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              value={list.city}
              onChange={(e) => {
                dispatch(setCity(e.target.value));
                dispatch(setPage(1));
              }}
            >
              <option value="">Pilih Asal Kota</option>
              {list.cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              value={list.statusLabel}
              onChange={(e) => {
                dispatch(setStatusLabel((e.target.value || '') as any));
                dispatch(setPage(1));
              }}
            >
              <option value="">Pilih Status</option>
              {list.statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md text-neutral-900">
                <th className="w-[120px] p-4 font-semibold">Profile</th>
                <th className="p-4 font-semibold">Nama Murid</th>
                <th className="p-4 font-semibold">No Telepon</th>
                <th className="p-4 font-semibold">Asal Kota</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="w-[120px] p-4 font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {list.status === 'loading' && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">memuat data…</td>
                </tr>
              )}

              {list.status === 'failed' && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-red-600">
                    {list.error || 'Gagal memuat data'}
                  </td>
                </tr>
              )}

              {list.status !== 'loading' && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">Belum ada data.</td>
                </tr>
              )}

              {list.status !== 'loading' && rows.map((s) => {
                const img = resolveIconUrl(s.image) || defaultUser; 
                return (
                  <tr key={s.uuid}>
                    <td className="px-4 py-4">
                      <div className="h-12 w-12 overflow-hidden rounded-full ring-1 ring-black/10">
                        <img src={img} alt={s.name} className="h-12 w-12 object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-black">{s.name}</td>
                    <td className="px-4 py-4 text-neutral-900">{s.phone || '-'}</td>
                    <td className="px-4 py-4 text-neutral-900">{s.city || '-'}</td>
                    <td className="px-4 py-4">
                      <span className={`font-medium ${statusClass(s.status)}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() =>
                          navigate('/dashboard-admin/student-list/detail-student', {
                            state: { studentUuid: s.uuid },
                          })
                        }
                        className="rounded-full cursor-pointer border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={prev} disabled={list.page === 1 || list.status === 'loading'} className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40" aria-label="Previous page">
            &lt;
          </button>

          {pageWindow(totalPages, list.page).map((p, i) =>
            p === '…' ? (
              <span key={`dots-${i}`} className="px-3 py-2 text-md text-black/40">…</span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`rounded-xl border border-[var(--secondary-color)] px-3 py-1 text-md ${
                  p === list.page
                    ? 'border-(--secondary-color) bg-(--secondary-light-color) text-(--secondary-color)'
                    : 'text-black/70 hover:bg-black/5'
                }`}
                aria-current={p === list.page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}

          <button onClick={next} disabled={list.page === totalPages || list.status === 'loading'} className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40" aria-label="Next page">
            &gt;
          </button>
        </div>
      </section>
    </div>
  );
}
