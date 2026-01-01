import React, { useEffect, useMemo, useState } from "react";
import { RiNotification4Fill } from "react-icons/ri";
import Button from "@/components/ui/common/Button";
import ApprovalModal from "./ApprovalModal";
import {
  listRescheduleAdmin,
  type ListRescheduleAdminResponse,
  type RescheduleAdminItem,
  type RescheduleTargetRole,
} from "@/services/api/reschedule.api";

type RescheduleDisplay = {
  id: string;
  requesterName: string;
  requesterRole: string;
  requesterAvatar?: string | null;
  targetName: string;
  targetAvatar?: string | null;
  targetRole: string;
  status: string;
  reason?: string;
  responseNote?: string;
  message: string;
  createdAt?: string | null;
  isRead: boolean;
  from: { dateLabel: string; timeLabel: string };
  to: { dateLabel: string; timeLabel: string; startLabel: string };
};

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

function formatDateLabel(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatTimeLabel(time?: string | null): string {
  if (!time) return "-";
  const cleaned = time.trim();
  if (!cleaned) return "-";
  const normalized = cleaned.includes(":")
    ? cleaned
    : cleaned.replace(/\./g, ":");
  const parts = normalized.split(":");
  const hh = parts[0]?.padStart(2, "0") ?? "";
  const mm = (parts[1] ?? "").padStart(2, "0").slice(0, 2);
  if (!hh) return "-";
  return `${hh}.${mm}`;
}

function formatTimeRange(start?: string | null, end?: string | null): string {
  const s = formatTimeLabel(start);
  const e = formatTimeLabel(end);
  if (s === "-" && e === "-") return "-";
  if (s !== "-" && e !== "-") return `${s} - ${e}`;
  return s !== "-" ? s : e;
}

function buildMessage(
  name: string,
  dateLabel: string,
  startLabel: string,
  targetName?: string
) {
  const dateText = dateLabel && dateLabel !== "-" ? dateLabel : "Jadwal baru";
  const timeText =
    startLabel && startLabel !== "-" ? ` pukul ${startLabel} WIB.` : ".";
  const targetText = targetName ? ` untuk ${targetName}` : "";
  return `${name} mengajukan jadwal baru${targetText}: ${dateText}${timeText}`;
}

type StatusKey = "pending" | "approved" | "rejected";

function statusMeta(
  status?: string | null
): { key: StatusKey; label: string; className: string } {
  const raw = (status || "").toLowerCase();
  if (raw.includes("reject")) {
    return {
      key: "rejected",
      label: "Ditolak",
      className:
        "bg-[var(--primary-light-color)] text-[var(--accent-red-color)]",
    };
  }
  if (raw.includes("approve") || raw === "accepted" || raw === "approved") {
    return {
      key: "approved",
      label: "Disetujui",
      className:
        "bg-[var(--accent-green-light-color)] text-[var(--accent-green-color)]",
    };
  }
  return {
    key: "pending",
    label: "Menunggu",
    className:
      "bg-[var(--secondary-light-color)] text-[var(--secondary-color)]",
  };
}

function pickRequester(row: RescheduleAdminItem) {
  const requestedBy = (row.requested_by || "").toLowerCase();
  const murid = row.transaksi?.murid?.nama?.trim();
  const guru = row.transaksi?.guru?.nama?.trim();
  const muridAvatar = row.transaksi?.murid?.profile_pic_url ?? null;
  const guruAvatar = row.transaksi?.guru?.profile_pic_url ?? null;

  if (requestedBy === "murid") {
    return { name: murid || "Murid", role: "murid", avatar: muridAvatar };
  }
  if (requestedBy === "guru") {
    return { name: guru || "Guru", role: "guru", avatar: guruAvatar };
  }

  if (murid && !guru) return { name: murid, role: "murid", avatar: muridAvatar };
  if (guru) return { name: guru, role: "guru", avatar: guruAvatar };
  return { name: "Pengguna", role: requestedBy || "user", avatar: null };
}

function pickTarget(row: RescheduleAdminItem) {
  const targetRole = (row.target_role || "").toLowerCase();
  const murid = row.transaksi?.murid?.nama?.trim();
  const guru = row.transaksi?.guru?.nama?.trim();
  const muridAvatar = row.transaksi?.murid?.profile_pic_url ?? null;
  const guruAvatar = row.transaksi?.guru?.profile_pic_url ?? null;

  if (targetRole === "murid") {
    return { name: murid || "Murid", avatar: muridAvatar || null };
  }
  if (targetRole === "guru") {
    return { name: guru || "Guru", avatar: guruAvatar || null };
  }

  // fallback: jika target_role tidak ada, asumsikan kebalikan dari requested_by
  if (row.requested_by === "murid") return { name: guru || "Guru", avatar: guruAvatar || null };
  if (row.requested_by === "guru") return { name: murid || "Murid", avatar: muridAvatar || null };

  return { name: "Penerima", avatar: null };
}

function adaptReschedule(row: RescheduleAdminItem): RescheduleDisplay {
  const requester = pickRequester(row);
  const target = pickTarget(row);
  const fromDate = formatDateLabel(row.old_date);
  const toDate = formatDateLabel(row.new_date);
  const oldRange = formatTimeRange(row.old_start, row.old_end);
  const newRange = formatTimeRange(row.new_start, row.new_end);
  const newStart = formatTimeLabel(row.new_start);

  return {
    id: String(row.id ?? `${Date.now()}-${Math.random()}`),
    requesterName: requester.name,
    requesterRole: requester.role,
    requesterAvatar: requester.avatar || null,
    targetName: target.name,
    targetAvatar: target.avatar || null,
    targetRole: (row.target_role as string) || "",
    status: row.status || "",
    reason: row.reason || undefined,
    responseNote: row.response_note || undefined,
    message: buildMessage(requester.name, toDate, newStart, target.name),
    createdAt: row.created_at ?? row.updated_at ?? null,
    isRead: false,
    from: { dateLabel: fromDate, timeLabel: oldRange },
    to: { dateLabel: toDate, timeLabel: newRange, startLabel: newStart },
  };
}

type Props = {
  title: string;
  targetRole: RescheduleTargetRole;
};

function loadReadIds(key: string): Set<string> {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

function saveReadIds(key: string, ids: Set<string>) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {
    /* ignore */
  }
}

const AdminRescheduleReport: React.FC<Props> = ({ title, targetRole }) => {
  const [items, setItems] = useState<RescheduleDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RescheduleDisplay | null>(null);
  const [openApproval, setOpenApproval] = useState(false);
  const storageKey = `admin-reschedule-read-${targetRole}`;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res: ListRescheduleAdminResponse = await listRescheduleAdmin({
          targetRole,
        });
        const data = res?.data ?? [];
        const readSet = loadReadIds(storageKey);
        const filtered = data.filter(
          (r) =>
            !r.target_role ||
            String(r.target_role).toLowerCase() === targetRole.toLowerCase()
        );
        const adapted = filtered.map(adaptReschedule).map((it) => ({
          ...it,
          isRead: readSet.has(it.id),
        }));
        setItems(adapted);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Gagal memuat data reschedule.";
        setError(message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [targetRole, storageKey]);

  const markAllAsRead = () =>
    setItems((prev) => {
      const updated = prev.map((it) => ({ ...it, isRead: true }));
      const ids = new Set(updated.map((it) => it.id));
      saveReadIds(storageKey, ids);
      return updated;
    });

  const hasUnread = useMemo(() => items.some((it) => !it.isRead), [items]);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return arr;
  }, [items]);

  const onClickDetail = (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    setItems((prev) => {
      const updated = prev.map((it) =>
        it.id === id ? { ...it, isRead: true } : it
      );
      const readIds = new Set(
        updated.filter((x) => x.isRead).map((x) => x.id)
      );
      saveReadIds(storageKey, readIds);
      return updated;
    });
    setSelected({ ...item, isRead: true });
    setOpenApproval(true);
  };

  const selectedMeta = selected ? statusMeta(selected.status) : null;

  return (
    <>
      <div className="relative min-h-[89vh] pt-1">
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-11 h-11 rounded-full bg-[var(--accent-purple-color)] flex items-center justify-center">
              <RiNotification4Fill className="text-[#fff]" size={25} />
            </div>
            <h2 className="font-semibold text-lg">{title}</h2>
            <div className="ml-auto">
              <Button
                color="secondaryLine"
                className="text-sm"
                onClick={markAllAsRead}
                disabled={!hasUnread}
              >
                Tandai Semua Dibaca
              </Button>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden bg-white p-5 pt-0">
            {loading ? (
              <div className="py-10 text-center text-neutral-500">
                Memuat data reschedule...
              </div>
            ) : error ? (
              <div className="py-6 text-center text-red-600 text-sm">
                {error}
              </div>
            ) : sorted.length === 0 ? (
              <div className="py-10 text-center text-neutral-400">
                Tidak ada pengajuan reschedule.
              </div>
            ) : (
              <ul className="divide-y divide-neutral-300">
                {sorted.map((n) => {
                  const showDetail = true;
                  const rowBgClass = n.isRead
                    ? "bg-[var(--secondary-light-color)]/60"
                    : "bg-white";
                  const m = statusMeta(n.status);

                  return (
                    <li
                      key={n.id}
                      className={cls(
                        "px-5 py-4 flex items-start gap-4 transition-colors",
                        rowBgClass
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-md">
                            Pengajuan Reschedule dari {n.requesterName} ke {n.targetName}
                          </p>
                          {!n.isRead && (
                            <span className="inline-flex items-center rounded-full bg-[var(--secondary-color)] text-white text-[10px] font-semibold px-2 py-[2px]">
                              New
                            </span>
                          )}
                          <span
                            className={cls(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold",
                              m.className
                            )}
                          >
                            {m.label}
                          </span>
                        </div>

                        <p className="mt-1 text-md text-neutral-600">
                          {n.message}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {showDetail ? (
                          <Button
                            color="secondaryLine"
                            className="text-sm"
                            onClick={() => onClickDetail(n.id)}
                          >
                            Detail
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <ApprovalModal
          isOpen={openApproval}
          onClose={() => setOpenApproval(false)}
          mode="approval"
          showActionButtons={false}
          student={{
            name: selected.requesterName,
            avatarUrl: selected.requesterAvatar || "/assets/images/profile.png",
            package: null,
            instrument: null,
          }}
          title="Detail Reschedule"
          from={{
            dateLabel: selected.from.dateLabel,
            timeLabel: selected.from.timeLabel,
          }}
          to={{
            dateLabel: selected.to.dateLabel,
            timeLabel: selected.to.timeLabel,
          }}
          metaContent={
            selectedMeta ? (
              <div className="flex flex-col gap-3">
                <div className="text-sm text-neutral-700">
                  Ditujukan ke <b>{selected.targetName}</b>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cls(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                      selectedMeta.className
                    )}
                  >
                    {selectedMeta.label}
                  </span>
                  {selected.responseNote ? (
                    <span className="text-xs text-neutral-600">
                      Catatan: {selected.responseNote}
                    </span>
                  ) : null}
                </div>
                {selectedMeta.key === "rejected" && selected.reason ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                    <p className="font-semibold">Alasan Penolakan</p>
                    <p className="mt-1 whitespace-pre-line">
                      {selected.reason}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null
          }
        />
      )}
    </>
  );
};

export default AdminRescheduleReport;
