// src/ui/modal/ApprovalModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { RiTimeLine, RiArrowRightLine } from "react-icons/ri";
import ProgramAvatarBadge from "@/components/ui/badge/ProgramAvatarBadge";
import { icons as instrumentIcons } from "@/utils/icons";

type ButtonCfg = {
  label: string;
  onClick?: () => void;
  loading?: boolean;
  variant?: "primary" | "success" | "danger" | "neutral" | "outline" | "ghost";
  className?: string;
};

export type ApprovalMode = "approval" | "reason";

export type ApprovalModalProps = {
  isOpen: boolean;
  onClose: () => void;

  /* Layout & behavior */
  mode: ApprovalMode; // mode awal saat modal dibuka
  showCloseIcon?: boolean; // default: true
  closeOnOverlay?: boolean; // default: true
  widthClass?: string; // default: 'max-w-lg'

  /* Header */
  student: {
    name: string;
    avatarUrl?: string | null;
    package?: string | null; // badge pada ProgramAvatarBadge
    instrument?: string | null; // contoh: "Vocal"
  };

  /* Title  */
  title?: string;

  /* Jadwal (mode approval) */
  from?: { dateLabel: string; timeLabel: string };
  to?: { dateLabel: string; timeLabel: string };

  /* Tombol (mode approval) opsional */
  showActionButtons?: boolean; // default: true
  rejectBtn?: ButtonCfg | null;
  approveBtn?: ButtonCfg | null;

  /* Reason (mode reason) */
  reasonPlaceholder?: string;
  reasonValue?: string; // controlled
  onReasonChange?: (val: string) => void;
  onSubmitReason?: (reason: string) => void;
  showSubmitButton?: boolean; // default: true
  submitButton?: Omit<ButtonCfg, "onClick">;
  reasonReadOnly?: boolean;
};

const cls = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

function classesForButton(
  b?: ButtonCfg | Omit<ButtonCfg, "onClick">,
  isPrimary?: boolean
) {
  if (!b) return "";
  const base =
    "w-full rounded-full font-semibold py-3 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed";
  const variant =
    ("variant" in b && b.variant) ?? (isPrimary ? "primary" : "outline");
  const custom = ("className" in b && b.className) || undefined;
  if (custom) return cls(base, custom);
  switch (variant) {
    case "primary":
      return cls(
        base,
        "bg-[var(--primary-color)] hover:bg-yellow-500 text-neutral-900"
      );
    case "success":
      return cls(
        base,
        "bg-[var(--accent-green-color)] hover:bg-emerald-700 text-white"
      );
    case "danger":
      return cls(
        base,
        "bg-[var(--accent-red-color)] hover:bg-red-700 text-white"
      );
    case "neutral":
      return cls(base, "bg-neutral-800 hover:bg-neutral-900 text-white");
    case "outline":
      return cls(
        base,
        "border border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-blue-50"
      );
    case "ghost":
      return cls(base, "text-neutral-700 hover:bg-neutral-100");
    default:
      return base;
  }
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  mode,
  showCloseIcon = true,
  closeOnOverlay = true,
  widthClass = "max-w-lg",

  student,
  title,

  from,
  to,

  showActionButtons = true,
  rejectBtn,
  approveBtn,

  reasonPlaceholder = "Ceritakan kenapa jadwal baru kurang pas",
  reasonValue,
  onReasonChange,
  onSubmitReason,
  showSubmitButton = true,
  submitButton,
  reasonReadOnly = false,
}) => {
  // Refs
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement | null>(null);

  // Mode internal agar bisa switch ke "reason" saat klik "Tolak"
  const [curMode, setCurMode] = useState<ApprovalMode>(mode);

  // Reset mode internal setiap kali modal dibuka ulang / mode awal berubah
  useEffect(() => {
    if (isOpen) setCurMode(mode);
  }, [isOpen, mode]);

  // Reason
  const [reasonLocal, setReasonLocal] = useState("");
  const reason = reasonValue ?? reasonLocal;

  // Fokus & ESC
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      if (curMode === "reason") {
        reasonRef.current?.focus();
      } else {
        primaryRef.current?.focus();
      }
    }, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, curMode, onClose]);

  const instrumentMeta = useMemo(() => {
    const key = (student.instrument || "").toLowerCase();
    return instrumentIcons.find((i) => i.type === key) || null;
  }, [student.instrument]);

  // guard setelah SEMUA hook
  if (!isOpen) return null;

  const handleReasonChange = (v: string) => {
    if (onReasonChange) onReasonChange(v);
    else setReasonLocal(v);
  };

  const fallbackApprove: ButtonCfg = { label: "Terima", variant: "primary" };
  const _reject = rejectBtn ?? null; // bisa single button
  const _approve = approveBtn ?? fallbackApprove;

  const onRejectClick = () => {
    _reject?.onClick?.();
    setCurMode("reason"); // pindah ke mode reason
  };
  const onApproveClick = () => {
    _approve?.onClick?.();
    onClose();
  };

  const submitBtnLabel = submitButton?.label ?? "Bagikan Pengalaman Anda";
  const submitBtnVariant = submitButton?.variant ?? "primary";
  const submitBtnLoading = submitButton?.loading ?? false;
  const submitBtnClass = submitButton?.className;

  const headerTitle =
    title ?? (curMode === "approval" ? "Mengajukan Perubahan Jadwal!" : "");

  // Alignment header & title sesuai mode internal
  const headerLayout =
    curMode === "approval"
      ? "flex-col items-center text-center"
      : "flex-row items-center text-left";

  const titleAlign = curMode === "approval" ? "text-center" : "text-left";

  // Susun tombol approval dinamis (1 atau 2)
  const btns: Array<{ cfg: ButtonCfg; primary: boolean; onClick: () => void }> =
    [];
  if (_reject && showActionButtons)
    btns.push({ cfg: _reject, primary: false, onClick: onRejectClick });
  if (_approve && showActionButtons)
    btns.push({ cfg: _approve, primary: true, onClick: onApproveClick });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cls(
          "w-full rounded-2xl bg-white shadow-2xl border border-neutral-200",
          widthClass
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 relative">
          {showCloseIcon && (
            <button
              aria-label="Tutup"
              onClick={onClose}
              className="absolute top-4 right-6 text-neutral-500 text-2xl leading-none font-bold hover:text-neutral-700 cursor-pointer"
            >
              &times;
            </button>
          )}

          <div className={cls("flex gap-3", headerLayout)}>
            <div
              className={cls(
                "flex flex-wrap items-center gap-4",
                curMode === "approval" ? "justify-center" : ""
              )}
            >
              <ProgramAvatarBadge
                src={student.avatarUrl || "/assets/images/profile.png"}
                alt={student.name}
                pkg={student.package || ""}
                size={45}
              />
              <h3 className="text-base sm:text-lg text-neutral-950 font-medium">
                {student.name}
              </h3>
              {instrumentMeta && (
                <span className="inline-flex items-center gap-1 text-[15px] text-neutral-900 font-medium">
                  |
                  {/* Ganti next/image -> img biasa */}
                  <img
                    src={instrumentMeta.url}
                    alt={instrumentMeta.alt}
                    width={22}
                    height={22}
                  />
                  <span className="capitalize">{student.instrument}</span>
                </span>
              )}
            </div>
          </div>

          {headerTitle ? (
            <h4
              className={cls(
                "mt-3 text-[15px] md:text-base font-semibold text-neutral-900",
                titleAlign
              )}
            >
              {headerTitle}
            </h4>
          ) : null}
        </div>

        <div className="mx-6 h-px bg-neutral-200" />

        {/* Body */}
        <div className="p-6 pt-4">
          {curMode === "approval" ? (
            <>
              {/* Dari → Ke */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-start gap-3">
                <div className="rounded-xl">
                  <p className="text-xs text-neutral-500 mb-1">Dari</p>
                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      <RiTimeLine
                        className="text-[var(--secondary-color)]"
                        size={18}
                      />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-neutral-800">
                        {from?.dateLabel ?? "-"}
                      </p>
                      <p className="text-neutral-600">
                        {from?.timeLabel ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center justify-center pt-6">
                  <RiArrowRightLine className="text-neutral-900" size={22} />
                </div>

                <div className="rounded-xl">
                  <p className="text-xs text-neutral-500 mb-1">Ke</p>
                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      <RiTimeLine
                        className="text-[var(--secondary-color)]"
                        size={18}
                      />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-neutral-800">
                        {to?.dateLabel ?? "-"}
                      </p>
                      <p className="text-neutral-600">{to?.timeLabel ?? "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons (1 atau 2) */}
              {btns.length > 0 && (
                <div
                  className={cls(
                    "mt-6 grid gap-3",
                    btns.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"
                  )}
                >
                  {btns.map(({ cfg, primary, onClick }, i) => (
                    <button
                      key={i}
                      ref={
                        primary
                          ? (primaryRef as React.RefObject<HTMLButtonElement>)
                          : undefined
                      }
                      type="button"
                      onClick={onClick}
                      className={classesForButton(cfg as ButtonCfg, primary)}
                      disabled={(cfg as ButtonCfg).loading}
                    >
                      {(cfg as ButtonCfg).loading
                        ? "Loading…"
                        : (cfg as ButtonCfg).label}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Reason textarea */}
              <textarea
                ref={reasonRef}
                rows={4}
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder={reasonPlaceholder}
                readOnly={reasonReadOnly}
                className={cls(
                  "w-full rounded-xl border border-neutral-300 focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-blue-100 outline-none p-3 text-sm placeholder:text-neutral-400",
                  reasonReadOnly && "bg-neutral-100 cursor-not-allowed"
                )}
              />

              {showSubmitButton && (
                <div className="mt-5">
                  <button
                    type="button"
                    ref={primaryRef as React.RefObject<HTMLButtonElement>}
                    onClick={() => onSubmitReason?.(reason)}
                    className={classesForButton(
                      {
                        label: submitBtnLabel,
                        variant: submitBtnVariant,
                        className: submitBtnClass,
                        loading: submitBtnLoading,
                      },
                      true
                    )}
                    disabled={submitBtnLoading}
                  >
                    {submitBtnLoading ? "Loading…" : submitBtnLabel}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
