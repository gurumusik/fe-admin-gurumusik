// src/components/common/ConfirmationModal.tsx (Vite + React + TS)

import React, {
  useEffect,
  useRef,
  isValidElement,
  cloneElement,
} from "react";

type ButtonCfg = {
  label: string;
  onClick: () => void;
  loading?: boolean;
  variant?: "primary" | "success" | "danger" | "neutral" | "outline" | "ghost";
  className?: string;
};

export type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  iconTone?: "success" | "warning" | "danger" | "info" | "neutral";
  texts?: Array<string | React.ReactNode>;
  title?: string;
  children?: React.ReactNode;
  button1?: ButtonCfg; // tombol utama (kanan)
  button2?: ButtonCfg; // tombol sekunder (kiri)
  align?: "center" | "left";
  showCloseIcon?: boolean;
  closeOnOverlay?: boolean;
  widthClass?: string; // mis. "max-w-md"
};

/* utils kecil */
const cls = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

function classesForButton(b?: ButtonCfg, isPrimary?: boolean) {
  if (!b) return "";
  const base =
    "w-full rounded-full font-semibold py-3 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed";
  if (b.className) return cls(base, b.className);
  switch (b.variant ?? (isPrimary ? "primary" : "outline")) {
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

function toneClasses(
  tone: NonNullable<ConfirmationModalProps["iconTone"]>
) {
  const map = {
    success: {
      ring: "ring-green-100",
      text: "text-[var(--accent-green-color)]",
      bg: "",
    },
    warning: {
      ring: "ring-yellow-100",
      text: "text-[var(--primary-color)]",
      bg: "",
    },
    danger: {
      ring: "ring-red-100",
      text: "text-[var(--accent-red-color)]",
      bg: "bg-red-100",
    },
    info: {
      ring: "ring-blue-100",
      text: "text-[var(--accent-blue-color)]",
      bg: "",
    },
    neutral: { ring: "ring-neutral-200", text: "text-neutral-500", bg: "" },
  } as const;
  return map[tone] ?? map.neutral;
}

function enhanceIcon(node: React.ReactNode, extraClass: string) {
  if (!isValidElement(node)) return node;

  // ⬇️ el diketik sebagai ReactElement dgn props berisi className opsional
  const el = node as React.ReactElement<{ className?: string }>;
  const prev = el.props.className ?? "";

  return cloneElement(el, { className: cls(extraClass, prev) });
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  icon,
  iconTone = "neutral",
  texts = [],
  title,
  children,
  button1,
  button2,
  align = "center",
  showCloseIcon = true,
  closeOnOverlay = true,
  widthClass = "max-w-md",
}) => {
  const primaryRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => primaryRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tone = toneClasses(iconTone);
  const buttons = [
    button2
      ? {
          cfg: button2,
          primary: false,
          ref: undefined as React.RefObject<HTMLButtonElement> | undefined,
        }
      : null,
    button1 ? { cfg: button1, primary: true, ref: primaryRef } : null,
  ].filter(Boolean) as Array<{
    cfg: ButtonCfg;
    primary: boolean;
    ref?: React.RefObject<HTMLButtonElement>;
  }>;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cls("w-full rounded-2xl bg-white shadow-2xl", widthClass)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {showCloseIcon && (
            <div className="flex justify-end -mt-2 -mr-2">
              <button
                aria-label="Tutup"
                onClick={onClose}
                className="text-neutral-500 text-2xl leading-none font-bold hover:text-neutral-700 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {icon && (
            <div
              className={cls(
                "mx-auto grid place-items-center w-14 h-14 rounded-full ring-[14px]",
                tone.ring,
                tone.bg,
                align === "left" && "ml-0 mr-auto"
              )}
            >
              {enhanceIcon(
                icon,
                cls("block w-[130%] h-[130%] -m-[10%]", tone.text)
              )}
            </div>
          )}

          {title && (
            <h3
              className={cls(
                "text-lg font-semibold text-neutral-900 mt-8",
                align === "center" ? "text-center" : "text-left"
              )}
            >
              {title}
            </h3>
          )}

          {!!texts.length && (
            <div
              className={cls(
                "mt-2 space-y-1 text-md text-neutral-700",
                align === "center" ? "text-center" : "text-left"
              )}
            >
              {texts.map((t, i) => (
                <div key={i}>{t}</div>
              ))}
            </div>
          )}

          {children && <div className="mt-4">{children}</div>}

          {(button1 || button2) && (
            <div className={cls("mt-6", buttons.length === 2 && "flex gap-3")}>
              {buttons.map(({ cfg, primary, ref }, i) => (
                <button
                  key={i}
                  ref={ref}
                  type="button"
                  onClick={cfg.onClick}
                  className={classesForButton(cfg, primary)}
                  disabled={cfg.loading}
                >
                  {cfg.loading ? "Loading…" : cfg.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
