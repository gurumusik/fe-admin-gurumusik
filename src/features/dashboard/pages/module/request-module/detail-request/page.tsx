/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/module/pages/DetailRequestModulePage.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  RiMusic2Line,
  RiLinkM,
  RiImage2Fill,
  RiPlayCircleLine,
  RiCoinsLine,
  RiArrowLeftLine,
  RiDownloadLine,
  RiCloseLine,
  RiCheckboxCircleFill,
} from 'react-icons/ri';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import type { RootState, AppDispatch } from '@/app/store';

// Modal & types
import ModuleApprovalModal, {
  type ApproveResult,
  type RejectResult,
} from '@/features/dashboard/components/ModuleApprovalModal';

import ConfirmationModal from '@/components/ui/common/ConfirmationModal';

// Thunks detail
import {
  fetchModuleAdminDetailThunk,
  approveModuleAdminThunk,
  rejectModuleAdminThunk,
} from '@/features/slices/module/detailSlice';

// Placeholder/gambar cadangan
import Landscape from '@/assets/images/Landscape.png';

// ===== helpers =====
const nfIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const HIDE_CUPLIKAN_DAN_EBOOK = true as const;

type ConfirmKind = 'approved-ok' | 'approved-fail' | 'rejected-ok' | 'rejected-fail';

// Path list request module
const REQUEST_LIST_PATH = '/dashboard-admin/module/request';

// ===== page =====
export default function DetailRequestModulePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const { item: detail, status, error } = useSelector(
    (s: RootState) =>
      (s as any).moduleAdminDetail ?? {
        item: null,
        status: 'idle',
        error: null,
      }
  );

  const [openModal, setOpenModal] = useState<null | 'approve' | 'reject'>(null);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const moduleId = Number(id || 0);

  // Fetch detail saat mount / ganti id
  useEffect(() => {
    if (!moduleId) return;
    dispatch(fetchModuleAdminDetailThunk(moduleId));
  }, [dispatch, moduleId]);

  // ——— Normalisasi field dari detail API agar UI aman pakai optional chaining ———
  const d = detail as any;

  const title: string = d?.judul ?? '-';
  const thumbUrl: string = d?.thumbnail_path || (Landscape as unknown as string);

  // Mapping harga dari DB
  const hargaAwal: number = Number(d?.harga ?? 0);            // base price (modal)  -> DB: harga
  const hargaJual: number = Number(d?.harga_bid ?? 0);        // sale price (normal) -> DB: harga_bid
  const hargaPromo: number = Number(d?.harga_discount ?? 0);  // promo price         -> DB: harga_discount
  const percentDiscount: number = Number(d?.percent_discount ?? 0); // opsional

  const instrumentName: string = d?.instrument?.nama ?? 'gitar';
  const previewUrl: string = d?.preview_class || d?.link_drive || '';
  const descriptionHtml: string = d?.deskripsi || '<p>Tidak ada deskripsi.</p>';
  const audienceText: string = d?.appropriate_module || d?.target_audience || '—';

  // ✅ FIX: Ambil **string** dari array objek
  const playlistLinks: string[] = Array.isArray(d?.playlists)
    ? d.playlists
        .map((x: any) => (x?.link_playlist ?? '').toString().trim())
        .filter(Boolean)
    : [];

  // ✅ Perbaiki sumber thumbnails:
  // - previews: { file_path, ... } → pakai file_path
  // - ebooks:   { ebook_path, ... } → pakai ebook_path
  const previewThumbs: string[] = Array.isArray(d?.previews)
    ? d.previews.map((x: any) => x?.file_path || thumbUrl)
    : [];

  const ebookThumbs: string[] = Array.isArray(d?.ebooks)
    ? d.ebooks.map((x: any) => x?.ebook_path || thumbUrl)
    : [];

  // info pengaju (guru)
  const requesterName: string = d?.owner?.name || d?.guru?.nama || 'Guru';
  const requesterId: string = d?.owner?.id ? `#${d.owner.id}` : d?.guru?.id ? `#${d.guru.id}` : '#—';
  const requesterAvatar: string =
    d?.owner?.avatar || d?.guru?.profile_pic_url || (Landscape as unknown as string);

  // waktu pengajuan (opsional)
  const submittedAt: string = useMemo(() => {
    const raw = d?.submitted_at || d?.created_at || d?.updated_at;
    if (!raw) return '—';
    try {
      const dt = new Date(raw);
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = dt.getFullYear();
      const HH = String(dt.getHours()).padStart(2, '0');
      const ii = String(dt.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} | ${HH}.${ii}`;
    } catch {
      return String(raw);
    }
  }, [d?.submitted_at, d?.created_at, d?.updated_at]);

  // ===== handlers =====
  const handleApproveClick = () => setOpenModal('approve');
  const handleRejectClick = () => setOpenModal('reject');

  // Submit: PUT dua field harga (normal/promo) + opsional percentDiscount
  const handleApproved = async (prices: ApproveResult) => {
    if (!moduleId) return;
    try {
      await dispatch(
        approveModuleAdminThunk({
          id: moduleId,
          salePrice: prices.salePrice,   // => body.harga_bid
          promoPrice: prices.promoPrice, // => body.harga_discount
          percentDiscount: percentDiscount || 0,
        })
      ).unwrap();

      setOpenModal(null);
      setConfirmKind('approved-ok');
      // optional refresh
      dispatch(fetchModuleAdminDetailThunk(moduleId));
    } catch {
      setOpenModal(null);
      setConfirmKind('approved-fail');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRejected = async (_data: RejectResult) => {
    if (!moduleId) return;
    try {
      await dispatch(rejectModuleAdminThunk(moduleId)).unwrap();
      setOpenModal(null);
      setConfirmKind('rejected-ok');
      dispatch(fetchModuleAdminDetailThunk(moduleId));
    } catch {
      setOpenModal(null);
      setConfirmKind('rejected-fail');
    }
  };

  const handleCloseConfirm = () => {
    const kind = confirmKind;
    setConfirmKind(null);
    if (kind === 'approved-ok') {
      navigate(REQUEST_LIST_PATH, { replace: true });
    }
  };

  // ===== UI =====
  return (
    <div className="w-full">
      {/* Header */}
      <header className="sticky top-20 z-40 -m-6 mb-6 px-6 border-t bg-white border-black/10 rounded-b-3xl">
        <div className="py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-3 py-1.5 text-sm text-[var(--secondary-color)] hover:bg-black/5"
            type="button"
          >
            <RiArrowLeftLine className="text-lg" />
            Kembali
          </button>

          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <img
                src={requesterAvatar}
                alt={requesterName}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-black/5"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
              />
              <div className="flex flex-col">
                <div className="font-semibold text-md text-neutral-900">{requesterName}</div>
                <span className="text-sm text-neutral-500">{requesterId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRejectClick}
              className="rounded-full border border-[var(--accent-red-color)] px-5 py-2 text-sm font-semibold text-[var(--accent-red-color)] bg-white hover:bg-[#FFF5F7]"
              type="button"
              disabled={status === 'loading'}
            >
              Tolak
            </button>
            <button
              onClick={handleApproveClick}
              className="rounded-full bg-[var(--primary-color)] px-5 py-2 text-sm font-semibold text-black hover:brightness-95 disabled:opacity-60"
              type="button"
              disabled={status === 'loading'}
            >
              Setujui
            </button>
          </div>
        </div>
      </header>

      {/* Loading / Error banner */}
      {status === 'loading' && (
        <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
          Memuat detail modul…
        </div>
      )}
      {status === 'failed' && error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* ===== READ-ONLY VIEW ===== */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* LEFT */}
        <section className="md:col-span-7 rounded-2xl bg-white p-4 sm:p-5 text-md">
          <div className="grid gap-5">
            {/* Judul */}
            <label className="block">
              <div className="mb-2 text-md font-semibold text-neutral-900">Judul Modul</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                  <RiPlayCircleLine size={22} />
                </span>
                <input
                  value={title}
                  readOnly
                  disabled
                  className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 bg-neutral-50 text-black/80 cursor-default"
                />
              </div>
            </label>

            {/* Harga */}
            {[
              { key: 'base',  label: 'Harga Awal (Modal)',   value: hargaAwal },
              { key: 'sale',  label: 'Harga Jual (Normal)',  value: hargaJual },
              { key: 'promo', label: 'Harga Promo (Diskon)', value: hargaPromo },
            ].map((r) => (
              <label key={r.key} className="block">
                <div className="mb-2 text-md font-semibold text-neutral-900">{r.label}</div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                    <RiCoinsLine size={22} />
                  </span>
                  <input
                    value={nfIDR(Number(r.value || 0))}
                    readOnly
                    disabled
                    className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 bg-neutral-50 text-black/80 cursor-default"
                  />
                </div>
              </label>
            ))}

            {/* Instrumen */}
            <label className="block">
              <div className="mb-2 text-md font-semibold text-neutral-900">Instrumen Musik</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                  <RiMusic2Line size={22} />
                </span>
                <input
                  value={instrumentName}
                  readOnly
                  disabled
                  className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 bg-neutral-50 text-black/80 cursor-default"
                />
              </div>
            </label>

            {/* Preview Class / Link Drive (opsional) */}
            <label className="block">
              <div className="mb-2 text-md font-semibold text-neutral-900">Preview Kelas</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                  <RiLinkM size={22} />
                </span>
                <input
                  value={previewUrl || '—'}
                  readOnly
                  disabled
                  className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 bg-neutral-50 text-black/80 cursor-default"
                />
              </div>
            </label>

            {/* Tentang Produk */}
            <div>
              <div className="mb-2 text-md font-semibold text-neutral-800">Tentang Produk</div>
              <div
                className="rounded-xl border border-black/15 bg-neutral-50 px-4 py-3 text-[15px] text-neutral-800"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>

            {/* Target/Audience */}
            <div>
              <div className="mb-2 text-md font-semibold text-neutral-800">Modul Ini Cocok Untuk</div>
              <textarea
                value={audienceText}
                readOnly
                disabled
                rows={4}
                className="w-full p-3 rounded-lg border border-gray-200 bg-neutral-50 text-black/80 cursor-default"
              />
            </div>

            {/* ✅ Link Playlist */}
            <div>
              <div className="mb-4 text-md font-semibold text-neutral-800 flex items-center justify-between">
                <span>Link Playlist</span>
                <button
                  className="flex gap-2 text-sm border border-[var(--secondary-color)] text-[var(--secondary-color)] px-5 py-2 rounded-full"
                  type="button"
                >
                  <RiDownloadLine size={20} />
                  Download Modul
                </button>
              </div>
              {playlistLinks.length === 0 ? (
                <p className="text-sm text-neutral-500">Tidak ada playlist.</p>
              ) : (
                <div className="space-y-3">
                  {playlistLinks.map((link, idx) => (
                    <input
                      key={idx}
                      value={link}
                      readOnly
                      disabled
                      className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-neutral-50 text-black/80 cursor-default"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* E-Books */}
            <div className={HIDE_CUPLIKAN_DAN_EBOOK ? 'hidden' : ''}>
              <div className="mb-2 text-md font-semibold text-neutral-800">E-Book Pendukung</div>
              {ebookThumbs.length === 0 ? (
                <p className="text-sm text-neutral-500">Tidak ada file.</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {ebookThumbs.map((u, i) => (
                    <div key={`eb-${i}`} className="relative rounded-xl bg-neutral-100 p-1">
                      <img src={u} alt="Ebook" className="h-16 w-24 rounded-lg object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <aside className="md:col-span-5 md:sticky md:top-6 md:self-start space-y-5">
          <div>
            <div className="mb-1 text-sm text-neutral-500">Waktu Pengajuan</div>
            <div className="mb-4 text-md font-medium text-neutral-800">{submittedAt}</div>

            <div className="mb-2 text-lg font-semibold text-neutral-800">Thumbnail Modul</div>
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-neutral-200">
              {thumbUrl ? (
                <img src={thumbUrl} alt="Thumbnail modul" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-neutral-400">
                  <RiImage2Fill size={48} />
                </div>
              )}
            </div>
          </div>

          {/* ✅ Cuplikan Modul (pakai previews.file_path) */}
          <div className={HIDE_CUPLIKAN_DAN_EBOOK ? 'hidden' : ''}>
            <div className="mb-2 text-lg font-semibold text-neutral-800">Cuplikan Modul</div>
            {previewThumbs.length === 0 ? (
              <p className="text-sm text-neutral-500">Tidak ada file.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {previewThumbs.map((u, i) => (
                  <div key={`cl-${i}`} className="relative rounded-xl bg-neutral-100 p-1">
                    <img src={u} alt="Cuplikan modul" className="h-16 w-24 rounded-lg object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ===== ModuleApprovalModal ===== */}
      {openModal && (
        <ModuleApprovalModal
          open
          mode={openModal === 'approve' ? 'approve' : 'reject'}
          onClose={() => setOpenModal(null)}
          requester={{ name: requesterName, id: requesterId, avatarUrl: requesterAvatar }}
          defaultPrices={{
            basePrice: hargaAwal,   // dari DB: modul.harga
            salePrice: hargaJual,   // dari DB: modul.harga_bid
            promoPrice: hargaPromo, // dari DB: modul.harga_discount
          }}
          onApprove={handleApproved}
          onReject={handleRejected}
        />
      )}

      {/* ===== ConfirmationModal (success/error) ===== */}
      {confirmKind && (
        <ConfirmationModal
          isOpen
          onClose={handleCloseConfirm}
          widthClass="max-w-lg"
          align="center"
          icon={confirmKind.includes('ok') ? <RiCheckboxCircleFill /> : <RiCloseLine />}
          iconTone={confirmKind.includes('ok') ? 'success' : 'danger'}
          title={
            confirmKind === 'approved-ok'
              ? 'Modul Berhasil Disetujui!'
              : confirmKind === 'approved-fail'
              ? 'Modul Gagal Disetujui'
              : confirmKind === 'rejected-ok'
              ? 'Alasan Penolakan Berhasil Dikirim'
              : 'Alasan Penolakan Gagal Dikirim'
          }
          texts={
            confirmKind === 'approved-ok'
              ? ['Modul ini sekarang tampil di katalog dan bisa dibeli murid.']
              : confirmKind === 'approved-fail'
              ? ['Terjadi kendala saat menyetujui modul ini. Silakan coba lagi beberapa saat lagi.']
              : confirmKind === 'rejected-ok'
              ? ['Keterangan penolakan modul sudah berhasil dikirim ke guru.']
              : ['Terjadi kendala saat mengirim keterangan penolakan modul ke guru. Silakan coba lagi.']
          }
          button1={{
            label: 'Tutup',
            variant: 'primary',
            onClick: handleCloseConfirm,
          }}
        />
      )}
    </div>
  );
}
