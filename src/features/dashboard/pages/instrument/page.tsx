import React from "react";
import {
  RiPencilFill,
  RiQuestionFill,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiCloseFill,
} from "react-icons/ri";
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";
import AddInstrumentModal from "@/features/dashboard/components/AddInstrumentModal";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import { fetchInstrumentsThunk, setInstrumentActiveThunk } from "@/features/slices/instruments/slice"; // ⬅️ perhatikan path slice-mu
import { resolveIconUrl } from "@/services/api/instrument.api";
import { countByInstrument } from "@/services/api/detailProgram.api";
import { startDraft, prefillFromInstrumentThunk } from "@/features/slices/instrumentWizard/slice";
import type {
  LevelCountMap,
  ModalKind,
  CountByInstrumentResponse,
  AddInstrumentSubmitPayload,
} from "@/features/slices/instruments/types";

const toTitle = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const slugify = (s: string) =>
  s?.toLowerCase()?.trim()?.replace(/\s+/g, "-")?.replace(/[^a-z0-9-]/g, "") ?? "";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export const AdminInstrumentPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items, status, error, page, limit, q } = useSelector((s: RootState) => s.instrument);

  React.useEffect(() => {
    dispatch(fetchInstrumentsThunk({ q, page, limit }));
  }, [dispatch, q, page, limit]);

  const [levelCounts, setLevelCounts] = React.useState<LevelCountMap>({});

  React.useEffect(() => {
    const loadCounts = async () => {
      if (!items || items.length === 0) return;
      try {
        const ids = items.map((i) => i.id);
        const res = await countByInstrument(ids);
        const { counts } = (res as CountByInstrumentResponse) ?? { counts: {} };
        setLevelCounts(counts || {});
      } catch {
        setLevelCounts({});
      }
    };
    loadCounts();
  }, [items]);

  // modal state
  const [showAdd, setShowAdd] = React.useState(false);
  const [modalType, setModalType] = React.useState<ModalKind | null>(null);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [selectedName, setSelectedName] = React.useState<string>("");
  const [targetActive, setTargetActive] = React.useState<boolean | null>(null);

  const closeModal = () => {
    setModalType(null);
    setSelectedId(null);
    setSelectedName("");
    setTargetActive(null);
  };

  const onToggleActive = (id: number, name: string, currentActive?: boolean) => {
    setSelectedId(id);
    setSelectedName(name);
    setTargetActive(!currentActive);
    setModalType("confirm");
  };

  const reallyToggle = async () => {
    if (selectedId == null || targetActive == null) return;
    try {
      await dispatch(setInstrumentActiveThunk({ id: selectedId, is_active: targetActive })).unwrap();
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
          <h1 className="text-xl font-semibold text-neutral-800">Kelola Instrumen Guru Musik.</h1>

          <div className="w-full sm:w-[520px] flex gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center justify-center h-11 rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold px-6 hover:brightness-95 transition cursor-pointer"
            >
              <span className="text-lg mr-2 leading-none">+</span>
              Tambah Instrumen
            </button>
          </div>
        </div>

        {/* Grid kartu */}
        <div className="rounded-2xl bg-white">
          {status === "loading" && (
            <div className="py-10 text-center text-sm text-neutral-500">Memuat instrumen...</div>
          )}

          {status === "failed" && (
            <div className="py-10 text-center text-sm text-red-600">{error ?? "Gagal memuat data"}</div>
          )}

          {status !== "loading" && items.length > 0 && (
            <div className="grid gap-4 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((it) => {
                const iconUrl = resolveIconUrl(it.icon);
                const name = toTitle(it.nama_instrumen);
                const slug = slugify(it.nama_instrumen);
                const totalLevel = levelCounts[it.id] ?? 0;
                const active = it.is_active !== false; // default true bila undefined

                return (
                  <div
                    key={it.id}
                    className="flex items-center justify-between rounded-3xl border border-[#C9D9EA] bg-white p-3 py-5 shadow-[0_1px_0_#0000000d] hover:border-[#AFC3DA] transition"
                  >
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2 mb-2 pl-2">
                        {iconUrl ? (
                          <img src={iconUrl} alt={`${name} Icon`} className="h-6 w-6 object-contain" loading="lazy" />
                        ) : (
                          <div className="h-6 w-6 rounded bg-neutral-200" />
                        )}
                        <p className="text-md font-semibold text-[#0F172A]">{name}</p>
                      </div>

                      <div className="flex items-center gap-2 pl-2">
                        <p className="text-md font-semibold text-[#6B7E93]">Total Level: {totalLevel}</p>
                        <span
                          className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            active ? "bg-[var(--accent-green-light-color)] text-[var(--accent-green-color)]" : "bg-[var(--primary-light-color)] text-[var(--accent-red-color)]"
                          }`}
                          title={active ? "Aktif" : "Nonaktif"}
                        >
                          {active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                            await dispatch(prefillFromInstrumentThunk({ instrumentId: it.id })).unwrap();
                          navigate(`/dashboard-admin/instrument/${slug}?edit=1&id=${it.id}`);
                        }}
                        className="h-10 w-10 rounded-xl border border-[#C9D9EA] grid place-items-center hover:bg-[#F4F8FC] transition cursor-pointer"
                        aria-label={`Edit ${name}`}
                        title="Edit"
                      >
                        <RiPencilFill className="text-[22px] text-[var(--secondary-color,#0682DF)]" />
                      </button>

                      {/* Toggle Aktif/Nonaktif */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleActive(it.id, name, active);
                        }}
                        className="h-10 w-10 rounded-xl border border-[#C9D9EA] grid place-items-center hover:bg-[#F4F8FC] transition cursor-pointer"
                        aria-label={active ? `Nonaktifkan ${name}` : `Aktifkan ${name}`}
                        title={active ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {active ? (
                          <RiCloseFill className="text-[25px] text-[#FF437B]" /> // nonaktifkan
                        ) : (
                          <RiCheckboxCircleFill className="text-[25px] text-[#10B981]" /> // aktifkan
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {status === "succeeded" && items.length === 0 && (
            <div className="mt-8 text-center text-sm text-neutral-500">Belum ada instrumen.</div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddInstrumentModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={async (payload: AddInstrumentSubmitPayload) => {
          const n = (payload.name || "").trim();
          if (!n) return;
          let base64: string | undefined = undefined;
          if (payload.file) base64 = await fileToDataUrl(payload.file);
          dispatch(startDraft({ name: n, iconBase64: base64, isAbk: payload.isAbk }));
          const slug = slugify(n);
          setShowAdd(false);
          navigate(`/dashboard-admin/instrument/${slug}?new=1`);
        }}
      />

      {/* Confirm toggle */}
      <ConfirmationModal
        isOpen={modalType === "confirm"}
        onClose={closeModal}
        icon={<RiQuestionFill />}
        iconTone="warning"
        title={
          targetActive
            ? `Aktifkan instrumen "${selectedName}"?`
            : `Nonaktifkan instrumen "${selectedName}"?`
        }
        texts={[
          targetActive
            ? <>Instrumen akan <b>Aktif</b> dan bisa dipakai di fitur lain.</>
            : <>Instrumen akan <b>Nonaktif</b> dan disembunyikan dari pemakaian baru.</>,
        ]}
        align="center"
        widthClass="max-w-lg"
        button2={{ label: "Batal", onClick: closeModal, variant: "outline" }}
        button1={{ label: targetActive ? "Aktifkan" : "Nonaktifkan", onClick: reallyToggle, variant: "primary" }}
      />

      {/* Success */}
      <ConfirmationModal
        isOpen={modalType === "success"}
        onClose={closeModal}
        icon={<RiCheckboxCircleFill />}
        iconTone="success"
        title="Status Instrumen Diperbarui"
        texts={[
          targetActive
            ? `Instrumen berhasil diaktifkan.`
            : `Instrumen berhasil dinonaktifkan.`,
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
        title="Gagal Memperbarui Status!"
        texts={[`Terjadi kendala saat memperbarui status instrumen. Coba lagi.`]}
        align="center"
        widthClass="max-w-lg"
        button1={{ label: "Tutup", onClick: closeModal, variant: "primary" }}
        showCloseIcon
      />
    </div>
  );
};

export default AdminInstrumentPage;
