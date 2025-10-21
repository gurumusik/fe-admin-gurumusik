/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCouponFill,
  RiFlashlightFill,
  RiCheckboxCircleFill,
  RiCloseLine,
} from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/store';

import { getStatusColor } from '@/utils/getStatusColor';
import AddPromoModal, { type AddPromoPayload } from '@/features/dashboard/components/AddPromoModal';
import ConfirmationModal, { type ConfirmationModalProps } from '@/components/ui/common/ConfirmationModal';

// Redux: promo flash & general
import {
  fetchFlashPromosThunk,
  selectFlashPromos,
  selectPromoStatus,
  selectPromoError,
  fetchGeneralPromosThunk,
  selectGeneralPromos,
  selectGeneralStatus,
  selectGeneralError,
} from '@/features/slices/promo/slice';

import type { PromoRow, FlashRow, FlashTypeRaw } from '@/features/slices/promo/types';
import { createPromo } from '@/services/api/promo.api';

// ====== Tambahan: row local dengan flag headline ======
type PromoRowExt = PromoRow & { isHeadline: boolean };

// helpers
function pageWindow(total: number, current: number) {
  const out: (number | '…')[] = [];
  const push = (x: number | '…') => { if (out[out.length - 1] !== x) out.push(x); };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '…') push('…');
  }
  return out;
}

function formatIDDate(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function AdminManagePromoPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const PAGE_SIZE = 5;

  // Confirm modal
  const [confirm, setConfirm] = useState<Pick<
    ConfirmationModalProps,
    'isOpen' | 'title' | 'texts' | 'icon' | 'iconTone'
  >>({ isOpen: false, title: '', texts: [], icon: null, iconTone: 'neutral' });

  const openSuccess = (title: string, texts: string[] = []) =>
    setConfirm({ isOpen: true, title, texts, icon: <RiCheckboxCircleFill />, iconTone: 'success' });
  const openError = (title: string, texts: string[] = []) =>
    setConfirm({ isOpen: true, title, texts, icon: <RiCloseLine />, iconTone: 'danger' });
  const closeConfirm = () => setConfirm((c) => ({ ...c, isOpen: false }));

  // FETCH via Redux
  const flashStatus = useSelector(selectPromoStatus);
  const flashError = useSelector(selectPromoError);
  const flashPromos = useSelector((s: RootState) => selectFlashPromos(s));

  const generalStatus = useSelector(selectGeneralStatus);
  const generalError = useSelector(selectGeneralError);
  const generalPromos = useSelector((s: RootState) => selectGeneralPromos(s));

  useEffect(() => {
    dispatch(fetchFlashPromosThunk(undefined));
    dispatch(fetchGeneralPromosThunk(undefined));
  }, [dispatch]);

  // Mapping general (pakai started_at jika ada) + isHeadline
  const generalRowsAll: PromoRowExt[] = useMemo(() => {
    return (generalPromos || []).map(p => ({
      id: p.id,
      code: p.kode_promo,
      discountPct: Number(p.persentase_diskon || 0),
      startDate: formatIDDate(p.started_at ?? p.startedAt ?? p.created_at ?? p.createdAt),
      endDate:   formatIDDate(p.expired_at ?? p.expiredAt ?? null),
      status: p.status === 'active' ? 'Aktif' : 'Non-Aktif',
      isHeadline: Boolean(p.is_headline_promo), // ⬅️ penting: flag headline
    }));
  }, [generalPromos]);

  // Pagination (general)
  const [page, setPage] = useState(1);
  const hasPromos = generalStatus === 'succeeded' ? generalRowsAll.length > 0 : false;
  const totalPages = hasPromos ? Math.max(1, Math.ceil(generalRowsAll.length / PAGE_SIZE)) : 1;
  const rows = useMemo(() => {
    if (!hasPromos) return [];
    const start = (page - 1) * PAGE_SIZE;
    return generalRowsAll.slice(start, start + PAGE_SIZE);
  }, [page, hasPromos, generalRowsAll]);
  const goTo = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));
  const prev = () => goTo(page - 1);
  const next = () => goTo(page + 1);

  // Mapping flash
  const flashRowsAll: FlashRow[] = useMemo(() => {
    return (flashPromos || []).map(p => {
      const raw: FlashTypeRaw = p.promo_for === 'modul' ? 'modul' : 'class';
      const label = raw === 'class' ? 'Tutor' : 'Modul';
      return {
        id: p.id,
        rawType: raw,
        type: label,
        discountPct: Number(p.persentase_diskon || 0),
        startDate: formatIDDate(p.started_at ?? p.startedAt ?? p.created_at ?? p.createdAt),
        endDate:   formatIDDate(p.expired_at ?? p.expiredAt ?? null),
        status: p.status === 'active' ? 'Aktif' : 'Non-Aktif',
      };
    });
  }, [flashPromos]);

  const [pageFs, setPageFs] = useState(1);
  const hasFlash = flashStatus === 'succeeded' ? flashRowsAll.length > 0 : false;
  const totalPagesFs = hasFlash ? Math.max(1, Math.ceil(flashRowsAll.length / PAGE_SIZE)) : 1;
  const rowsFs = useMemo(() => {
    if (!hasFlash) return [];
    const start = (pageFs - 1) * PAGE_SIZE;
    return flashRowsAll.slice(start, start + PAGE_SIZE);
  }, [pageFs, hasFlash, flashRowsAll]);
  const goToFs = (p: number) => setPageFs(Math.min(Math.max(1, p), totalPagesFs));
  const prevFs = () => goToFs(pageFs - 1);
  const nextFs = () => goToFs(pageFs + 1);

  // Modal Add Promo (GENERAL)
  const [addOpen, setAddOpen] = useState(false);

  const handleAddPromo = async (data: AddPromoPayload) => {
    try {
      setAddOpen(false);

      // Map modal → payload BE
      await createPromo({
        kode_promo: data.code.trim(),
        title: data.title.trim(),
        notes: data.notesHtml,
        headline_text: data.bannerHeadline,
        persentase_diskon: Number(data.discountPct),
        max_usage: Number(data.maxUsage),
        started_at: data.startDate,
        expired_at: data.endDate,
        promo_for: 'general',
        status: 'active',
        is_show: true,
        is_headline_promo: false,
      });

      await dispatch(fetchGeneralPromosThunk(undefined));
      openSuccess('Promo berhasil ditambahkan!', [
        'Promo sudah disimpan dan dapat digunakan sesuai periode yang ditentukan.',
      ]);
      setPage(1);
    } catch (e: any) {
      openError('Gagal menambahkan promo!', [
        e?.message || 'Terjadi kendala saat menyimpan promo. Silakan coba lagi.',
      ]);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ====== Kelola Kode Promo (GENERAL) ====== */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-(--secondary-color)">
              <RiCouponFill size={25} className="text-white" />
            </span>
            <h2 className="text-lg font-semibold text-neutral-900">Kelola Kode Promo</h2>
          </div>

        <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-(--primary-color) px-4 py-2 text-sm font-semibold text-black hover:brightness-95"
          >
            <RiAddLine size={20} />
            Tambah Promo
          </button>
        </div>

        <div className="overflow-hidden rounded-xl">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md text-neutral-900">
                <th className="w-[22%] p-5 font-semibold">Kode Promo</th>
                <th className="w-[16%] p-5 font-semibold">Besar Promo</th>
                <th className="w-[20%] p-5 font-semibold">Tanggal Mulai</th>
                <th className="w-[20%] p-5 font-semibold">Tanggal Berakhir</th>
                <th className="w-[14%] p-5 font-semibold">Status</th>
                <th className="w-[8%]  p-5 font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {generalStatus === 'loading' && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    Memuat...
                  </td>
                </tr>
              )}

              {generalStatus === 'failed' && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-red-500">
                    {generalError || 'Gagal memuat data'}
                  </td>
                </tr>
              )}

              {generalStatus === 'succeeded' && !hasPromos && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    Tidak ada data
                  </td>
                </tr>
              )}

              {generalStatus === 'succeeded' && hasPromos && rows.map((r, idx) => (
                <tr key={r.id} className={idx === 0 ? 'text-md' : 'border-t border-black/5 text-md'}>
                  <td className="px-5 py-5 text-neutral-900">
                    <div className="inline-flex items-center gap-2">
                      <span>{r.code}</span>
                      {r.isHeadline && (
                        <>
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full bg-red-500"
                            title="Headline aktif"
                            aria-label="Headline aktif"
                          />
                          <span className="sr-only">Promo headline aktif</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-5 text-neutral-900">{r.discountPct}%</td>
                  <td className="px-5 py-5 text-neutral-900">{r.startDate}</td>
                  <td className="px-5 py-5 text-neutral-900">{r.endDate}</td>
                  <td className="px-5 py-5">
                    <span className={`font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-5">
                    <button
                      type="button"
                      onClick={() =>
                        // ⬇️ arahkan TANPA :id, kirim data via state
                        navigate('/dashboard-admin/manage-promo/detail-promo', {
                          state: {
                            promoId: r.id,              // ← ID dipakai di halaman detail
                            code: r.code,              // ← tampilkan cepat sebelum fetch
                            discountPct: r.discountPct // optional
                          },
                        })
                      }
                      className="rounded-full border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {generalStatus === 'succeeded' && hasPromos && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={prev}
              disabled={page === 1}
              className="text-black enabled:hover:bg-black/5 disabled:opacity-40"
              aria-label="Previous page"
            >
              <RiArrowLeftSLine size={20} />
            </button>

            {pageWindow(totalPages, page).map((p, i) =>
              p === '…' ? (
                <span
                  key={`dots-${i}`}
                  className="grid h-9 min-w-9 place-items-center rounded-xl border border-black/10 text-md text-black/40"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`grid h-9 min-w-9 place-items-center rounded-xl border px-3 text-md ${
                    p === page
                      ? 'border-(--secondary-color) bg-[var(--secondary-color)]/20 '
                      : 'border-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/20'
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
              className="text-black enabled:hover:bg-black/5 disabled:opacity-40"
              aria-label="Next page"
            >
              <RiArrowRightSLine size={20} />
            </button>
          </div>
        )}
      </section>

      {/* ====== Kelola Flash Sale (tetap) ====== */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-(--primary-color)">
              <RiFlashlightFill size={22} className="text-black" />
            </span>
            <h2 className="text-lg font-semibold text-neutral-900">Kelola Flash Sale</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-(--primary-color) px-4 py-2 text-sm font-semibold text-black hover:brightness-95"
            onClick={() => navigate('/dashboard-admin/manage-promo/manage-flashsale')}
          >
            <RiAddLine size={20} />
            Tambah Flashsale
          </button>
        </div>

        <div className="overflow-hidden rounded-xl">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md text-neutral-900">
                <th className="w-[20%] p-5 font-semibold">Tipe Flashsale</th>
                <th className="w-[16%] p-5 font-semibold">Besar Promo</th>
                <th className="w-[22%] p-5 font-semibold">Tanggal Mulai</th>
                <th className="w-[22%] p-5 font-semibold">Tanggal Berakhir</th>
                <th className="w-[14%] p-5 font-semibold">Status</th>
                <th className="w-[8%]  p-5 font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {flashStatus === 'loading' && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    Memuat...
                  </td>
                </tr>
              )}

              {flashStatus === 'failed' && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-red-500">
                    {flashError || 'Gagal memuat data'}
                  </td>
                </tr>
              )}

              {flashStatus === 'succeeded' && hasFlash && rowsFs.map((r, idx) => (
                <tr key={r.id} className={idx === 0 ? 'text-md' : 'border-t border-black/5 text-md'}>
                  <td className="px-5 py-5 text-neutral-900">{r.type}</td>
                  <td className="px-5 py-5 text-neutral-900">{r.discountPct}%</td>
                  <td className="px-5 py-5 text-neutral-900">{r.startDate}</td>
                  <td className="px-5 py-5 text-neutral-900">{r.endDate}</td>
                  <td className="px-5 py-5">
                    <span className={`font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-5">
                    <button
                      type="button"
                      className="rounded-full border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                      onClick={() =>
                        navigate('/dashboard-admin/manage-promo/manage-flashsale', {
                          state: {
                            id: r.id,
                            type: r.rawType,
                            typeLabel: r.type,
                            discountPct: r.discountPct,
                            startDate: r.startDate,
                            endDate: r.endDate,
                            status: r.status,
                          },
                        })
                      }
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {flashStatus === 'succeeded' && hasFlash && totalPagesFs > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={prevFs}
              disabled={pageFs === 1}
              className="text-black enabled:hover:bg-black/5 disabled:opacity-40"
              aria-label="Previous page"
            >
              <RiArrowLeftSLine size={20} />
            </button>

            {pageWindow(totalPagesFs, pageFs).map((p, i) =>
              p === '…' ? (
                <span
                  key={`dotsfs-${i}`}
                  className="grid h-9 min-w-9 place-items-center rounded-xl border border-black/10 text-md text-black/40"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToFs(p)}
                  className={`grid h-9 min-w-9 place-items-center rounded-xl border px-3 text-md ${
                    p === pageFs
                      ? 'border-(--secondary-color) bg-[var(--secondary-color)]/20 '
                      : 'border-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/20'
                  }`}
                  aria-current={p === pageFs ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={nextFs}
              disabled={pageFs === totalPagesFs}
              className="text-black enabled:hover:bg-black/5 disabled:opacity-40"
              aria-label="Next page"
            >
              <RiArrowRightSLine size={20} />
            </button>
          </div>
        )}
      </section>

      {/* Modal Promo (GENERAL) */}
      <AddPromoModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddPromo}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirm.isOpen}
        onClose={closeConfirm}
        icon={confirm.icon}
        iconTone={confirm.iconTone}
        title={confirm.title}
        texts={confirm.texts}
        align="center"
      />
    </div>
  );
}
