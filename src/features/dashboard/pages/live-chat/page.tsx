import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  RiCalendarLine,
  RiChat3Line,
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleLine,
  RiDownload2Line,
  RiHistoryLine,
  RiImage2Line,
  RiLoader4Line,
  RiMailLine,
  RiPhoneLine,
  RiRefreshLine,
  RiTimeLine,
  RiUser3Line,
} from "react-icons/ri";
import LoadingScreen from "@/components/ui/common/LoadingScreen";
import {
  getAdminLiveChatDetail,
  getAdminLiveChatOverview,
} from "@/services/api/adminLiveChat.api";
import type {
  TAdminLiveChatMessage,
  TAdminLiveChatOverview,
  TAdminLiveChatPhotoItem,
  TAdminLiveChatSessionDetail,
  TAdminLiveChatSessionSummary,
} from "@/types/TAdminLiveChat";
import { resolveImageUrl } from "@/utils/resolveImageUrl";

dayjs.locale("id");

const statusClassName: Record<TAdminLiveChatSessionSummary["status"], string> = {
  scheduled: "border-amber-200 bg-amber-50 text-amber-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-rose-200 bg-rose-50 text-rose-700",
  ended: "border-slate-200 bg-slate-100 text-slate-700",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("ddd, D MMM YYYY") : value;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("D MMM YYYY, HH:mm") : value;
}

function formatClockRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "-";
  if (!end) return start || "-";
  return `${start || "-"} - ${end}`;
}

function toImageUrl(value?: string | null) {
  if (!value) return "";
  return resolveImageUrl(value) || value;
}

function getFallbackSessionId(
  overview: TAdminLiveChatOverview | null,
  preferredSessionId?: number | null
) {
  if (!overview) return null;
  const sessions = [...overview.active_sessions, ...overview.history_sessions];
  if (
    typeof preferredSessionId === "number" &&
    sessions.some((item) => item.chat_session_id === preferredSessionId)
  ) {
    return preferredSessionId;
  }
  return sessions[0]?.chat_session_id ?? null;
}

function StatCard({
  title,
  value,
  caption,
  icon,
  action,
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--neutral-100)] text-[var(--secondary-color)]">
          {icon}
        </div>
        {action}
      </div>
      <div className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--neutral-500)]">
        {title}
      </div>
      <div className="mt-2 text-3xl font-semibold text-[var(--neutral-950)]">{value}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--neutral-600)]">{caption}</p>
    </div>
  );
}

function SessionCard({
  item,
  selected,
  onClick,
}: {
  item: TAdminLiveChatSessionSummary;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[26px] border p-4 text-left transition ${
        selected
          ? "border-[var(--secondary-color)] bg-[var(--secondary-light-color)]/30 shadow-sm"
          : "border-[var(--neutral-200)] bg-white hover:border-[var(--secondary-color)]/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-[var(--neutral-950)]">
            {item.class_info.label}
          </div>
          <div className="mt-1 text-sm text-[var(--neutral-600)]">
            {item.teacher?.name || "Guru"} • {item.student?.name || "Murid"}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName[item.status]}`}
        >
          {item.status_label}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-[var(--neutral-600)] sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <RiCalendarLine className="text-base text-[var(--secondary-color)]" />
          <span>{formatDate(item.class_info.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <RiTimeLine className="text-base text-[var(--secondary-color)]" />
          <span>{formatClockRange(item.class_info.start_time, item.class_info.end_time)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-[var(--neutral-100)] px-3 py-1 text-xs font-semibold text-[var(--neutral-700)]">
          {item.message_count} pesan
        </span>
        <span className="rounded-full bg-[var(--neutral-100)] px-3 py-1 text-xs font-semibold text-[var(--neutral-700)]">
          {item.photo_count} foto
        </span>
        {item.class_info.sesi_ke ? (
          <span className="rounded-full bg-[var(--neutral-100)] px-3 py-1 text-xs font-semibold text-[var(--neutral-700)]">
            Sesi {item.class_info.sesi_ke}
          </span>
        ) : null}
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--neutral-600)]">
        {item.latest_message_preview || "Belum ada preview pesan."}
      </p>
    </button>
  );
}

function ParticipantCard({
  label,
  participant,
}: {
  label: string;
  participant: TAdminLiveChatSessionSummary["teacher"];
}) {
  return (
    <div className="rounded-[24px] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--neutral-500)]">
        {label}
      </div>
      <div className="mt-3 flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white">
          {participant?.avatar_url ? (
            <img
              src={toImageUrl(participant.avatar_url)}
              alt={participant.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <RiUser3Line className="text-xl text-[var(--neutral-500)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-[var(--neutral-950)]">
            {participant?.name || "-"}
          </div>
          {participant?.email ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--neutral-600)]">
              <RiMailLine className="text-base text-[var(--secondary-color)]" />
              <span className="truncate">{participant.email}</span>
            </div>
          ) : null}
          {participant?.phone ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-[var(--neutral-600)]">
              <RiPhoneLine className="text-base text-[var(--secondary-color)]" />
              <span>{participant.phone}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: TAdminLiveChatMessage }) {
  const isSystem = message.kind === "system" || message.sender.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[480px] rounded-full border border-[var(--neutral-200)] bg-white px-4 py-2 text-center text-xs text-[var(--neutral-600)]">
          {message.text || "Pesan sistem"}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-[var(--neutral-200)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[var(--neutral-950)]">
          {message.sender.name}
        </div>
        <div className="text-xs text-[var(--neutral-500)]">
          {formatDateTime(message.sent_at)}
        </div>
      </div>

      {message.text ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--neutral-700)]">
          {message.text}
        </p>
      ) : null}

      {message.image_url ? (
        <a
          href={toImageUrl(message.image_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block"
        >
          <img
            src={toImageUrl(message.image_url)}
            alt={`Lampiran ${message.sender.name}`}
            className="max-h-72 w-full rounded-[20px] object-cover"
          />
        </a>
      ) : null}

      {message.image_deleted ? (
        <div className="mt-3 rounded-2xl border border-dashed border-[var(--neutral-300)] px-3 py-2 text-sm text-[var(--neutral-500)]">
          Gambar sudah tidak tersedia.
        </div>
      ) : null}
    </div>
  );
}

function PhotoTile({
  photo,
  checked,
  onToggle,
}: {
  photo: TAdminLiveChatPhotoItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--neutral-200)] bg-white shadow-sm">
      <div className="relative">
        <img
          src={toImageUrl(photo.image_url)}
          alt={photo.download_name}
          className="h-44 w-full object-cover"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[var(--secondary-color)] shadow"
          aria-label={checked ? "Batalkan pilih foto" : "Pilih foto"}
        >
          {checked ? (
            <RiCheckboxCircleLine className="text-xl" />
          ) : (
            <RiCheckboxBlankCircleLine className="text-xl" />
          )}
        </button>
      </div>

      <div className="p-4">
        <div className="line-clamp-1 text-sm font-semibold text-[var(--neutral-950)]">
          {photo.class_label}
        </div>
        <div className="mt-1 text-xs text-[var(--neutral-500)]">
          {photo.sender.name} • {formatDateTime(photo.sent_at)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--neutral-100)] px-3 py-1 text-xs font-semibold text-[var(--neutral-700)]">
            {photo.teacher_name}
          </span>
          <span className="rounded-full bg-[var(--neutral-100)] px-3 py-1 text-xs font-semibold text-[var(--neutral-700)]">
            {photo.student_name}
          </span>
        </div>
      </div>
    </div>
  );
}

const AdminLiveChatPage: React.FC = () => {
  const [overview, setOverview] = useState<TAdminLiveChatOverview | null>(null);
  const [detail, setDetail] = useState<TAdminLiveChatSessionDetail | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleSessions = useMemo(() => {
    const activeSessions = overview?.active_sessions || [];
    const historySessions = overview?.history_sessions || [];
    return [...activeSessions, ...historySessions];
  }, [overview]);

  const visiblePhotos = overview?.photos || [];

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setLoadingOverview(true);
      try {
        const nextOverview = await getAdminLiveChatOverview();
        if (!active) return;
        setOverview(nextOverview);
        setError(null);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Gagal memuat dashboard live chat.";
        setError(message);
      } finally {
        if (!active) return;
        setLoadingOverview(false);
      }
    };

    void loadOverview();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const fallbackSessionId = getFallbackSessionId(overview, selectedSessionId);
    if (fallbackSessionId === selectedSessionId) return;
    setSelectedSessionId(fallbackSessionId);
  }, [overview, selectedSessionId, visibleSessions]);

  useEffect(() => {
    if (!selectedSessionId) {
      setDetail(null);
      return;
    }

    let active = true;
    setLoadingDetail(true);

    getAdminLiveChatDetail(selectedSessionId)
      .then((nextDetail) => {
        if (!active) return;
        setDetail(nextDetail);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Gagal memuat detail live chat.";
        setError(message);
      })
      .finally(() => {
        if (!active) return;
        setLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSessionId]);

  useEffect(() => {
    setSelectedPhotoIds((current) =>
      current.filter((id) => visiblePhotos.some((photo) => photo.id === id))
    );
  }, [visiblePhotos]);

  const selectedPhotos = useMemo(
    () => visiblePhotos.filter((photo) => selectedPhotoIds.includes(photo.id)),
    [selectedPhotoIds, visiblePhotos]
  );

  const togglePhoto = (photoId: number) => {
    setSelectedPhotoIds((current) =>
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId]
    );
  };

  const toggleSelectAllPhotos = () => {
    if (selectedPhotoIds.length === visiblePhotos.length) {
      setSelectedPhotoIds([]);
      return;
    }
    setSelectedPhotoIds(visiblePhotos.map((photo) => photo.id));
  };

  const downloadPhoto = async (photo: TAdminLiveChatPhotoItem) => {
    const url = toImageUrl(photo.image_url);
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("download_failed");
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = photo.download_name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
      return;
    } catch {
      const fallback = document.createElement("a");
      fallback.href = url;
      fallback.download = photo.download_name;
      fallback.target = "_blank";
      fallback.rel = "noopener noreferrer";
      document.body.appendChild(fallback);
      fallback.click();
      fallback.remove();
    }
  };

  const handleDownloadSelected = async () => {
    for (const photo of selectedPhotos) {
      await downloadPhoto(photo);
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const nextOverview = await getAdminLiveChatOverview();
      const nextSessionId = getFallbackSessionId(nextOverview, selectedSessionId);

      setOverview(nextOverview);
      setSelectedSessionId(nextSessionId);

      if (nextSessionId) {
        const nextDetail = await getAdminLiveChatDetail(nextSessionId);
        setDetail(nextDetail);
      } else {
        setDetail(null);
      }

      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memperbarui data live chat.";
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loadingOverview) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(249,202,36,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 rounded-[36px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--secondary-color)]">
                Dashboard Admin
              </div>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--neutral-950)]">
                Monitor Live Chat
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--neutral-600)]">
                Pantau chat aktif yang sedang berjalan, buka riwayat chat yang sudah
                selesai, dan unduh foto lampiran live chat dari satu halaman admin.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--secondary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? (
                <RiLoader4Line className="animate-spin text-lg" />
              ) : (
                <RiRefreshLine className="text-lg" />
              )}
              Refresh Data
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-[26px] border border-[var(--accent-red-color)]/20 bg-[var(--accent-red-light-color)] px-5 py-4 text-sm text-[var(--accent-red-color)]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Chat Aktif"
            value={overview?.stats.active_sessions || 0}
            caption="Jumlah live chat yang masih berjalan saat ini."
            icon={<RiChat3Line className="text-2xl" />}
          />
          <StatCard
            title="Riwayat Chat"
            value={overview?.stats.history_sessions || 0}
            caption="Total sesi live chat yang sudah ditutup atau selesai."
            icon={<RiHistoryLine className="text-2xl" />}
          />
          <StatCard
            title="Data Foto"
            value={overview?.stats.photo_count || 0}
            caption={`${selectedPhotoIds.length} foto dipilih untuk diunduh.`}
            icon={<RiImage2Line className="text-2xl" />}
            action={
              <button
                type="button"
                onClick={handleDownloadSelected}
                disabled={!selectedPhotoIds.length}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  selectedPhotoIds.length
                    ? "bg-[var(--secondary-color)] text-white"
                    : "bg-[var(--neutral-200)] text-[var(--neutral-500)]"
                }`}
              >
                <RiDownload2Line className="text-base" />
                Unduh
              </button>
            }
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div className="rounded-[32px] border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <RiChat3Line className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--neutral-950)]">
                    Chat Active
                  </h2>
                  <p className="text-sm text-[var(--neutral-600)]">
                    Sesi live chat yang saat ini masih aktif.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {overview?.active_sessions.length ? (
                  overview.active_sessions.map((item) => (
                    <SessionCard
                      key={item.chat_session_id}
                      item={item}
                      selected={selectedSessionId === item.chat_session_id}
                      onClick={() => setSelectedSessionId(item.chat_session_id)}
                    />
                  ))
                ) : (
                  <div className="rounded-[26px] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] px-5 py-8 text-center text-sm text-[var(--neutral-500)]">
                    Belum ada live chat aktif.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <RiHistoryLine className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--neutral-950)]">
                    Riwayat Chat
                  </h2>
                  <p className="text-sm text-[var(--neutral-600)]">
                    Sesi live chat yang sudah selesai atau ditutup.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {overview?.history_sessions.length ? (
                  overview.history_sessions.map((item) => (
                    <SessionCard
                      key={item.chat_session_id}
                      item={item}
                      selected={selectedSessionId === item.chat_session_id}
                      onClick={() => setSelectedSessionId(item.chat_session_id)}
                    />
                  ))
                ) : (
                  <div className="rounded-[26px] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] px-5 py-8 text-center text-sm text-[var(--neutral-500)]">
                    Belum ada riwayat live chat.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--neutral-950)]">
                    Data Foto Live Chat
                  </h2>
                  <p className="mt-1 text-sm text-[var(--neutral-600)]">
                    Pilih beberapa foto lalu unduh sekaligus dari galeri lampiran live
                    chat.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllPhotos}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-4 py-2 text-sm font-semibold text-[var(--neutral-700)]"
                  >
                    {selectedPhotoIds.length === visiblePhotos.length &&
                    visiblePhotos.length ? (
                      <RiCheckboxCircleLine className="text-lg text-[var(--secondary-color)]" />
                    ) : (
                      <RiCheckboxBlankCircleLine className="text-lg text-[var(--secondary-color)]" />
                    )}
                    Pilih Semua
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSelected}
                    disabled={!selectedPhotoIds.length}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                      selectedPhotoIds.length
                        ? "bg-[var(--secondary-color)] text-white"
                        : "bg-[var(--neutral-200)] text-[var(--neutral-500)]"
                    }`}
                  >
                    <RiDownload2Line className="text-lg" />
                    Unduh Terpilih
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visiblePhotos.length ? (
                  visiblePhotos.map((photo) => (
                    <PhotoTile
                      key={photo.id}
                      photo={photo}
                      checked={selectedPhotoIds.includes(photo.id)}
                      onToggle={() => togglePhoto(photo.id)}
                    />
                  ))
                ) : (
                  <div className="rounded-[26px] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] px-5 py-8 text-center text-sm text-[var(--neutral-500)] sm:col-span-2 xl:col-span-3">
                    Belum ada data foto live chat yang tersedia.
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="rounded-[32px] border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--secondary-color)]">
                  Detail Chat
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--neutral-950)]">
                  {detail?.session.class_info.label || "Pilih chat session"}
                </h2>
              </div>
              {loadingDetail ? (
                <RiLoader4Line className="animate-spin text-2xl text-[var(--secondary-color)]" />
              ) : null}
            </div>

            {detail ? (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName[detail.session.status]}`}
                  >
                    {detail.session.status_label}
                  </span>
                  <span className="rounded-full bg-[var(--neutral-100)] px-3 py-1 text-xs font-semibold text-[var(--neutral-700)]">
                    {detail.session.message_count} pesan
                  </span>
                  <span className="rounded-full bg-[var(--neutral-100)] px-3 py-1 text-xs font-semibold text-[var(--neutral-700)]">
                    {detail.session.photo_count} foto
                  </span>
                </div>

                <div className="mt-5 grid gap-4">
                  <ParticipantCard label="Guru" participant={detail.session.teacher} />
                  <ParticipantCard label="Murid" participant={detail.session.student} />
                </div>

                <div className="mt-5 rounded-[26px] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
                  <div className="grid gap-3 text-sm text-[var(--neutral-700)]">
                    <div className="flex items-center gap-2">
                      <RiCalendarLine className="text-base text-[var(--secondary-color)]" />
                      <span>{formatDate(detail.session.class_info.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiTimeLine className="text-base text-[var(--secondary-color)]" />
                      <span>
                        {formatClockRange(
                          detail.session.class_info.start_time,
                          detail.session.class_info.end_time
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--neutral-600)]">
                      {detail.session.class_info.location_label || "Lokasi belum tersedia"}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--neutral-500)]">
                    Percakapan
                  </div>
                  <div className="max-h-[980px] space-y-3 overflow-y-auto pr-1">
                    {detail.messages.length ? (
                      detail.messages.map((message) => (
                        <MessageRow key={message.id} message={message} />
                      ))
                    ) : (
                      <div className="rounded-[26px] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] px-5 py-8 text-center text-sm text-[var(--neutral-500)]">
                        Belum ada pesan di chat session ini.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-[26px] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] px-5 py-10 text-center text-sm text-[var(--neutral-500)]">
                Pilih salah satu chat dari daftar untuk melihat detail percakapan.
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
};

export default AdminLiveChatPage;
