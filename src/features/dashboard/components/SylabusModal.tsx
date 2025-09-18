import React from "react";
import {
  RiCloseLine,
  RiLink,
  RiUpload2Line,
  RiAddLine,
  RiFileListLine,
} from "react-icons/ri";

type SylabusModalProps = {
  open: boolean;
  onClose: () => void;
  /** Opsional: tampil di subjudul, mis. "Piano - Grade I" */
  subtitle?: string;
};

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const SylabusModal: React.FC<SylabusModalProps> = ({ open, onClose, subtitle }) => {
  const [tab, setTab] = React.useState<"pdf" | "link">("pdf");
  const [targets, setTargets] = React.useState(["", "", ""]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-neutral-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#0F172A]">Silabus</h3>
              {subtitle && (
                <p className="text-sm text-[#6B7E93] mt-1">{subtitle}</p>
              )}
            </div>
            <button
              aria-label="Tutup"
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 p-1"
            >
              <RiCloseLine size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 bg-[#F2F6FB] rounded-2xl p-1 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setTab("pdf")}
              className={cls(
                "h-10 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold",
                tab === "pdf"
                  ? "bg-white text-[var(--secondary-color,#0682DF)] shadow-sm"
                  : "text-[#6B7E93]"
              )}
            >
              <RiFileListLine size={25}/>
              File PDF
            </button>
            <button
              type="button"
              onClick={() => setTab("link")}
              className={cls(
                "h-10 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold",
                tab === "link"
                  ? "bg-white text-[var(--secondary-color,#0682DF)] shadow-sm"
                  : "text-[#6B7E93]"
              )}
            >
              <RiLink size={25}/>
              Link
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5">
          {tab === "pdf" ? (
            <>
              <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
                Upload Silabus Dalam Bentuk PDF
              </label>

              {/* Upload button (presentational only) */}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--secondary-color,#0682DF)] text-[var(--secondary-color,#0682DF)] px-4 h-10 hover:bg-[var(--secondary-light-color,#E6F4FF)]"
              >
                <RiUpload2Line />
                Upload Silabus
              </button>

              <p className="text-[12px] text-[#6B7E93] mt-2">
                Supported formats (Max 25 mb): PDF
              </p>

              <hr className="my-5 border-neutral-200" />
            </>
          ) : (
            <>
              <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
                Masukkan Link Silabus
              </label>
              <input
                placeholder="Masukkan Link Silabus"
                className="w-full rounded-xl border border-[#B8C8DA] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-neutral-200"
              />
              <hr className="my-5 border-neutral-200" />
            </>
          )}

          {/* Target Pembelajaran */}
          <div>
            <h4 className="text-[16px] font-semibold text-[#0F172A] mb-3">
              Target Pembelajaran
            </h4>

            <div className="space-y-3">
              {targets.map((v, i) => (
                <input
                  key={i}
                  defaultValue={v}
                  placeholder="Masukkan Target Pembelajaran"
                  className="w-full rounded-xl border border-[#B8C8DA] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-neutral-200"
                />
              ))}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setTargets((t) => [...t, ""])}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color,#0682DF)] text-[var(--secondary-color,#0682DF)] px-4 h-10 hover:bg-[var(--secondary-light-color,#E6F4FF)]"
              >
                <RiAddLine className="text-lg" />
                Tambah Target
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6">
            <button
              type="button"
              className="w-full h-12 rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold hover:brightness-95"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SylabusModal;
