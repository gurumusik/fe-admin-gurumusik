import React, { useEffect, useMemo, useState } from "react";
import {
  RiArrowLeftLine,
  RiSearchLine,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiQuestionFill,
  RiCheckLine as RiCheckSolid,
  RiCheckboxCircleFill,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";
import CashoutRejectModal from "../../../components/CashoutRejectModal";
import NoData from "@/assets/images/NoData.png";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  fetchPayoutGuruListThunk,
  selectPayoutGuruState,
  decidePayoutGuruThunk,
} from "@/features/slices/payoutGuru/slice";
import { resolveImageUrl } from "@/services/api/payoutGuru.api";
import type { PayoutGuruDTO } from "@/features/slices/payoutGuru/types";

/* ===== Utils ===== */
const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");
const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(n)
    .replace(",00", "");

/* ===== Row type utk tabel ===== */
type Row = {
  id: number;
  teacherName: string;
  avatar?: string | null;
  accountNumber: string;
  recipientName: string;
  bankName: string;
  netCommission: number | null;
  raw: PayoutGuruDTO;
};

const EMPTY_IMG = NoData;

/* ===== Page ===== */
const CashoutVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { items, total, page, limit, status, error, decideStatus } =
    useAppSelector(selectPayoutGuruState);

  const [search, setSearch] = useState("");

  // fetch initial + on deps change
  useEffect(() => {
    dispatch(
      fetchPayoutGuruListThunk({
        page,
        limit,
        sort_by: "requested_at",
        sort_dir: "DESC",
        status: "requested", // HANYA requested di page ini
      })
    );
  }, [dispatch, page, limit]);

  // mapping items -> rows untuk tabel
  const rows: Row[] = useMemo(() => {
    return items.map((r) => {
      const teacherName = r.guru?.nama ?? `Guru #${r.id_guru}`;
      const avatar = resolveImageUrl(r.guru?.profile_pic_url ?? null);
      const bankName =
        r.payoutBank?.name ?? r.payoutBank?.code ?? r.payout_bank_code ?? "-";
      return {
        id: r.id,
        teacherName,
        avatar,
        accountNumber: r.payout_account_number,
        recipientName: r.payout_account_name,
        bankName,
        netCommission: r.amount, // sesuai permintaan
        raw: r,
      };
    });
  }, [items]);

  // FE search by guru name
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.teacherName.toLowerCase().includes(s));
  }, [rows, search]);

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const current = page;

  // ====== Modal flow state ======
  type Stage =
    | "none"
    | "confirm"
    | "success"
    | "error"
    | "reportSuccess"
    | "reportError";
  const [stage, setStage] = useState<Stage>("none");
  const [target, setTarget] = useState<Row | null>(null);
  const [sending, setSending] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Row | null>(null);
  const [sendingReport, setSendingReport] = useState(false);

  const openConfirm = (row: Row) => {
    setTarget(row);
    setStage("confirm");
  };
  const openReject = (row: Row) => {
    setRejectTarget(row);
    setRejectOpen(true);
  };
  const closeModal = () => !sending && setStage("none");

  // === APPROVE: panggil thunk decide (approve) lalu refresh list
  const approveRequest = async (row: Row) => {
    setSending(true);
    try {
      await dispatch(
        decidePayoutGuruThunk({ id: row.id, action: "approve" })
      ).unwrap();
      setStage("success");
      // refresh untuk sync total/page
      dispatch(
        fetchPayoutGuruListThunk({
          page: 1,
          limit,
          sort_by: "requested_at",
          sort_dir: "DESC",
          status: "requested",
          search: search.trim() || undefined,
        })
      );
    } catch {
      setStage("error");
    } finally {
      setSending(false);
    }
  };

  // === REJECT: panggil thunk decide (reject) + reason, lalu refresh list
  async function handleRejectSubmit(payload: {
    subject: string;
    note: string;
    file?: File | null;
  }) {
    if (!rejectTarget) return;
    setSendingReport(true);
    try {
      await dispatch(
        decidePayoutGuruThunk({
          id: rejectTarget.id,
          action: "reject",
          reason: payload.note?.trim() || "Ditolak",
        })
      ).unwrap();
      setRejectOpen(false);
      setStage("reportSuccess");
      dispatch(
        fetchPayoutGuruListThunk({
          page: 1,
          limit,
          sort_by: "requested_at",
          sort_dir: "DESC",
          status: "requested",
          search: search.trim() || undefined,
        })
      );
    } catch {
      setStage("reportError");
    } finally {
      setSendingReport(false);
    }
  }

  // ===== Empty State =====
  if (status !== "loading" && filtered.length === 0) {
    return (
      <div className="min-h-[70vh] grid place-items-center px-4">
        <div className="text-center mt-14">
          <img
            src={EMPTY_IMG}
            alt="Belum ada pengajuan komisi"
            className="mx-auto max-w-md mb-4 select-none"
            draggable={false}
          />
        </div>
        {status === "failed" && error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Gagal memuat data: {error}
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-6 py-2 text-sm font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 p-2 text-sm text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
          >
            <RiArrowLeftLine className="text-xl" />
          </button>
          <span className="text-neutral-900 text-lg font-semibold">
            Verifikasi Pengajuan Komisi
          </span>
        </div>

        <div className="relative w-full sm:w-[380px]">
          <RiSearchLine
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A7B98]"
            size={18}
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              dispatch(
                fetchPayoutGuruListThunk({
                  page: 1,
                  limit,
                  sort_by: "requested_at",
                  sort_dir: "DESC",
                  status: "requested",
                  search: e.target.value,
                })
              );
            }}
            className="w-full h-11 rounded-xl border border-[var(--secondary-light-color)] pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
            placeholder="Cari Guru (nama) / No Rekening / Bank…"
          />
        </div>
      </div>

      {/* Error banner jika fetch gagal */}
      {status === "failed" && error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Gagal memuat data: {error}
        </div>
      )}

      {/* Table */}
      <section className="rounded-2xl bg-white">
        <div className="overflow-x-auto rounded-2xl">
          <table className="min-w-full text-md">
            <thead className="bg-neutral-100 text-neutral-900">
              <tr className="text-left">
                <th className="p-4 font-semibold">Profile</th>
                <th className="p-4 font-semibold">Nama Guru</th>
                <th className="p-4 font-semibold">No Rekening</th>
                <th className="p-4 font-semibold">Nama Penerima</th>
                <th className="p-4 font-semibold">Nama Bank</th>
                <th className="p-4 font-semibold">Komisi Bersih</th>
                <th className="p-4 font-semibold">Aksi</th>
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

              {status !== "loading" &&
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="py-4 pl-4 pr-3">
                      {r.avatar ? (
                        <img
                          src={r.avatar}
                          alt={r.teacherName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-slate-200" />
                      )}
                    </td>
                    <td className="p-4">{r.teacherName}</td>
                    <td className="p-4">{r.accountNumber}</td>
                    <td className="p-4">{r.recipientName}</td>
                    <td className="p-4">{r.bankName}</td>
                    <td className="p-4">
                      {r.netCommission == null ? "-" : formatRupiah(r.netCommission)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-start gap-4">
                        {/* APPROVE */}
                        <button
                          onClick={() => openConfirm(r)}
                          className={cls(
                            "grid h-10 w-10 place-items-center rounded-xl",
                            "bg-[var(--accent-green-light-color)] text-[var(--accent-green-color)] hover:brightness-95"
                          )}
                          title="Setujui Pencairan"
                          disabled={decideStatus === "loading"}
                        >
                          <RiCheckSolid size={24} />
                        </button>

                        {/* REJECT */}
                        <button
                          onClick={() => openReject(r)}
                          className="text-[var(--accent-red-color)] hover:brightness-90"
                          title="Tolak"
                          disabled={decideStatus === "loading"}
                        >
                          <RiCloseLine size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination (server-side) */}
        <div className="mt-4 flex items-center justify-center gap-2 pb-4">
          <button
            onClick={() =>
              dispatch(
                fetchPayoutGuruListThunk({
                  page: Math.max(1, current - 1),
                  limit,
                  sort_by: "requested_at",
                  sort_dir: "DESC",
                  status: "requested",
                  search: search.trim() || undefined,
                })
              )
            }
            disabled={current <= 1}
            className={cls(
              "cursor-pointer",
              current <= 1 && "opacity-40 cursor-not-allowed"
            )}
            aria-label="Prev"
          >
            <RiArrowLeftSLine size={25} />
          </button>

          <span className="px-2 text-sm">
            {current} / {pageCount}
          </span>

          <button
            onClick={() =>
              dispatch(
                fetchPayoutGuruListThunk({
                  page: Math.min(pageCount, current + 1),
                  limit,
                  sort_by: "requested_at",
                  sort_dir: "DESC",
                  status: "requested",
                  search: search.trim() || undefined,
                })
              )
            }
            disabled={current >= pageCount}
            className={cls(
              "cursor-pointer",
              current >= pageCount && "opacity-40 cursor-not-allowed"
            )}
            aria-label="Next"
          >
            <RiArrowRightSLine size={20} />
          </button>
        </div>
      </section>

      {/* ===== Modals ===== */}
      <ConfirmationModal
        isOpen={stage === "confirm"}
        onClose={closeModal}
        icon={<RiQuestionFill />}
        iconTone="warning"
        title="Setujui Pencairan Komisi?"
        texts={[
          <>
            Anda akan menyetujui pencairan untuk{" "}
            <span className="font-semibold">{target?.teacherName}</span>
          </>,
          <>
            Pastikan <span className="font-semibold">transfer sudah dilakukan</span>{" "}
            sebelum melanjutkan.
          </>,
        ]}
        button1={{
          label: "Ya, Setujui",
          onClick: () => target && approveRequest(target),
          loading: sending || decideStatus === "loading",
          variant: "primary" as const,
        }}
        button2={{
          label: "Batal",
          onClick: closeModal,
          variant: "outline" as const,
        }}
        showCloseIcon={false}
        widthClass="max-w-lg"
      />

      <ConfirmationModal
        isOpen={stage === "success"}
        onClose={() => setStage("none")}
        icon={<RiCheckboxCircleFill />}
        iconTone="success"
        title="Pengajuan Disetujui"
        texts={["Pengajuan komisi berhasil disetujui."]}
        showCloseIcon
        widthClass="max-w-md"
      />

      <ConfirmationModal
        isOpen={stage === "error"}
        onClose={() => setStage("none")}
        icon={<RiCloseLine />}
        iconTone="danger"
        title="Gagal Menyetujui"
        texts={[
          "Terjadi kendala saat menyetujui pengajuan.",
          "Silakan coba lagi beberapa saat lagi.",
        ]}
        showCloseIcon
        widthClass="max-w-md"
      />

      {/* Form Penolakan */}
      <CashoutRejectModal
        isOpen={rejectOpen}
        onClose={() => !sendingReport && setRejectOpen(false)}
        onSubmit={handleRejectSubmit}
        submitting={sendingReport || decideStatus === "loading"}
      />

      {/* Sukses / Error kirim laporan */}
      <ConfirmationModal
        isOpen={stage === "reportSuccess"}
        onClose={() => setStage("none")}
        icon={<RiCheckboxCircleFill />}
        iconTone="success"
        title="Form Penolakan Terkirim"
        texts={["Laporan penolakan telah berhasil dikirim."]}
        showCloseIcon
        widthClass="max-w-md"
      />
      <ConfirmationModal
        isOpen={stage === "reportError"}
        onClose={() => setStage("none")}
        icon={<RiCloseLine />}
        iconTone="danger"
        title="Gagal Mengirim Formulir"
        texts={[
          "Maaf, terjadi kesalahan saat mengirim laporan.",
          "Coba lagi beberapa saat lagi.",
        ]}
        showCloseIcon
        widthClass="max-w-md"
      />
    </div>
  );
};

export default CashoutVerificationPage;
