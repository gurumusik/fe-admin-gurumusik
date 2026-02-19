/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import {
  fetchAllTxThunk,
  fetchMonthlyTxStatsThunk,
  setPage,
  setLimit,
  setQuery,
  setStatusFilter,
} from '@/features/slices/transaksi/slice';
import type { AllTransactionItem, TxStatusLabel } from '@/features/slices/transaksi/types';
import { mapTxStatusLabel } from '@/services/api/transaksi.api';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { getStatusColor } from '@/utils/getStatusColor';
import defaultUser from '@/assets/images/default-user.png';

const formatIDR = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
    : '-';

const formatDateShort = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' });
};

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

const statusOptions: Array<{ label: string; value: TxStatusLabel | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Success', value: 'Success' },
  { label: 'On Progress', value: 'On Progress' },
  { label: 'Failed', value: 'Failed' },
  { label: 'Expired', value: 'Expired' },
];

export default function TransactionListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const tx = useSelector((s: RootState) => s.transaksi);

  useEffect(() => {
    dispatch(setLimit(10));
    dispatch(fetchMonthlyTxStatsThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAllTxThunk(undefined));
  }, [dispatch, tx.page, tx.limit, tx.q, tx.statusFilter]);

  const rows = useMemo(() => (tx.allItems as AllTransactionItem[]) || [], [tx.allItems]);
  const totalPages = Math.max(1, Math.ceil((tx.allTotal || 0) / (tx.limit || 10)));

  const stats = tx.monthlyStats;
  const statsLabel = stats
    ? new Date(stats.range.year, stats.range.month - 1).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  const chartData = [
    { name: 'Booking', students: stats?.booking.students ?? 0 },
    { name: 'Pembayaran', students: stats?.payment.students ?? 0 },
  ];

  return (
    <div className="w-full">
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-black">Aktivitas Transaksi Bulan Ini</h2>
            <p className="text-sm text-neutral-500">{statsLabel}</p>
          </div>
        </div>

        {tx.monthlyStatsStatus === 'loading' && (
          <div className="text-neutral-500">Memuat bagan…</div>
        )}

        {tx.monthlyStatsStatus === 'failed' && (
          <div className="text-red-600">{tx.monthlyStatsError || 'Gagal memuat statistik'}</div>
        )}

        {tx.monthlyStatsStatus === 'succeeded' && stats && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-[var(--primary-light-color)] p-5">
                <p className="text-md text-neutral-900">Murid Booking</p>
                <p className="mt-2 text-3xl font-semibold text-black">{stats.booking.students}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {stats.booking.transactions} transaksi
                </p>
              </div>
              <div className="rounded-xl bg-[var(--accent-green-light-color)] p-5">
                <p className="text-md text-neutral-900">Murid Pembayaran</p>
                <p className="mt-2 text-3xl font-semibold text-black">{stats.payment.students}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {stats.payment.transactions} transaksi
                </p>
              </div>
              <div className="rounded-xl bg-[var(--secondary-light-color)] p-5">
                <p className="text-md text-neutral-900">Total Transaksi</p>
                <p className="mt-2 text-3xl font-semibold text-black">
                  {(stats.booking.transactions ?? 0).toLocaleString('id-ID')}
                </p>
                <p className="mt-1 text-sm text-neutral-500">bulan ini</p>
              </div>
            </div>

            <div className="mt-6 h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="students" fill="var(--secondary-color)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      <section className="mt-6 rounded-2xl bg-white p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-black">List Transaksi</h3>

          <div className="flex flex-1 items-center gap-3 md:justify-end text-md">
            <label className="relative w-full max-w-[420px]">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
              <input
                className="w-full rounded-xl border border-black/10 bg-white py-2 pl-10 pr-3 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                placeholder="| Cari nama murid / guru / paket / modul"
                value={tx.q}
                onChange={(e) => {
                  dispatch(setQuery(e.target.value));
                  dispatch(setPage(1));
                }}
              />
            </label>

            <select
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              value={tx.statusFilter}
              onChange={(e) => {
                dispatch(setStatusFilter(e.target.value as TxStatusLabel | 'ALL'));
                dispatch(setPage(1));
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md text-neutral-900">
                <th className="w-[160px] p-4 font-semibold">Tanggal</th>
                <th className="p-4 font-semibold">Murid</th>
                <th className="p-4 font-semibold">Guru</th>
                <th className="p-4 font-semibold">Produk</th>
                <th className="w-[120px] p-4 font-semibold">Tipe</th>
                <th className="w-[160px] p-4 font-semibold">Harga</th>
                <th className="w-[160px] p-4 font-semibold">Tahap</th>
                <th className="w-[140px] p-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {tx.allStatus === 'loading' && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-neutral-500">memuat data…</td>
                </tr>
              )}

              {tx.allStatus === 'failed' && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-red-600">
                    {tx.allError || 'Gagal memuat data'}
                  </td>
                </tr>
              )}

              {tx.allStatus !== 'loading' && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-neutral-500">Belum ada data.</td>
                </tr>
              )}

              {tx.allStatus !== 'loading' && rows.map((item: any) => {
                const statusLabel = item.status_label || mapTxStatusLabel(item.status as any);
                const studentAvatar =
                  resolveImageUrl(item.student?.avatar ?? item.murid?.profile_pic_url) ?? defaultUser;
                const studentName = item.student?.name ?? item.murid?.nama ?? '-';
                const teacherName = item.teacher?.name ?? item.guru?.nama ?? '-';
                const isModul = String(item?.type || item?.category_transaksi || '').toLowerCase() === 'modul' || !!item?.module;
                const productName =
                  item.module?.title ||
                  item.modul?.judul ||
                  item.paket?.name ||
                  item.paket?.nama_paket ||
                  item.program?.name ||
                  item.program?.nama_program ||
                  '-';
                const price = Number(item.price ?? item.total_harga ?? 0);
                const date = item.date ?? item.tanggal_transaksi;
                const isPaid = statusLabel === 'Success';
                const stageLabel = isPaid ? 'Payment' : 'Booking';

                return (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="p-4 text-sm text-neutral-700">{formatDateShort(date)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={studentAvatar}
                          alt={studentName}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium text-neutral-900">{studentName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-neutral-700">{teacherName}</td>
                    <td className="p-4 text-sm text-neutral-700">{productName}</td>
                    <td className="p-4 text-sm text-neutral-700">{isModul ? 'Modul' : 'Kursus'}</td>
                    <td className="p-4 text-sm text-neutral-700">{formatIDR(price)}</td>
                    <td className="p-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          isPaid
                            ? 'bg-[var(--accent-green-light-color)] text-[var(--accent-green-color)]'
                            : 'bg-[var(--primary-light-color)] text-[var(--primary-color)]'
                        }`}
                      >
                        {stageLabel}
                      </span>
                    </td>
                    <td className={`p-4 text-sm font-semibold ${getStatusColor(statusLabel)}`}>
                      {statusLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => dispatch(setPage(Math.max(1, tx.page - 1)))}
            disabled={tx.page <= 1}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-700 disabled:opacity-50"
          >
            Prev
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {pageWindow(totalPages, tx.page).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-sm text-neutral-500">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => dispatch(setPage(p))}
                  className={`h-9 w-9 rounded-lg text-sm ${
                    p === tx.page
                      ? 'bg-[var(--secondary-color)] text-white'
                      : 'border border-black/10 bg-white text-neutral-700'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => dispatch(setPage(Math.min(totalPages, tx.page + 1)))}
            disabled={tx.page >= totalPages}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
