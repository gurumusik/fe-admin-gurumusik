/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchReferralCommissionsThunk,
  fetchReferralReferrersThunk,
  selectReferralsState,
} from '@/features/slices/referrals/slice';
import type { ReferralCommissionRow, ReferralReferrerSummaryRaw } from '@/features/slices/referrals/types';

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const formatDateShort = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' });
};

function coerceNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pickReferrerUser(row: ReferralReferrerSummaryRaw): { id: number; nama: string; email: string; ucode: string } {
  const anyRow = row as any;
  const id = coerceNum(anyRow.referrer_user_id ?? anyRow['teacherReferral.referrer.id'] ?? anyRow['referrer.id'] ?? anyRow['referrer_user_id']);
  const nama = String(anyRow['teacherReferral.referrer.nama'] ?? anyRow['referrer.nama'] ?? anyRow.nama ?? '-');
  const email = String(anyRow['teacherReferral.referrer.email'] ?? anyRow['referrer.email'] ?? anyRow.email ?? '-');
  const ucode = String(anyRow['teacherReferral.referrer.ucode'] ?? anyRow['referrer.ucode'] ?? anyRow.ucode ?? '-');
  return { id, nama, email, ucode };
}

export default function ReferralMonitoringPage() {
  const dispatch = useAppDispatch();
  const { referrers, commissions } = useAppSelector(selectReferralsState);

  const [q, setQ] = useState('');
  const [referrerStatus, setReferrerStatus] = useState<'earned' | 'paid' | 'pending' | 'cancelled'>('earned');
  const [referrerPage, setReferrerPage] = useState(1);
  const [referrerLimit] = useState(20);

  const [commissionStatus, setCommissionStatus] = useState<'earned' | 'paid' | 'pending' | 'cancelled'>('earned');
  const [filterReferrerId, setFilterReferrerId] = useState<string>('');
  const [filterReferredId, setFilterReferredId] = useState<string>('');
  const [filterTrxId, setFilterTrxId] = useState<string>('');
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionLimit] = useState(20);

  useEffect(() => setReferrerPage(1), [q, referrerStatus]);
  useEffect(() => setCommissionPage(1), [commissionStatus, filterReferrerId, filterReferredId, filterTrxId]);

  useEffect(() => {
    dispatch(
      fetchReferralReferrersThunk({
        q: q.trim() || undefined,
        status: referrerStatus,
        page: referrerPage,
        limit: referrerLimit,
      })
    );
  }, [dispatch, q, referrerStatus, referrerPage, referrerLimit]);

  useEffect(() => {
    dispatch(
      fetchReferralCommissionsThunk({
        status: commissionStatus,
        referrer_user_id: filterReferrerId.trim() ? Number(filterReferrerId) : undefined,
        referred_user_id: filterReferredId.trim() ? Number(filterReferredId) : undefined,
        transaksi_id: filterTrxId.trim() ? Number(filterTrxId) : undefined,
        page: commissionPage,
        limit: commissionLimit,
      })
    );
  }, [dispatch, commissionStatus, filterReferrerId, filterReferredId, filterTrxId, commissionPage, commissionLimit]);

  const referrerRows = useMemo(() => (referrers.items as ReferralReferrerSummaryRaw[]) || [], [referrers.items]);
  const commissionRows = useMemo(() => (commissions.items as ReferralCommissionRow[]) || [], [commissions.items]);
  const referrerPageCount = Math.max(1, Math.ceil((referrers.total || 0) / (referrerLimit || 20)));
  const commissionPageCount = Math.max(1, Math.ceil((commissions.total || 0) / (commissionLimit || 20)));

  return (
    <div className="w-full">
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-black">Monitoring Referral Guru</h2>
            <p className="text-sm text-neutral-500">Ringkasan referrer & riwayat komisi per transaksi.</p>
          </div>
        </div>

        {/* Referrers */}
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-black">Daftar Guru Pemberi Referral</h3>
              <p className="text-sm text-neutral-500">Berdasarkan komisi yang tercatat.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari nama/email/ucode"
                  className="w-[260px] rounded-xl border border-black/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/20"
                />
              </div>

              <select
                value={referrerStatus}
                onChange={(e) => setReferrerStatus(e.target.value as any)}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/20"
                title="Status komisi yang dihitung"
              >
                <option value="earned">earned</option>
                <option value="paid">paid</option>
                <option value="pending">pending</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>

          {referrers.status === 'loading' && <div className="mt-4 text-sm text-neutral-500">Memuat…</div>}
          {referrers.status === 'failed' && (
            <div className="mt-4 text-sm text-red-600">{referrers.error || 'Gagal memuat data.'}</div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-neutral-500">
                <tr className="border-b border-neutral-200">
                  <th className="py-3 pr-4">Referrer</th>
                  <th className="py-3 pr-4">UCode</th>
                  <th className="py-3 pr-4">Total Referred</th>
                  <th className="py-3 pr-4">Total Komisi</th>
                  <th className="py-3 pr-4">Total Nominal</th>
                  <th className="py-3 pr-4">Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {referrers.status !== 'loading' && referrerRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-neutral-500">
                      Belum ada data.
                    </td>
                  </tr>
                )}

                {referrerRows.map((row) => {
                  const u = pickReferrerUser(row);
                  const totalReferred = coerceNum((row as any).total_referred);
                  const totalCommissions = coerceNum((row as any).total_commissions);
                  const totalAmount = coerceNum((row as any).total_amount);
                  const lastEarnedAt = String((row as any).last_earned_at ?? '');

                  return (
                    <tr key={`${u.id}-${u.ucode}`} className="border-b border-neutral-100">
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-neutral-900">{u.nama}</div>
                        <div className="text-xs text-neutral-500">{u.email}</div>
                      </td>
                      <td className="py-3 pr-4 font-mono">{u.ucode}</td>
                      <td className="py-3 pr-4">{totalReferred.toLocaleString('id-ID')}</td>
                      <td className="py-3 pr-4">{totalCommissions.toLocaleString('id-ID')}</td>
                      <td className="py-3 pr-4 font-semibold">{formatIDR(totalAmount)}</td>
                      <td className="py-3 pr-4">{formatDateShort(lastEarnedAt || null)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setReferrerPage((p) => Math.max(1, p - 1))}
              disabled={referrerPage <= 1}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-700 disabled:opacity-50"
            >
              Prev
            </button>
            <div className="text-sm text-neutral-600">
              {referrerPage} / {referrerPageCount}
            </div>
            <button
              type="button"
              onClick={() => setReferrerPage((p) => Math.min(referrerPageCount, p + 1))}
              disabled={referrerPage >= referrerPageCount}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Commissions */}
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-black">Riwayat Transaksi Komisi Referral</h3>
              <p className="text-sm text-neutral-500">Satu transaksi = maksimal satu komisi.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={commissionStatus}
                onChange={(e) => setCommissionStatus(e.target.value as any)}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/20"
              >
                <option value="earned">earned</option>
                <option value="paid">paid</option>
                <option value="pending">pending</option>
                <option value="cancelled">cancelled</option>
              </select>
              <input
                value={filterReferrerId}
                onChange={(e) => setFilterReferrerId(e.target.value)}
                placeholder="referrer_user_id"
                className="w-[160px] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/20"
              />
              <input
                value={filterReferredId}
                onChange={(e) => setFilterReferredId(e.target.value)}
                placeholder="referred_user_id"
                className="w-[160px] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/20"
              />
              <input
                value={filterTrxId}
                onChange={(e) => setFilterTrxId(e.target.value)}
                placeholder="transaksi_id"
                className="w-[140px] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/20"
              />
            </div>
          </div>

          {commissions.status === 'loading' && <div className="mt-4 text-sm text-neutral-500">Memuat…</div>}
          {commissions.status === 'failed' && (
            <div className="mt-4 text-sm text-red-600">{commissions.error || 'Gagal memuat data.'}</div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-neutral-500">
                <tr className="border-b border-neutral-200">
                  <th className="py-3 pr-4">Tanggal</th>
                  <th className="py-3 pr-4">Referrer</th>
                  <th className="py-3 pr-4">Referred</th>
                  <th className="py-3 pr-4">Transaksi</th>
                  <th className="py-3 pr-4">Kategori</th>
                  <th className="py-3 pr-4">Nominal</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.status !== 'loading' && commissionRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-neutral-500">
                      Belum ada data.
                    </td>
                  </tr>
                )}

                {commissionRows.map((row) => {
                  const ref = row.teacherReferral?.referrer;
                  const referred = row.teacherReferral?.referred;
                  const trx = row.transaksi;
                  const category = String(trx?.category_transaksi ?? '').toLowerCase() || '-';
                  return (
                    <tr key={row.id} className="border-b border-neutral-100">
                      <td className="py-3 pr-4">{formatDateShort(row.earned_at)}</td>
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-neutral-900">{ref?.nama ?? '-'}</div>
                        <div className="text-xs text-neutral-500">{ref?.ucode ? `#${ref.ucode}` : '-'}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-neutral-900">{referred?.nama ?? '-'}</div>
                        <div className="text-xs text-neutral-500">{referred?.ucode ? `#${referred.ucode}` : '-'}</div>
                      </td>
                      <td className="py-3 pr-4 font-mono">#{row.transaksi_id}</td>
                      <td className="py-3 pr-4">{category}</td>
                      <td className="py-3 pr-4 font-semibold">{formatIDR(coerceNum(row.amount))}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={cls(
                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                            row.status === 'earned'
                              ? 'bg-[var(--accent-green-light-color)] text-[var(--accent-green-color)]'
                              : 'bg-[var(--secondary-light-color)] text-[var(--secondary-color)]'
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCommissionPage((p) => Math.max(1, p - 1))}
              disabled={commissionPage <= 1}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-700 disabled:opacity-50"
            >
              Prev
            </button>
            <div className="text-sm text-neutral-600">
              {commissionPage} / {commissionPageCount}
            </div>
            <button
              type="button"
              onClick={() => setCommissionPage((p) => Math.min(commissionPageCount, p + 1))}
              disabled={commissionPage >= commissionPageCount}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
