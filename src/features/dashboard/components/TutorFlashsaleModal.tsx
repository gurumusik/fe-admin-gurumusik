import React, { useEffect, useMemo, useState } from "react";
import { RiCloseLine, RiSearchLine, RiCheckLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/app/store";
import { fetchGuruListThunk, selectGuruList } from "@/features/slices/guru/slice";
import NotFound from "@/assets/images/NotFound.png";
import userDefault from "@/assets/images/default-user.png"

/* ===== Types ===== */
export type Tutor = { id: string; name: string; city: string; avatar: string };

type Props = {
  open: boolean;
  onClose: () => void;
  /** id tutor yang sudah dipilih di parent — akan di-disable dari default checked awal */
  selectedIds?: Set<string>;
  /** ketika klik Simpan, kirim daftar tutor yang dipilih di modal */
  onSave: (picked: Tutor[]) => void;
};

const TutorFlashsaleModal: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  selectedIds,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [q, setQ] = useState("");
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());

  // redux: ambil daftar guru dari slice
  const guruList = useSelector((s: RootState) => selectGuruList(s));
  const { items, status, error } = guruList;

  // fetch saat modal dibuka
  useEffect(() => {
    if (!open) return;
    // reset UI modal
    setQ("");
    setPickedIds(new Set());
    // ambil semua guru (atau batasi sesuai kebutuhan)
    // kalau datamu besar, pertimbangkan pagination atau server-side search (q)
    dispatch(fetchGuruListThunk({ page: 1, limit: 1000 }));
  }, [open, dispatch]);

  // adapt hasil redux -> pool Tutor (local)
  const pool: Tutor[] = useMemo(() => {
    return (items || []).map((g) => ({
      id: String(g.id),
      name: g.nama,
      city: g.city ?? "-",
      avatar: g.image
        ? g.image
        : userDefault,
    }));
  }, [items]);

  // filter by q
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return pool.filter((t) =>
      query ? t.name.toLowerCase().includes(query) : true
    );
  }, [q, pool]);

  const togglePick = (id: string) => {
    // blokir toggle jika sudah dipilih di parent
    if (selectedIds?.has(id)) return;
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
            Tambahkan Tutor Flash Sale
          </h4>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 text-neutral-600"
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
              placeholder="Cari Guru, cth: John Doe"
              className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
            />
          </div>

          {/* States */}
          {status === "loading" && (
            <div className="py-10 text-center text-md text-neutral-500">
              Memuat daftar guru...
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-48 h-48">
                <img src={NotFound} />
              </div>
              <p className="text-md text-red-600 text-center">
                {error || "Gagal memuat guru"}
              </p>
            </div>
          )}

          {status === "succeeded" && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-48 h-48">
                <img src={NotFound} />
              </div>
              <p className="text-md text-neutral-900 text-center">
                Guru tidak ditemukan, coba kata kunci lain
              </p>
            </div>
          )}

          {/* List */}
          {status === "succeeded" && filtered.length > 0 && (
            <div className="mt-3 max-h-72 overflow-auto pr-1 space-y-2">
              {filtered.map((t) => {
                const already = selectedIds?.has(t.id) ?? false;
                const checked = pickedIds.has(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => togglePick(t.id)}
                    className={
                      "w-full flex items-center justify-between rounded-xl p-2 text-left " +
                      (checked && !already ? "bg-blue-50" : "hover:bg-black/5") +
                      (already ? " opacity-60 cursor-not-allowed" : "")
                    }
                    disabled={already}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="leading-tight">
                        <div className="text-md font-medium text-neutral-900">
                          {t.name}
                        </div>
                        <div className="text-sm text-neutral-800">{t.city}</div>
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
              const pickedTutors = pool.filter((t) => pickedIds.has(t.id));
              onSave(pickedTutors);
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

export default TutorFlashsaleModal;
