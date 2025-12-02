'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RiCloseLine, RiCoinsLine, RiUpload2Line } from 'react-icons/ri';

type Mode = 'approve' | 'reject';

export type ApproveResult = {
  basePrice: number;
  salePrice: number;
  promoPrice: number;
};

export type RejectResult = {
  reason: string;
  photo?: File | null;
};

type Props = {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onApprove?: (data: ApproveResult) => void;
  onReject?: (data: RejectResult) => void;
  initialPrice?: Partial<ApproveResult>;

  requester: {
    name: string;
    id: string;
    avatarUrl: string;
  };

  defaultPrices: {
    basePrice: number;
    salePrice: number;
    promoPrice: number;
  };
};

const nfIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const toNumber = (s: string) => {
  const n = Number(String(s).replace(/[^\d]/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <div className="mb-2 text-md font-semibold text-neutral-900">{label}</div>
    {children}
  </label>
);

const ModuleApprovalModal: React.FC<Props> = ({
  open,
  mode,
  onClose,
  onApprove,
  onReject,
  initialPrice,
  defaultPrices,
}) => {
  const [basePrice, setBasePrice] = useState<string>(
    initialPrice?.basePrice != null ? nfIDR(initialPrice.basePrice) : ''
  );
  const [salePrice, setSalePrice] = useState<string>(
    initialPrice?.salePrice != null ? nfIDR(initialPrice.salePrice) : ''
  );
  const [promoPrice, setPromoPrice] = useState<string>(
    initialPrice?.promoPrice != null ? nfIDR(initialPrice.promoPrice) : ''
  );

  const [reason, setReason] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Tetap boleh validasi basePrice > 0 (dia diprefill & read-only)
  const canApprove =
    toNumber(basePrice) > 0 && toNumber(salePrice) > 0 && toNumber(promoPrice) >= 0;

  const canReject = reason.trim().length > 3;

  // Prefill nilai saat modal dibuka
  useEffect(() => {
    if (!open) return;
    const bp = initialPrice?.basePrice ?? defaultPrices?.basePrice ?? 0;
    const sp = initialPrice?.salePrice ?? defaultPrices?.salePrice ?? 0;
    const pp = initialPrice?.promoPrice ?? defaultPrices?.promoPrice ?? 0;
    setBasePrice(nfIDR(bp));
    setSalePrice(nfIDR(sp));
    setPromoPrice(nfIDR(pp));
  }, [open, initialPrice, defaultPrices]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="mt-6 w-full max-w-xl rounded-2xl bg-white p-5 md:p-6 shadow-xl">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">
            {mode === 'approve' ? 'Review Harga Modul' : 'Formulir Alasan Penolakan Modul'}
          </h3>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full hover:bg-black/5"
            aria-label="Tutup"
          >
            <RiCloseLine size={22} />
          </button>
        </div>
        <hr className="mb-4 border-black/10" />

        {mode === 'approve' ? (
          <div className="space-y-4">
            {/* === Harga Awal (Modal) → READ-ONLY === */}
            <Field label="Harga Awal (Modal)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                  <RiCoinsLine size={20} />
                </span>
                <input
                  value={basePrice}
                  readOnly
                  disabled
                  aria-readonly
                  placeholder="Rp500.000"
                  inputMode="numeric"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-black/15 bg-neutral-50 text-black/70 cursor-default"
                />
              </div>
            </Field>

            {/* === Harga Jual (Normal) → editable === */}
            <Field label="Harga Jual (Normal)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                  <RiCoinsLine size={20} />
                </span>
                <input
                  value={salePrice}
                  onChange={(e) => setSalePrice(nfIDR(toNumber(e.target.value)))}
                  placeholder="Harga Yang Akan Dijual, cth: 150.000"
                  inputMode="numeric"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-black/15 bg-white placeholder:text-black/40 outline-none focus:border-(--secondary-color)"
                />
              </div>
            </Field>

            {/* === Harga Promo (Diskon) → editable === */}
            <Field label="Harga Promo (Diskon)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                  <RiCoinsLine size={20} />
                </span>
                <input
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(nfIDR(toNumber(e.target.value)))}
                  placeholder="Harga jual dengan diskon/promo, cth: 120.000"
                  inputMode="numeric"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-black/15 bg-white placeholder:text-black/40 outline-none focus:border-(--secondary-color)"
                />
              </div>
            </Field>

            <button
              disabled={!canApprove}
              onClick={() =>
                onApprove?.({
                  basePrice: toNumber(basePrice),
                  salePrice: toNumber(salePrice),
                  promoPrice: toNumber(promoPrice),
                })
              }
              className="mt-3 w-full rounded-xl bg-(--primary-color) px-4 py-3 text-center text-md font-semibold text-black disabled:opacity-60"
            >
              Setujui Modul
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-neutral-500">Perihal:</div>
              <div className="text-md font-semibold text-neutral-900">Penolakan Modul</div>
            </div>

            {/* Upload foto */}
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-(--secondary-color) px-4 py-2 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
              >
                <RiUpload2Line /> Upload Foto
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/heic,image/heif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 5 * 1024 * 1024) {
                    alert('Maksimal 5MB');
                    return;
                  }
                  setPhoto(f);
                }}
              />
              <div className="mt-1 text-xs text-neutral-500">
                Format (Max 5mb): PNG, JPG, JPEG, HEIC
              </div>

              {photo && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs">
                  <span className="truncate max-w-[220px]">{photo.name}</span>
                  <button
                    onClick={() => setPhoto(null)}
                    className="text-neutral-500 hover:text-neutral-800"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <Field label="">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                placeholder="Masukkan Keterangan Penolakan Modul"
                className="w-full rounded-xl border border-(--secondary-color) bg-white px-4 py-3 outline-none"
              />
            </Field>

            <button
              disabled={!canReject}
              onClick={() => onReject?.({ reason: reason.trim(), photo })}
              className="mt-2 w-full rounded-xl bg-(--primary-color) px-4 py-3 text-center text-md font-semibold text-black disabled:opacity-60"
            >
              Kirim Laporan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleApprovalModal;
