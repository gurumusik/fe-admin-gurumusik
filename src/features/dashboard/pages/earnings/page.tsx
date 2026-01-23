/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/earnings/pages/AdminEarningsPage.tsx
import React from "react";
import { useNavigate } from 'react-router-dom';
import {
  RiCoinsLine,
  RiInformationLine,
  RiCalendar2Line,
  RiArrowDownSLine,
  RiSearchLine,
  RiDownloadLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowRightUpLine,
  RiBarChartFill,
  RiCloseLine,
  RiArrowRightDownLine
} from "react-icons/ri";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getInstrumentIcon } from "@/utils/getInstrumentIcon";
import { getStatusColor } from "@/utils/getStatusColor";

/* redux */
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import {
  setCategory,
  setQuery,
  setStatusFilter,
  setPage as setReduxPage,
  setLimit as setReduxLimit,
  fetchAllTxThunk,
} from "@/features/slices/transaksi/slice";
import type {
  TxCategoryChip,
  TxStatusLabel,
  AllTransactionItem,
  TxStatusRaw,
} from "@/features/slices/transaksi/types";

import {
  fetchEarningsChartThunk,
  setRange as setChartRange,
} from "@/features/slices/earnings/slice";
import type { EarningsChartPoint, EarningsRecap } from "@/features/slices/earnings/types";

import { resolveImageUrl } from "@/utils/resolveImageUrl";

/* UI helpers */
const toneClasses = {
  green: { bg: "bg-[var(--accent-green-light-color)]" },
  orange: { bg: "bg-[var(--primary-light-color)]" },
  blue: { bg: "bg-[var(--secondary-light-color)]" },
  pink: { bg: "bg-[var(--accent-red-light-color)]" },
  purple: { bg: "bg-[var(--accent-purple-light-color)]" },
} as const;

const COLORS = {
  total: "var(--accent-green-color)",     // hijau
  course: "var(--primary-color)",         // kuning/oranye
  module: "var(--secondary-color)",       // biru
  promo: "var(--accent-red-color)",       // merah
  fee: "var(--accent-purple-color)",      // ungu (fee layanan)
};

const LEGEND_ORDER: Record<string, number> = {
  total: 0,
  course: 1,
  module: 2,
  promo: 3,
  fee: 4,
};

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const PAGE_SIZE = 5 as const;

const EMPTY_RECAP: EarningsRecap = {
  total_sum: 0,
  course_sum: 0,
  module_sum: 0,
  promo_sum: 0,
  fee_sum: 0,
  course_count: 0,
  module_count: 0,
  promo_tx_count: 0,
  delta_percent: {},
};

const typeChipCls = (t: string) =>
  t === "Video"
    ? "bg-[var(--accent-orange-color)] text-white"
    : "bg-[var(--accent-purple-color)] text-white";

const formatPct = (v: number) =>
  `${v > 0 ? "+" : ""}${v.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;

const DeltaBadge: React.FC<{ value?: number | null }> = ({ value }) => {
  // kalau BE lama belum kirim delta_percent, jangan tampilkan apa-apa (biar layout gak aneh)
  if (typeof value === "undefined") return null;

  // kalau tidak bisa dihitung (prev=0 dan curr>0), tampilkan netral
  if (value === null) {
    return (
      <div className="mt-1 inline-flex items-center text-md text-neutral-500">
        <span>0% dari bulan lalu</span>
      </div>
    );
  }

  const negative = value < 0;
  const Icon = negative ? RiArrowRightDownLine : RiArrowRightUpLine;
  const colorClass = negative
    ? "text-[var(--accent-red-color)]"
    : "text-[var(--accent-green-color)]";

  return (
    <div className={`mt-1 inline-flex items-center text-md ${colorClass}`}>
      <Icon size={20} />
      <span>{formatPct(value)} dari bulan lalu</span>
    </div>
  );
};


/* Bar custom (top border) */
const TopBorderBar: React.FC<any> = (props) => {
  const { x, y, width, height, fill, borderColor } = props;
  if (width <= 0 || height <= 0) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} opacity={0.6} />
      <line x1={x} x2={x + width} y1={y} y2={y} stroke={borderColor || fill} strokeWidth={2} />
    </g>
  );
};

/* ===== util bulan/range untuk chart & picker ===== */
const ID_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
] as const;

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  Jan: 0, Januari: 0,
  Feb: 1, Februari: 1,
  Mar: 2, Maret: 2,
  Apr: 3, April: 3,
  Mei: 4,
  Jun: 5, Juni: 5,
  Jul: 6, Juli: 6,
  Agu: 7, Agustus: 7,
  Sep: 8, September: 8,
  Okt: 9, Oktober: 9,
  Nov: 10, November: 10,
  Des: 11, Desember: 11,
};

type MonthPoint = { label: string; year: number; mIdx: number };

/** parse label "Jan 2025 - Agu 2025" -> list bulan inclusive */
function parseRangeLabel(label: string): MonthPoint[] {
  const m = label.match(/^\s*([A-Za-zÀ-ÿ]+)\s+(\d{4})\s*-\s*([A-Za-zÀ-ÿ]+)\s+(\d{4})\s*$/i);
  let startIdx = 0, startYear = new Date().getFullYear();
  let endIdx = 11, endYear = startYear;

  if (m) {
    const a = m[1]; const ay = Number(m[2]);
    const b = m[3]; const by = Number(m[4]);
    if (a in MONTH_NAME_TO_INDEX) startIdx = MONTH_NAME_TO_INDEX[a];
    if (b in MONTH_NAME_TO_INDEX) endIdx = MONTH_NAME_TO_INDEX[b];
    startYear = ay; endYear = by;
  }

  const out: MonthPoint[] = [];
  let y = startYear, mi = startIdx;
  while (y < endYear || (y === endYear && mi <= endIdx)) {
    out.push({ label: `${ID_MONTHS[mi]}`, year: y, mIdx: mi });
    mi += 1;
    if (mi > 11) { mi = 0; y += 1; }
  }
  return out;
}

function buildDefaultRangeLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth(); // 0 = Jan, 11 = Des

  // Kalau sekarang di antara Januari–Juni ➜ pakai Jan–Jun
  if (monthIdx <= 5) {
    // Jan (0) - Jun (5)
    return formatRangeLabel(year, 0, year, 5);
  }

  // Kalau sekarang di antara Juli–Desember ➜ pakai Jul–Des
  // Jul (6) - Des (11)
  return formatRangeLabel(year, 6, year, 11);
}

function formatRangeLabel(sYear: number, sMonthIdx: number, eYear: number, eMonthIdx: number) {
  return `${ID_MONTHS[sMonthIdx]} ${sYear} - ${ID_MONTHS[eMonthIdx]} ${eYear}`;
}
function monthsDiffInclusive(sYear: number, sMonthIdx: number, eYear: number, eMonthIdx: number) {
  const a = sYear * 12 + sMonthIdx;
  const b = eYear * 12 + eMonthIdx;
  return b - a + 1;
}

const toYYYYMM = (year: number, monthIdx: number) =>
  `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

/* TYPES (untuk table lokal) */
type Tab = "kursus" | "modul";
type HistoryRow = {
  uuid: string;
  image: string;
  // kursus
  student?: string;
  instrument?: string;
  pkg?: string;
  // modul
  title?: string;
  type?: "E-Book" | "Video" | "Module Online" | string;
  buyer?: string;
  // umum
  price: string;
  date: string;
  status: string;
};

/* utils */
const formatIDR = (n: number) =>
  typeof n === "number"
    ? n.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
    : n;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

/** fallback mapper kalau status_label tidak dikirim */
const rawToLabel = (raw?: TxStatusRaw | string | null): TxStatusLabel => {
  const v = String(raw || "").toLowerCase();
  if (v === "lunas") return "Success";
  if (v === "pending" || v === "menunggu_pembayaran") return "On Progress";
  if (v === "expired") return "Expired";
  if (v === "gagal") return "Failed";
  return "Canceled";
};

/* ===== Overlay komponen: Info & Month Range Picker ===== */
const InfoOverlay: React.FC<{
  open: boolean;
  mode: "kotor" | "bersih";
  onClose: () => void;
}> = ({ open, mode, onClose }) => {
  if (!open) return null;

  const isKotor = mode === "kotor";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-[#0B1220]/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h4 className="text-[18px] font-semibold text-[#0B1220]">
            {isKotor ? "Apa Itu Total Pendapatan Kotor?" : "Apa Itu Total Pendapatan Bersih?"}
          </h4>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100" aria-label="Tutup">
            <RiCloseLine className="text-xl text-[#0B1220]" />
          </button>
        </div>
        <div className="my-3 h-px bg-neutral-200" />
        <div className="space-y-3 text-[15px] leading-relaxed text-[#0B1220]">
          {isKotor ? (
            <>
              <p>Pendapatan Kotor adalah jumlah pendapatan yang <b>sudah dipotong promo</b>, tetapi <b>belum dipotong komisi guru</b>.</p>
              <div>
                <b>Rumus:</b>
                <p>Total Pendapatan Kotor = Pendapatan Kotor Kursus + Pendapatan Kotor Modul – Promo</p>
              </div>
            </>
          ) : (
            <>
              <p>Pendapatan Bersih adalah jumlah pendapatan akhir <b>setelah dipotong promo/diskon dan komisi guru</b>.</p>
              <div>
                <b>Rumus:</b>
                <p>Total Pendapatan Bersih = Pendapatan Bersih Kursus + Pendapatan Bersih Modul – Promo</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const MonthRangeOverlay: React.FC<{
  open: boolean;
  initialLabel: string;
  onApply: (newLabel: string) => void;
  onClose: () => void;
}> = ({ open, initialLabel, onApply, onClose }) => {
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const currentMonth = React.useMemo(() => new Date().getMonth(), []);

  // tahun opsional: -5 s/d +5 dari tahun berjalan
  const yearOptions = React.useMemo(
    () => Array.from({ length: 11 }, (_, i) => currentYear - 5 + i),
    [currentYear]
  );

  // parse awal dari label
  const init = React.useMemo(() => {
    const m = initialLabel.match(/^\s*([A-Za-zÀ-ÿ]+)\s+(\d{4})\s*-\s*([A-Za-zÀ-ÿ]+)\s+(\d{4})\s*$/i);
    let sy = currentYear, sm = 0, ey = currentYear, em = Math.min(7, currentMonth); // default Jan–Agu (atau sampai bulan berjalan)
    if (m) {
      sy = Number(m[2]); ey = Number(m[4]);
      sm = MONTH_NAME_TO_INDEX[m[1]] ?? 0;
      em = MONTH_NAME_TO_INDEX[m[3]] ?? 0;
    }
    // rapihkan jika end < start
    const a = sy * 12 + sm, b = ey * 12 + em;
    if (b < a) { ey = sy; em = sm; }
    return { sy, sm, ey, em };
  }, [initialLabel, currentYear, currentMonth]);

  const [sy, setSY] = React.useState(init.sy);
  const [sm, setSM] = React.useState(init.sm);
  const [ey, setEY] = React.useState(init.ey);
  const [em, setEM] = React.useState(init.em);

  React.useEffect(() => {
    if (open) {
      setSY(init.sy); setSM(init.sm); setEY(init.ey); setEM(init.em);
    }
  }, [open, init]);

  const a = sy * 12 + sm;
  const b = ey * 12 + em;
  const swapped = b < a;
  const normSY = swapped ? ey : sy;
  const normSM = swapped ? em : sm;
  const normEY = swapped ? sy : ey;
  const normEM = swapped ? sm : em;

  const totalMonths = monthsDiffInclusive(normSY, normSM, normEY, normEM);
  const tooLong = totalMonths > 12;

  const apply = () => {
    if (tooLong) return;
    const lbl = formatRangeLabel(normSY, normSM, normEY, normEM);
    onApply(lbl);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-[#0B1220]/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h4 className="text-[18px] font-semibold text-[#0B1220]">Pilih Rentang Bulan (maks. 12 bulan)</h4>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100" aria-label="Tutup">
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Start */}
          <div className="rounded-xl border border-neutral-200 p-4">
            <div className="mb-3 text-sm font-medium text-[#0B1220]">Mulai</div>
            <div className="flex items-center gap-3">
              <select
                value={sm}
                onChange={(e) => setSM(Number(e.target.value))}
                className="h-9 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                title="Bulan mulai"
              >
                {ID_MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={sy}
                onChange={(e) => setSY(Number(e.target.value))}
                className="h-9 w-[120px] rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                title="Tahun mulai"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* End */}
          <div className="rounded-xl border border-neutral-200 p-4">
            <div className="mb-3 text-sm font-medium text-[#0B1220]">Selesai</div>
            <div className="flex items-center gap-3">
              <select
                value={em}
                onChange={(e) => setEM(Number(e.target.value))}
                className="h-9 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                title="Bulan selesai"
              >
                {ID_MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={ey}
                onChange={(e) => setEY(Number(e.target.value))}
                className="h-9 w-[120px] rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                title="Tahun selesai"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-2 rounded-xl bg-neutral-50 p-3 text-sm">
          <div>
            <span className="font-medium text-[#0B1220]">Rentang terpilih:</span>{" "}
            <span className="text-[#0B1220]">
              {formatRangeLabel(normSY, normSM, normEY, normEM)} ({totalMonths} bulan)
            </span>
          </div>
          {tooLong && (
            <div className="mt-1 text-[13px] text-[var(--accent-red-color)]">
              Rentang melebihi 12 bulan. Kurangi rentang agar ≤ 12 bulan.
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm text-[#0B1220] hover:bg-neutral-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={tooLong}
            className={cls(
              "inline-flex h-9 items-center rounded-lg px-4 text-sm",
              tooLong
                ? "cursor-not-allowed bg-neutral-300 text-neutral-600"
                : "bg-[var(--secondary-color)] text-white hover:opacity-90"
            )}
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

/* PAGE */
const AdminEarningsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const tx = useSelector((s: RootState) => s.transaksi);
  const earnings = useSelector((s: RootState) => s.earningsChart);

  const [netOnly, setNetOnly] = React.useState(false);
  const [rangeLabel, setRangeLabel] = React.useState(() => buildDefaultRangeLabel());
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("kursus");

  // local input (mirror redux)
  const [searchQ, setSearchQ] = React.useState(tx.q ?? "");
  const [statusQ, setStatusQ] = React.useState<string>(tx.statusFilter === "ALL" ? "All" : String(tx.statusFilter));

  // init transaksi list
  React.useEffect(() => {
    if (tx.limit !== PAGE_SIZE) dispatch(setReduxLimit(PAGE_SIZE));
    dispatch(setCategory("Kursus"));
    dispatch(setReduxPage(1));
    dispatch(fetchAllTxThunk({ net: netOnly } as any));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // init/update chart earnings (range + mode)
  React.useEffect(() => {
    const months = parseRangeLabel(rangeLabel);
    if (!months.length) return;
    const start = months[0];
    const end = months[months.length - 1];
    const startMonth = toYYYYMM(start.year, start.mIdx);
    const endMonth = toYYYYMM(end.year, end.mIdx);

    dispatch(setChartRange({ start_month: startMonth, end_month: endMonth }));
    dispatch(fetchEarningsChartThunk({ start_month: startMonth, end_month: endMonth, net: netOnly }));
  }, [dispatch, rangeLabel, netOnly]);

  // tab -> category
  React.useEffect(() => {
    const chip: TxCategoryChip = tab === "kursus" ? "Kursus" : "Modul";
    dispatch(setCategory(chip));
    dispatch(setReduxPage(1));
    dispatch(fetchAllTxThunk({ net: netOnly } as any));
  }, [tab, dispatch, netOnly]);

  // search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setQuery(searchQ));
      dispatch(setReduxPage(1));
      dispatch(fetchAllTxThunk({ net: netOnly } as any));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQ, dispatch, netOnly]);

  // status filter
  React.useEffect(() => {
    const mapUIToLabel = (v: string): TxStatusLabel | "ALL" => {
      if (!v || v === "All") return "ALL";
      if (v === "Dibatalkan") return "Canceled";
      return v as TxStatusLabel;
    };
    dispatch(setStatusFilter(mapUIToLabel(statusQ)));
    dispatch(setReduxPage(1));
    dispatch(fetchAllTxThunk({ net: netOnly } as any));
  }, [statusQ, dispatch, netOnly]);

  // pagination
  const onPrev = () => {
    if (tx.page <= 1) return;
    dispatch(setReduxPage(tx.page - 1));
    dispatch(fetchAllTxThunk({ net: netOnly } as any));
  };

  const onNext = () => {
    const pages = Math.max(1, Math.ceil((tx.allTotal || 0) / (tx.limit || PAGE_SIZE)));
    if (tx.page >= pages) return;
    dispatch(setReduxPage(tx.page + 1));
    dispatch(fetchAllTxThunk({ net: netOnly } as any));
  };

  const onGoto = (p: number) => {
    dispatch(setReduxPage(p));
    dispatch(fetchAllTxThunk({ net: netOnly } as any));
  };

  /* Normalisasi rows untuk tabel */
  const normalized: HistoryRow[] = React.useMemo(() => {
    const rows = (tx.allItems as AllTransactionItem[] | any[]) || [];

    const isModulRow = (r: any) =>
      String(r?.type || "").toLowerCase() === "modul" ||
      String(r?.category_transaksi || "").toLowerCase() === "modul" ||
      !!r?.module;

    if (tab === "modul") {
      return rows
        .filter(isModulRow)
        .map((m: any) => {
          const mod = m.module ?? m.modul ?? null;
          const thumb = mod?.thumbnail ?? mod?.thumbnail_path ?? "/assets/images/modul.png";
          const title = mod?.title ?? mod?.judul ?? m.item ?? "-";
          const buyer = m.student?.name ?? m.murid?.nama ?? "-";
          const price = Number(m.price ?? m.total_harga ?? 0);
          const date = m.date ?? m.tanggal_transaksi;
          const type = mod?.type ?? "Module Online";
          const label = m.status_label || rawToLabel(m.status);

          return {
            uuid: String(m.id),
            image: thumb,
            title,
            type: typeof type === "string" ? (type.toLowerCase() === "video" ? "Video" : type) : "Module Online",
            buyer,
            price: formatIDR(price),
            date: formatDate(date),
            status: label,
          };
        });
    }

    // kursus
    return rows
      .filter((x: any) => {
        const isModul =
          String(x?.type || "").toLowerCase() === "modul" ||
          String(x?.category_transaksi || "").toLowerCase() === "modul" ||
          !!x?.module;
        return !isModul;
      })
      .map((x: any) => {
        const avatar = x.student?.avatar ?? x.murid?.profile_pic_url ?? "/assets/images/teacher-demo.png";
        const studentName = x.student?.name ?? x.murid?.nama ?? x.program?.name ?? "-";
        const instrName = x.instrument?.name ?? x.detailProgram?.instrument?.nama_instrumen ?? "";
        const pkgNameRaw = x.paket?.name ?? x.paket?.nama_paket ?? "";
        const sessions = x.paket?.sessions ?? x.paket?.jumlah_sesi ?? null;
        const pkg = pkgNameRaw ? `${pkgNameRaw}${sessions ? ` - ${sessions} Sesi` : ""}` : "-";
        const price = Number(x.price ?? x.total_harga ?? 0);
        const date = x.date ?? x.tanggal_transaksi;
        const label = x.status_label || rawToLabel(x.status);

        return {
          uuid: String(x.id),
          image: avatar,
          student: studentName,
          instrument: instrName || "",
          pkg,
          price: formatIDR(price),
          date: formatDate(date),
          status: label,
        };
      });
  }, [tx.allItems, tab]);

  /* ====== REKAP DINAMIS (langsung dari API) ====== */
  const recap = React.useMemo(() => earnings.recap ?? EMPTY_RECAP, [earnings.recap]);

  // ====== DATA CHART PER BULAN ======
  const monthlyPerfData = React.useMemo(() => {
    const months = parseRangeLabel(rangeLabel);
    if (!months.length) return [];

    const base = months.map((p) => {
      const key = toYYYYMM(p.year, p.mIdx); // 'YYYY-MM'
      return {
        month: p.label,
        total: 0,
        course: 0,
        module: 0,
        promo: 0,
        fee: 0,
        _k: key,
      };
    });

    const points = (earnings.points || []) as EarningsChartPoint[];
    const byMonth: Record<string, EarningsChartPoint> = {};
    for (const pt of points) {
      if (!pt?.month) continue;
      byMonth[pt.month] = pt;
    }

    for (const slot of base) {
      const pt = byMonth[slot._k];
      if (!pt) continue;

      const course = Number(pt.kursus ?? 0);
      const module = Number(pt.modul ?? 0);
      const total = Number(pt.total ?? course + module);
      const promo = Number((pt as any).promo ?? 0);
      const fee = Number((pt as any).fee ?? 0);

      slot.course = course;
      slot.module = module;
      slot.total = total;
      slot.promo = promo;
      slot.fee = fee;
    }

    // buang _k sebelum dikirim ke Recharts
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return base.map(({ _k, ...rest }) => rest);
  }, [rangeLabel, earnings.points]);

  // Y-axis dinamis (kelipatan 10.000)
  const { yDomainMax, yTicks } = React.useMemo(() => {
    if (!monthlyPerfData.length) {
      // default kalau belum ada data
      return { yDomainMax: 10000, yTicks: [0, 10000] };
    }

    const rawMax = monthlyPerfData.reduce(
      (mx, r) => Math.max(mx, r.total, r.course, r.module, r.promo, r.fee),
      0
    );

    // dibulatkan ke atas ke kelipatan 10.000, minimal 10.000
    const roundedMax = Math.max(10000, Math.ceil(rawMax / 10000) * 10000);

    const ticks: number[] = [];
    for (let v = 0; v <= roundedMax; v += 10000) {
      ticks.push(v);
    }

    return { yDomainMax: roundedMax, yTicks: ticks };
  }, [monthlyPerfData]);

  const monthlyPerfDelta = React.useMemo(() => {
    const months = parseRangeLabel(rangeLabel);
    if (!months.length || monthlyPerfData.length < 2) {
      return { ready: false } as const;
    }

    const now = new Date();
    let targetIdx = months.findIndex(
      (m) => m.year === now.getFullYear() && m.mIdx === now.getMonth()
    );
    if (targetIdx < 0) targetIdx = months.length - 1;
    const prevIdx = targetIdx - 1;
    if (prevIdx < 0) {
      return { ready: false } as const;
    }

    const curr = monthlyPerfData[targetIdx] || {};
    const prev = monthlyPerfData[prevIdx] || {};

    const calc = (key: "total" | "course" | "module" | "promo" | "fee") => {
      const c = Number((curr as any)[key] ?? 0);
      const p = Number((prev as any)[key] ?? 0);
      if (!(p > 0)) return null;
      return ((c - p) / p) * 100;
    };

    return {
      ready: true,
      values: {
        total: calc("total"),
        course: calc("course"),
        module: calc("module"),
        promo: calc("promo"),
        fee: calc("fee"),
      },
    } as const;
  }, [monthlyPerfData, rangeLabel]);

  const deltaValue = React.useCallback(
    (key: "total" | "course" | "module" | "promo" | "fee") => {
      if (monthlyPerfDelta.ready) {
        return monthlyPerfDelta.values?.[key] ?? null;
      }

      const mapKey =
        key === "total"
          ? "total_sum"
          : key === "course"
          ? "course_sum"
          : key === "module"
          ? "module_sum"
          : key === "promo"
          ? "promo_sum"
          : "fee_sum";

      return (recap as any)?.delta_percent?.[mapKey];
    },
    [monthlyPerfDelta, recap]
  );

  const fmt = (n: number) =>
    n.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

  const pages = React.useMemo(
    () => Math.max(1, Math.ceil((tx.allTotal || 0) / (tx.limit || PAGE_SIZE)) ),
    [tx.allTotal, tx.limit]
  );

  const isLoading = tx.allStatus === "loading";

  /* Render */
  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Rekap + Performa */}
        <section className="rounded-2xl bg-white">
          {/* Header Rekap */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: "var(--primary-color)" }}>
                <RiCoinsLine size={25} className="text-black text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Rekap Pendapatan <span className="font-semibold">{netOnly ? "(Bersih)" : "(Kotor)"}</span>
              </h3>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 text-md text-neutral-900">
                <span className="hidden sm:inline">Pendapatan Bersih</span>
                <button
                  type="button"
                  onClick={() =>
                    setNetOnly((prev) => {
                      const next = !prev;
                      // ⬇️ refetch recap + data dengan mode baru
                      dispatch(fetchAllTxThunk({ net: next } as any));
                      return next;
                    })
                  }
                  className={cls(
                    "relative h-[24px] w-[44px] rounded-full transition",
                    netOnly ? "bg-[var(--secondary-color)]" : "bg-neutral-300"
                  )}
                  aria-label="Toggle pendapatan bersih"
                >
                  <span
                    className={cls(
                      "absolute left-1 top-1 h-[16px] w-[16px] rounded-full bg-white transition",
                      netOnly && "translate-x-[20px]"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Cards Rekap */}
          <div className="px-4 sm:px-5 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
              {/* Total */}
              <div className={cls("relative rounded-2xl p-4 sm:p-5", toneClasses.green.bg)}>
                <button
                  type="button"
                  onClick={() => setInfoOpen(true)}
                  className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full hover:bg-white/60"
                  aria-label="Informasi Total Pendapatan"
                  title="Informasi"
                >
                  <RiInformationLine className="text-[25px] text-[var(--secondary-color)]" />
                </button>
                <p className="text-md text-[#0B1220]">Total Pendapatan</p>
                <div className="mt-2">
                  <div className="text-[20px] font-bold leading-tight text-[#0B122A] sm:text-[22px]">
                    {fmt((recap as any).total_sum ?? 0)}
                  </div>
                  <div className="mt-1 inline-flex items-center text-sm text-[var(--accent-green-color)]">
                    <DeltaBadge value={deltaValue("total")} />
                  </div>
                </div>
                <div className="mt-3 text-sm text-[#0B1220]">
                  {(recap as any).course_count + (recap as any).module_count} Transaksi
                </div>
              </div>

              {/* Kursus */}
              <div className={cls("relative rounded-2xl p-4 sm:p-5", toneClasses.orange.bg)}>
                <p className="text-md text-[#0B1220]">Pendapatan Kursus</p>
                <div className="mt-2">
                  <div className="text-[20px] font-bold leading-tight text-[#0B122A] sm:text-[22px]">
                    {fmt((recap as any).course_sum ?? 0)}
                  </div>
                  <div className="mt-1 inline-flex items-center text-sm text-[var(--accent-green-color)]">
                    <DeltaBadge value={deltaValue("course")} />
                  </div>
                </div>
                <div className="mt-3 text-sm text-[#0B1220]">
                  {(recap as any).course_count ?? 0} Transaksi
                </div>
              </div>

              {/* Modul */}
              <div className={cls("relative rounded-2xl p-4 sm:p-5", toneClasses.blue.bg)}>
                <p className="text-md text-[#0B1220]">Pendapatan Modul</p>
                <div className="mt-2">
                  <div className="text-[20px] font-bold leading-tight text-[#0B122A] sm:text-[22px]">
                    {fmt((recap as any).module_sum ?? 0)}
                  </div>
                  <div className="mt-1 inline-flex items-center text-sm text-[var(--accent-green-color)]">
                    <DeltaBadge value={deltaValue("module")} />
                  </div>
                </div>
                <div className="mt-3 text-sm text-[#0B1220]">
                  {(recap as any).module_count ?? 0} Transaksi
                </div>
              </div>

              {/* Promo */}
              <div className={cls("relative rounded-2xl p-4 sm:p-5", toneClasses.pink.bg)}>
                <p className="text-md text-[#0B1220]">Nilai Promo</p>
                <div className="mt-2">
                  <div className="text-[20px] font-bold leading-tight text-[#0B122A] sm:text-[22px]">
                    {`-${fmt((recap as any).promo_sum ?? 0)}`}
                  </div>
                  <div className="mt-1 inline-flex items-center text-sm text-[var(--accent-green-color)]">
                    <DeltaBadge value={deltaValue("promo")} />
                  </div>
                </div>
                <div className="mt-3 text-sm text-[#0B1220]">
                  {(recap as any).promo_tx_count ?? 0} Transaksi
                </div>
              </div>

              <div className={cls("relative rounded-2xl p-4 sm:p-5", toneClasses.purple.bg)}>
                <p className="text-md text-[#0B1220]">Fee Layanan</p>
                <div className="mt-2">
                  <div className="text-[20px] font-bold leading-tight text-[#0B122A] sm:text-[22px]">
                    {fmt((recap as any).fee_sum ?? 0)}
                  </div>
                  {/* kalau nanti BE kirim delta_percent.fee_sum bisa langsung kebaca */}
                  <div className="mt-1 inline-flex items-center text-sm text-[var(--accent-green-color)]">
                    <DeltaBadge value={deltaValue("fee")} />
                  </div>
                </div>
                <div className="mt-3 text-sm text-[#0B1220]">
                  Dari semua transaksi
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-[var(--secondary-light-color)]" />

          {/* Header Performa */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: "var(--secondary-color)" }}>
                <RiBarChartFill size={25} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Performa Review</h3>
            </div>

            <button
              type="button"
              onClick={() => setRangeOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--secondary-light-color)] bg-white px-3 text-sm text-[#0F172A] hover:bg-[var(--secondary-light-color)]"
            >
              <span>{rangeLabel}</span>
              <RiArrowDownSLine className="text-[18px]" />
            </button>
          </div>

          {/* Chart Performa (per bulan; pakai SUM nominal dari endpoint earnings) */}
          <div className="px-2 pb-4 sm:px-4">
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPerfData} barCategoryGap={18}>
                  <CartesianGrid stroke="var(--secondary-light-color)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#6B7280", fontSize: 14 }}
                    axisLine={{ stroke: "var(--secondary-light-color)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    axisLine={{ stroke: "var(--secondary-light-color)" }}
                    tickLine={false}
                    allowDecimals={false}
                    domain={[0, yDomainMax]}
                    ticks={yTicks}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(2,132,199,0.06)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--secondary-light-color)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value: any) =>
                      typeof value === "number" ? fmt(value) : value
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: 16 }}
                    iconType="square"
                    itemSorter={(item) => LEGEND_ORDER[String(item?.dataKey ?? "")] ?? 99}
                  />
                  <Bar
                    dataKey="total"
                    name="Total Kursus + Modul"
                    fill={COLORS.total}
                    shape={<TopBorderBar borderColor="var(--accent-green-color)" />}
                  />
                  <Bar
                    dataKey="course"
                    name="Kursus"
                    fill={COLORS.course}
                    shape={<TopBorderBar borderColor="var(--primary-color)" />}
                  />
                  <Bar
                    dataKey="module"
                    name="Modul"
                    fill={COLORS.module}
                    shape={<TopBorderBar borderColor="var(--secondary-color)" />}
                  />
                  <Bar
                    dataKey="promo"
                    name="Promo"
                    fill={COLORS.promo}
                    shape={<TopBorderBar borderColor="var(--accent-red-color)" />}
                  />
                  <Bar
                    dataKey="fee"
                    name="Fee Layanan"
                    fill={COLORS.fee}
                    shape={<TopBorderBar borderColor="var(--accent-purple-color)" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ================= RIWAYAT ================= */}
        <section className="rounded-2xl bg-white">
          <div className="flex justify-between px-4 sm:px-5 py-3 sm:py-4">
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-neutral-900">Riwayat Pendapatan</h3>
              <div className="flex items-center gap-2">
                {(["kursus", "modul"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cls(
                      "h-8 cursor-pointer rounded-xl border border-[var(--secondary-color)] px-3 text-sm text-[var(--secondary-color)]",
                      tab === t ? "bg-[var(--secondary-light-color)]" : "hover:bg-[var(--secondary-light-color)]"
                    )}
                  >
                    {t === "kursus" ? "Kursus" : "Modul"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-[320px] flex-1">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A7B98]" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="| Cari Transaksi (nama murid, judul modul, program...)"
                  className="h-9 w-full rounded-xl border border-[var(--secondary-light-color)] bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-light-color)]"
                />
              </div>

              <select
                value={statusQ}
                onChange={(e) => setStatusQ(e.target.value)}
                className="h-9 rounded-xl border border-[var(--secondary-light-color)] bg-white px-3 text-sm text-[#0F172A] cursor-pointer"
                title="Filter Status"
              >
                {["All", "Success", "On Progress", "Expired", "Failed"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--secondary-light-color)] bg-white px-3 text-sm text-[#0F172A]"
              >
                <RiCalendar2Line className="text-[18px] text-[var(--secondary-color)]" />
                <span>30 Hari Terakhir</span>
                <RiArrowDownSLine className="text-[18px]" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="px-4 sm:px-5 py-3">
            <div className="overflow-hidden rounded-2xl">
              <table className="w-full">
                <thead>
                  {tab === "modul" ? (
                    <tr className="bg-neutral-100">
                      {["Gambar", "Nama Modul", "Tipe Modul", "Harga", "Pembeli", "Tanggal", "Status", "Aksi"].map((h) => (
                        <th key={h} className="px-3 py-4 text-left text-md font-semibold text-neutral-900">{h}</th>
                      ))}
                    </tr>
                  ) : (
                    <tr className="bg-neutral-100">
                      {["Profile", "Nama Siswa", "Paket", "Harga", "Tanggal", "Status", "Aksi"].map((h) => (
                        <th key={h} className="px-3 py-4 text-left text-md font-semibold text-neutral-900">{h}</th>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={tab === "modul" ? 8 : 7} className="p-6 text-center text-sm text-[#6A7B98]">
                        Memuat data...
                      </td>
                    </tr>
                  )}

                  {!isLoading && normalized.map((r) =>
                    tab === "modul" ? (
                      <tr key={r.uuid} className="border-b border-[var(--secondary-light-color)]">
                        <td className="p-3">
                          <img src={resolveImageUrl(r.image) || ""} alt={r.title} className="h-12 w-12 rounded-md object-cover" />
                        </td>
                        <td className="p-3 text-[#0F172A] font-medium">{r.title}</td>
                        <td className="p-3">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${typeChipCls(r.type || "")}`}>
                            {r.type ?? "Module Online"}
                          </span>
                        </td>
                        <td className="p-3 text-[#0F172A]">{r.price}</td>
                        <td className="p-3 text-[#0F172A]">{r.buyer ?? "-"}</td>
                        <td className="p-3 text-[#0F172A]">{r.date}</td>
                        <td className="p-3">
                          <span className={cls("text-sm font-medium", getStatusColor(r.status))}>{r.status || "-"}</span>
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--secondary-color)] px-3 text-sm text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                            onClick={() => navigate(`/dashboard-admin/invoice/${r.uuid}`)}
                          >
                            <RiDownloadLine className="text-[18px]" />
                            Invoice
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={r.uuid} className="border-b border-[var(--secondary-light-color)]">
                        <td className="p-3">
                          <img src={resolveImageUrl(r.image) || ""} alt={r.student} className="h-10 w-10 rounded-full object-cover" />
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-[#0F172A]">{r.student}</div>
                          <div className="mt-1 flex items-center gap-1 text-md capitalize text-neutral-900">
                            <img src={getInstrumentIcon(r.instrument || "")} className="h-6 w-6 object-contain" alt={`${r.instrument || "instrument"} icon`} />
                            {r.instrument || "-"}
                          </div>
                        </td>
                        <td className="p-3 text-[#0F172A]">{r.pkg}</td>
                        <td className="p-3 text-[#0F172A]">{r.price}</td>
                        <td className="p-3 text-[#0F172A]">{r.date}</td>
                        <td className="p-3">
                          <span className={cls("text-sm font-medium", getStatusColor(r.status))}>{r.status || "-"}</span>
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--secondary-color)] px-3 text-sm text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                            onClick={() => navigate(`/dashboard-admin/invoice/${r.uuid}`)}
                          >
                            <RiDownloadLine className="text-[18px]" />
                            Invoice
                          </button>
                        </td>
                      </tr>
                    )
                  )}

                  {!isLoading && normalized.length === 0 && (
                    <tr>
                      <td colSpan={tab === "modul" ? 8 : 7} className="p-6 text-center text-sm text-[#6A7B98]">
                        Tidak ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  className="grid h-9 w-9 place-items-center rounded-lg text-[#0F172A] hover:bg-[var(--secondary-light-color)] disabled:opacity-40"
                  disabled={tx.page === 1 || isLoading}
                  onClick={onPrev}
                  aria-label="Sebelumnya"
                  title="Sebelumnya"
                >
                  <RiArrowLeftSLine className="text-xl" />
                </button>

                {Array.from({ length: pages }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => onGoto(p)}
                      disabled={isLoading}
                      className={cls(
                        "min-w-9 h-9 rounded-lg border border-[var(--secondary-color)] px-3 text-sm text-[#0F172A] hover:bg-[var(--secondary-light-color)]",
                        p === tx.page && "border-[var(--primary-color)] bg-[var(--secondary-color)]/20 font-medium"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  className="grid h-9 w-9 place-items-center rounded-lg text-[#0F172A] hover:bg-[var(--secondary-light-color)] disabled:opacity-40"
                  disabled={tx.page === pages || isLoading}
                  onClick={onNext}
                  aria-label="Berikutnya"
                  title="Berikutnya"
                >
                  <RiArrowRightSLine className="text-xl" />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Overlays */}
      <InfoOverlay open={infoOpen} mode={netOnly ? "bersih" : "kotor"} onClose={() => setInfoOpen(false)} />
      <MonthRangeOverlay
        open={rangeOpen}
        initialLabel={rangeLabel}
        onApply={(lbl) => {
          setRangeLabel(lbl);
          setRangeOpen(false);
        }}
        onClose={() => setRangeOpen(false)}
      />
    </>
  );
};

export default AdminEarningsPage;
