// src/features/instrument/pages/InstrumentDetailPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiBookOpenLine,
  RiAddLine,
  RiPencilFill,
} from "react-icons/ri";
import { getInstrumentIcon } from "@/utils/getInstrumentIcon";
import SylabusModal from "@/features/dashboard/components/SylabusModal";
import AddInstrumentModal from "@/features/dashboard/components/AddInstrumentModal";

const toTitle = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export const InstrumentDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { type: paramType = "piano" } = useParams();

  const [typeSlug, setTypeSlug] = React.useState(paramType);
  const title = React.useMemo(() => toTitle(typeSlug), [typeSlug]);
  const iconUrl = React.useMemo(() => getInstrumentIcon(typeSlug), [typeSlug]);

  // dummy rows
  const [rows, setRows] = React.useState(
    Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      grade: `Grade ${i + 1}`,
      price: "Rp100.000",
    }))
  );

  const [showSylabus, setShowSylabus] = React.useState(false);
  const [currentGrade, setCurrentGrade] = React.useState<string>("");

  // state & handler untuk EDIT modal
  const [showEdit, setShowEdit] = React.useState(false);

  const resolveType = (payload: { type?: string; name?: string }) => {
    // 1) paling akurat: type dari modal
    const t = payload?.type?.trim();
    if (t) return t;

    // 2) coba cocokkan name -> type (mis. "Gitar" → "guitar" jika backend memberi mapping),
    // di sini fallback langsung slug dari name
    const nm = payload?.name?.trim();
    if (nm) return slugify(nm);

    return "";
  };

  return (
    <div className="rounded-2xl">
      {/* Header bar */}
      <div className="px-6 sm:px-8 lg:px-10 pt-4 pb-3 bg-white rounded-2xl mb-4">
        <div className="flex items-center justify-between">
          {/* Kiri: back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-6 h-10 text-[15px] font-semibold text-[var(--secondary-color,#0682DF)] hover:bg-[var(--accent-blue-light-color,#E7EFFD)]"
          >
            <RiArrowLeftLine className="text-lg" />
            Kembali
          </button>

          {/* Tengah: icon + title + pencil */}
          <div className="flex items-center gap-3">
            <img src={iconUrl} alt={title} className="h-8 w-8 object-contain" />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-[#0F172A]">{title}</h1>
              </div>
              <p className="text-[13px] text-[#6B7E93]">Total Level: 5</p>
            </div>
            <button
              type="button"
              onClick={() => setShowEdit(true)} // buka modal edit
              className="h-10 w-10 rounded-2xl border border-[#B8C8DA] text-[var(--secondary-color)] grid place-items-center hover:bg-[#F4F8FC]"
              title="Edit nama/ikon instrumen"
            >
              <RiPencilFill size={20} />
            </button>
          </div>

          {/* Kanan: dropdown program + simpan */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-4 h-10 text-[15px] font-semibold text-[var(--secondary-color)] hover:bg-[#F4F8FC]"
            >
              Program Reguler <span className="opacity-60">▾</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold px-6 h-10 hover:brightness-95"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="">
        <div className="rounded-2xl bg-white p-4 sm:p-6">
          {/* rows */}
          <div className="space-y-6">
            {rows.map((row) => (
              <div key={row.id} className="pb-6 border-b border-[#E5EDF6] last:border-none">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 md:gap-6 items-end">
                  {/* Instrument Grade */}
                  <div>
                    <label className="block text-[14px] font-semibold text-[#0F172A] mb-2">
                      Instrument Grade
                    </label>
                    <input
                      defaultValue={row.grade}
                      className="w-full rounded-xl border border-[#B8C8DA] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="Grade I"
                    />
                  </div>

                  {/* Harga per sesi */}
                  <div>
                    <label className="block text-[14px] font-semibold text-[#0F172A] mb-2">
                      Harga Per Sesi
                    </label>
                    <input
                      defaultValue={row.price}
                      className="w-full rounded-xl border border-[#B8C8DA] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="Rp0"
                    />
                  </div>

                  {/* Lihat Silabus */}
                  <div className="md:justify-self-end">
                    <span className="block text-[14px] font-semibold text-[#0F172A] mb-2 text-right md:text-left">
                      Lihat Silabus
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentGrade(row.grade);
                        setShowSylabus(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color,#0682DF)] text-[var(--secondary-color,#0682DF)] px-4 h-10 hover:bg-[var(--secondary-light-color,#E6F4FF)]"
                    >
                      <RiBookOpenLine className="text-lg" />
                      Silabus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tambah grade */}
          <div className="pt-5">
            <button
              type="button"
              onClick={() =>
                setRows((r) => [
                  ...r,
                  { id: Date.now(), grade: `Grade ${r.length + 1}`, price: "" },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full border border-[#B8C8DA] px-4 h-10 text-[15px] font-semibold text-[var(--secondary-color,#0682DF)] hover:bg-[var(--accent-blue-light-color,#E7EFFD)]"
            >
              <RiAddLine className="text-lg" />
              Tambah Grade
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <SylabusModal
        open={showSylabus}
        onClose={() => setShowSylabus(false)}
        subtitle={`${title} - ${currentGrade || "Grade I"}`}
      />

      {/* Modal Edit Instrumen */}
      <AddInstrumentModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        defaultName={title}          // prefill nama saat ini
        title="Edit Instrumen"       // judul modal
        onSubmit={(payload: { type?: string; name?: string }) => {
          const newType = resolveType(payload);

          if (newType && newType !== typeSlug) {
            setTypeSlug(newType);           // update state lokal agar header langsung berubah
            setShowEdit(false);
            navigate(`/dashboard-admin/instrument/${newType}`); // redirect jika slug/type berubah
          } else {
            setShowEdit(false);
          }
        }}
      />
    </div>
  );
};
