import React from "react";
import { RiCloseLine } from "react-icons/ri";
import type { PayoutGuruDTO } from "@/features/slices/payoutGuru/types";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(n)
    .replace(",00", "");

const formatText = (v?: string | null) => {
  if (v == null) return "-";
  const t = String(v).trim();
  return t.length > 0 ? t : "-";
};

const formatDateTime = (v?: string | null) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID");
};

const titleCase = (v?: string | null) => {
  if (!v) return "-";
  const cleaned = String(v).replace(/_/g, " ").trim();
  if (!cleaned) return "-";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  payout: PayoutGuruDTO | null;
};

const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col gap-1 text-sm">
    <span className="text-neutral-500">{label}</span>
    <span className="text-neutral-900 font-semibold break-words">{value}</span>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="text-sm font-semibold text-neutral-700">{children}</div>
);

const PayoutDetailModal: React.FC<Props> = ({ isOpen, onClose, payout }) => {
  if (!isOpen) return null;

  if (!payout) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 pt-4 pb-3 border-b border-black/10 flex items-center justify-between">
            <div className="text-lg font-semibold text-neutral-900">
              Detail Payout
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="text-neutral-500 hover:text-neutral-700 text-xl cursor-pointer"
            >
              <RiCloseLine size={24} />
            </button>
          </div>
          <div className="p-5 text-sm text-neutral-700">
            Data payout tidak tersedia.
          </div>
        </div>
      </div>
    );
  }

  const teacherName = payout.guru?.nama ?? `Guru #${payout.id_guru}`;
  const teacherEmail = formatText(payout.guru?.email ?? null);
  const bankName =
    payout.payoutBank?.name ??
    payout.payoutBank?.code ??
    payout.payout_bank_code ??
    "-";
  const netCommission =
    (payout.amount_requested ?? 0) - (payout.deduction_transfer_fee ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-black/10 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-neutral-900">
              Detail Payout
            </div>
            <div className="text-sm text-neutral-500">ID: {payout.id}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-neutral-500 hover:text-neutral-700 text-xl cursor-pointer"
          >
            <RiCloseLine size={24} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <SectionTitle>Info Guru</SectionTitle>
              <div className="grid grid-cols-1 gap-3">
                <InfoItem label="Nama Guru" value={teacherName} />
                <InfoItem label="Email" value={teacherEmail} />
                <InfoItem label="ID Guru" value={payout.id_guru} />
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>Info Bank</SectionTitle>
              <div className="grid grid-cols-1 gap-3">
                <InfoItem label="Nama Bank" value={bankName} />
                <InfoItem
                  label="Nama Penerima"
                  value={formatText(payout.payout_account_name)}
                />
                <InfoItem
                  label="No Rekening"
                  value={formatText(payout.payout_account_number)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <SectionTitle>Info Pencairan</SectionTitle>
              <div className="grid grid-cols-1 gap-3">
                <InfoItem label="Status" value={titleCase(payout.status)} />
                <InfoItem label="Tipe" value={titleCase(payout.type)} />
                <InfoItem
                  label="Metode"
                  value={
                    payout.metode === "bank_transfer"
                      ? "Bank Transfer"
                      : payout.metode === "ewallet"
                        ? "E-Wallet"
                        : titleCase(payout.metode)
                  }
                />
                <InfoItem
                  label="Requested At"
                  value={formatDateTime(payout.requested_at)}
                />
                <InfoItem
                  label="Approved At"
                  value={formatDateTime(payout.approved_at)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>Rincian Komisi</SectionTitle>
              <div className="grid grid-cols-1 gap-3">
                <InfoItem
                  label="Jumlah Pengajuan"
                  value={formatRupiah(payout.amount_requested ?? 0)}
                />
                <InfoItem
                  label="Potongan Transfer"
                  value={formatRupiah(payout.deduction_transfer_fee ?? 0)}
                />
                <InfoItem
                  label="Komisi Bersih"
                  value={formatRupiah(netCommission)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutDetailModal;
