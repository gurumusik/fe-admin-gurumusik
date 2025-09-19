// src/features/instrument/pages/AdminInstrumentPage.tsx
import React from "react";
import {
  RiPencilFill,
  RiDeleteBinFill,
  RiQuestionFill,
  RiCheckboxCircleFill,
  RiCloseLine,
} from "react-icons/ri";
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";
import { icons as instrumentIconDefs } from "@/utils/icons";
import { getInstrumentIcon } from "@/utils/getInstrumentIcon";
import AddInstrumentModal from "@/features/dashboard/components/AddInstrumentModal";
import { useNavigate } from "react-router-dom";

type Item = {
  type: string;
  name: string;
  iconUrl: string;
  totalGrade: number;
  isNew?: boolean;
};


const toTitle = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const AdminInstrumentPage: React.FC = () => {
  const navigate = useNavigate();
  const items: Item[] = React.useMemo(
    () =>
      instrumentIconDefs.map((it) => ({
        type: it.type,
        name: toTitle(it.type),
        iconUrl: getInstrumentIcon(it.type),
        totalGrade: 5,
      })),
    []
  );

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const resolveType = (payload: { type?: string; name?: string }, items: Item[]) => {
    // 1) prioritas: type dari modal (paling akurat)
    const t = payload?.type?.trim();
    if (t) return t;

    // 2) coba cocokkan name ke daftar items (display name ke type)
    const nm = payload?.name?.trim().toLowerCase();
    if (nm) {
      // cocokkan ke name yang ditampilkan (toTitle(it.type)) atau langsung by type
      const hit = items.find(
        (it) => it.name.toLowerCase() === nm || it.type.toLowerCase() === nm
      );
      if (hit) return hit.type;
    }

    // 3) fallback ke slugify(name) — mungkin tidak cocok dengan route yang ada
    return nm ? slugify(nm) : '';
  };

  // modal state
  const [showAdd, setShowAdd] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [selected, setSelected] = React.useState<Item | null>(null);
  const [modalType, setModalType] = React.useState<
    "confirm" | "success" | "error" | null
  >(null);

  const closeModal = () => {
    setModalType(null);
    setSelected(null);
  };

  const onDelete = (it: Item) => {
    setSelected(it);
    setModalType("confirm");
  };

  const reallyDelete = async () => {
    try {
      setModalType("success");
    } catch {
      setModalType("error");
    }
  };

  return (
    <div className="rounded-2xl bg-white">
      <div className="px-6 sm:px-8 lg:px-10 py-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-neutral-800">
            Kelola Instrumen Guru Musik
          </h1>

          <div className="w-full sm:w-[420px] flex sm:justify-end">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center justify-center w-full sm:w-auto h-11 rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold px-6 hover:brightness-95 transition cursor-pointer"
            >
              <span className="text-xl mr-2 leading-none">+</span>
              Tambah Instrumen
            </button>
          </div>
        </div>

        {/* Grid kartu */}
        <div className="rounded-2xl pt-5 bg-white">
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => (
              <div
                key={it.type}
                className="flex items-center justify-between rounded-3xl border border-[#C9D9EA] bg-white px-4 py-3 shadow-[0_1px_0_#0000000d] hover:border-[#AFC3DA] transition"
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center">
                      <img
                        src={it.iconUrl}
                        alt={`${it.name} Icon`}
                        className="h-8 w-8 object-contain"
                      />
                    </span>
                    <p className="text-lg font-semibold text-[#0F172A]">
                      {it.name}
                    </p>
                  </div>
                  <p className="mt-1 text-[18px] font-semibold text-[#6B7E93]">
                    Total Level: {it.totalGrade}
                  </p>
                </div>

                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard-admin/instrument/${it.type}`);
                    }}
                    className="h-11 w-11 rounded-2xl border border-[#C9D9EA] grid place-items-center hover:bg-[#F4F8FC] transition cursor-pointer"
                    aria-label={`Edit ${it.name}`}
                    title="Edit"
                  >
                    <RiPencilFill className="text-[22px] text-[var(--secondary-color,#0682DF)]" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();         
                      onDelete(it);
                    }}
                    className="h-11 w-11 grid place-items-center cursor-pointer"
                    aria-label={`Delete ${it.name}`}
                    title="Delete"
                  >
                    <RiDeleteBinFill className="text-[22px] text-[#FF437B]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="mt-8 text-center text-sm text-neutral-500">
              Belum ada instrumen.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}

      {/* Add Instrumen */}
      <AddInstrumentModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={(payload: { type?: string; name?: string }) => {
          const newType = resolveType(payload, items)
          setShowAdd(false); 

          if (newType) {
            navigate(`/dashboard-admin/instrument/${newType}`);
          } else {
            console.warn('Gagal menentukan type instrumen baru:', payload);
          }
        }}
      />

      {/* Edit Instrumen */}
      <AddInstrumentModal
        open={showEdit}
        onClose={() => { setShowEdit(false); setSelected(null); }}
        defaultName={selected?.name ?? ""}
        onSubmit={(payload) => {
          console.log("EDIT:", selected, payload);
          setShowEdit(false);
          setSelected(null);
        }}
        title="Edit Instrumen"
      />

      {/* Confirm delete */}
      <ConfirmationModal
        isOpen={modalType === "confirm"}
        onClose={closeModal}
        icon={<RiQuestionFill />}
        iconTone="warning"
        title={`Yakin Mau Hapus Instrumen Musik Ini?`}
        texts={[
          <>
            Jika instrumen dihapus, <strong>semua silabus</strong> yang terkait
            dengan instrumen ini juga <strong>akan ikut terhapus.</strong>
          </>,
        ]}
        align="center"
        widthClass="max-w-lg"
        button2={{
          label: "Ga Jadi Deh",
          onClick: closeModal,
          variant: "outline",
        }}
        button1={{
          label: "Ya, Saya Yakin",
          onClick: reallyDelete,
          variant: "primary",
        }}
      />

      {/* Success */}
      <ConfirmationModal
        isOpen={modalType === "success"}
        onClose={closeModal}
        icon={<RiCheckboxCircleFill />}
        iconTone="success"
        title="Instrumen Berhasil Dihapus"
        texts={[
          `Instrumen ini telah dihapus, maka murid dan guru sudah tidak bisa mengaksesnya.`,
        ]}
        align="center"
        widthClass="max-w-lg"
        button1={{ label: "Tutup", onClick: closeModal, variant: "primary" }}
        showCloseIcon
      />

      {/* Error */}
      <ConfirmationModal
        isOpen={modalType === "error"}
        onClose={closeModal}
        icon={<RiCloseLine />}
        iconTone="danger"
        title="Instrumen Gagal Dihapus!"
        texts={[
          `Terjadi kendala saat menghapus instrumen ini. Silakan coba lagi beberapa saat lagi.`,
        ]}
        align="center"
        widthClass="max-w-lg"
        button1={{ label: "Tutup", onClick: closeModal, variant: "primary" }}
        showCloseIcon
      />
    </div>
  );
};

export default AdminInstrumentPage;
