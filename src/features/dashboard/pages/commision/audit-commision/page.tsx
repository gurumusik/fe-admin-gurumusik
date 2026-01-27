/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
  RiSearchLine,
  RiArrowLeftLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiQuestionFill,
  RiCheckboxCircleFill,
  RiCloseLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";
import PayoutDetailModal from "@/features/dashboard/components/PayoutDetailModal";

/* ===== Redux & API ===== */
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  fetchPayoutGuruListThunk,
  selectPayoutGuruState,
} from "@/features/slices/payoutGuru/slice";
import { resolveImageUrl, sendSlipKomisi } from "@/services/api/payoutGuru.api";
import type { PayoutGuruDTO } from "@/features/slices/payoutGuru/types";

/* ===== Utils ===== */
const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(n)
    .replace(",00", "");

/* ===== Types ===== */
type AuditRow = {
  id: string;
  teacherName: string;
  accountNumber: string;
  recipientName: string;
  bankName: string;
  netCommission: number;
  raw: PayoutGuruDTO;
  avatar?: string | null;
};

/* ===== Pagination helper ===== */
function pageWindow(total: number, current: number) {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "…", total] as const;
  if (current >= total - 2) return [1, "…", total - 2, total - 1, total] as const;
  return [1, "…", current - 1, current, current + 1, "…", total] as const;
}

/* ===== Page ===== */
const CommisionAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ambil state dari slice payoutGuru
  const { items, status, error } = useAppSelector(selectPayoutGuruState);

  // filters & paging (lokal)
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10; // boleh disesuaikan

  // selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<PayoutGuruDTO | null>(null);
  const openDetail = (row: AuditRow) => {
    setDetailTarget(row.raw);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailTarget(null);
  };

  // fetch awal: ambil semua yang status='approved'
  useEffect(() => {
    dispatch(
      fetchPayoutGuruListThunk({
        page: 1,
        limit: 200,              // ambil cukup banyak dulu; pagination di FE
        sort_by: "paid_at",
        sort_dir: "DESC",
        status: "approved",
      })
    );
  }, [dispatch]);

  // mapping API -> rows, lalu filter transfer_reference === null
  const allRows: AuditRow[] = useMemo(() => {
    const onlyApprovedNoRef = (items as PayoutGuruDTO[]).filter(
      (it) => it.status === "approved" && (it.transfer_reference == null || String(it.transfer_reference).trim() === "")
    );
    return onlyApprovedNoRef.map((r) => ({
      id: String(r.id),
      teacherName: r.guru?.nama ?? `Guru #${r.id_guru}`,
      accountNumber: r.payout_account_number,
      recipientName: r.payout_account_name,
      bankName: r.payoutBank?.name ?? r.payoutBank?.code ?? r.payout_bank_code ?? "-",
      netCommission: (r.amount_requested ?? 0) - (r.deduction_transfer_fee ?? 0),
      raw: r,
      avatar: resolveImageUrl(r.guru?.profile_pic_url ?? null),
    }));
  }, [items]);

  // filter by search (nama guru)
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return allRows.filter((r) => !s || r.teacherName.toLowerCase().includes(s));
  }, [allRows, search]);

  // paging lokal
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);
  const pagination = pageWindow(pageCount, currentPage);

  // toggle selection
  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleCheckAllVisible = () => {
    const ids = rows.map((r) => r.id);
    const allChecked = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  // header metric
  const selectedTotal = useMemo(
    () => allRows.filter((r) => selected.has(r.id)).reduce((sum, r) => sum + r.netCommission, 0),
    [allRows, selected]
  );
  const selectedCount = selected.size;

  // modal (kirim slip)
  type ModalStage = "none" | "confirm" | "success" | "error";
  const [modal, setModal] = useState<ModalStage>("none");
  const [sending, setSending] = useState(false);
  const openConfirm = () => setModal("confirm");
  const closeModal = () => !sending && setModal("none");
  const sendSlips = async () => {
    const payoutIds = Array.from(selected)
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (!payoutIds.length) return false;
    setSending(true);
    try {
      const res = await sendSlipKomisi({ payout_ids: payoutIds });
      const hasUpdated = (res.updated?.length ?? 0) > 0;
      if (hasUpdated) {
        setSelected(new Set());
        dispatch(
          fetchPayoutGuruListThunk({
            page: 1,
            limit: 200,
            sort_by: "paid_at",
            sort_dir: "DESC",
            status: "approved",
          })
        );
      }
      return hasUpdated;
    } catch {
      return false;
    } finally {
      setSending(false);
    }
  };
  const handleConfirmYes = async () => {
    setModal("none");
    const ok = await sendSlips();
    setModal(ok ? "success" : "error");
  };

  return (
    <div className="">
      {/* ===== Sticky Header ===== */}
      <header className="sticky top-20 z-40 -m-4 sm:-m-6 mb-4 sm:mb-6 px-4 sm:px-6 border-t bg-white border-black/10 rounded-b-3xl">
        <div className="py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-3 py-1.5 text-sm text-[var(--secondary-color)] hover:bg-black/5"
          >
            <RiArrowLeftLine className="text-lg" />
            Kembali
          </button>

          <div className="flex-1 grid grid-cols-2 gap-6 max-w-3xl mx-auto text-center">
            <div className="flex flex-col">
              <span className="text-[12px] text-neutral-500">Total Komisi</span>
              <span className="text-lg font-semibold text-neutral-900">
                {formatRupiah(selectedTotal)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] text-neutral-500">Guru Dipilih</span>
              <span className="text-lg font-semibold text-neutral-900">{selectedCount}</span>
            </div>
          </div>

          <button
            disabled={selectedCount === 0}
            onClick={openConfirm}
            className={cls(
              "rounded-full px-6 py-2 text-sm font-semibold",
              "bg-[#F9CA24] text-black hover:brightness-95",
              selectedCount === 0 && "opacity-60 cursor-not-allowed"
            )}
          >
            Kirim Slip Komisi 
          </button>
        </div>
      </header>

      {/* ===== Section: Header tabel + Search ===== */}
      <section className="rounded-2xl bg-white">
        <div className="px-4 sm:px-5 pt-4">
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">
              Komisi Guru Yang Harus Dibayar
            </h3>

            <div className="flex w-3/4 justify-end gap-3">
              <div className="relative w-1/2">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A7B98]" size={18} />
                <input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  className="w-full h-11 rounded-xl border border-[var(--secondary-light-color)] pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
                  placeholder="Cari Guru: cth: Isabella Fernández"
                />
              </div>

              <button
                onClick={toggleCheckAllVisible}
                className="inline-flex h-11 items-center rounded-xl border border-[var(--secondary-color)] px-4 text-sm font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
              >
                Centang Semua
              </button>
            </div>
          </div>
        </div>

        {/* ===== Table ===== */}
        <div className="px-4 sm:px-5 pb-4 pt-3">
          <div className="overflow-x-auto rounded-2xl border border-[var(--secondary-light-color)]">
            <table className="min-w-full text-md">
              <thead className="bg-[#F1F5F9] text-[#0B1220]">
                <tr className="text-left">
                  <th className="py-3 pl-4 pr-3 font-semibold">Profile</th>
                  <th className="py-3 px-3 font-semibold">Nama Guru</th>
                  <th className="py-3 px-3 font-semibold">No Rekening</th>
                  <th className="py-3 px-3 font-semibold">Nama Penerima</th>
                  <th className="py-3 px-3 font-semibold">Nama Bank</th>
                  <th className="py-3 px-3 font-semibold">Komisi Bersih</th>
                  <th className="py-3 pr-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {status === "loading" && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#6A7B98]">
                      Memuat…
                    </td>
                  </tr>
                )}

                {status !== "loading" && rows.map((r) => {
                  const checked = selected.has(r.id);
                  return (
                    <tr key={r.id} className="border-t border-[var(--secondary-light-color)]">
                      <td className="py-4 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(r.id)}
                            className="h-5 w-5 accent-[var(--secondary-color)]"
                            aria-label={`Pilih ${r.teacherName}`}
                          />
                          {r.avatar ? (
                            <img
                              src={r.avatar}
                              alt={r.teacherName}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-slate-200" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-3 text-[#0B1220]">{r.teacherName}</td>
                      <td className="py-4 px-3">{r.accountNumber}</td>
                      <td className="py-4 px-3">{r.recipientName}</td>
                      <td className="py-4 px-3">{r.bankName}</td>
                      <td className="py-4 px-3">{formatRupiah(r.netCommission)}</td>
                      <td className="py-4 pr-4 pl-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => openDetail(r)}
                            className="inline-flex items-center rounded-full border border-[var(--secondary-color)] px-6 py-2 text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {status !== "loading" && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#6A7B98]">
                      {error ? `Gagal memuat: ${error}` : "Tidak ada data."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ===== Pagination (lokal) ===== */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              className="disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Sebelumnya"
            >
              <RiArrowLeftSLine size={20} />
            </button>

            {pagination.map((it, i) =>
              it === "…" ? (
                <span key={`sep-${i}`} className="px-2 text-[#6A7B98]">…</span>
              ) : (
                <button
                  key={it}
                  onClick={() => setPage(it as number)}
                  className={cls(
                    "min-w-9 h-9 px-3 rounded-xl border",
                    it === currentPage
                      ? "border-[var(--secondary-color)] text-[var(--secondary-color)] bg-[var(--primary-light-color)]"
                      : "border-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                  )}
                >
                  {it}
                </button>
              )
            )}

            <button
              className="h-9 w-9 rounded-full border border-[var(--secondary-light-color)] disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              aria-label="Berikutnya"
            >
              <RiArrowRightSLine size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ===== Modals ===== */}
      <PayoutDetailModal
        isOpen={detailOpen}
        onClose={closeDetail}
        payout={detailTarget}
      />
      <ConfirmationModal
        isOpen={modal === "confirm"}
        onClose={closeModal}
        icon={<RiQuestionFill />}
        iconTone="warning"
        title={`Kirim Slip Komisi ke ${selectedCount} Guru?`}
        texts={[
          `Anda akan mengirim slip komisi kepada ${selectedCount} guru`,
          <>
            Pastikan <span className="font-semibold">komisi sudah di transfer</span> sebelum melanjutkan
          </>,
        ]}
        button1={{
          label: "Ya, Saya Yakin",
          onClick: handleConfirmYes,
          loading: sending,
          variant: "primary",
        }}
        button2={{
          label: "Ga Jadi Deh",
          onClick: closeModal,
          variant: "outline",
        }}
        showCloseIcon={false}
        widthClass="max-w-md"
      />

      <ConfirmationModal
        isOpen={modal === "success"}
        onClose={() => setModal("none")}
        icon={<RiCheckboxCircleFill />}
        iconTone="success"
        title="Slip Komisi Berhasil Dikirim"
        texts={[`Slip komisi sudah terkirim ke ${selectedCount} guru yang telah Kamu pilih.`]}
        showCloseIcon
        widthClass="max-w-md"
      />

      <ConfirmationModal
        isOpen={modal === "error"}
        onClose={() => setModal("none")}
        icon={<RiCloseLine />}
        iconTone="danger"
        title="Pengiriman Slip Komisi Gagal"
        texts={[
          "Maaf, terjadi kendala saat mengirim slip komisi. Silakan coba lagi dalam beberapa saat, atau hubungi admin.",
        ]}
        showCloseIcon
        widthClass="max-w-md"
      />
    </div>
  );
};

export default CommisionAuditPage;


