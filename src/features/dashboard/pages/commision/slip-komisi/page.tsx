import React, { useCallback, useEffect, useState } from "react";
import {
  RiCheckLine,
  RiCloseLine,
  RiQuestionLine,
  RiUpload2Line,
} from "react-icons/ri";
import { useNavigate, useParams } from "react-router-dom";
import Logo from "@/assets/images/gurumusik.png";
import {
  getWithdrawSlipGuru,
  type WithdrawSlipDTO,
} from "@/services/api/withdrawSlip.api";
import { decidePayoutGuru } from "@/services/api/payoutGuru.api";

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";
type ActionStatus = "idle" | "loading" | "succeeded" | "failed";

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const money = (n: number | null | undefined) =>
  n === null || n === undefined ? "-" : formatIDR(n);

const moneyOrDash = (n: number | null | undefined) =>
  !n ? "-" : formatIDR(n);

const bulanID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const fmtTanggalID = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${bulanID[d.getMonth()]} ${d.getFullYear()}`;
};

const fmtTanggal = (value?: string | null) => fmtTanggalID(value);

const toWordsID = (n: number): string => {
  const angka = [
    "nol",
    "satu",
    "dua",
    "tiga",
    "empat",
    "lima",
    "enam",
    "tujuh",
    "delapan",
    "sembilan",
    "sepuluh",
    "sebelas",
  ];

  const toWords = (x: number): string => {
    if (x < 12) return angka[x];
    if (x < 20) return `${angka[x - 10]} belas`;
    if (x < 100)
      return `${angka[Math.floor(x / 10)]} puluh${x % 10 ? ` ${toWords(x % 10)}` : ""}`;
    if (x < 200) return `seratus${x - 100 ? ` ${toWords(x - 100)}` : ""}`;
    if (x < 1000)
      return `${angka[Math.floor(x / 100)]} ratus${
        x % 100 ? ` ${toWords(x % 100)}` : ""
      }`;
    if (x < 2000) return `seribu${x - 1000 ? ` ${toWords(x - 1000)}` : ""}`;
    if (x < 1_000_000)
      return `${toWords(Math.floor(x / 1000))} ribu${
        x % 1000 ? ` ${toWords(x % 1000)}` : ""
      }`;
    if (x < 1_000_000_000)
      return `${toWords(Math.floor(x / 1_000_000))} juta${
        x % 1_000_000 ? ` ${toWords(x % 1_000_000)}` : ""
      }`;
    if (x < 1_000_000_000_000)
      return `${toWords(Math.floor(x / 1_000_000_000))} miliar${
        x % 1_000_000_000 ? ` ${toWords(x % 1_000_000_000)}` : ""
      }`;
    return `${toWords(Math.floor(x / 1_000_000_000_000))} triliun${
      x % 1_000_000_000_000 ? ` ${toWords(x % 1_000_000_000_000)}` : ""
    }`;
  };

  const abs = Math.abs(Math.floor(n));
  const words = toWords(abs);
  return n < 0 ? `minus ${words}` : words;
};

const terbilangIDR = (n: number | null | undefined) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  const text = `${toWordsID(n)} rupiah`;
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const SlipKomisiPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const payoutId = Number(id);
  const [slip, setSlip] = useState<WithdrawSlipDTO | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRejectSuccessOpen, setIsRejectSuccessOpen] = useState(false);
  const [isRejectErrorOpen, setIsRejectErrorOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectFile, setRejectFile] = useState<File | null>(null);
  const [rejectFormError, setRejectFormError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const applyPayoutUpdate = (nextPayout: any) => {
    if (!nextPayout) return;
    const nextStatusCode =
      (nextPayout as any).status_code ?? nextPayout.status ?? "";
    setSlip((prev) =>
      prev
        ? {
            ...prev,
            payout: {
              ...prev.payout,
              status: nextPayout.status ?? prev.payout.status,
              status_code: nextStatusCode || prev.payout.status_code,
              amount_paid:
                nextPayout.amount ?? prev.payout.amount_paid ?? null,
              reference:
                nextPayout.transfer_reference ?? prev.payout.reference ?? null,
            },
          }
        : prev
    );
  };

  const fetchSlip = useCallback(() => {
    if (!Number.isFinite(payoutId)) return;
    let mounted = true;
    setStatus("loading");
    setError(null);
    setSlip(null);

    getWithdrawSlipGuru(payoutId)
      .then((data) => {
        if (!mounted) return;
        setSlip(data);
        setStatus("succeeded");
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err?.message ?? "Gagal memuat slip pendapatan.");
        setStatus("failed");
      });

    return () => {
      mounted = false;
    };
  }, [payoutId]);

  useEffect(() => {
    const cleanup = fetchSlip();
    return cleanup;
  }, [fetchSlip]);

  if (!Number.isFinite(payoutId)) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-white">
        <div className="text-center">
          <p className="font-semibold text-red-600">Payout ID tidak valid.</p>
          <button onClick={() => navigate(-1)} className="mt-3 underline">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading" || (!slip && status === "idle")) {
    return (
      <div className="min-h-screen bg-white py-6">
        <div className="mx-auto w-full max-w-4xl p-6 sm:p-8">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded bg-neutral-200" />
                <div className="h-5 w-36 rounded bg-neutral-200" />
              </div>
              <div className="h-5 w-40 rounded bg-neutral-200" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="h-24 rounded bg-neutral-100" />
              <div className="h-24 rounded bg-neutral-100" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="h-40 rounded bg-neutral-100" />
              <div className="h-40 rounded bg-neutral-100" />
            </div>
            <div className="h-10 rounded bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed" || !slip) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-white">
        <div className="text-center">
          <p className="font-semibold text-red-600">
            {error || "Gagal memuat slip pendapatan."}
          </p>
          <button onClick={() => navigate(-1)} className="mt-3 underline">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const {
    slip_no,
    untuk,
    tanggal_pencairan,
    pendapatan,
    potongan,
    penerimaan_bersih,
    payout,
  } = slip;

  const isPengajuan = payout?.type === "Pengajuan";

  const potTotalB =
    potongan?.total_B ??
    (potongan?.pph21 ?? 0) +
      (potongan?.denda ?? 0) +
      (potongan?.transfer_fee ?? 0) +
      (potongan?.platform_fee ?? 0) +
      (potongan?.lainnya ?? 0);

  const amountRequested = payout?.amount_requested ?? 0;
  const incomeA_pengajuan = Number(amountRequested) || 0;
  const net_pengajuan = incomeA_pengajuan - potTotalB;

  const incomeA_otomatis = pendapatan?.total_A ?? 0;
  const net_otomatis =
    typeof penerimaan_bersih === "number"
      ? penerimaan_bersih
      : incomeA_otomatis - potTotalB;

  const incomeAToShow = isPengajuan ? incomeA_pengajuan : incomeA_otomatis;
  const netToShow = isPengajuan ? net_pengajuan : net_otomatis;
  const terbilangText = terbilangIDR(netToShow);

  // const showPengajuanPrev = isOtomatis && (potongan?.lainnya || 0) > 0;
  // const lainnyaLabel = showPengajuanPrev ? "Pengajuan (sebelumnya)" : "Lainnya";

  const statusCode = payout?.status_code ?? "";
  const statusLabel =
    statusCode === "requested" ? "Menunggu Konfirmasi" : payout?.status ?? "-";
  const statusClass =
    statusCode === "requested" || payout?.status === "On Progress"
      ? "bg-yellow-100 text-yellow-700"
      : payout?.status === "Success"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  const StatusBadge = (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        statusClass,
      ].join(" ")}
      title={`Status: ${statusLabel}`}
    >
      {statusLabel}
    </span>
  );

  const canDecide = payout?.status_code === "requested";

  const handleApprove = async () => {
    if (!payout?.id) return;
    setActionStatus("loading");
    setActionError(null);
    try {
      const res = await decidePayoutGuru(payout.id, { action: "approve" });
      applyPayoutUpdate(res?.data);
      setActionStatus("succeeded");
      setIsSuccessOpen(true);
      fetchSlip();
    } catch (err: any) {
      setActionStatus("failed");
      setActionError(err?.message ?? "Gagal menyetujui payout.");
      setIsErrorOpen(true);
    }
  };

  const handleReject = async () => {
    if (!payout?.id) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectFormError("Keterangan penolakan wajib diisi.");
      return;
    }
    if (rejectFile && rejectFile.size > 5 * 1024 * 1024) {
      setRejectFormError("Ukuran file maksimal 5MB.");
      return;
    }
    setActionStatus("loading");
    setRejectFormError(null);
    setRejectError(null);
    try {
      const res = await decidePayoutGuru(payout.id, { action: "reject", reason });
      applyPayoutUpdate(res?.data);
      setActionStatus("succeeded");
      setIsRejectOpen(false);
      setIsRejectSuccessOpen(true);
      setRejectReason("");
      setRejectFile(null);
      fetchSlip();
    } catch (err: any) {
      setActionStatus("failed");
      setRejectError(err?.message ?? "Gagal menolak payout.");
      setIsRejectErrorOpen(true);
    }
  };

  const handleCloseApproveSuccess = () => {
    setIsSuccessOpen(false);
    navigate("/dashboard-admin/tutor-commision/cashout-verification");
  };
  const handleCloseRejectSuccess = () => {
    setIsRejectSuccessOpen(false);
    navigate("/dashboard-admin/tutor-commision/cashout-verification");
  };

  return (
    <div className="min-h-screen bg-white py-6 print:bg-white">
      <div className="mx-auto w-full max-w-4xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard-admin/tutor-commision")}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-3 py-1.5 text-xs font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
            >
              Kembali
            </button>
            <img src={Logo} alt="GuruMusik.ID" className="h-9 w-9" />
            <div className="text-lg font-bold text-neutral-900">GuruMusik</div>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-neutral-900">
              Slip Pendapatan
            </div>
            <div className="text-sm text-blue-600">{slip_no}</div>
            <div className="mt-1">{StatusBadge}</div>
          </div>
        </div>

        {/* Info blok */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <div className="font-bold text-neutral-800">
              DITERBITKAN ATAS NAMA
            </div>
            <div className="font-semibold">
              Aplikator : PT PRIMAVISTA NADA NUSANTARA
            </div>
            <div className="font-semibold">
              Tanggal : {fmtTanggal(tanggal_pencairan)}
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="font-bold text-neutral-800">Untuk</div>
            <div className="grid grid-cols-[120px_1fr] gap-y-1">
              <div>Id Guru</div>
              <div>: {untuk?.id_guru ?? "-"}</div>
              <div>Guru</div>
              <div>: {untuk?.guru ?? "-"}</div>
              <div>Tanggal Pencairan</div>
              <div>: {fmtTanggalID(tanggal_pencairan)}</div>
              <div>Email</div>
              <div>: {untuk?.email ?? "-"}</div>
              <div>No Telepon</div>
              <div>: {untuk?.no_telp || "-"}</div>
              <div>Alamat</div>
              <div>: {untuk?.alamat || "-"}</div>
            </div>
          </div>
        </div>

        <hr className="my-6 border-neutral-200" />

        {/* Penghasilan & Potongan */}
        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-neutral-200 sm:block"
          />

          {/* Penghasilan */}
          <div className="text-sm">
            <div className="mb-2 font-bold text-neutral-800">Penghasilan</div>

            {isPengajuan ? (
              <>
                <div className="flex justify-between py-1">
                  <span>Diminta</span>
                  <span>{money(amountRequested)}</span>
                </div>
                <div className="mt-2 flex items-end justify-between font-bold text-neutral-800">
                  <span>Total Penghasilan (A)</span>
                  <span className="text-lg">{money(incomeAToShow)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-1">
                  <span>Komisi Kelas</span>
                  <span>{money(pendapatan?.komisi_kelas)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Pendapatan Modul</span>
                  <span>{moneyOrDash(pendapatan?.pendapatan_modul)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Bonus</span>
                  <span>{moneyOrDash(pendapatan?.bonus)}</span>
                </div>
                <div className="mt-2 flex items-end justify-between font-bold text-neutral-800">
                  <span>Total Penghasilan (A)</span>
                  <span className="text-lg">{money(incomeAToShow)}</span>
                </div>
              </>
            )}
          </div>

          {/* Potongan */}
          <div className="text-sm">
            <div className="mb-2 font-bold text-neutral-800">Potongan</div>
            <div className="flex justify-between py-1">
              <span>PPH 21</span>
              <span>{money(potongan?.pph21)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Denda</span>
              <span>{money(potongan?.denda)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Transfer Fee</span>
              <span>{moneyOrDash(potongan?.transfer_fee)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Platform Fee</span>
              <span>{moneyOrDash(potongan?.platform_fee)}</span>
            </div>
            {/* <div className="flex justify-between py-1">
              <span>{lainnyaLabel}</span>
              <span>{moneyOrDash(potongan?.lainnya)}</span>
            </div> */}
            <div className="mt-2 flex items-end justify-between font-bold text-neutral-800">
              <span>Total Potongan (B)</span>
              <span className="text-lg">{money(potTotalB)}</span>
            </div>
          </div>
        </div>

        {/* Net */}
        <div className="mt-5 text-center">
          <div className="text-lg font-bold text-neutral-900">
            Penerimaan Bersih (A - B) = {money(netToShow)}
          </div>
          <p className="mt-1 text-sm text-[#6A7B98]">
            Terbilang: {terbilangText}
          </p>
        </div>

        {/* Actions */}
        <div className="no-print mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              setRejectReason("");
              setRejectFile(null);
              setRejectFormError(null);
              setRejectError(null);
              setIsRejectOpen(true);
            }}
            disabled={!canDecide || actionStatus === "loading"}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--secondary-color)] text-sm font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-64"
          >
            Tolak
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={!canDecide || actionStatus === "loading"}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--warning-color,#F5C542)] text-sm font-semibold text-[#1F2937] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-64"
          >
            Setujui
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Confirm Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--warning-color,#F5C542)]/20 text-[var(--warning-color,#F5C542)]">
              <RiQuestionLine size={26} />
            </div>
            <h3 className="mt-4 text-center text-lg font-semibold text-neutral-900">
              Setujui Pencairan Komisi?
            </h3>
            <p className="mt-2 text-center text-sm text-neutral-600">
              Anda akan mengirim slip komisi ke{" "}
              <span className="font-semibold">{untuk?.guru ?? "-"}</span>.
              Pastikan komisi sudah di transfer sebelum melanjutkan.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="h-11 w-full rounded-full border border-[var(--secondary-color)] text-sm font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
              >
                Ga Jadi Deh
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmOpen(false);
                  handleApprove();
                }}
                disabled={actionStatus === "loading"}
                className="h-11 w-full rounded-full bg-[var(--warning-color,#F5C542)] text-sm font-semibold text-[#1F2937] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ya, Setujui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Form Modal */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-900">
                Formulir Penolakan Pencairan Komisi
              </h3>
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                className="text-neutral-500 hover:text-neutral-700"
                aria-label="Tutup"
              >
                <RiCloseLine size={18} />
              </button>
            </div>
            <div className="mt-4 border-t border-neutral-200" />

            <div className="mt-4 text-sm text-neutral-600">Perihal:</div>
            <div className="text-sm font-semibold text-neutral-900">
              Penolakan Pencairan Komisi
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-4 py-2 text-sm font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]">
                <RiUpload2Line size={18} />
                Upload Foto
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/heic,image/heif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setRejectFile(file);
                    if (file && file.size > 5 * 1024 * 1024) {
                      setRejectFormError("Ukuran file maksimal 5MB.");
                    } else {
                      setRejectFormError(null);
                    }
                  }}
                />
              </label>
              <p className="mt-2 text-xs text-neutral-500">
                Format (Max 5mb): PNG, JPG, JPEG, HEIG
              </p>
              {rejectFile && (
                <p className="mt-1 text-xs text-neutral-500">
                  File: {rejectFile.name}
                </p>
              )}
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Masukkan keterangan Penolakan Pencairan Komisi"
              className="mt-4 h-28 w-full resize-none rounded-xl border border-[var(--secondary-light-color)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
            />

            {rejectFormError && (
              <div className="mt-3 text-sm text-red-600">{rejectFormError}</div>
            )}

            <button
              type="button"
              onClick={handleReject}
              disabled={actionStatus === "loading"}
              className="mt-5 h-11 w-full rounded-full bg-[var(--warning-color,#F5C542)] text-sm font-semibold text-[#1F2937] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Kirim Laporan
            </button>
          </div>
        </div>
      )}

      {/* Reject Success Modal */}
      {isRejectSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={handleCloseRejectSuccess}
              className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-700"
              aria-label="Tutup"
            >
              <RiCloseLine size={18} />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <RiCheckLine size={26} />
            </div>
            <h3 className="mt-4 text-center text-base font-semibold text-neutral-900">
              Formulir Berhasil Dikirim
            </h3>
            <p className="mt-2 text-center text-sm text-neutral-600">
              Laporan penolakan pencairan komisi telah berhasil dikirim.
            </p>
          </div>
        </div>
      )}

      {/* Reject Error Modal */}
      {isRejectErrorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setIsRejectErrorOpen(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-700"
              aria-label="Tutup"
            >
              <RiCloseLine size={18} />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <RiCloseLine size={24} />
            </div>
            <h3 className="mt-4 text-center text-base font-semibold text-neutral-900">
              Gagal Mengirim Formulir
            </h3>
            <p className="mt-2 text-center text-sm text-neutral-600">
              {rejectError ||
                "Maaf, terjadi kesalahan saat mengirim laporan. Coba lagi beberapa saat lagi."}
            </p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={handleCloseApproveSuccess}
              className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-700"
              aria-label="Tutup"
            >
              <RiCloseLine size={18} />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <RiCheckLine size={26} />
            </div>
            <h3 className="mt-4 text-center text-base font-semibold text-neutral-900">
              Pencairan Komisi Disetujui
            </h3>
            <p className="mt-2 text-center text-sm text-neutral-600">
              Slip komisi telah berhasil dikirim secara otomatis.
            </p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {isErrorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setIsErrorOpen(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-700"
              aria-label="Tutup"
            >
              <RiCloseLine size={18} />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <RiCloseLine size={24} />
            </div>
            <h3 className="mt-4 text-center text-base font-semibold text-neutral-900">
              Pencairan Komisi Gagal Disetujui
            </h3>
            <p className="mt-2 text-center text-sm text-neutral-600">
              {actionError ||
                "Terjadi kendala saat menyetujui pencairan komisi. Silakan coba lagi beberapa saat lagi."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlipKomisiPage;
