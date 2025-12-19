'use client';

import React, { useEffect, useMemo, useState } from "react";
import { getStatusColor } from "@/utils/getStatusColor";
import {
  RiCloseLine,
  RiEyeFill,
  RiMusic2Line,
  RiStickyNoteFill,
  RiCheckboxMultipleFill,
  RiArrowLeftSLine,
} from "react-icons/ri";
import { resolveImageUrl } from "@/utils/resolveImageUrl";

export type CertStatus = "Menunggu Verifikasi" | "Disetujui" | "Tidak Disetujui";

export type CertificateItem = {
  id: string | number;
  title: string;
  school: string;
  instrument: string;
  grade: string;
  status: CertStatus;
  link?: string;
  instrumentIcon?: string;
  /** alasan penolakan dari backend (nullable) */
  rejectReason?: string | null;
};

type RejectPayload = { reason: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  certificates?: CertificateItem[];
  title?: string;
  canDecide?: boolean;
  onPreview?: (item: CertificateItem) => void;
  onApprove?: (item: CertificateItem) => void;
  onReject?: (item: CertificateItem) => void; // legacy
  onRejectSubmit?: (item: CertificateItem, payload: RejectPayload) => void | Promise<void>;
  onShowRejectNote?: (item: CertificateItem) => void; // tidak dipakai (kita handle internal)
  
};

const FALLBACK: CertificateItem[] = [
  { id: 1, title: "Rockstar 3", school: "Javas Music School", instrument: "Piano", grade: "Grade III", status: "Menunggu Verifikasi",  link: "/assets/images/certificate-demo.jpg" },
  { id: 2, title: "Rockstar 3", school: "Javas Music School", instrument: "Piano", grade: "Grade III", status: "Disetujui",            link: "/assets/images/certificate-demo.jpg" },
  { id: 3, title: "Rockstar 3", school: "Javas Music School", instrument: "Piano", grade: "Grade III", status: "Tidak Disetujui",      link: "/assets/images/certificate-demo.jpg", rejectReason: "Nama pada sertifikat tidak sesuai KTP." },
  { id: 4, title: "Rockstar 3", school: "Javas Music School", instrument: "Piano", grade: "Grade III", status: "Disetujui",            link: "/assets/images/certificate-demo.jpg" },
];

const BtnSquare: React.FC<
  React.PropsWithChildren<{ bordered?: boolean; onClick?: () => void; ariaLabel: string }>
> = ({ bordered = true, onClick, ariaLabel, children }) => (
  <button
    aria-label={ariaLabel}
    onClick={onClick}
    className={[
      "inline-grid place-items-center w-10 h-10 rounded-xl bg-white transition active:scale-95",
      bordered ? "border border-neutral-300 hover:bg-neutral-50" : "hover:bg-neutral-50",
    ].join(" ")}
  >
    {children}
  </button>
);

const isPdfTypeOrUrl = (contentType?: string | null, url?: string) => {
  if (contentType && contentType.toLowerCase().includes("pdf")) return true;
  if (url && /\.pdf(\?|$)/i.test(url)) return true;
  return false;
};
const resolveCertUrl = (raw?: string) => resolveImageUrl(raw ?? null) ?? raw ?? undefined;

const ManageCertificateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  certificates,
  title = "Kelola Sertifikat",
  onApprove,
  onReject,           // legacy
  onRejectSubmit,     // kirim reason saja
  onPreview,
  canDecide = true,
}) => {
  const items = useMemo(
    () => (certificates && certificates.length ? certificates : FALLBACK),
    [certificates]
  );

  /** ===== PHASE HANDLING ===== */
  const [phase, setPhase] = useState<"list" | "detail" | "preview" | "reject">("list");
  const [selected, setSelected] = useState<CertificateItem | null>(null);

  // close helper -> selalu reset state ke awal
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobType, setBlobType] = useState<string | null>(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const [blobErr, setBlobErr] = useState<string | null>(null);

  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReadonly, setRejectReadonly] = useState(false);

  const resetAll = () => {
    setPhase("list");
    setSelected(null);
    setReason("");
    setErr(null);
    setSubmitting(false);
    setRejectReadonly(false);
    setBlobErr(null);
    setBlobLoading(false);
    setBlobType(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
  };

  const handleClose = () => {
    resetAll();
    onClose?.();
  };

  const openDetail = (item: CertificateItem) => {
    setSelected(item);
    setPhase("detail");
  };
  const openPreview = (item: CertificateItem) => {
    setSelected(item);
    setPhase("preview");
    onPreview?.(item);
  };
  const openReject = (opts?: { readonly?: boolean; presetReason?: string }) => {
    setRejectReadonly(Boolean(opts?.readonly));
    setReason(opts?.presetReason ?? "");
    setPhase("reject");
  };

  const backToList = () => { setPhase("list"); setSelected(null); };
  const backToDetail = () => setPhase("detail");

  // ====== Preview blob effect ======
  useEffect(() => {
    let cancelled = false;
    const loadBlob = async () => {
      if (phase !== "preview" || !selected?.link) {
        if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); setBlobType(null); }
        setBlobLoading(false); setBlobErr(null);
        return;
      }
      try {
        setBlobLoading(true); setBlobErr(null);
        const fileUrl = resolveCertUrl(selected.link)!;
        const resp = await fetch(fileUrl);
        const ct = resp.headers.get("Content-Type") || "";
        const b = await resp.blob();
        const u = URL.createObjectURL(b);
        if (cancelled) { URL.revokeObjectURL(u); return; }
        setBlobType(ct || b.type || null);
        setBlobUrl(u);
      } catch {
        setBlobErr("Gagal memuat pratinjau.");
        setBlobUrl(null); setBlobType(null);
      } finally {
        if (!cancelled) setBlobLoading(false);
      }
    };
    loadBlob();
    return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selected?.link]);

  // Esc + lock scroll
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // reset form ketika bukan fase reject
  useEffect(() => {
    if (phase !== "reject") {
      setReason("");
      setErr(null);
      setSubmitting(false);
      setRejectReadonly(false);
    }
  }, [phase]);

  if (!isOpen) return null;

  const canSubmitReject = reason.trim().length >= 5 && !submitting && !rejectReadonly;

  const submitReject = async () => {
    if (!selected) return;
    try {
      setSubmitting(true);
      if (onRejectSubmit) {
        await onRejectSubmit(selected, { reason: reason.trim() });
      } else if (onReject) {
        onReject(selected);
      }
      handleClose();
    } catch {
      setErr("Gagal mengirim laporan. Coba lagi beberapa saat.");
    } finally {
      setSubmitting(false);
    }
  };

  const showDecisionButtons = canDecide && selected?.status === "Menunggu Verifikasi";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
      onMouseDown={handleClose} // ⬅ langsung tutup
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()} // cegah bubble
      >
        {/* ========== PHASE 1: LIST ========== */}
        {phase === "list" && (
          <>
            <div className="flex items-start gap-3 p-5 pb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                <p className="text-md text-neutral-600 mt-1">{items.length} Sertifikat</p>
              </div>
              <button
                aria-label="Tutup"
                onClick={handleClose}
                className="shrink-0 inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100"
                title="Tutup"
              >
                <RiCloseLine size={25} className="text-neutral-800" />
              </button>
            </div>
            <hr className="border-t border-neutral-300 mb-2 mx-5" />
            <div className="px-5 pb-5">
              <ul>
                {items.map((item) => (
                  <li key={item.id} className="py-3 border-b border-neutral-300 px-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-semibold text-neutral-900 leading-tight">{item.title}</div>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <div className="text-md text-neutral-600 leading-tight">{item.school}</div>
                          <span className="inline-flex items-center gap-1 text-md text-neutral-800">
                            {item.instrumentIcon ? (
                              <img src={item.instrumentIcon} alt={item.instrument} className="w-4 h-4 object-contain" loading="lazy" />
                            ) : (
                              <RiMusic2Line />
                            )}
                            <span className="font-medium">{item.instrument}</span>
                            <span className="text-neutral-400">•</span>
                            <span className="font-medium">{item.grade}</span>
                          </span>
                          <span className={`text-md font-medium ${getStatusColor(item.status)}`}>{item.status}</span>
                        </div>
                      </div>

                      {item.status === "Disetujui" && (
                        <BtnSquare ariaLabel="Lihat detail sertifikat" onClick={() => openDetail(item)} bordered>
                          <RiEyeFill size={22} className="text-[var(--secondary-color)]" />
                        </BtnSquare>
                      )}

                      {item.status === "Menunggu Verifikasi" && (
                        <BtnSquare ariaLabel="Setujui / Review sertifikat" onClick={() => openDetail(item)} bordered>
                          <RiCheckboxMultipleFill size={22} className="text-[var(--secondary-color)]" />
                        </BtnSquare>
                      )}

                      {item.status === "Tidak Disetujui" && (
                        <div className="flex items-center gap-3">
                          <BtnSquare
                            ariaLabel="Lihat alasan penolakan"
                            onClick={() => {
                              setSelected(item);
                              openReject({ readonly: true, presetReason: item.rejectReason ?? "" });
                            }}
                            bordered={false}
                          >
                            <RiStickyNoteFill size={22} className="text-[var(--secondary-color)]" />
                          </BtnSquare>

                          <BtnSquare ariaLabel="Lihat detail sertifikat" onClick={() => openDetail(item)} bordered>
                            <RiEyeFill size={22} className="text-[var(--secondary-color)]" />
                          </BtnSquare>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* ========== PHASE 2: DETAIL ========== */}
        {phase === "detail" && selected && (
          <>
            <div className="px-5 pt-5 pb-3">
              <div className="grid grid-cols-3 items-center">
                <div className="justify-self-start">
                  <button onClick={backToList} className="inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100" aria-label="Kembali">
                    <RiArrowLeftSLine size={20} className="text-neutral-800" />
                  </button>
                </div>
                <div className="justify-self-center">
                  <h3 className="text-[18px] font-semibold text-neutral-900">Pengajuan Sertifikasi</h3>
                </div>
                <div className="justify-self-end">
                  <button aria-label="Tutup" onClick={handleClose} className="inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100" title="Tutup">
                    <RiCloseLine size={20} className="text-neutral-800" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="mb-4">
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">Nama Sertifikasi</div>
                <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3 text-neutral-700">{selected.title || "-"}</div>
              </div>
              <div className="mb-4">
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">Penyelenggara Sertifikasi</div>
                <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3 text-neutral-700">{selected.school || "-"}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-[15px] font-semibold text-neutral-900 mb-2">Alat Musik</div>
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-2 text-neutral-800 flex items-center gap-2">
                    <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-white border border-neutral-300 overflow-hidden">
                      {selected.instrumentIcon ? (
                        <img src={selected.instrumentIcon} alt={selected.instrument} className="w-5 h-5 object-contain" />
                      ) : (
                        <span aria-hidden>🎹</span>
                      )}
                    </span>
                    <span className="font-medium">{selected.instrument || "-"}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-neutral-900 mb-2">Grade</div>
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3 text-neutral-800 font-medium">
                    {selected.grade || "-"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">File Sertifikasi</div>
                <button
                  className="inline-flex items-center rounded-full px-4 py-2 border text-[14px]
                             border-[var(--secondary-color)] text-[var(--secondary-color)]
                             hover:bg-[var(--secondary-color)]/5"
                  onClick={() => openPreview(selected)}
                >
                  Lihat Sertifikat
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========== PHASE 3: PREVIEW ========== */}
        {phase === "preview" && selected && (
          <>
            <div className="px-5 pt-5 pb-3">
              <div className="grid grid-cols-3 items-center">
                <div className="justify-self-start">
                  <button onClick={backToDetail} className="inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100" aria-label="Kembali">
                    <RiArrowLeftSLine size={20} className="text-neutral-800" />
                  </button>
                </div>
                <div className="justify-self-center">
                  <h3 className="text-[18px] font-semibold text-neutral-900">{selected.title}</h3>
                </div>
                <div className="justify-self-end">
                  <button aria-label="Tutup" onClick={handleClose} className="inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100" title="Tutup">
                    <RiCloseLine size={20} className="text-neutral-800" />
                  </button>
                </div>
              </div>
            </div>

            <hr className="text-neutral-300 m-6 mt-0" />

            <div className="px-5 mb-6">
              <div className="w-full rounded-2xl overflow-hidden bg-neutral-200">
                <div className="w-full">
                  {blobLoading && (
                    <div className="aspect-video grid place-items-center">
                      <div className="w-24 h-24 rounded-full border-4 border-neutral-300 border-t-[var(--secondary-color)] animate-spin" />
                    </div>
                  )}
                  {!blobLoading && blobErr && (
                    <div className="aspect-video grid place-items-center text-sm text-neutral-700 p-4">
                      <div className="text-center">
                        <div className="mb-2">Tidak bisa memuat pratinjau.</div>
                        {selected.link && (
                          <a
                            href={resolveCertUrl(selected.link)}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-[var(--secondary-color)]"
                          >
                            Buka file langsung
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {!blobLoading && !blobErr && (
                    <>
                      {isPdfTypeOrUrl(blobType, resolveCertUrl(selected.link)) ? (
                        <button
                          type="button"
                          onClick={() => {
                            const u = resolveCertUrl(selected.link);
                            if (u) window.open(u, "_blank", "noopener,noreferrer");
                          }}
                          title="Klik untuk membuka file asli"
                          className="block w-full cursor-zoom-in"
                        >
                          <iframe src={blobUrl || resolveCertUrl(selected.link)} className="w-full aspect-video" title="Preview PDF Sertifikat" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const u = resolveCertUrl(selected.link);
                            if (u) window.open(u, "_blank", "noopener,noreferrer");
                          }}
                          title="Klik untuk membuka file asli"
                          className="block w-full cursor-zoom-in"
                        >
                          <img
                            src={blobUrl || resolveCertUrl(selected.link) || "/assets/images/certificate-demo.jpg"}
                            alt={selected.title}
                            className="w-full aspect-video object-contain bg-neutral-100"
                          />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* only show when under_review */}
            {showDecisionButtons && (
              <div className="px-5 pb-4 grid grid-cols-2 gap-4">
                <button
                  onClick={() => openReject()}
                  className="rounded-full px-8 py-3 border-2 bg-white
                           text-[var(--accent-red-color)] border-[var(--accent-red-color)]
                           hover:bg-[var(--accent-pink-color)]/5"
                >
                  Tolak
                </button>
                <button
                  onClick={() => (onApprove ? onApprove(selected) : null)}
                  className="rounded-full px-8 py-3 font-semibold shadow
                           bg-[var(--primary-color)] text-neutral-900 hover:brightness-95"
                >
                  Setujui
                </button>
              </div>
            )}
          </>
        )}

        {/* ========== PHASE 4: REJECT FORM (no upload) ========== */}
        {phase === "reject" && selected && (
          <>
            <div className="flex items-start gap-3 p-5 pb-3">
              <div className="flex-1">
                <h3 className="text-[16px] md:text-[18px] font-semibold text-neutral-900">
                  {rejectReadonly ? "Alasan Penolakan" : "Formulir Penolakan Instrumen"}
                </h3>
              </div>
              <button aria-label="Tutup" onClick={handleClose} className="shrink-0 inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100" title="Tutup">
                <RiCloseLine size={20} className="text-neutral-800" />
              </button>
            </div>

            <hr className="border-t border-neutral-300 mb-2 mx-5" />

            <div className="px-5 md:px-6 pb-4 space-y-4">
              <div className="text-sm">
                <span className="text-neutral-500 mr-1">Perihal:</span>
                <span className="font-medium text-neutral-900">
                  {rejectReadonly ? "Alasan Penolakan" : "Penolakan Pengajuan Instrumen"} {selected.instrument || "Observasi Pembelajaran"}
                </span>
              </div>

              <div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  readOnly={rejectReadonly}
                  className={[
                    "w-full rounded-xl border border-neutral-300 px-4 py-3 text-[15px] outline-none",
                    rejectReadonly ? "bg-neutral-100 cursor-not-allowed" : "focus:ring-2 focus:ring-[var(--secondary-color)]/40"
                  ].join(" ")}
                  placeholder="Masukkan Keterangan Penolakan Instrumen"
                />
              </div>

              {err && <div className="text-sm text-red-600">{err}</div>}
            </div>

            <div className="px-5 md:px-6 pb-5">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={backToList} className="rounded-full px-6 py-3 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50">
                  {rejectReadonly ? "Kembali" : "Kembali"}
                </button>
                {!rejectReadonly && (
                  <button
                    onClick={submitReject}
                    disabled={!canSubmitReject}
                    className="rounded-full px-6 py-3 font-semibold bg-[var(--primary-color)] text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95 transition"
                  >
                    {submitting ? "Mengirim…" : "Kirim Laporan"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageCertificateModal;
