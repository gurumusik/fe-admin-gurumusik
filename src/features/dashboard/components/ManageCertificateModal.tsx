'use client';

import React, { useEffect, useMemo, useState } from "react";
import { getStatusColor } from "@/utils/getStatusColor";
import {
  RiCloseLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiMusic2Line,
  RiCheckboxMultipleFill,
  RiArrowLeftSLine,
} from "react-icons/ri";
import { resolveImageUrl } from "@/utils/resolveImageUrl";

export type CertStatus =
  | "Menunggu Verifikasi"
  | "Revisi"
  | "Disetujui"
  | "Tidak Disetujui";

export type CertificateItem = {
  id: string | number;
  title: string;
  school: string;
  instrument: string;
  grade: string;
  status: CertStatus;
  link?: string;
  instrumentIcon?: string;
  certType?: string;
  year?: number;
  files?: Array<{
    id?: number | string | null;
    file_url?: string | null;
    file_mime?: string | null;
    created_at?: string | null;
  }>;
  details?: Array<{ label: string; value: string }>;
  videoClips?: Array<{
    id?: number | string | null;
    title?: string | null;
    description?: string | null;
    link?: string | null;
  }>;
  /** legacy (single video) */
  video?: { title?: string; description?: string; link?: string } | null;
  draftStatus?: "approved" | "rejected" | "revision" | null;
  draftReason?: string | null;
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
  decisionMode?: "immediate" | "draft";
  onPreview?: (item: CertificateItem) => void;
  onApprove?: (item: CertificateItem) => void | Promise<void>;
  onReject?: (item: CertificateItem) => void; // legacy
  onRejectSubmit?: (item: CertificateItem, payload: RejectPayload) => void | Promise<void>;
  onShowRejectNote?: (item: CertificateItem) => void; // tidak dipakai (kita handle internal)
  onDraftChange?: (
    item: CertificateItem,
    payload: { status: "approved" | "rejected" | "revision"; reason?: string | null }
  ) => void;
  onDraftReset?: (item: CertificateItem) => void;
  initialItemId?: string | number;
  initialPhase?: "list" | "detail" | "preview";
  
};

type DraftDecision = "pending" | "approved" | "rejected" | "revision" | "certification";

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

const resolveHttpsUrl = (raw?: string | null): string => {
  if (!raw) return "";
  const url = raw.trim();
  if (!url) return "";
  if (url.startsWith("https://")) return url;
  if (/^https?:\/\//i.test(url)) return url.replace(/^http:\/\//i, "https://");
  if (/^www\./i.test(url)) return `https://${url}`;
  if (/^(tiktok\.com|www\.tiktok\.com|youtu\.be|youtube\.com|www\.youtube\.com)\//i.test(url)) {
    return `https://${url}`;
  }
  return "";
};

const resolveVideoEmbedUrl = (raw?: string | null): string | null => {
  const url = resolveHttpsUrl(raw);
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return `https://www.youtube.com${u.pathname}`;
    }
    if (host === "tiktok.com" || host === "www.tiktok.com") {
      const match = u.pathname.match(/\/video\/(\d+)/);
      if (match?.[1]) return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
  } catch {
    return null;
  }
  return null;
};

const CERT_TYPE_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "internasional", label: "Internasional" },
  { key: "lokal", label: "Lokal" },
  { key: "universitas", label: "Universitas" },
  { key: "penghargaan", label: "Penghargaan" },
];

const getDraftDecision = (item?: CertificateItem | null): DraftDecision => {
  if (!item) return "pending";
  if (item.draftStatus === "approved") return "approved";
  if (item.draftStatus === "rejected") return "rejected";
  if (item.draftStatus === "revision") return "revision";
  if (item.status === "Disetujui") return "approved";
  if (item.status === "Tidak Disetujui") return "rejected";
  return "pending";
};

const isLocalOrInternationalType = (certType?: string | null) => {
  const value = String(certType || "").trim().toLowerCase();
  return (
    !value ||
    value === "lokal" ||
    value === "internasional" ||
    value === "local" ||
    value === "international"
  );
};

const getPrimaryVideoUrl = (item?: CertificateItem | null) => {
  if (!item) return "";
  if (Array.isArray(item.videoClips) && item.videoClips.length > 0) {
    return resolveHttpsUrl(item.videoClips[0]?.link ?? null);
  }
  return resolveHttpsUrl(item.video?.link ?? null);
};

const getPrimaryCertificateUrl = (item?: CertificateItem | null) => {
  if (!item) return "";
  if (Array.isArray(item.files) && item.files.length > 0) {
    return resolveCertUrl(item.files[0]?.file_url ?? undefined) ?? "";
  }
  return resolveCertUrl(item.link) ?? "";
};

const getDisplayFileName = (item?: CertificateItem | null) => {
  const raw = getPrimaryCertificateUrl(item);
  if (!raw) return "-";
  try {
    const withoutQuery = raw.split("?")[0] || raw;
    const filename = withoutQuery.split("/").pop() || withoutQuery;
    return decodeURIComponent(filename);
  } catch {
    return raw;
  }
};

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
  decisionMode = "immediate",
  onDraftChange,
  onDraftReset,
  initialItemId,
  initialPhase = "detail",
}) => {
  const items = useMemo(
    () => (certificates && certificates.length ? certificates : FALLBACK),
    [certificates]
  );

  const getDisplayStatus = (item: CertificateItem): CertStatus => {
    if (decisionMode === "draft" && item.draftStatus) {
      if (item.draftStatus === "approved") return "Disetujui";
      if (item.draftStatus === "rejected") return "Tidak Disetujui";
      return "Revisi";
    }
    return item.status;
  };

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
  const [draftDecision, setDraftDecision] = useState<DraftDecision>("pending");

  const resetAll = () => {
    setPhase("list");
    setSelected(null);
    setReason("");
    setErr(null);
    setSubmitting(false);
    setRejectReadonly(false);
    setDraftDecision("pending");
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

  // Open directly to detail/preview when requested
  useEffect(() => {
    if (!isOpen) return;
    if (initialItemId == null) return;
    const found = items.find((it) => String(it.id) === String(initialItemId)) || null;
    if (!found) return;
    setSelected(found);
    setPhase(initialPhase === "preview" ? "preview" : "detail");
  }, [isOpen, initialItemId, initialPhase, items]);

  // reset form ketika bukan fase reject
  useEffect(() => {
    if (phase !== "reject") {
      setReason("");
      setErr(null);
      setSubmitting(false);
      setRejectReadonly(false);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "detail") return;
    setDraftDecision(getDraftDecision(selected));
  }, [phase, selected]);

  if (!isOpen) return null;

  const canSubmitReject = reason.trim().length >= 5 && !submitting && !rejectReadonly;
  const selectedTypeKey = (() => {
    const raw = String(selected?.certType || "").trim().toLowerCase();
    if (raw === "local") return "lokal";
    if (raw === "international") return "internasional";
    return CERT_TYPE_OPTIONS.some((item) => item.key === raw) ? raw : "lokal";
  })();
  const selectedVideoUrl = getPrimaryVideoUrl(selected);
  const selectedCertificateUrl = getPrimaryCertificateUrl(selected);
  const selectedCertificateFileName = getDisplayFileName(selected);
  const useDraftRedesign = decisionMode === "draft" && isLocalOrInternationalType(selected?.certType);
  const selectedDisplayStatus = selected ? getDisplayStatus(selected) : null;
  const canReviewSelected =
    Boolean(canDecide) && selectedDisplayStatus === "Menunggu Verifikasi";
  const showActionSection = Boolean(canDecide && selected);
  const canSaveDraftDecision =
    canReviewSelected && draftDecision !== "pending";
  const noteLabel =
    selectedDisplayStatus === "Tidak Disetujui" ? "Alasan Penolakan" : "Catatan Admin";

  const submitReject = async () => {
    if (!selected) return;
    try {
      setSubmitting(true);
      if (decisionMode === "draft") {
        onDraftChange?.(selected, {
          status: "rejected",
          reason: reason.trim() || null,
        });
        handleClose();
        return;
      }
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

  const submitDraftDecision = () => {
    if (!selected || decisionMode !== "draft") return;
    if (draftDecision === "pending") return;
    if (draftDecision === "approved") {
      onDraftChange?.(selected, { status: "approved", reason: null });
    } else if (draftDecision === "rejected") {
      openReject({
        presetReason: selected.draftReason ?? selected.rejectReason ?? "",
      });
      return;
    } else if (draftDecision === "revision") {
      onDraftChange?.(selected, { status: "revision", reason: null });
    } else {
      onDraftReset?.(selected);
    }
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
      onMouseDown={handleClose} // ⬅ langsung tutup
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[calc(100vh-4rem)] overflow-hidden"
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
            <div className="px-5 pb-5 max-h-[calc(100vh-9rem)] overflow-y-auto">
              <ul>
                {items.map((item) => {
                  const displayStatus = getDisplayStatus(item);
                  const useReviewAction =
                    Boolean(canDecide) && displayStatus === "Menunggu Verifikasi";
                  return (
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
                          <span className={`text-md font-medium ${getStatusColor(displayStatus)}`}>
                            {displayStatus}
                          </span>
                        </div>
                      </div>

                      <BtnSquare
                        ariaLabel={
                          useReviewAction
                            ? "Setujui / Review sertifikat"
                            : "Lihat detail sertifikat"
                        }
                        onClick={() => openDetail(item)}
                        bordered
                      >
                        {useReviewAction ? (
                          <RiCheckboxMultipleFill
                            size={22}
                            className="text-[var(--secondary-color)]"
                          />
                        ) : (
                          <RiEyeLine size={22} className="text-[var(--secondary-color)]" />
                        )}
                      </BtnSquare>
                    </div>
                  </li>
                )})}
              </ul>
            </div>
          </>
        )}

        {/* ========== PHASE 2: DETAIL ========== */}
        {phase === "detail" && selected && (
          useDraftRedesign ? (
            <>
              <div className="px-5 pt-5 pb-3">
                <div className="grid grid-cols-3 items-center">
                  <div className="justify-self-start">
                    <button
                      onClick={backToList}
                      className="inline-grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-100"
                      aria-label="Kembali"
                    >
                      <RiArrowLeftSLine size={20} className="text-neutral-800" />
                    </button>
                  </div>
                  <div className="justify-self-center">
                    <h3 className="text-[18px] font-semibold text-neutral-900">
                      Pengajuan Sertifikasi
                    </h3>
                  </div>
                  <div className="justify-self-end">
                    <button
                      aria-label="Tutup"
                      onClick={handleClose}
                      className="inline-grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-100"
                      title="Tutup"
                    >
                      <RiCloseLine size={20} className="text-neutral-800" />
                    </button>
                  </div>
                </div>
              </div>

              <hr className="mx-5 mb-2 border-t border-[#DCE5EF]" />

              <div className="px-5 pb-5 max-h-[calc(100vh-9rem)] overflow-y-auto">
                <div className="mb-5">
                  <p className="mb-3 text-[16px] font-semibold text-[#2D3445]">
                    Tipe Sertifikasi
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {CERT_TYPE_OPTIONS.map((option) => {
                      const checked = selectedTypeKey === option.key;
                      return (
                        <label
                          key={option.key}
                          className="inline-flex items-center gap-3 text-[15px] text-[#2D3445]"
                        >
                          <input
                            type="radio"
                            name={`cert-type-${selected.id}`}
                            checked={checked}
                            readOnly
                            className="h-[18px] w-[18px] accent-[var(--secondary-color)]"
                          />
                          <span className={!checked ? "text-[#8A94A6]" : undefined}>
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
                    Nama Sertifikasi
                  </div>
                  <div className="rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-[15px] text-[#334155]">
                    {selected.title || "-"}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
                    Penyelenggara Sertifikasi
                  </div>
                  <div className="rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-[15px] text-[#334155]">
                    {selected.school || "-"}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">Tahun</div>
                    <div className="rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-[15px] text-[#334155]">
                      {selected.year ? String(selected.year) : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
                      Instrumen
                    </div>
                    <div className="flex items-center gap-2 rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-[15px] text-[#334155]">
                      <span className="inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white">
                        {selected.instrumentIcon ? (
                          <img
                            src={selected.instrumentIcon}
                            alt={selected.instrument}
                            className="h-4 w-4 object-contain"
                          />
                        ) : (
                          <RiMusic2Line className="text-base" />
                        )}
                      </span>
                      <span className="truncate">{selected.instrument || "-"}</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">Grade</div>
                    <div className="rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-[15px] text-[#334155]">
                      {selected.grade || "-"}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
                    Video Performa
                  </div>
                  <button
                    type="button"
                    disabled={!selectedVideoUrl}
                    onClick={() => {
                      if (!selectedVideoUrl) return;
                      window.open(selectedVideoUrl, "_blank", "noopener,noreferrer");
                    }}
                    className="flex w-full items-center gap-3 rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-left text-[15px] text-[#334155] transition hover:border-[var(--secondary-color)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {selectedVideoUrl || "Video performa belum tersedia"}
                    </span>
                    <RiExternalLinkLine className="shrink-0 text-xl text-[#2D3445]" />
                  </button>
                </div>

                <div className="mb-5">
                  <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
                    File Sertifikasi
                  </div>
                  <button
                    type="button"
                    disabled={!selectedCertificateUrl}
                    onClick={() => {
                      if (!selectedCertificateUrl) return;
                      window.open(selectedCertificateUrl, "_blank", "noopener,noreferrer");
                    }}
                    className="flex w-full items-center gap-3 rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-left text-[15px] text-[#334155] transition hover:border-[var(--secondary-color)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {selectedCertificateFileName}
                    </span>
                    <RiExternalLinkLine className="shrink-0 text-xl text-[#2D3445]" />
                  </button>
                </div>

                {selected?.rejectReason ? (
                <div className="mb-5">
                  <div className="mb-2 text-[16px] font-semibold text-[#2D3445]">
                    {noteLabel}
                  </div>
                  <div className="rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-3 text-[15px] text-[#334155]">
                    {selected.rejectReason}
                  </div>
                </div>
                ) : null}

                {showActionSection ? (
                <div className="border-t border-[#DCE5EF] pt-4">
                  <p className="mb-3 text-[16px] font-semibold text-[#2D3445]">
                    Pilih Aksi Dibawah!!
                  </p>
                  {!canReviewSelected ? (
                    <p className="mb-3 text-sm text-[#8A94A6]">
                      Aksi dinonaktifkan karena status sertifikat bukan Menunggu Verifikasi.
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="grid flex-1 grid-cols-2 overflow-hidden rounded-full border border-[#D6E1EC] bg-white sm:grid-cols-4">
                      <button
                        type="button"
                        disabled
                        className="h-12 border-r border-[#E4ECF4] bg-[#F7FAFD] px-4 text-[15px] font-medium text-[#9FB0C5] cursor-not-allowed"
                        title="Sedang maintenance"
                      >
                        Ajukan Ujian
                      </button>
                      <button
                        type="button"
                        disabled={!canReviewSelected}
                        onClick={() => {
                          if (!canReviewSelected) return;
                          setDraftDecision("revision");
                        }}
                        className={[
                          "h-12 border-r border-[#E4ECF4] px-4 text-[15px] font-medium transition",
                          !canReviewSelected
                            ? "bg-[#F7FAFD] text-[#9FB0C5] cursor-not-allowed"
                            :
                          draftDecision === "revision"
                            ? "bg-[#E9F3FF] text-[var(--secondary-color)]"
                            : "bg-white text-[#2D3445] hover:bg-[#F7FAFD]",
                        ].join(" ")}
                      >
                        Revisi
                      </button>
                      <button
                        type="button"
                        disabled={!canReviewSelected}
                        onClick={() => {
                          if (!canReviewSelected) return;
                          setDraftDecision("rejected");
                        }}
                        className={[
                          "h-12 border-r border-[#E4ECF4] px-4 text-[15px] font-medium transition",
                          !canReviewSelected
                            ? "bg-[#F7FAFD] text-[#9FB0C5] cursor-not-allowed"
                            :
                          draftDecision === "rejected"
                            ? "bg-[#FFF1F5] text-[var(--accent-red-color)]"
                            : "bg-white text-[#2D3445] hover:bg-[#F7FAFD]",
                        ].join(" ")}
                      >
                        Tolak
                      </button>
                      <button
                        type="button"
                        disabled={!canReviewSelected}
                        onClick={() => {
                          if (!canReviewSelected) return;
                          setDraftDecision("approved");
                        }}
                        className={[
                          "h-12 px-4 text-[15px] font-medium transition",
                          !canReviewSelected
                            ? "bg-[#F7FAFD] text-[#9FB0C5] cursor-not-allowed"
                            :
                          draftDecision === "approved"
                            ? "bg-[#EEF9F2] text-[#18B968]"
                            : "bg-white text-[#2D3445] hover:bg-[#F7FAFD]",
                        ].join(" ")}
                      >
                        Setujui
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={!canSaveDraftDecision}
                      onClick={submitDraftDecision}
                      className={[
                        "h-12 rounded-full px-8 text-[15px] font-semibold transition lg:min-w-[140px]",
                        canSaveDraftDecision
                          ? "bg-[var(--primary-color)] text-neutral-900 hover:brightness-95"
                          : "bg-neutral-200 text-neutral-500 cursor-not-allowed",
                      ].join(" ")}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
                ) : null}
              </div>
            </>
          ) : (
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

            <div className="px-6 pb-6 max-h-[calc(100vh-9rem)] overflow-y-auto">
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
                  <div className="text-[15px] font-semibold text-neutral-900 mb-2">Tahun</div>
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3 text-neutral-700">
                    {selected.year ? String(selected.year) : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-neutral-900 mb-2">Tipe Sertifikat</div>
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3 text-neutral-700">
                    {selected.certType || "-"}
                  </div>
                </div>
              </div>

              {selected.details && selected.details.length > 0 && (
                <div className="mb-6">
                  <div className="text-[15px] font-semibold text-neutral-900 mb-2">Detail Tambahan</div>
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3">
                    <ul className="space-y-2">
                      {selected.details.map((d, idx) => (
                        <li key={`${d.label}-${idx}`} className="text-sm text-neutral-700">
                          <span className="font-medium text-neutral-900">{d.label}:</span>{" "}
                          <span className="break-all">{d.value || "-"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

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

              <div className="mb-6">
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">Video Instrumen</div>
                {Array.isArray(selected.videoClips) && selected.videoClips.length > 0 ? (
                  <div className="space-y-3">
                    {selected.videoClips.map((v, idx) => {
                      const titleTxt = (v.title ?? "").trim() || `Cuplikan Video ${idx + 1}`;
                      const descTxt = (v.description ?? "").trim();
                      const linkTxt = (v.link ?? "").trim();
                      const embed = resolveVideoEmbedUrl(linkTxt);
                      return (
                        <div key={String(v.id ?? idx)} className="rounded-xl border border-neutral-300 bg-neutral-100/50 p-3">
                          <div className="text-sm font-medium text-neutral-900 mb-1">{titleTxt}</div>
                          {descTxt ? <div className="text-sm text-neutral-600 mb-3">{descTxt}</div> : null}
                          {linkTxt ? (
                            embed ? (
                              <div className="aspect-video rounded-lg overflow-hidden bg-black/5">
                                <iframe
                                  src={embed || undefined}
                                  title={titleTxt}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <a
                                href={resolveHttpsUrl(linkTxt)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-[var(--secondary-color)] underline"
                              >
                                Buka video
                              </a>
                            )
                          ) : (
                            <div className="text-sm text-neutral-600">Link video tidak tersedia.</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : selected.video?.link ? (
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 p-3">
                    <div className="text-sm font-medium text-neutral-900 mb-1">{selected.video?.title || "Cuplikan Video"}</div>
                    {selected.video?.description ? (
                      <div className="text-sm text-neutral-600 mb-3">{selected.video.description}</div>
                    ) : null}
                    {resolveVideoEmbedUrl(selected.video.link) ? (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black/5">
                        <iframe
                          src={resolveVideoEmbedUrl(selected.video.link) || undefined}
                          title={selected.video?.title || "Video Instrumen"}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a
                        href={resolveHttpsUrl(selected.video.link)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[var(--secondary-color)] underline"
                      >
                        Buka video
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3 text-neutral-600">
                    Belum ada video instrumen.
                  </div>
                )}
              </div>

              <div>
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">File Sertifikasi</div>
                {selected.files && selected.files.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selected.files.map((f, idx) => {
                      const resolved = resolveCertUrl(f.file_url ?? undefined);
                      const disabled = !resolved;
                      return (
                        <button
                          key={String(f.id ?? idx)}
                          disabled={disabled}
                          className="inline-flex items-center rounded-full px-4 py-2 border text-[14px]
                                     border-[var(--secondary-color)] text-[var(--secondary-color)]
                                     hover:bg-[var(--secondary-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() =>
                            openPreview({
                              ...selected,
                              link: resolved || undefined,
                            })
                          }
                        >
                          Lihat File {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <button
                    disabled={!selected.link}
                    className="inline-flex items-center rounded-full px-4 py-2 border text-[14px]
                               border-[var(--secondary-color)] text-[var(--secondary-color)]
                               hover:bg-[var(--secondary-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => openPreview(selected)}
                  >
                    Lihat Sertifikat
                  </button>
                )}
              </div>
              {selected?.rejectReason ? (
                <div className="mt-6">
                  <div className="text-[15px] font-semibold text-neutral-900 mb-2">
                    {noteLabel}
                  </div>
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3 text-neutral-700">
                    {selected.rejectReason}
                  </div>
                </div>
              ) : null}
              {showActionSection && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    disabled={!canReviewSelected}
                    onClick={() => {
                      if (!canReviewSelected) return;
                      openReject();
                    }}
                    className={[
                      "rounded-full px-8 py-3 border-2 bg-white",
                      canReviewSelected
                        ? "text-[var(--accent-red-color)] border-[var(--accent-red-color)] hover:bg-[var(--accent-pink-color)]/5"
                        : "text-neutral-400 border-neutral-300 cursor-not-allowed",
                    ].join(" ")}
                  >
                    Tolak
                  </button>
                  <button
                    type="button"
                    disabled={!canReviewSelected}
                    onClick={async () => {
                      if (!canReviewSelected) return;
                      if (decisionMode === "draft") {
                        onDraftChange?.(selected, { status: "approved", reason: null });
                        handleClose();
                        return;
                      }
                      if (onApprove) {
                        await onApprove(selected);
                      }
                      handleClose();
                    }}
                    className={[
                      "rounded-full px-8 py-3 font-semibold shadow",
                      canReviewSelected
                        ? "bg-[var(--primary-color)] text-neutral-900 hover:brightness-95"
                        : "bg-neutral-200 text-neutral-500 cursor-not-allowed shadow-none",
                    ].join(" ")}
                  >
                    Setujui
                  </button>
                </div>
              )}
            </div>
          </>
          )
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

            <div className="px-5 mb-6 max-h-[calc(100vh-9rem)] overflow-y-auto">
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

            <div className="px-5 md:px-6 pb-4 space-y-4 max-h-[calc(100vh-9rem)] overflow-y-auto">
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
                <button onClick={backToDetail} className="rounded-full px-6 py-3 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50">
                  {rejectReadonly ? "Kembali" : "Kembali"}
                </button>
                {!rejectReadonly && (
                  <button
                    onClick={submitReject}
                    disabled={!canSubmitReject}
                    className="rounded-full px-6 py-3 font-semibold bg-[var(--primary-color)] text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95 transition"
                  >
                    {submitting
                      ? "Menyimpan..."
                      : decisionMode === "draft"
                        ? "Simpan Penolakan"
                        : "Kirim Laporan"}
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
