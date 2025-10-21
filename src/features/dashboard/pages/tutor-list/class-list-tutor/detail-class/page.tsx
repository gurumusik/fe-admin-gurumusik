/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  RiArrowLeftLine, RiStarFill, RiArrowRightUpLine, RiArrowRightDownLine, RiArrowRightLine,
  RiCloseLine, RiCheckboxCircleFill
} from 'react-icons/ri';

import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/app/store';
import {
  fetchPerformaMengajarAdminThunk,
  selectPerformaMengajarAdmin,
} from '@/features/slices/rating/slice';
import type { Trend, PerformaMengajar } from '@/features/slices/rating/types';

import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import { getStatusColor } from '@/utils/getStatusColor';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import TutorReportModal, { type TutorReportRow } from '@/features/dashboard/components/TutorReportModal';
import TutorReviewModal from '@/features/dashboard/components/TutorReviewModal';
import FeedbackTutorModal from '@/features/dashboard/components/FeedbackTutorModal';

// KELAS
import {
  listGuruClasses,
  type GuruClassDTO,
  resolveAvatarUrl,
} from '@/services/api/guruClasses.api';

type LocationState = {
  studentUuid?: string;
  studentName?: string;
  classId?: string;
  tutorUuid?: string;
  prev?: { page?: number; filters?: Record<string, unknown> };

  guruId?: number;
  transaksiId?: number;
  sesiId?: number;

  // opsional: muridId bisa dikirim via state
  muridId?: number | string;
};

const PAGE_SIZE = 4 as const;

/* ========== Helpers umum ========== */
function pageWindow(total: number, current: number) {
  const out: (number | '…')[] = [];
  const push = (x: number | '…') => { if (out[out.length - 1] !== x) out.push(x); };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '…') push('…');
  }
  return out;
}

const toNum = (v: string | null | undefined): number | undefined => {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const hhmm = (t?: string | null) => {
  if (!t) return '–';
  const [h, m] = t.split(':');
  return [h ?? '00', m ?? '00'].slice(0, 2).join('.');
};

const dayName = (d?: number | string | null) => {
  if (d == null) return '–';
  if (typeof d === 'string') return d;
  const map = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return map[d] ?? String(d);
};

const toYYYYMM = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const trendColor = (t: Trend) =>
  t === 'naik'
    ? 'text-[var(--accent-green-color)]'
    : t === 'turun'
    ? 'text-red-500'
    : 'text-slate-500';

const TrendIcon: React.FC<{ trend: Trend; className?: string }> = ({ trend, className }) => {
  if (trend === 'naik') return <RiArrowRightUpLine className={className ?? ''} />;
  if (trend === 'turun') return <RiArrowRightDownLine className={className ?? ''} />;
  return <RiArrowRightLine className={className ?? ''} />;
};

const formatRating = (v: number | null | undefined) =>
  typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(1)}/5` : '−';

/* ========== Halaman ========== */
const DetailClassTutorPage: React.FC = () => {
  const tutorImage = 'test';
  const tutorName = 'tutor-name';
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: LocationState };
  const [searchParams] = useSearchParams();

  // Ambil param utama
  const guruId = state?.guruId ?? toNum(searchParams.get('guru_id'));
  const transaksiId = state?.transaksiId ?? toNum(searchParams.get('transaksi_id'));
  const month = searchParams.get('month') ?? toYYYYMM(new Date());

  // muridId: prioritas query → state → fallback dari data kelas (first.murid.id)
  const [muridId, setMuridId] = useState<number | undefined>(() => {
    const fromQuery = toNum(searchParams.get('murid_id'));
    const fromState = toNum((state as any)?.muridId);
    return fromQuery ?? fromState ?? undefined;
  });

  // ------ DATA DARI API KELAS ------
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trxRows, setTrxRows] = useState<GuruClassDTO[]>([]); // semua sesi pada transaksi ini

  const fetchAll = useCallback(async () => {
    if (!guruId || !transaksiId) {
      setLoadError('Parameter tidak lengkap (guruId/transaksiId).');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);

    try {
      const limit = 100;
      let page = 1;
      let hasNext = true;
      const bag: GuruClassDTO[] = [];

      while (hasNext) {
        const resp = await listGuruClasses({
          guruId: Number(guruId),
          page,
          limit,
          sort_by: 'sesi_ke',
          sort_dir: 'asc',
        });
        if (Array.isArray(resp.data)) bag.push(...resp.data);
        hasNext = !!resp.has_next;
        page += 1;
      }

      const onlyTrx = bag.filter((r) => r.transaksi_id === Number(transaksiId));
      setTrxRows(onlyTrx);
    } catch (e: any) {
      setLoadError(e?.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [guruId, transaksiId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ------ HEADER: ambil dari data.murid (item pertama) ------
  const first = trxRows[0];

  // fallback muridId dari data kelas jika belum ada
  useEffect(() => {
    if (!muridId && first?.murid?.id) {
      setMuridId(Number(first.murid.id));
    }
  }, [muridId, first?.murid?.id]);

  const studentImage =
    resolveAvatarUrl(first?.murid?.profile_pic_url ?? null) || '/assets/images/student.png';
  const studentName = first?.murid?.nama || 'Murid';
  const instrumentLabel =
    ((first as any)?.detail_program?.instrument?.nama as string | undefined) ??
    ((first as any)?.instrument?.nama as string | undefined) ??
    '—';

  const pickedClass = useMemo(() => {
    if (!first) return undefined as any;
    const hari = dayName(first?.jadwal?.hari);
    const start = hhmm(first?.jadwal?.waktu_mulai);
    const end = hhmm(first?.jadwal?.waktu_selesai);
    const schedule = hari !== '–' && start !== '–' && end !== '–'
      ? `Setiap ${hari} | ${start} - ${end}`
      : 'Setiap — | — - —';

    return {
      id: `${first.transaksi_id}`,
      program: first?.program?.nama ?? '—',
      instrument: instrumentLabel,
      schedule,
    };
  }, [first, instrumentLabel]);

  // ------ RIWAYAT KELAS (map ke UI) ------
  type StudentClassHistoryItem = {
    session: string;
    date: string;
    startClock: string;
    endClock: string;
    status: string;
  };

  const allHistory: StudentClassHistoryItem[] = useMemo(() => {
    if (!trxRows.length) return [];
    return [...trxRows]
      .sort((a, b) => (a.sesi_ke ?? 0) - (b.sesi_ke ?? 0))
      .map((r) => {
        const date = (r as any).tanggal_sesi || '—';
        return {
          session: r.sesi_label ?? `${r.sesi_ke}`,
          date,
          startClock: hhmm(r?.waktu_mulai),
          endClock: hhmm(r?.waktu_selesai),
          status: (r as any).status ?? '—',
        };
      });
  }, [trxRows]);

  // ------ State UI report/review/feedback ------
  const [reportOpen, setReportOpen] = useState(false);
  const [reportRows, setReportRows] = useState<TutorReportRow[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; type: 'success' | 'error' }>({
    open: false,
    type: 'success',
  });

  const openReport = useCallback(() => {
    setReportRows([
      { no: 1, nilai: '4.5/5', date: '04/08/2025', status: 'Tampil' },
      { no: 2, nilai: '4.5/5', date: '04/08/2025', status: 'Tampil' },
    ]);
    setReportOpen(true);
  }, []);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRow, setReviewRow] = useState<TutorReportRow | null>(null);
  const handleReviewFromReport = useCallback((row: TutorReportRow) => {
    setReportOpen(false);
    setReviewRow(row);
    setReviewOpen(true);
  }, []);


  // ------ Pagination ------
  const [page, setPage] = useState(1);
  const { totalPages, pageRows } = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(allHistory.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    return { totalPages, pageRows: allHistory.slice(start, start + PAGE_SIZE) };
  }, [allHistory, page]);

  const goTo = useCallback((p: number) => setPage(Math.min(Math.max(1, p), totalPages)), [totalPages]);
  const prev = useCallback(() => goTo(page - 1), [goTo, page]);
  const next = useCallback(() => goTo(page + 1), [goTo, page]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else {
      navigate('/dashboard-admin/tutor-list/class-list-tutor', {
        state: { ...(state?.prev ? { prev: state.prev } : {}) },
        replace: true,
      });
    }
  }, [navigate, state?.prev]);


  /* ========== ⬇️ FETCH PERFORMA MENGAJAR (NEW) ========== */
  const dispatch = useDispatch<AppDispatch>();
  const perfState = useSelector(selectPerformaMengajarAdmin);
  const perfData = perfState.data;

  useEffect(() => {
    // Admin: kirim guruId; Guru: biarkan undefined
    const args: { guruId?: number | string; month?: string; muridId?: number | string } = {
      guruId: guruId ?? undefined,
      month,
    };
    if (muridId) args.muridId = muridId;
    dispatch(fetchPerformaMengajarAdminThunk(args));
  }, [dispatch, guruId, month, muridId]);

  // Sumber data untuk kartu: gunakan student_scope jika ada, kalau tidak fallback ke overall
  const perfSource = useMemo(() => {
    if (!perfData) return null;
    return (perfData.student_scope ?? perfData) as Pick<
      PerformaMengajar,
      'average_rating' | 'class_rating' | 'categories'
    > & { murid_id?: number };
  }, [perfData]);

  /* ================= RENDER ================= */
  if (loadError) {
    return (
      <div className="rounded-2xl bg-white p-6">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-[var(--secondary-color)] hover:bg-neutral-50"
        >
          <RiArrowLeftLine />
          Kembali
        </button>
        <div className="mt-6 text-red-600">{loadError}</div>
      </div>
    );
  }

  if (!guruId || !transaksiId) {
    return (
      <div className="rounded-2xl bg-white p-6">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-[var(--secondary-color)] hover:bg-neutral-50"
        >
          <RiArrowLeftLine />
          Kembali
        </button>
        <div className="mt-6 text-neutral-600">Parameter tidak lengkap.</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ====== HEADER ====== */}
      <header className="sticky top-20 z-40 -m-6 mb-6 px-6 border-t bg-white border-black/10 rounded-b-3xl">
        <div className="py-3 flex items-center justify-between gap-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-3 py-1.5 text-sm text-[var(--secondary-color)] hover:bg-black/5"
          >
            <RiArrowLeftLine className="text-lg" />
            Kembali
          </button>

          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <img
                src={studentImage}
                alt={studentName}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-black/5"
              />
              <div className="flex flex-col">
                <div className="font-semibold text-md text-neutral-900">{studentName}</div>
                <div className="mt-1 inline-flex items-center gap-2">
                  <img
                    src={getInstrumentIcon((instrumentLabel || '').toLowerCase())}
                    alt={instrumentLabel}
                    className="h-5 w-5"
                  />
                  <span className="text-sm text-neutral-700">{instrumentLabel}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="rounded-full bg-(--primary-color) px-6 py-2 text-sm font-semibold text-black hover:brightness-95"
          >
            Beri Masukan
          </button>
        </div>
      </header>

      {/* ===== Performa (DINAMIS dari endpoint) ===== */}
      <section className="rounded-2xl bg-white p-4 md:p-6 mb-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-[var(--primary-color)] text-white w-9 h-9">
            <RiStarFill size={20} />
          </span>
          <h2 className="text-lg font-semibold text-neutral-900">Performa Mengajar</h2>
        </div>

        {/* Loading / error kecil khusus performa */}
        {perfState.status === 'loading' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        )}

        {perfState.status === 'failed' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {perfState.error ?? 'Gagal memuat performa.'}
          </div>
        )}

        {perfState.status === 'succeeded' && perfSource && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              // Nilai Kelas
              {
                key: 'nilaiKelas',
                title: perfData?.student_scope ? 'Nilai Kelas' : 'Nilai Kelas',
                valueNode: (
                  <span className="inline-flex items-center gap-2">
                    <RiStarFill className="text-[var(--primary-color)]" />
                    <span className="font-semibold">{formatRating(perfSource.class_rating.this_month)}</span>
                  </span>
                ),
                deltaLabel: perfSource.class_rating.delta_label,
                trend: perfSource.class_rating.trend as Trend,
                bg: 'bg-[#E9F7F0]',
              },
              // Kategori
              ...(['DISCIPLINE','COMMUNICATION','TEACHING'] as const).map((code) => {
                const cat = perfSource.categories.find((c) => c.code === code);
                const title =
                  code === 'DISCIPLINE' ? 'Kedisiplinan' :
                  code === 'COMMUNICATION' ? 'Komunikasi' :
                  'Cara Mengajar';
                const bg =
                  code === 'DISCIPLINE' ? 'bg-[#FFE9EA]' :
                  code === 'COMMUNICATION' ? 'bg-[#EEE9FF]' :
                  'bg-[#E7F2FF]';
                return {
                  key: code,
                  title: perfData?.student_scope ? `${title}` : title,
                  valueNode: <span className="font-semibold">{typeof cat?.this_month_percent === 'number' ? `${cat.this_month_percent}%` : '−'}</span>,
                  deltaLabel: cat?.delta_label ?? null,
                  trend: cat?.trend ?? null,
                  bg,
                };
              })
            ].map((m) => (
              <div key={m.key} className={`rounded-2xl ${m.bg} p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]`}>
                <div className="text-md text-neutral-900 mb-2">{m.title}</div>
                <div className="text-2xl text-neutral-900">{m.valueNode}</div>
                {m.deltaLabel ? (
                  <div className={`mt-1 inline-flex items-center text-[14px] ${trendColor(m.trend)}`}>
                    <TrendIcon trend={m.trend} className="text-[20px]" />
                    <span className="ml-1">{m.deltaLabel}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ====== RIWAYAT KELAS ====== */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-neutral-900">Riwayat Kelas</h3>

          {/* (Filter status dummy, tetap) */}
          <select className="rounded-xl border w-[200px] border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)">
            <option>Pilih Status</option>
            <option>Selesai Tepat Waktu</option>
            <option>Selesai Terlambat</option>
            <option>Dialihkan Ke Guru Lain</option>
            <option>Belum Selesai</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-xl">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md">
                <th className="w-[80px] p-5 font-medium">Sesi</th>
                <th className="p-5 font-medium">Tanggal</th>
                <th className="p-5 font-medium">Jam Mulai</th>
                <th className="p-5 font-medium">Jam Akhir</th>
                <th className="p-5 font-medium">Status</th>
                <th className="p-5 font-medium">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">memuat data…</td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    Belum ada riwayat untuk kelas ini.
                  </td>
                </tr>
              ) : (
                pageRows.map((h, idx) => (
                  <tr key={`${transaksiId}-${page}-${idx}`} className="border-t border-black/5 text-md">
                    <td className="px-4 py-4">{h.session}</td>
                    <td className="px-4 py-4">{h.date}</td>
                    <td className="px-4 py-4">{h.startClock}</td>
                    <td className="px-4 py-4">{h.endClock}</td>
                    <td className="px-4 py-4">
                      <div className={`font-semibold ${getStatusColor(h.status)}`}>{h.status}</div>
                    </td>
                    <td className="px-4 py-4">
                      {h.status === 'Belum Selesai' ? (
                        <button
                          type="button"
                          className="rounded-full border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                        >
                          Aktifkan Kelas
                        </button>
                      ) : (
                        (() => {
                          const disabled = /dialihkan/i.test(String(h.status));
                          return (
                            <button
                              type="button"
                              onClick={!disabled ? openReport : undefined}
                              disabled={disabled}
                              className={`rounded-full border border-(--secondary-color) px-4 py-1.5 text-sm font-medium ${
                                disabled
                                  ? 'text-(--secondary-color) opacity-50 cursor-not-allowed'
                                  : 'text-(--secondary-color) hover:bg-(--secondary-light-color)'
                              }`}
                              title={disabled ? 'Laporan tidak tersedia untuk status Dialihkan' : 'Laporan'}
                            >
                              Laporan
                            </button>
                          );
                        })()
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={prev}
            disabled={page === 1 || loading}
            className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
            aria-label="Previous page"
          >
            &lt;
          </button>

          {pageWindow(totalPages, page).map((p, i) =>
            p === '…' ? (
              <span key={`dots-${i}`} className="px-3 py-2 text-md text-black/40">…</span>
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
            disabled={page === totalPages || loading}
            className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      </section>

      {/* ===== Modals ===== */}
      <TutorReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        tutorImage={tutorImage}
        tutorName={tutorName}
        statusLabel="Aktif"
        programLabel={pickedClass?.program ?? 'ABK'}
        instrumentLabel={instrumentLabel}
        schedule={pickedClass?.schedule ?? 'Setiap Kamis | 14.00 - 14.45'}
        nilaiKelas="4.5/5"
        nilaiAsli="4.5/5"
        rows={reportRows}
        onReview={handleReviewFromReport}
      />

      <TutorReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        tutorImage={tutorImage}
        tutorName={tutorName}
        instrumentLabel={instrumentLabel}
        schedule={pickedClass?.schedule ?? 'Setiap Kamis | 14.00 - 14.45'}
        programLabel={pickedClass?.program ?? 'ABK'}
        nilaiKelas="4.5/5"
        nilaiAsli="4.5/5"
        row={reviewRow}
      />

      <FeedbackTutorModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={async ()=>{ setFeedbackOpen(false); setConfirm({ open: true, type: 'success' }); }}
      />

      <ConfirmationModal
        isOpen={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        icon={confirm.type === 'success' ? <RiCheckboxCircleFill /> : <RiCloseLine />}
        iconTone={confirm.type === 'success' ? 'success' : 'danger'}
        title={confirm.type === 'success' ? 'Masukan berhasil dikirim' : 'Masukan Berhasil Ditolak'}
        texts={[
          confirm.type === 'success'
            ? 'Data berhasil disimpan dan notifikasi telah dikirim ke guru'
            : 'Terjadi kendala saat mengirim masukan. Silakan coba lagi beberapa saat lagi.',
        ]}
      />
    </div>
  );
};

export default DetailClassTutorPage;
