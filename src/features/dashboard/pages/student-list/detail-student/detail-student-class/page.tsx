/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard-admin/student/DetailStudentClassPage.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RiArrowLeftLine, RiCalendar2Line, RiHistoryLine, RiStarFill } from 'react-icons/ri';
import type { AppDispatch } from '@/app/store';

import { resolveIconUrl } from '@/utils/resolveIconUrl';
import defaultUser from '@/assets/images/default-user.png';
import ProgramAvatarBadge from '@/components/ui/badge/ProgramAvatarBadge';
import { getStatusColor } from '@/utils/getStatusColor';

import { fetchStudentHeaderThunk, selectStudentDetail } from '@/features/slices/murid/slice';
import StudentReportModal, { type StudentReportRow } from '@/features/dashboard/components/studentReportModal';

import {
  listMuridClassesById,
  listMuridTransaksiRatings, // ⬅️ NEW: ambil data rating per transaksi
  type MuridClassSessionRow,
} from '@/services/api/murid.api';

/* ===================== Helpers ===================== */
// rata-rata rating (abaikan null)
function avg(arr: Array<number | null | undefined>): number | null {
  const nums = arr.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  if (!nums.length) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return Math.round((s / nums.length) * 10) / 10;
}

function pageWindow(total: number, current: number) {
  const out: (number | '…')[] = [];
  const push = (x: number | '…') => { if (out[out.length - 1] !== x) out.push(x); };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '…') push('…');
  }
  return out;
}

const isBelumSelesai = (s?: string) => (s || '').toLowerCase().includes('belum selesai');

/* ===================== Page ===================== */
const DetailStudentClassPage: React.FC = () => {
  const params = useParams<{ classId?: string }>();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { studentUuid?: string; classId?: string } };

  const classId = String(params.classId || state?.classId || '');
  const studentUuid = state?.studentUuid;

  const dispatch = useDispatch<AppDispatch>();
  const detail = useSelector(selectStudentDetail);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // header kelas
  const [hdr, setHdr] = useState<{
    transaksiId: number;
    teacherName: string;
    teacherAvatar: string | null;
    instrumentName: string;
    instrumentIcon: string | null;
    programName: string;
    schedule: string;
    totalSession: number;      // Y
    latestDoneKe: number;      // X
    avgRating: number | null;
  } | null>(null);

  // riwayat sesi (full)
  const [history, setHistory] = useState<MuridClassSessionRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);

  // pagination local untuk history
  const [histPage, setHistPage] = useState<number>(1);
  const HIST_PAGE_SIZE = 6;

  // ====== modal report (murid) ======
  const [reportOpen, setReportOpen] = useState(false);
  const [reportRows, setReportRows] = useState<StudentReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState<boolean>(false);

  // header murid
  useEffect(() => {
    if (studentUuid) dispatch(fetchStudentHeaderThunk(studentUuid));
  }, [dispatch, studentUuid]);

  // fetch data kelas:
  // - per_session: kumpulkan semua sesi transaksi ini -> totalSession & avgRating
  // - latest_done: cari sesi_ke tertinggi "kelas selesai" -> latestDoneKe
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!studentUuid || !classId) {
          setHdr(null);
          setHistory([]);
          setLoading(false);
          setHistoryLoading(false);
          return;
        }
        setLoading(true);
        setHistoryLoading(true);
        setError(null);

        // 1) kumpulkan semua sesi (per_session)
        const collected: MuridClassSessionRow[] = [];
        let page = 1, totalPages = 1;
        do {
          const resp = await listMuridClassesById({
            uuid: studentUuid,
            page,
            limit: 100,
            view: 'per_session',
          });
          if (cancelled) return;
          if (Array.isArray(resp.data)) collected.push(...resp.data);
          totalPages = resp.totalPages || 1;
          page += 1;
        } while (page <= totalPages);

        const rowsThisTx = collected
          .filter(r => String(r.transaksi_id) === String(classId))
          .sort((a, b) => (a.sesi_ke || 0) - (b.sesi_ke || 0)); // urutkan sesi_ke naik

        if (!rowsThisTx.length) {
          setHdr(null);
          setHistory([]);
          setLoading(false);
          setHistoryLoading(false);
          return;
        }

        const ref = rowsThisTx[0];
        const totalSession = ref.total_session || Math.max(...rowsThisTx.map(x => x.sesi_ke || 0), 0);
        const avgRating = avg(rowsThisTx.map(x => x.rating));

        // 2) latest_done
        let latestDoneKe = 0;
        {
          let page2 = 1, totalPages2 = 1, found = false;
          do {
            const resp2 = await listMuridClassesById({
              uuid: studentUuid,
              page: page2,
              limit: 100,
              view: 'latest_done',
            });
            if (cancelled) return;
            const row = resp2.data.find(d => String(d.transaksi_id) === String(classId));
            if (row) { latestDoneKe = row.sesi_ke || 0; found = true; }
            totalPages2 = resp2.totalPages || 1;
            page2 += 1;
          } while (!found && page2 <= totalPages2);
        }

        // set header
        const teacherAvatar = resolveIconUrl(ref.avatar) || null;
        const instrumentIcon = resolveIconUrl(ref.instrument.icon);
        setHdr({
          transaksiId: Number(ref.transaksi_id),
          teacherName: ref.teacherName,
          teacherAvatar,
          instrumentName: ref.instrument.name || '',
          instrumentIcon,
          programName: ref.program.name || '',
          schedule: ref.schedule || '-',
          totalSession,
          latestDoneKe,
          avgRating,
        });

        // set history (untuk tabel sesi)
        setHistory(rowsThisTx);
        setHistPage(1);

        setLoading(false);
        setHistoryLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Gagal memuat data kelas');
        setLoading(false);
        setHistoryLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [studentUuid, classId]);

  // ketika modal Laporan dibuka, ambil rating dari DB (tabel rating) untuk transaksi ini
  useEffect(() => {
    let cancelled = false;
    async function fetchRatings() {
      if (!reportOpen) return;
      if (!studentUuid || !hdr?.transaksiId) return;

      setReportLoading(true);
      try {
        const resp = await listMuridTransaksiRatings({
          uuid: studentUuid,
          transaksiId: hdr.transaksiId,
        });

        if (cancelled) return;

      const mapped: StudentReportRow[] = (resp.data || []).map((r, idx) => {
        const rateNum = typeof r.rate === 'string' ? parseFloat(r.rate) : r.rate;
        const nilai = Number.isFinite(rateNum as number) ? `${(rateNum as number).toFixed(1)}/5` : '−';
        return {
          no: idx + 1,
          nilai,
          date: r.created_at,
          status: r.is_show ? 'Tampil' : 'Tidak Tampil',
        };
      });

        setReportRows(mapped);
      } catch {
        if (!cancelled) setReportRows([]);
      } finally {
        if (!cancelled) setReportLoading(false);
      }
    }
    fetchRatings();
    return () => { cancelled = true; };
  }, [reportOpen, studentUuid, hdr?.transaksiId]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/dashboard-admin/student-list', { replace: true });
  }, [navigate]);

  const student = detail.item;

  // pagination client-side untuk history (sesi)
  const totalHistPages = Math.max(1, Math.ceil(history.length / HIST_PAGE_SIZE));
  const histPageRows = useMemo(() => {
    const start = (histPage - 1) * HIST_PAGE_SIZE;
    return history.slice(start, start + HIST_PAGE_SIZE);
  }, [history, histPage]);

  return (
    <div className="w-full">
      {/* ====== HEADER ====== */}
      <section className="rounded-2xl bg-white p-4 md:p-6 mb-4">
        <div className="flex items-center justify-between">
          {/* kiri: murid + instrumen + jadwal */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center size-10 rounded-xl border border-neutral-300 text-[var(--secondary-color)] hover:bg-neutral-50"
              aria-label="Kembali"
            >
              <RiArrowLeftLine size={22} />
            </button>

            <ProgramAvatarBadge
              src={hdr?.teacherAvatar || defaultUser}
              alt={hdr?.teacherName || 'Guru'}
              pkg={hdr?.programName || ''}
              size={55}
            />

            <div className="flex flex-col">
              <div className="font-semibold text-neutral-900">
                {student?.name || '-'}
              </div>

              <span className="inline-flex items-center gap-2">
                {hdr?.instrumentIcon ? (
                  <img src={hdr.instrumentIcon} alt={hdr.instrumentName} className="h-5 w-5" />
                ) : (
                  <span className="inline-block w-5 h-5 rounded-full bg-neutral-300" />
                )}
                {hdr?.instrumentName || '-'}
              </span>

              <span className="inline-flex items-center gap-2 items-center">
                <RiCalendar2Line size={20} className="text-[var(--secondary-color)] mt-1" />
                {hdr?.schedule || '-'}
              </span>
            </div>
          </div>

          {/* kanan: Total Sesi (X/Y) + Rata-rata */}
          <div className="flex items-stretch gap-3">
            <div className="rounded-2xl bg-[var(--accent-purple-light-color)] p-5">
              <div className="text-md text-neutral-900">Total Sesi</div>
              <div className="text-xl mt-1 font-semibold text-neutral-900">
                {loading ? '…' : hdr ? `${hdr.latestDoneKe}/${hdr.totalSession}` : '-'}
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--primary-light-color)] p-5">
              <div className="text-md text-neutral-900">Rata-Rata Nilai</div>
              <div className="inline-flex mt-1 items-center gap-2 text-xl font-semibold text-neutral-900">
                <RiStarFill className="text-[var(--primary-color)]" />
                {loading ? '…' : hdr?.avgRating != null ? `${hdr.avgRating.toFixed(1)}/5` : '-'}
                <span className="flex border rounded-xl border-neutral-300 w-9 h-9 items-center justify-center">
                  <RiHistoryLine size={20} className="text-[var(--secondary-color)]" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </section>

      {/* ====== RIWAYAT KELAS (semua sesi + status + Aksi) ====== */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-neutral-900">Riwayat Kelas</h3>
        </div>

        <div className="overflow-hidden rounded-xl">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md">
                <th className="w-[90px] p-5 font-medium">Sesi</th>
                <th className="p-5 font-medium">Tanggal</th>
                <th className="p-5 font-medium">Jam Mulai</th>
                <th className="p-5 font-medium">Jam Akhir</th>
                <th className="p-5 font-medium">Status</th>
                <th className="w-[160px] p-5 font-medium">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {historyLoading && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">Memuat riwayat…</td>
                </tr>
              )}

              {!historyLoading && histPageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">Belum ada riwayat untuk kelas ini.</td>
                </tr>
              )}

              {!historyLoading && histPageRows.map((r) => (
                <tr key={r.sesi_id} className="border-t border-black/5 text-md">
                  <td className="px-4 py-4 pl-6">{r.sesi_ke}</td>
                  <td className="px-4 py-4">{r.date}</td>
                  <td className="px-4 py-4">{r.startClock}</td>
                  <td className="px-4 py-4">{r.endClock}</td>
                  <td className="px-4 py-4">
                    <span className={`font-semibold capitalize ${getStatusColor(r.status || '-')}`}>
                      {r.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {isBelumSelesai(r.status) ? (
                      <button
                        type="button"
                        onClick={() => console.log('Aktifkan kelas untuk sesi', r.sesi_id, '(sesi_ke:', r.sesi_ke, ')')}
                        className="rounded-full border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                      >
                        Aktifkan Kelas
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReportOpen(true)}
                        className="rounded-full border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                      >
                        Laporan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination lokal */}
        {!historyLoading && history.length > HIST_PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setHistPage(p => Math.max(1, p - 1))}
              disabled={histPage === 1}
              className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
              aria-label="Previous page"
            >
              &lt;
            </button>

            {pageWindow(Math.max(1, totalHistPages), histPage).map((p, i) =>
              p === '…' ? (
                <span key={`dots-${i}`} className="px-3 py-2 text-md text-black/40">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setHistPage(p)}
                  className={`rounded-xl border border-[var(--secondary-color)] px-3 py-1 text-md ${
                    p === histPage
                      ? 'border-(--secondary-color) bg-(--secondary-light-color) text-(--secondary-color)'
                      : 'text-black/70 hover:bg-black/5'
                  }`}
                  aria-current={p === histPage ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setHistPage(p => Math.min(totalHistPages, p + 1))}
              disabled={histPage === totalHistPages}
              className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
              aria-label="Next page"
            >
              &gt;
            </button>
          </div>
        )}
      </section>

      {/* ===== Modal: Riwayat Penilaian (Murid) ===== */}
      <StudentReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        teacherImage={hdr?.teacherAvatar || defaultUser}
        teacherName={hdr?.teacherName || 'Guru'}
        statusLabel={String((detail.item?.status ?? '') || '')}    // status murid (opsional)
        programLabel={hdr?.programName || '—'}
        instrumentLabel={hdr?.instrumentName || '—'}
        schedule={hdr?.schedule || '—'}
        nilaiKelas={hdr?.avgRating != null ? `${hdr.avgRating.toFixed(1)}/5` : '−'}
        nilaiAsli={hdr?.avgRating != null ? `${hdr.avgRating.toFixed(1)}/5` : '−'}
        rows={reportRows}
        loading={reportLoading} // ⬅️ NEW
      />
    </div>
  );
};

export default DetailStudentClassPage;
