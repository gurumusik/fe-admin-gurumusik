/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/dashboard/pages/promo/DetailPromoPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine, RiCalendar2Line,
  RiCouponFill, RiDownloadLine, RiCheckboxCircleFill, RiCloseLine, RiQuestionFill,
  RiArrowLeftLine
} from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';

import ProgramAvatarBadge from '@/components/ui/badge/ProgramAvatarBadge';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import AddPromoModal, { type AddPromoPayload } from '../../../components/AddPromoModal';
import ConfirmationModal, { type ConfirmationModalProps } from '@/components/ui/common/ConfirmationModal';
import defaultUser from '@/assets/images/default-user.png';

import { getPromo, updatePromo, getHeadlineAvail } from '@/services/api/promo.api';
import type { ApiPromo } from '@/features/slices/promo/types';

import {
  fetchTxByPromoThunk,
  setQuery as setTxQuery,
  setStatusFilter as setTxStatusFilter,
  setCategory as setTxCategory,
  setRange as setTxRange,
  setPage as setTxPage,
  setLimit as setTxLimit,
} from '@/features/slices/transaksi/slice';
import type { TxRange, TxStatusLabel } from '@/features/slices/transaksi/types';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

// =================== Helpers UI ===================
type TxStatus = 'Success' | 'On Progress' | 'Failed' | 'Expired' | 'Canceled';
const currency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const toID = (iso: string) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const statusPill = (s: TxStatus | string) =>
  s === 'Success'
    ? 'text-[var(--accent-green-color)]'
    : s === 'On Progress'
    ? 'text-[var(--primary-color)]'
    : 'text-[var(--accent-red-color)]';

function pageWindow(total: number, current: number) {
  const out: (number | '…')[] = [];
  const push = (x: number | '…') => { if (out[out.length - 1] !== x) out.push(x); };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '…') push('…');
  }
  return out;
}

function mapApiPromoToModal(p: ApiPromo): AddPromoPayload {
  return {
    code: p.kode_promo ?? '',
    title: p.title ?? '',
    notesHtml: (p as any).notes ?? '',
    bannerHeadline: p.headline_text ?? '',
    discountPct: Number(p.persentase_diskon || 0),
    maxUsage: Number(p.max_usage || 1),
    startDate: p.started_at ? String(p.started_at).slice(0, 10) : '',
    endDate: p.expired_at ? String(p.expired_at).slice(0, 10) : '',
  };
}

// Tabs fix 2 opsi saja
const tabOptions = ['Kursus', 'Modul'] as const;

// type chip + capitalize util
const typeChipCls = (t: string) =>
  String(t).toLowerCase() === 'video'
    ? 'bg-[var(--accent-orange-color)] text-white'
    : 'bg-[var(--accent-purple-color)] text-white';

const capWords = (s?: string) =>
  (s ?? '')
    .toString()
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());

/** ===== util tanggal utk filter server ===== */
function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function computeDateRange(range: TxRange): { date_from?: string; date_to?: string } {
  if (range === 'ALL') return {};
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // normalize 00:00
  const start = new Date(end);
  if (range === '30D') start.setDate(end.getDate() - 29);
  else if (range === '90D') start.setDate(end.getDate() - 89);
  return { date_from: toYmd(start), date_to: toYmd(end) };
}

// NOTE: promo hanya pakai tanggal (tanpa jam). Kirim YYYY-MM-DD agar BE set start/end of day.

const DetailPromoPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const location = useLocation() as { state?: { promoId?: number | string; code?: string; discountPct?: number }; search: string };
  const state = location.state;
  const searchParams = new URLSearchParams(location.search);
  const promoIdFromQuery = searchParams.get('id');
  const promoId = state?.promoId ?? promoIdFromQuery ?? null;

  // ======= detail promo header =======
  const [promo, setPromo] = useState<ApiPromo | null>(null);
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [errorPromo, setErrorPromo] = useState<string | null>(null);

  const [currentPromo, setCurrentPromo] = useState<Partial<AddPromoPayload>>({
    code: state?.code ?? 'GURUMUSIK',
    discountPct: state?.discountPct ?? 50,
    startDate: '2025-08-01',
    endDate: '2025-09-01',
  });

  const [isActive, setIsActive] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Headline states
  const [isHeadline, setIsHeadline] = useState<boolean>(false);
  const [headlineToggling, setHeadlineToggling] = useState<boolean>(false);
  const [headlineChecking, setHeadlineChecking] = useState<boolean>(false);

  const [confirm, setConfirm] = useState<ConfirmationModalProps>({
    isOpen: false,
    onClose: () => setConfirm((c) => ({ ...c, isOpen: false })),
    title: '',
    texts: [],
    icon: null,
    iconTone: 'neutral',
    align: 'center',
  });
  const closeConfirm = () => setConfirm((c) => ({ ...c, isOpen: false }));
  const setPrimaryLoading = (loading: boolean) =>
    setConfirm((c) => (c.button1 ? { ...c, button1: { ...c.button1, loading } } : c));

  // ======= call detail promo =======
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!promoId) return;
      try {
        setLoadingPromo(true);
        setErrorPromo(null);

        const resp = await getPromo(promoId);
        if (cancelled) return;

        const p = resp.data;
        setPromo(p);

        setCurrentPromo((prev) => ({
          ...prev,
          code: p.kode_promo || prev.code,
          discountPct: Number.isFinite(p.persentase_diskon) ? Number(p.persentase_diskon) : prev.discountPct,
          startDate: p.started_at ? String(p.started_at).slice(0, 10) : prev.startDate,
          endDate: p.expired_at ? String(p.expired_at).slice(0, 10) : prev.endDate,
        }));

        setIsActive(String(p.status).toLowerCase() === 'active');
        setIsHeadline(Boolean(p.is_headline_promo));
      } catch (err: any) {
        if (cancelled) return;
        setErrorPromo(err?.message || 'Gagal memuat detail promo');
      } finally {
        if (!cancelled) setLoadingPromo(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [promoId]);

  // ======= Toggle aktif/non-aktif promo =======
  const openDeactivateConfirm = () => {
    setConfirm({
      isOpen: true,
      icon: <RiQuestionFill />,
      onClose: closeConfirm,
      iconTone: 'warning',
      title: 'Yakin...Mau Menon-Aktif Kode Promo?',
      texts: ['Jika dinonaktifkan, kode promo ini tidak bisa digunakan lagi oleh murid.'],
      button2: { label: 'Batal', variant: 'outline', onClick: closeConfirm },
      button1: {
        label: 'Ya, Non-aktifkan',
        variant: 'primary',
        onClick: async () => {
          if (!promoId) return;
          try {
            setPrimaryLoading(true);
            setToggling(true);
            await updatePromo(promoId, { status: 'inactive' });
            const refreshed = await getPromo(promoId);
            const p = refreshed.data;
            setPromo(p);
            setIsActive(String(p.status).toLowerCase() === 'active');
            setConfirm({
              isOpen: true, onClose: closeConfirm,
              icon: <RiCheckboxCircleFill />, iconTone: 'success',
              title: 'Kode Promo Berhasil Dinon-aktifkan',
              texts: ['Kode promo ini sudah tidak bisa digunakan lagi oleh murid.'],
              align: 'center',
            });
          } catch (e: any) {
            setConfirm({
              isOpen: true, onClose: closeConfirm,
              icon: <RiCloseLine />, iconTone: 'danger',
              title: 'Kode Promo Gagal Dinon-aktifkan',
              texts: [e?.message || 'Terjadi kendala saat menonaktifkan kode promo. Coba lagi beberapa saat lagi.'],
              align: 'center',
            });
          } finally {
            setPrimaryLoading(false);
            setToggling(false);
          }
        },
      },
    });
  };

  const openActivateFlow = () => setActivateOpen(true);

  const handleActivateSubmit = async (data: AddPromoPayload) => {
    if (!promoId) return;
    setActivateOpen(false);
    try {
      setToggling(true);
      await updatePromo(promoId, {
        status: 'active',
        kode_promo: data.code?.trim(),
        title: data.title?.trim(),
        notes: data.notesHtml ?? null,
        headline_text: data.bannerHeadline ?? null,
        persentase_diskon: Number(data.discountPct),
        max_usage: Number(data.maxUsage),
        started_at: data.startDate || null,
        expired_at: data.endDate || null,
      });
      const refreshed = await getPromo(promoId);
      const p = refreshed.data;
      setPromo(p);
      setIsActive(true);
      setCurrentPromo((prev) => ({
        ...prev,
        code: p.kode_promo || prev.code,
        discountPct: Number(p.persentase_diskon || prev.discountPct || 0),
        startDate: p.started_at ? String(p.started_at).slice(0, 10) : prev.startDate,
        endDate: p.expired_at ? String(p.expired_at).slice(0, 10) : prev.endDate,
      }));

      setConfirm({
        isOpen: true, onClose: closeConfirm,
        icon: <RiCheckboxCircleFill />, iconTone: 'success',
        title: 'Promo berhasil Diaktifkan.',
        texts: ['Promo sudah diaktifkan dan dapat digunakan sesuai periode yang ditentukan.'],
        align: 'center',
      });
    } catch (e: any) {
      setConfirm({
        isOpen: true,
        onClose: closeConfirm,
        icon: <RiCloseLine />,
        iconTone: 'danger',
        title: 'Promo gagal diaktifkan',
        texts: [e?.message || 'Terjadi kendala saat menyimpan promo. Silakan coba lagi beberapa saat lagi.'],
        align: 'center',
      });
    } finally {
      setToggling(false);
    }
  };

  // ======= Toggle Headline ON/OFF =======
  const handleToggleHeadline = async () => {
    if (!promoId) return;
    const nextVal = !isHeadline;
    const nextCode = promo?.kode_promo ?? state?.code ?? '-';

    const runActivateHeadline = async () => {
      try {
        setHeadlineToggling(true);
        await updatePromo(promoId, { is_headline_promo: true });
        const refreshed = await getPromo(promoId);
        const p = refreshed.data;
        setPromo(p);
        setIsHeadline(Boolean(p.is_headline_promo));
        setConfirm({
          isOpen: true,
          onClose: closeConfirm,
          icon: <RiCheckboxCircleFill />,
          iconTone: 'success',
          title: 'Headline promo diaktifkan',
          texts: ['Status headline sekarang: ON.'],
          align: 'center',
          button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
        });
      } catch (e: any) {
        setConfirm({
          isOpen: true,
          onClose: closeConfirm,
          icon: <RiCloseLine />,
          iconTone: 'danger',
          title: 'Gagal mengaktifkan headline promo',
          texts: [e?.message || 'Terjadi kendala saat menyimpan perubahan.'],
          align: 'center',
          button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
        });
      } finally {
        setHeadlineToggling(false);
      }
    };

    const runDeactivateHeadline = async () => {
      try {
        setHeadlineToggling(true);
        await updatePromo(promoId, { is_headline_promo: false });
        const refreshed = await getPromo(promoId);
        const p = refreshed.data;
        setPromo(p);
        setIsHeadline(Boolean(p.is_headline_promo));
        setConfirm({
          isOpen: true,
          onClose: closeConfirm,
          icon: <RiCheckboxCircleFill />,
          iconTone: 'success',
          title: 'Headline promo dimatikan',
          texts: ['Status headline sekarang: OFF.'],
          align: 'center',
          button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
        });
      } catch (e: any) {
        setConfirm({
          isOpen: true,
          onClose: closeConfirm,
          icon: <RiCloseLine />,
          iconTone: 'danger',
          title: 'Gagal mematikan headline promo',
          texts: [e?.message || 'Terjadi kendala saat menyimpan perubahan.'],
          align: 'center',
          button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
        });
      } finally {
        setHeadlineToggling(false);
      }
    };

    const openHeadlineConfirm = (currentCode: string, action: () => Promise<void>) => {
      const verb = nextVal ? 'Mengaktifkan' : 'Menonaktifkan';
      setConfirm({
        isOpen: true,
        onClose: closeConfirm,
        icon: <RiQuestionFill />,
        iconTone: 'warning',
        title: `Yakin...${verb} Headline Promo ${nextCode}?`,
        texts: [`Saat ini kode promo ${currentCode} yang aktif sebagai headline.`],
        align: 'center',
        button2: { label: 'Ga jadi deh', variant: 'outline', onClick: closeConfirm },
        button1: {
          label: 'Ya, Saya Yakin',
          variant: 'primary',
          onClick: async () => {
            closeConfirm();
            await action();
          },
        },
      });
    };

    // Matikan headline → confirm dulu
    if (!nextVal) {
      const currentCode = promo?.kode_promo ?? state?.code ?? '-';
      openHeadlineConfirm(currentCode, runDeactivateHeadline);
      return;
    }

    // Nyalakan headline → cek status headline saat ini lalu confirm
    try {
      setHeadlineChecking(true);
      const availResp = await getHeadlineAvail();
      const { current } = availResp.data || { current: null };
      const currentPromo = current && typeof current === 'object' ? (current as any) : null;
      const currentCode = currentPromo?.kode_promo || '-';
      openHeadlineConfirm(currentCode, runActivateHeadline);
      return;
    } catch (e: any) {
      setConfirm({
        isOpen: true,
        onClose: closeConfirm,
        icon: <RiCloseLine />,
        iconTone: 'danger',
        title: 'Gagal memeriksa status headline',
        texts: [e?.message || 'Tidak dapat memastikan promo headline saat ini. Coba lagi.'],
        align: 'center',
        button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
      });
      return;
    } finally {
      setHeadlineChecking(false);
    }
  };

  // ======= SELECTOR transaksi by promo
  const tx = useSelector((s: any) => s.transaksiByPromo ?? s.transaksi ?? {});
  const {
    items = [],
    total = 0,
    page = 1,
    limit = 5,
    q = '',
    statusFilter = 'ALL',
    category = 'ALL',
    range = 'ALL', // default ALL
    status: listStatus = 'idle',
    error,
  } = tx;

  // Paksa kategori valid (UI tabel hanya 2 mode)
  useEffect(() => {
    if (category !== 'Kursus' && category !== 'Modul') {
      dispatch(setTxCategory('Kursus') as any); // default tampilan
    }
  }, [category, dispatch]);

  // ======= Fetch list (WITH working filters)
  useEffect(() => {
    if (!promoId) return;
    const { date_from, date_to } = computeDateRange(range as TxRange);
    dispatch(fetchTxByPromoThunk({
      promoId,
      params: {
        page,
        limit,
        q: q || undefined,                         // search
        status_label: statusFilter !== 'ALL' ? statusFilter : undefined, // status label (dimap di thunk)
        category: category !== 'ALL' ? category : undefined,             // tab
        range,                                     // kirim flag range
        date_from,                                 // tanggal awal (YYYY-MM-DD)
        date_to,                                   // tanggal akhir (YYYY-MM-DD)
      },
    }) as any);
  }, [dispatch, promoId, page, limit, q, statusFilter, category, range]);

  // ======= Derive items (client guard by type)
  const baseByCategory = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    const want = String(category || 'Kursus').toLowerCase();
    return arr.filter((t: any) =>
      String(t?.type ?? t?.type_label ?? '').toLowerCase() === want
    );
  }, [items, category]);

  // ======= FE fallback: Search & Status (kalau BE belum support)
  const qLower = (q || '').trim().toLowerCase();

  const itemsSearchFiltered = useMemo(() => {
    if (!qLower) return baseByCategory;
    return baseByCategory.filter((t: any) => {
      const student =
        (t.student?.name || t.student_name || t.murid?.nama || '').toLowerCase();
      const title =
        (t.module?.title || t.module_title || t.modul?.judul || t.paket?.nama_paket || '').toLowerCase();
      const instrument =
        (t.instrument?.name || t.instrument_name || t.detailProgram?.instrument?.nama_instrumen || '').toLowerCase();
      return [student, title, instrument].some((s) => s.includes(qLower));
    });
  }, [baseByCategory, qLower]);

  const itemsStatusFiltered = useMemo(() => {
    if (!statusFilter || statusFilter === 'ALL') return itemsSearchFiltered;
    const want = String(statusFilter).toLowerCase();
    return itemsSearchFiltered.filter((t: any) =>
      String(t.status_label || '').toLowerCase() === want
    );
  }, [itemsSearchFiltered, statusFilter]);

  const rows = itemsStatusFiltered; // gunakan rows untuk render

  const isModuleView = String(category).toLowerCase() === 'modul';

  // ======= Summary sync dgn tabel
  const totalTransactions = rows.length;

  // diskon untuk rekap (ambil dari promo jika ada)
  const discountPctRaw = Number(currentPromo.discountPct ?? promo?.persentase_diskon ?? 0);
  const discountPct = Math.min(100, Math.max(0, discountPctRaw));

  const totalTable = useMemo(
    () => rows.reduce((sum: number, t: any) => sum + Number(t.price ?? t.total_harga ?? 0), 0),
    [rows]
  );

  const totalDiscount = useMemo(
    () => Math.round(totalTable * (discountPct / 100)),
    [totalTable, discountPct]
  );

  // ======= Pagination helper (pakai server pagination)
  const totalPages = Math.max(1, Math.ceil(Number(total || 0) / Number(limit || 5)));
  const pages = pageWindow(totalPages, Number(page || 1));

  const handleEditSubmit = async (data: AddPromoPayload) => {
    try {
      if (!promoId) throw new Error('promoId tidak ditemukan');
      await updatePromo(promoId, {
        kode_promo: data.code?.trim(),
        title: data.title?.trim(),
        notes: data.notesHtml ?? null,
        headline_text: data.bannerHeadline ?? null,
        persentase_diskon: Number(data.discountPct),
        max_usage: Number(data.maxUsage),
        started_at: data.startDate || null,
        expired_at: data.endDate || null,
      });
      setEditOpen(false);
      const refreshed = await getPromo(promoId);
      const p = refreshed.data;
      setPromo(p);
      setIsActive(String(p.status || '').toLowerCase() === 'active');
      setIsHeadline(Boolean(p.is_headline_promo));
      setCurrentPromo(prev => ({
        ...prev,
        code: p.kode_promo || prev.code,
        discountPct: Number.isFinite(p.persentase_diskon) ? Number(p.persentase_diskon) : prev.discountPct,
        startDate: p.started_at ? String(p.started_at).slice(0, 10) : prev.startDate,
        endDate: p.expired_at ? String(p.expired_at).slice(0, 10) : prev.endDate,
      }));
      setConfirm({
        isOpen: true, onClose: closeConfirm,
        icon: <RiCheckboxCircleFill />, iconTone: 'success',
        title: 'Promo berhasil diubah!',
        texts: ['Promo sudah diperbarui dan dapat digunakan sesuai periode yang ditentukan.'],
        align: 'center',
        button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
      });
    } catch (e: any) {
      setConfirm({
        isOpen: true, onClose: closeConfirm,
        icon: <RiCloseLine />, iconTone: 'danger',
        title: 'Promo gagal diubah',
        texts: [e?.message || 'Terjadi kendala saat menyimpan perubahan. Coba lagi beberapa saat lagi.'],
        align: 'center',
        button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
      });
    }
  };

  const displayedCode = promo?.kode_promo ?? state?.code ?? currentPromo.code ?? '-';
  const handleToggleClick = isActive ? openDeactivateConfirm : openActivateFlow;

  // ======= Render
  return (
    <div className="w-full space-y-5">
      {/* Header / Rekap */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              className="text-[var(--secondary-color)] w-9 h-9 rounded-xl border border-neutral-300 flex justify-center items-center"
              onClick={() => navigate(-1)}
            >
              <RiArrowLeftLine size={20} />
            </button>
            <span className="grid size-10 place-items-center rounded-full bg-(--primary-color)">
              <RiCouponFill />
            </span>
            <h2 className="text-lg font-semibold text-neutral-900">Rekap Kode Promo</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Headline ON/OFF toggle */}
            <button
              onClick={handleToggleHeadline}
              disabled={loadingPromo || !promoId || headlineToggling || headlineChecking}
              aria-pressed={isHeadline}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition enabled:hover:bg-black/5 disabled:opacity-50 ${
                isHeadline
                  ? 'border-[var(--accent-green-color)] text-[var(--accent-green-color)]'
                  : 'border-black/30 text-black/70'
              }`}
              title="Jadikan promo ini sebagai Headline di halaman depan"
            >
              {headlineChecking
                ? 'Memeriksa…'
                : headlineToggling
                ? 'Menyimpan…'
                : `Headline: ${isHeadline ? 'ON' : 'OFF'}`}
            </button>

            {isActive && (
              <button
                onClick={() => setEditOpen(true)}
                disabled={loadingPromo || toggling}
                className="rounded-full border border-[var(--secondary-color)] px-4 py-1.5 text-sm font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/20 disabled:opacity-50"
              >
                Edit
              </button>
            )}

            <button
              onClick={handleToggleClick}
              disabled={loadingPromo || !promoId || toggling}
              className={`text-md cursor-pointer rounded-full border p-1 px-4 disabled:opacity-50 ${
                isActive
                  ? 'border-[var(--accent-red-color)] text-[var(--accent-red-color)]'
                  : 'border-[var(--secondary-color)] text-[var(--secondary-color)]'
              }`}
            >
              {isActive ? 'Non - Aktifkan' : 'Aktifkan Promo'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--primary-light-color)] px-4 py-4">
            <div className="text-md text-neutral-900">Kode Promo</div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900">
              {loadingPromo ? 'Memuat…' : displayedCode}{' '}
              {!isActive && <span className="text-sm font-medium text-red-500">(Non-aktif)</span>}
            </div>
            {errorPromo && <div className="mt-1 text-sm text-red-500">{errorPromo}</div>}
          </div>

          <div className="rounded-xl bg-[var(--accent-green-light-color)] px-4 py-4">
            <div className="text-md text-neutral-900">Jumlah Transaksi</div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900">
              {listStatus === 'loading' ? 'Memuat…' : totalTransactions}
            </div>
          </div>

          <div className="rounded-xl bg-[var(--accent-red-light-color)] px-4 py-4">
            <div className="text-md text-neutral-900">Pengeluaran Promo</div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900">
              {listStatus === 'loading' ? 'Memuat…' : currency(totalDiscount)}
            </div>
          </div>
        </div>
      </section>

      {/* Riwayat Transaksi */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <h2 className="text-xl font-semibold text-neutral-900">Riwayat Transaksi</h2>

        {/* Toolbar */}
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
          {/* chips (radio-like) */}
          <div className="flex items-center gap-2">
            {tabOptions.map((t) => (
              <button
                key={t}
                onClick={() => {
                  if (category !== t) {
                    dispatch(setTxPage(1) as any);
                    dispatch(setTxCategory(t) as any);
                  }
                }}
                className={`rounded-full px-4 py-1.5 text-sm border ${
                  category === t
                    ? 'border-[var(--secondary-color)] bg-[var(--secondary-color)]/20'
                    : 'border-black/15 hover:bg-black/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* search */}
          <div className="flex-1 flex justify-end">
            <div className="relative w-full md:w-3/4">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                <RiSearchLine />
              </span>
              <input
                value={q ?? ''}
                onChange={(e) => {
                  dispatch(setTxPage(1) as any);
                  dispatch(setTxQuery(e.target.value) as any); // Search filter
                }}
                className="w-full rounded-full border border-black/15 pl-9 pr-4 py-2 outline-none placeholder:text-neutral-600"
                placeholder="Cari Transaksi: cth: Murid Satu / Judul Modul"
              />
            </div>
          </div>

          {/* filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={statusFilter ?? 'ALL'}
                onChange={(e) => {
                  dispatch(setTxPage(1) as any);
                  dispatch(setTxStatusFilter(e.target.value as TxStatusLabel | 'ALL') as any); // Status filter
                }}
                className="appearance:none rounded-full border border-black/15 px-3 py-2.5 pr-8 text-sm outline-none"
              >
                <option value="ALL">Status</option>
                <option value="Success">Success</option>
                <option value="On Progress">On Progress</option>
                <option value="Failed">Failed</option>
                <option value="Expired">Expired</option>
                <option value="Canceled">Canceled</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">▾</span>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-color)]">
                <RiCalendar2Line />
              </span>
              <select
                value={range ?? 'ALL'} // default ALL
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  dispatch(setTxPage(1));
                  dispatch(setTxRange(e.currentTarget.value as TxRange)); // Date (range) filter
                }}
                className="appearance-none rounded-full border border-black/15 pl-9 pr-8 py-2.5 text-sm outline-none"
              >
                <option value="30D">30 Hari Terakhir</option>
                <option value="90D">90 Hari Terakhir</option>
                <option value="ALL">Semua Waktu</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">▾</span>
            </div>
          </div>
        </div>

        {/* Error state */}
        {listStatus === 'failed' && (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-red-700 text-sm">
            {error || 'Gagal memuat transaksi.'}
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl mt-6">
          <table className="w-full table-fixed">
            <thead>
              {isModuleView ? (
                <tr className="bg-neutral-100 text-left text-md text-neutral-900">
                  <th className="w-[120px] p-5 font-semibold">Gambar</th>
                  <th className="p-5 font-semibold">Nama Modul</th>
                  <th className="p-5 font-semibold">Tipe Modul</th>
                  <th className="p-5 font-semibold">Harga</th>
                  <th className="p-5 font-semibold">Pembeli</th>
                  <th className="p-5 font-semibold">Tanggal</th>
                  <th className="p-5 font-semibold">Status</th>
                  <th className="p-5 font-semibold">Aksi</th>
                </tr>
              ) : (
                <tr className="bg-neutral-100 text-left text-md text-neutral-900">
                  <th className="w-[120px] p-5 font-semibold">Profile</th>
                  <th className="p-5 font-semibold">Nama Siswa</th>
                  <th className="p-5 font-semibold">Paket</th>
                  <th className="p-5 font-semibold">Harga</th>
                  <th className="p-5 font-semibold">Tanggal</th>
                  <th className="p-5 font-semibold">Status</th>
                  <th className="p-5 font-semibold">Aksi</th>
                </tr>
              )}
            </thead>

            <tbody>
              {listStatus === 'loading' ? (
                <tr>
                  <td colSpan={isModuleView ? 8 : 7} className="p-6 text-center text-neutral-500">Memuat…</td>
                </tr>
              ) : !rows || rows.length === 0 ? (
                <tr>
                  <td colSpan={isModuleView ? 8 : 7} className="p-6 text-center text-neutral-500">Tidak ada data</td>
                </tr>
              ) : (
                rows.map((t: any, idx: number) => {
                  const price = Number(t.price ?? t.total_harga ?? 0);
                  const dateIso = (t.date || t.tanggal_transaksi || '').slice(0, 10);
                  const statusLabel: TxStatus = (t.status_label || 'On Progress') as TxStatus;

                  if (isModuleView) {
                    // ==== ROW MODUL ====
                    const module = t.module || {
                      id: t.id_modul,
                      title: t.module_title || t.judul || '-',
                      type: t.module_type || t.type,
                      thumbnail: t.module_thumbnail || t.thumbnail_path || null,
                    };
                    const buyerName = t.student?.name || t.student_name || '-';
                    const thumbSrc = resolveImageUrl(module.thumbnail) || '/assets/images/modul.png';

                    return (
                      <tr key={t.id ?? `${idx}`} className={idx === 0 ? 'text-md' : 'border-t border-black/5 text-md'}>
                        <td className="px-4 py-4">
                          <img
                            src={thumbSrc}
                            alt={module.title || 'Modul'}
                            className="h-14 w-14 rounded-lg object-cover bg-neutral-100"
                          />
                        </td>
                        <td className="px-4 py-4 text-neutral-900">{module.title || '-'}</td>
                        <td className="p-3">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${typeChipCls(module.type || '-')}`}>
                            {capWords(module.type || '-')}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-neutral-900">{currency(price)}</td>
                        <td className="px-4 py-4 text-neutral-900">{buyerName}</td>
                        <td className="px-4 py-4 text-neutral-900">{toID(dateIso)}</td>
                        <td className="px-4 py-4">
                          <span className={`font-medium ${statusPill(statusLabel)}`}>{statusLabel}</span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => navigate(`/dashboard-admin/invoice/${t.id}?promoId=${promoId}`)}
                            className="rounded-full border px-3 py-1.5 text-sm flex items-center gap-1 border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/20"
                          >
                            <RiDownloadLine /> Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  // ==== ROW KURSUS ====
                  const avatarRaw = t.student?.avatar || t.student_avatar || null;
                  const avatarResolved = resolveImageUrl(avatarRaw) || defaultUser;
                  const studentName = t.student?.name || t.student_name || '-';

                  const instrumentName = t.instrument?.name || t.instrument_name || '';
                  const instrumentIconResolved =
                    resolveImageUrl(t.instrument?.icon || null) || getInstrumentIcon(instrumentName);

                  const packageLabel =
                    t.paket?.name
                      ? `${t.paket.name}${t.paket.sessions ? ` - ${t.paket.sessions} Sesi` : ''}`
                      : (t.package_name || '-');

                  const programName: string = t.program?.name || 'Reguler';

                  return (
                    <tr key={t.id ?? `${idx}`} className={idx === 0 ? 'text-md' : 'border-t border-black/5 text-md'}>
                      <td className="px-4 py-4">
                        <ProgramAvatarBadge src={avatarResolved} alt={studentName} pkg={programName} size={55} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-900">{studentName}</span>
                          {instrumentName ? (
                            <div className="mt-1 flex items-center gap-2">
                              <img src={instrumentIconResolved} alt={instrumentName} className="h-5 w-5" />
                              <span className="text-md text-black/80">{instrumentName}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-900">{packageLabel}</td>
                      <td className="px-4 py-4 text-neutral-900">{currency(price)}</td>
                      <td className="px-4 py-4 text-neutral-900">{toID(dateIso)}</td>
                      <td className="px-4 py-4">
                        <span className={`font-medium ${statusPill(statusLabel)}`}>{statusLabel}</span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => navigate(`/dashboard-admin/invoice/${t.id}?promoId=${promoId}`)}
                          className="rounded-full border px-3 py-1.5 text-sm flex items-center gap-1 border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/20"
                        >
                          <RiDownloadLine /> Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => dispatch(setTxPage(Math.max(1, Number(page || 1) - 1)) as any)}
              disabled={Number(page || 1) === 1}
              className="text-black enabled:hover:bg-black/5 disabled:opacity-40"
              aria-label="Previous page"
            >
              <RiArrowLeftSLine size={20} />
            </button>

            {pages.map((p, i) =>
              p === '…' ? (
                <span key={`dots-${i}`} className="grid h-9 min-w-9 place-items-center rounded-xl border border-black/10 text-md text-black/40">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => dispatch(setTxPage(Number(p)) as any)}
                  className={`grid h-9 min-w-9 place-items-center rounded-xl border px-3 text-md ${
                    Number(p) === Number(page || 1)
                      ? 'border-[var(--secondary-color)] bg-[var(--secondary-color)]/20'
                      : 'border-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/20'
                  }`}
                  aria-current={Number(p) === Number(page || 1) ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => dispatch(setTxPage(Math.min(totalPages, Number(page || 1) + 1)) as any)}
              disabled={Number(page || 1) === totalPages}
              className="text-black enabled:hover:bg-black/5 disabled:opacity-40"
              aria-label="Next page"
            >
              <RiArrowRightSLine size={20} />
            </button>

            <div className="ml-3">
              <select
                value={limit ?? 5}
                onChange={(e) => dispatch(setTxLimit(Number(e.target.value)) as any)}
                className="appearance-none rounded-full border border-black/15 px-3 py-2 text-sm outline-none"
                title="Rows per page"
              >
                {[6, 10, 20, 30].map((n) => <option key={n} value={n}>{n}/hal</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Modal Edit Promo */}
      <AddPromoModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        initial={(promo ? mapApiPromoToModal(promo) : currentPromo) as AddPromoPayload}
        titleOverride="Edit Promo"
        submitLabel="Ubah Promo"
      />

      {/* Modal AKTIFKAN KEMBALI */}
      <AddPromoModal
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        onSubmit={handleActivateSubmit}
        initial={(promo ? mapApiPromoToModal(promo) : currentPromo) as AddPromoPayload}
        titleOverride="Aktifkan Kembali Promo"
        submitLabel="Aktifkan Sekarang"
      />

      <ConfirmationModal
        isOpen={confirm.isOpen}
        onClose={confirm.onClose!}
        icon={confirm.icon}
        iconTone={confirm.iconTone}
        title={confirm.title}
        texts={confirm.texts}
        button1={confirm.button1}
        button2={confirm.button2}
        align={confirm.align}
      />
    </div>
  );
};

export default DetailPromoPage;
