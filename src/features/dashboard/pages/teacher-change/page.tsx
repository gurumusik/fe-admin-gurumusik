import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFilter3Line,
  RiSearchLine,
  RiSwapLine,
} from "react-icons/ri";
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { getGuruProfileById, listGuru } from "@/services/api/guru.api";
import {
  approveTeacherChangeRequest,
  closeTeacherChangeRequest,
  freezeTeacherChangeSessions,
  listTeacherChangeAdmin,
  rejectTeacherChangeRequest,
  setTeacherChangeFeeRef,
  type ChangeTeacherCategory,
  type ChangeTeacherItem,
  type ChangeTeacherStatus,
} from "@/services/api/teacherChange.api";

const pageSize = 10;

type StatusFilter = "all" | ChangeTeacherStatus;
type CategoryFilter = "all" | ChangeTeacherCategory;
type ActionKind = "approve" | "reject" | "close" | "freeze" | "fee";

type GuruOption = {
  id: number;
  nama: string;
  city?: string | null;
  status?: string | null;
  rating?: number | null;
};

type GuruScheduleOption = {
  id: number;
  hari: string | number;
  waktu_mulai: string;
  waktu_selesai: string;
  status?: string | null;
};

type StartDateOption = {
  value: string;
  label: string;
};

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "waiting_student_pick", label: "Menunggu Murid Pilih Guru" },
  { value: "waiting_teacher_approval", label: "Menunggu Guru Pengganti" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "closed_without_change", label: "Closed Without Change" },
];

const categoryOptions: Array<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "Semua Kategori" },
  { value: "murid_tidak_cocok", label: "Murid Tidak Cocok" },
  { value: "guru_tidak_cocok", label: "Guru Tidak Cocok" },
  { value: "guru_tanggung_jawab", label: "Guru Tanggung Jawab" },
  { value: "other", label: "Other" },
];

const statusTone: Record<ChangeTeacherStatus, string> = {
  pending: "text-[var(--accent-orange-color)]",
  waiting_student_pick: "text-[var(--accent-orange-color)]",
  waiting_teacher_approval: "text-[var(--accent-orange-color)]",
  approved: "text-[var(--accent-green-color)]",
  rejected: "text-[var(--accent-red-color)]",
  completed: "text-[var(--accent-green-color)]",
  cancelled: "text-neutral-500",
  closed_without_change: "text-neutral-500",
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const date = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(d)
    .replace(":", ".");
  return `${date} ${time}`;
}

function resolveName(
  user?: { nama?: string | null; nama_panggilan?: string | null } | null,
  fallback?: string
) {
  return user?.nama?.trim() || user?.nama_panggilan?.trim() || fallback || "-";
}

function categoryLabel(raw?: ChangeTeacherCategory | string | null): string {
  const key = String(raw || "").toLowerCase();
  if (key === "murid_tidak_cocok") return "Murid Tidak Cocok";
  if (key === "guru_tidak_cocok") return "Guru Tidak Cocok";
  if (key === "guru_tanggung_jawab") return "Guru Tanggung Jawab";
  if (key === "other") return "Other";
  return "-";
}

function statusLabel(raw?: ChangeTeacherStatus | string | null): string {
  const key = String(raw || "").toLowerCase();
  if (key === "pending") return "Pending";
  if (key === "waiting_student_pick") return "Menunggu Murid Pilih Guru";
  if (key === "waiting_teacher_approval") return "Menunggu Guru Pengganti";
  if (key === "approved") return "Approved";
  if (key === "rejected") return "Rejected";
  if (key === "completed") return "Completed";
  if (key === "cancelled") return "Cancelled";
  if (key === "closed_without_change") return "Closed Without Change";
  return raw ? String(raw) : "-";
}

function truncateText(value?: string | null, max = 60) {
  const text = (value || "").trim();
  if (!text) return "-";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function resolveFileLabel(file: { file_name?: string | null; file_url?: string | null }) {
  return file.file_name?.trim() || file.file_url?.trim() || "Lampiran";
}

function isImageMime(mime?: string | null) {
  return !!mime && mime.startsWith("image/");
}

function resolveFileUrl(file: { file_url?: string | null }) {
  return file.file_url?.trim() || "";
}

function normalizeGuruListResponse(resp: any): GuruOption[] {
  const root =
    resp?.data?.data && Array.isArray(resp.data.data)
      ? resp.data
      : resp?.data && Array.isArray(resp.data)
      ? { data: resp.data }
      : resp;
  const rows = Array.isArray(root?.data)
    ? root.data
    : Array.isArray(root?.rows)
    ? root.rows
    : Array.isArray(root)
    ? root
    : [];
  return rows
    .map((row: any) => {
      const id = Number(row?.id);
      if (!Number.isFinite(id)) return null;
      return {
        id,
        nama: String(row?.nama ?? row?.name ?? "-"),
        city: row?.city ?? null,
        status: row?.status_akun ?? null,
        rating:
          typeof row?.rating_avg === "number"
            ? row.rating_avg
            : typeof row?.rating === "number"
            ? row.rating
            : null,
      } as GuruOption;
    })
    .filter(Boolean) as GuruOption[];
}

function resolveDayName(raw?: string | number | null) {
  if (raw == null) return "-";
  const dayMap = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) {
    const idx = asNumber % 7;
    return dayMap[idx] ?? String(raw);
  }
  const key = String(raw).toLowerCase();
  if (key.startsWith("senin")) return "Senin";
  if (key.startsWith("selasa")) return "Selasa";
  if (key.startsWith("rabu")) return "Rabu";
  if (key.startsWith("kamis")) return "Kamis";
  if (key.startsWith("jumat")) return "Jumat";
  if (key.startsWith("sabtu")) return "Sabtu";
  if (key.startsWith("minggu")) return "Minggu";
  return String(raw);
}

function resolveDayIndex(raw?: string | number | null) {
  if (raw == null) return null;
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) return (asNumber % 7 + 7) % 7;
  const key = String(raw).toLowerCase();
  if (key.startsWith("senin")) return 1;
  if (key.startsWith("selasa")) return 2;
  if (key.startsWith("rabu")) return 3;
  if (key.startsWith("kamis")) return 4;
  if (key.startsWith("jumat")) return 5;
  if (key.startsWith("sabtu")) return 6;
  if (key.startsWith("minggu")) return 0;
  return null;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function pageWindow(total: number, current: number) {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "...", total] as const;
  if (current >= total - 2) {
    return [1, "...", total - 2, total - 1, total] as const;
  }
  return [1, "...", current - 1, current, current + 1, "...", total] as const;
}

const TeacherChangePage: React.FC = () => {
  const [rows, setRows] = useState<ChangeTeacherItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const [selected, setSelected] = useState<ChangeTeacherItem | null>(null);
  const [action, setAction] = useState<ActionKind>("approve");
  const [adminNote, setAdminNote] = useState("");
  const [expireInDays, setExpireInDays] = useState("");
  const [selectionExpiresAt, setSelectionExpiresAt] = useState("");
  const [freezeRemainingSessions, setFreezeRemainingSessions] = useState("");
  const [feeInvoiceId, setFeeInvoiceId] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [guruQuery, setGuruQuery] = useState("");
  const [guruOptions, setGuruOptions] = useState<GuruOption[]>([]);
  const [guruLoading, setGuruLoading] = useState(false);
  const [guruError, setGuruError] = useState<string | null>(null);
  const [selectedGuruId, setSelectedGuruId] = useState("");
  const [scheduleOptions, setScheduleOptions] = useState<GuruScheduleOption[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [decidedCategory, setDecidedCategory] = useState<
    "" | "murid_tidak_cocok" | "guru_tanggung_jawab"
  >("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const categoryKey = String(selected?.category || "").toLowerCase();
  const isOtherCategory = categoryKey === "other";
  const effectiveCategory = isOtherCategory ? decidedCategory : categoryKey;
  const isStudentMismatch = effectiveCategory === "murid_tidak_cocok";
  const isTeacherMismatch =
    effectiveCategory === "guru_tidak_cocok" ||
    effectiveCategory === "guru_tanggung_jawab";
  const selectedSchedule = useMemo(() => {
    if (!selectedScheduleId) return null;
    return scheduleOptions.find(
      (item) => String(item.id) === String(selectedScheduleId)
    );
  }, [scheduleOptions, selectedScheduleId]);
  const selectedScheduleDayIndex = useMemo(() => {
    return resolveDayIndex(selectedSchedule?.hari ?? null);
  }, [selectedSchedule]);
  const minStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const startDateOptions: StartDateOption[] = useMemo(() => {
    if (selectedScheduleDayIndex == null) return [];
    const base = new Date(minStartDate);
    const baseDay = base.getDay();
    let offset = selectedScheduleDayIndex - baseDay;
    if (offset < 0) offset += 7;
    const first = new Date(base);
    first.setDate(base.getDate() + offset);
    const options: StartDateOption[] = [];
    for (let i = 0; i < 12; i++) {
      const next = new Date(first);
      next.setDate(first.getDate() + i * 7);
      options.push({
        value: formatDateInput(next),
        label: formatDateLabel(next),
      });
    }
    return options;
  }, [minStartDate, selectedScheduleDayIndex]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listTeacherChangeAdmin({
        page,
        limit: pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        category: categoryFilter === "all" ? undefined : categoryFilter,
      });
      setRows(res?.data ?? []);
      setTotal(Number(res?.total ?? 0));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal memuat pengajuan pergantian guru.";
      setError(message);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, search]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const murid = resolveName(row.murid, "Murid").toLowerCase();
      const guru = resolveName(row.guru, "Guru").toLowerCase();
      const requester = resolveName(row.requester, "Requester").toLowerCase();
      const transaksi = String(row.transaksi_id ?? "").toLowerCase();
      const id = String(row.id ?? "").toLowerCase();
      return (
        murid.includes(q) ||
        guru.includes(q) ||
        requester.includes(q) ||
        transaksi.includes(q) ||
        id.includes(q)
      );
    });
  }, [rows, search]);

  const pageRows = useMemo(() => filteredRows, [filteredRows]);

  const openAction = (row: ChangeTeacherItem) => {
    setSelected(row);
    setAction(row.status === "pending" ? "approve" : "close");
    setAdminNote("");
    setExpireInDays("");
    setSelectionExpiresAt("");
    setFreezeRemainingSessions("");
    setFeeInvoiceId("");
    setPaymentRef("");
    setDecidedCategory("");
    setGuruQuery("");
    setGuruOptions([]);
    setGuruLoading(false);
    setGuruError(null);
    setSelectedGuruId(row.new_teacher_id ? String(row.new_teacher_id) : "");
    setScheduleOptions([]);
    setScheduleLoading(false);
    setScheduleError(null);
    setSelectedScheduleId(row.new_jadwal_id ? String(row.new_jadwal_id) : "");
    setNewStartDate(
      row.new_tanggal_mulai_sesi ? String(row.new_tanggal_mulai_sesi).slice(0, 10) : ""
    );
    setFormError(null);
  };

  const closeAction = () => {
    setSelected(null);
    setFormError(null);
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setFormError(null);
    try {
      setSubmitting(true);
      if (action === "approve") {
        if (isOtherCategory && !decidedCategory) {
          setFormError("Kategori final wajib dipilih.");
          setSubmitting(false);
          return;
        }
        if (isTeacherMismatch) {
          const teacherIdNum = Number(selectedGuruId || 0);
          const scheduleIdNum = Number(selectedScheduleId || 0);
          if (!Number.isFinite(teacherIdNum) || teacherIdNum <= 0) {
            setFormError("Guru pengganti wajib dipilih.");
            setSubmitting(false);
            return;
          }
          if (!Number.isFinite(scheduleIdNum) || scheduleIdNum <= 0) {
            setFormError("Jadwal guru pengganti wajib dipilih.");
            setSubmitting(false);
            return;
          }
          if (!newStartDate) {
            setFormError("Tanggal mulai sesi wajib diisi.");
            setSubmitting(false);
            return;
          }
          if (newStartDate < formatDateInput(minStartDate)) {
            setFormError("Tanggal mulai minimal H+7 dari hari ini.");
            setSubmitting(false);
            return;
          }
          if (selectedScheduleDayIndex != null) {
            const chosenDate = new Date(`${newStartDate}T00:00:00`);
            if (Number.isNaN(chosenDate.getTime())) {
              setFormError("Tanggal mulai sesi tidak valid.");
              setSubmitting(false);
              return;
            }
            if (chosenDate.getDay() !== selectedScheduleDayIndex) {
              setFormError("Tanggal mulai harus sesuai hari jadwal yang dipilih.");
              setSubmitting(false);
              return;
            }
          }
          await approveTeacherChangeRequest(selected.id, {
            admin_note: adminNote.trim() || null,
            new_teacher_id: teacherIdNum,
            new_jadwal_id: scheduleIdNum,
            new_tanggal_mulai_sesi: newStartDate,
            decided_category: isOtherCategory ? decidedCategory : undefined,
          });
        } else if (isStudentMismatch) {
          const expireDays = Number(expireInDays || 0);
          await approveTeacherChangeRequest(selected.id, {
            admin_note: adminNote.trim() || null,
            selection_expires_at: selectionExpiresAt || null,
            expire_in_days: expireDays > 0 ? expireDays : null,
            decided_category: isOtherCategory ? decidedCategory : undefined,
          });
        } else {
          await approveTeacherChangeRequest(selected.id, {
            admin_note: adminNote.trim() || null,
            decided_category: isOtherCategory ? decidedCategory : undefined,
          });
        }
      }
      if (action === "reject") {
        await rejectTeacherChangeRequest(selected.id, adminNote.trim() || null);
      }
      if (action === "close") {
        await closeTeacherChangeRequest(selected.id, adminNote.trim() || null);
      }
      if (action === "freeze") {
        const freezeCount = Number(freezeRemainingSessions || 0);
        if (!Number.isFinite(freezeCount) || freezeCount <= 0) {
          setFormError("freeze_remaining_sessions wajib diisi.");
          setSubmitting(false);
          return;
        }
        await freezeTeacherChangeSessions(selected.id, freezeCount);
      }
      if (action === "fee") {
        const invoiceId = feeInvoiceId.trim();
        const payment = paymentRef.trim();
        if (!invoiceId && !payment) {
          setFormError("change_fee_invoice_id atau payment_ref wajib diisi.");
          setSubmitting(false);
          return;
        }
        await setTeacherChangeFeeRef(selected.id, {
          change_fee_invoice_id: invoiceId || null,
          payment_ref: payment || null,
        });
      }
      closeAction();
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memproses aksi.";
      setFormError(message);
      setSubmitting(false);
    }
  };

  const canAction = (row: ChangeTeacherItem, kind: ActionKind) => {
    const status = String(row.status || "").toLowerCase();
    const closedStatuses = ["completed", "rejected", "cancelled", "closed_without_change"];
    if (kind === "approve" || kind === "reject") return status === "pending";
    if (kind === "close") return !closedStatuses.includes(status);
    return true;
  };

  const isClosedStatus = (row?: ChangeTeacherItem | null) => {
    const status = String(row?.status || "").toLowerCase();
    return ["completed", "rejected", "cancelled", "closed_without_change"].includes(status);
  };

  const loadGuruOptions = async () => {
    const q = guruQuery.trim();
    if (!q) {
      setGuruOptions([]);
      setGuruError("Masukkan nama atau ID guru untuk mencari.");
      return;
    }
    setGuruLoading(true);
    setGuruError(null);
    try {
      const resp = await listGuru({ q, page: 1, limit: 20 });
      const normalized = normalizeGuruListResponse(resp);
      setGuruOptions(normalized);
      if (normalized.length === 0) {
        setGuruError("Guru tidak ditemukan.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat daftar guru.";
      setGuruError(message);
      setGuruOptions([]);
    } finally {
      setGuruLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedGuruId) {
      setScheduleOptions([]);
      setSelectedScheduleId("");
      return;
    }
    let active = true;
    const fetchSchedule = async () => {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const resp = await getGuruProfileById(selectedGuruId);
        const data = (resp as any)?.data ?? resp;
        const jadwal = Array.isArray(data?.jadwal) ? data.jadwal : [];
        const normalized = jadwal
          .map((row: any) => {
            const id = Number(row?.id);
            if (!Number.isFinite(id)) return null;
            return {
              id,
              hari: row?.hari ?? "-",
              waktu_mulai: String(row?.waktu_mulai ?? "-"),
              waktu_selesai: String(row?.waktu_selesai ?? "-"),
              status: row?.status ?? null,
            } as GuruScheduleOption;
          })
          .filter(Boolean)
          .filter((row: GuruScheduleOption) => {
            return String(row.status || "").toLowerCase() === "available";
          }) as GuruScheduleOption[];
        if (!active) return;
        setScheduleOptions(normalized);
        if (normalized.length === 0) {
          setScheduleError("Jadwal guru tidak ditemukan.");
        }
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Gagal memuat jadwal guru.";
        setScheduleError(message);
        setScheduleOptions([]);
      } finally {
        if (active) setScheduleLoading(false);
      }
    };
    fetchSchedule();
    return () => {
      active = false;
    };
  }, [selectedGuruId]);

  useEffect(() => {
    if (!newStartDate) return;
    if (newStartDate < formatDateInput(minStartDate)) {
      setNewStartDate("");
      return;
    }
    if (selectedScheduleDayIndex == null) return;
    const chosenDate = new Date(`${newStartDate}T00:00:00`);
    if (Number.isNaN(chosenDate.getTime())) return;
    if (chosenDate.getDay() !== selectedScheduleDayIndex) {
      setNewStartDate("");
    }
  }, [minStartDate, newStartDate, selectedScheduleDayIndex]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white shadow-sm">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-color)] text-[var(--accent-blue-color)]">
                <RiSwapLine size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">
                  Pergantian Guru
                </p>
                <p className="text-sm text-neutral-500">
                  Daftar pengajuan ganti guru
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <div className="relative w-full min-w-[240px] max-w-xl sm:flex-1">
                <RiSearchLine
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari murid, guru, requester, transaksi"
                  className="w-full rounded-full border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-800 outline-none transition focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-[var(--secondary-color)]/20"
                />
              </div>

              <div className="relative">
                <RiFilter3Line
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={18}
                />
                <RiArrowDownSLine
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={16}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="appearance-none inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white pl-10 pr-10 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <RiFilter3Line
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={18}
                />
                <RiArrowDownSLine
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={16}
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                  className="appearance-none inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white pl-10 pr-10 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-[1200px] w-full table-auto text-sm text-neutral-900">
              <thead className="bg-neutral-200/80 text-left text-[13px] font-semibold text-neutral-800">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Transaksi</th>
                  <th className="p-4">Murid</th>
                  <th className="p-4">Guru</th>
                  <th className="p-4">Requester</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Alasan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Diajukan</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-neutral-500"
                    >
                      Memuat pengajuan pergantian guru...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-neutral-500"
                    >
                      Tidak ada pengajuan pergantian guru.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  pageRows.map((row, idx) => {
                    const status =
                      (row.status || "pending").toString().toLowerCase() as ChangeTeacherStatus;
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-neutral-200 last:border-none ${
                          idx % 2 === 0 ? "bg-white" : "bg-neutral-50"
                        }`}
                      >
                        <td className="px-4 py-3 align-middle text-neutral-800">
                          {row.id ?? "-"}
                        </td>
                        <td className="px-4 py-3 align-middle text-neutral-700">
                          {row.transaksi_id ?? "-"}
                        </td>
                        <td className="px-4 py-3 align-middle text-[15px] text-neutral-900">
                          {resolveName(row.murid, "Murid")}
                        </td>
                        <td className="px-4 py-3 align-middle text-[15px] text-neutral-900">
                          {resolveName(row.guru, "Guru")}
                        </td>
                        <td className="px-4 py-3 align-middle text-neutral-700">
                          {resolveName(row.requester, "Requester")}
                        </td>
                        <td className="px-4 py-3 align-middle text-neutral-700">
                          {categoryLabel(row.category)}
                        </td>
                        <td className="px-4 py-3 align-middle text-neutral-700">
                          {truncateText(row.reason)}
                        </td>
                        <td
                          className={`px-4 py-3 align-middle font-semibold ${
                            statusTone[status] ?? "text-neutral-600"
                          }`}
                        >
                          {statusLabel(row.status)}
                        </td>
                        <td className="px-4 py-3 align-middle text-neutral-700">
                          {formatDateTime(row.created_at)}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <button
                            type="button"
                            onClick={() => openAction(row)}
                            className="inline-flex items-center justify-center rounded-full border border-[var(--secondary-color)] px-4 py-1.5 text-xs font-semibold text-[var(--secondary-color)] transition hover:bg-[var(--secondary-light-color)]"
                          >
                            Aksi
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
            <p>Shows {pageRows.length} of {total} Data</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1 || loading || total === 0}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <RiArrowLeftSLine size={18} />
              </button>
              <div className="flex items-center gap-2">
                {pageWindow(pageCount, page).map((item, idx) =>
                  item === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-neutral-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={`h-10 w-10 rounded-2xl border border-neutral-300 bg-white text-sm font-semibold transition hover:bg-neutral-50 ${
                        item === page
                          ? "bg-[var(--secondary-light-color)] text-neutral-800"
                          : ""
                      }`}
                      aria-current={item === page ? "page" : undefined}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                disabled={page === pageCount || loading || total === 0}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              >
                <RiArrowRightSLine size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <ConfirmationModal
        isOpen={!!selected}
        onClose={closeAction}
        title="Aksi Pergantian Guru"
        texts={[
          selected
            ? `Transaksi #${selected.transaksi_id ?? "-"} - ${resolveName(
                selected.murid,
                "Murid"
              )}`
            : "",
          selected ? `Kategori: ${categoryLabel(selected.category)}` : "",
          selected ? `Status: ${statusLabel(selected.status)}` : "",
          selected ? `Kelas Belum Dimulai: ${selected.kelas_belum_dimulai ?? 0}` : "",
        ]}
        align="left"
        widthClass="max-w-2xl"
        button1={
          !isClosedStatus(selected)
            ? {
                label: submitting ? "Memproses..." : "Simpan",
                onClick: handleSubmit,
                loading: submitting,
                variant: "primary",
              }
            : undefined
        }
        button2={
          !isClosedStatus(selected)
            ? {
                label: "Batal",
                onClick: closeAction,
                variant: "outline",
              }
            : undefined
        }
      >
        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1 text-sm text-neutral-800">

          {selected?.reason && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Alasan
              </div>
              <div className="mt-1 whitespace-pre-wrap">{selected.reason}</div>
            </div>
          )}

          {categoryKey === "guru_tidak_cocok" && (
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Upaya
              </div>
              <div className="mt-1 whitespace-pre-wrap">
                {selected?.effort?.trim() || "-"}
              </div>
            </div>
          )}

          {(selected?.teacher_referral_id || selected?.teacherReferral) && (
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Rekomendasi guru baru dari user
              </div>
              <div className="mt-1 whitespace-pre-wrap">
                {resolveName(selected?.teacherReferral, "-")}
              </div>
            </div>
          )}

          {selected?.admin_note && (
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Catatan Admin
              </div>
              <div className="mt-1 whitespace-pre-wrap">{selected.admin_note}</div>
            </div>
          )}

          {!!selected?.files?.length && (
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Lampiran
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {selected.files.map((file, idx) => {
                  const url = resolveFileUrl(file);
                  const imageUrl = resolveImageUrl(url) || url;
                  const label = resolveFileLabel(file);
                  if (!url) return null;
                  if (isImageMime(file.mime_type)) {
                    return (
                      <a
                        key={`${label}-${idx}`}
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2 hover:border-[var(--secondary-color)]"
                      >
                        <img
                          src={imageUrl}
                          alt={label}
                          className="h-20 w-20 rounded-lg object-cover"
                          loading="lazy"
                        />
                        <span className="max-w-[120px] truncate text-xs text-neutral-600">
                          {label}
                        </span>
                      </a>
                    );
                  }
                  return (
                    <a
                      key={`${label}-${idx}`}
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-[var(--secondary-color)] hover:border-[var(--secondary-color)]"
                    >
                      {label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {!isClosedStatus(selected) && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Aksi
                </span>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as ActionKind)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="approve" disabled={!selected || !canAction(selected, "approve")}>
                    Approve
                  </option>
                  <option value="reject" disabled={!selected || !canAction(selected, "reject")}>
                    Reject
                  </option>
                  <option value="close" disabled={!selected || !canAction(selected, "close")}>
                    Close Without Change
                  </option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Admin Note
                </span>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Catatan admin"
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}

          {!isClosedStatus(selected) && action === "approve" && isOtherCategory && (
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Kategori Final
              </span>
              <select
                value={decidedCategory}
                onChange={(e) =>
                  setDecidedCategory(
                    e.target.value as "murid_tidak_cocok" | "guru_tanggung_jawab" | ""
                  )
                }
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Pilih kategori</option>
                <option value="murid_tidak_cocok">Murid Tidak Cocok</option>
                <option value="guru_tanggung_jawab">Guru Tanggung Jawab</option>
              </select>
            </label>
          )}

          {!isClosedStatus(selected) && action === "approve" && isStudentMismatch && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Selection Expires At
                </span>
                <input
                  type="date"
                  value={selectionExpiresAt}
                  onChange={(e) => setSelectionExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Expire In Days
                </span>
                <input
                  type="number"
                  min={0}
                  value={expireInDays}
                  onChange={(e) => setExpireInDays(e.target.value)}
                  placeholder="contoh: 3"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}

          {!isClosedStatus(selected) && action === "approve" && isTeacherMismatch && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Cari Guru Pengganti
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guruQuery}
                      onChange={(e) => setGuruQuery(e.target.value)}
                      placeholder="Nama / ID guru"
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={loadGuruOptions}
                      disabled={guruLoading}
                      className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-70"
                    >
                      {guruLoading ? "Mencari..." : "Cari"}
                    </button>
                  </div>
                  {guruError && (
                    <p className="text-xs text-red-600">{guruError}</p>
                  )}
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Guru Pengganti
                  </span>
                  <select
                    value={selectedGuruId}
                    onChange={(e) => setSelectedGuruId(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Pilih guru</option>
                    {guruOptions.map((guru) => (
                      <option key={guru.id} value={String(guru.id)}>
                        {guru.nama} {guru.city ? `- ${guru.city}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Jadwal Guru Pengganti
                  </span>
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                    disabled={!selectedGuruId || scheduleLoading}
                  >
                    <option value="">
                      {scheduleLoading ? "Memuat jadwal..." : "Pilih jadwal"}
                    </option>
                    {scheduleOptions.map((jadwal) => (
                      <option key={jadwal.id} value={String(jadwal.id)}>
                        {resolveDayName(jadwal.hari)} | {jadwal.waktu_mulai} -{" "}
                        {jadwal.waktu_selesai}
                      </option>
                    ))}
                  </select>
                  {scheduleError && (
                    <p className="text-xs text-red-600">{scheduleError}</p>
                  )}
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Tanggal Mulai Sesi
                  </span>
                  <select
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    disabled={startDateOptions.length === 0}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">
                      {startDateOptions.length === 0
                        ? "Pilih jadwal dahulu"
                        : "Pilih tanggal mulai"}
                    </option>
                    {startDateOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500">
                    Minimal H+7 dan sesuai hari jadwal ({resolveDayName(selectedSchedule?.hari ?? null)}).
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Freeze/Fee actions removed from UI */}

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default TeacherChangePage;
