// src/features/dashboard/components/ModulFlashsaleModal.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { RiCloseLine, RiSearchLine, RiCheckLine } from "react-icons/ri";
import NotFound from "@/assets/images/NotFound.png";
import userDefault from "@/assets/images/default-user.png";

import { listModulesAdmin } from "@/services/api/module.api";
import type { ModuleListItemApi } from "@/features/slices/module/types";

/* ===== Types (dipakai parent ManageFlashsalePage) ===== */
export type Modul = {
  id: string;
  title: string;
  category?: string | null;   // diisi dari instrument.nama / nama_instrumen
  thumbnail?: string | null;  // thumbnail_path
};

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

type Props = {
  open: boolean;
  onClose: () => void;
  /** id modul yang sudah dipilih di parent — akan ditandai “Sudah dipilih” & disabled */
  selectedIds?: Set<string>;
  /** ketika klik Simpan, kirim daftar modul yang dipilih di modal */
  onSave: (picked: Modul[]) => void;
};

const ModulFlashsaleModal: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  selectedIds,
}) => {
  const [q, setQ] = useState("");
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());

  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Modul[]>([]);

  // buat cancel-last guard biar response usang nggak nge-set state
  const reqId = useRef(0);

  // fetch saat modal dibuka & saat query berubah (debounce)
  useEffect(() => {
    if (!open) return;

    setPickedIds(new Set());
    setError(null);

    const myId = ++reqId.current;
    setStatus("loading");

    const handler = setTimeout(async () => {
      try {
        // panggil API list admin; service sudah normalize thumbnail/instrument
        const res = await listModulesAdmin({ q });
        if (reqId.current !== myId) return; // abaikan jika sudah ada request baru

        const arr = (res?.data ?? []) as ModuleListItemApi[];
        const mapped: Modul[] = arr.map((m) => ({
          id: String(m.id),
          title: m.judul,
          thumbnail: m.thumbnail_path || userDefault,
          category:
            (m.instrument as any)?.nama ??
            (m.instrument as any)?.nama_instrumen ??
            "-",
        }));
        setItems(mapped);
        setStatus("succeeded");
      } catch (e: any) {
        if (reqId.current !== myId) return;
        setError(e?.message || "Gagal memuat modul");
        setStatus("failed");
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(handler);
  }, [open, q]);

  // filter tambahan client-side (opsional; di sini kita sudah server-side search,
  // tapi tetap kasih filter lokal kalau mau nambahin logic nanti)
  const filtered = useMemo(() => items, [items]);

  const togglePick = (id: string) => {
    if (selectedIds?.has(id)) return; // sudah dipilih di parent → nonaktif
    setPickedIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const disabledSave = pickedIds.size === 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
          <h4 className="text-lg font-semibold text-neutral-900">
            Tambahkan Modul Flash Sale
          </h4>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 text-neutral-600"
            aria-label="Tutup"
          >
            <RiCloseLine size={25} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Search */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <RiSearchLine />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari Modul, cth: Piano Dasar"
              className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
            />
          </div>

          {/* States */}
          {status === "loading" && (
            <div className="py-10 text-center text-md text-neutral-500">
              Memuat daftar modul...
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-48 h-48">
                <img src={NotFound} />
              </div>
              <p className="text-md text-red-600 text-center">
                {error || "Gagal memuat modul"}
              </p>
            </div>
          )}

          {status === "succeeded" && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-48 h-48">
                <img src={NotFound} />
              </div>
              <p className="text-md text-neutral-900 text-center">
                Modul tidak ditemukan, coba kata kunci lain
              </p>
            </div>
          )}

          {/* List */}
          {status === "succeeded" && filtered.length > 0 && (
            <div className="mt-3 max-h-72 overflow-auto pr-1 space-y-2">
              {filtered.map((m) => {
                const already = selectedIds?.has(m.id) ?? false;
                const checked = pickedIds.has(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => togglePick(m.id)}
                    className={
                      "w-full flex items-center justify-between rounded-xl p-2 text-left " +
                      (checked && !already ? "bg-blue-50" : "hover:bg-black/5") +
                      (already ? " opacity-60 cursor-not-allowed" : "")
                    }
                    disabled={already}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={m.thumbnail || userDefault}
                        alt={m.title}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="leading-tight">
                        <div className="text-md font-medium text-neutral-900">
                          {m.title}
                        </div>
                        <div className="text-sm text-neutral-800">
                          {m.category || "-"}
                        </div>
                      </div>
                    </div>

                    {/* Right side: badge/checkbox */}
                    {already ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded-md bg-neutral-200 text-neutral-700">
                        Sudah dipilih
                      </span>
                    ) : (
                      <span
                        className={
                          "grid size-5 place-items-center rounded-md border " +
                          (checked
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-neutral-900")
                        }
                      >
                        {checked && <RiCheckLine size={16} />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            disabled={disabledSave || status !== "succeeded"}
            onClick={() => {
              const picked = items.filter((m) => pickedIds.has(m.id));
              onSave(picked);
            }}
            className={
              "mt-2 w-full rounded-xl py-3 text-sm font-semibold " +
              (disabledSave || status !== "succeeded"
                ? "bg-neutral-300 text-neutral-600 cursor-not-allowed"
                : "bg-[var(--primary-color)] hover:brightness-95")
            }
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModulFlashsaleModal;
