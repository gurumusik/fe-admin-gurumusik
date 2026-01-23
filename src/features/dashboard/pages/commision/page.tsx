/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
  RiCoinsLine,
  RiCalendar2Line,
  RiArrowDownSLine,
  RiArrowRightUpLine,
  RiBarChartFill,
  RiSearchLine,
  RiDownloadLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
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
import { useNavigate } from "react-router-dom";

// redux & api
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  fetchPayoutGuruListThunk,
  selectPayoutGuruState,
} from "@/features/slices/payoutGuru/slice";
import { resolveImageUrl } from "@/services/api/payoutGuru.api";
import type { PayoutGuruDTO } from "@/features/slices/payoutGuru/types";

/* == CONST & UTILS == */
type RecapCard = {
  id: "total" | "teachers" | "requests";
  title: string;
  amount: string | number;
  deltaLabel?: string;
  footer?: string;
  tone: "green" | "primary" | "blue" | "pink";
};

const toneClasses: Record<RecapCard["tone"], { bg: string }> = {
  green: { bg: "bg-[var(--accent-green-light-color)]" },
  primary: { bg: "bg-[var(--primary-light-color)]" },
  blue: { bg: "bg-[var(--secondary-light-color)]" },
  pink: { bg: "bg-[var(--accent-red-light-color)]" },
};

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
    .format(n)
    .replace(",00", "");

// Label UI (opsional)
const MONTH_RANGE = "Jan 2025 - Agu 2025";
const MONTH_LABEL = "Agustus 2025";

// Month helpers
const MONTH_KEYS: Array<
  | "january"
  | "february"
  | "march"
  | "april"
  | "may"
  | "june"
  | "july"
  | "august"
  | "september"
  | "october"
  | "november"
  | "december"
> = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const MONTH_LABELS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

// Custom bar shape: only top border
const TopBorderBar: React.FC<any> = (props) => {
  const { x, y, width, height, fill, borderColor } = props;
  if (width <= 0 || height <= 0) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} opacity={0.6} />
      <line
        x1={x}
        x2={x + width}
        y1={y}
        y2={y}
        stroke={borderColor || fill}
        strokeWidth={2}
      />
    </g>
  );
};

// nice rounding for axis max
function niceMax(n: number) {
  if (!n || n <= 0) return 0;
  const expo = Math.floor(Math.log10(n));
  const base = Math.pow(10, expo);
  return Math.ceil(n / base) * base;
}

/** Legend kustom: payload dibalik urutannya */
const ReversedLegend: React.FC<{ payload?: any[] }> = ({ payload = [] }) => {
  const reversed = [...payload].reverse();
  return (
    <ul className="flex items-center justify-center gap-6 pt-4">
      {reversed.map((entry, idx) => (
        <li
          key={`${entry?.value ?? "legend"}-${idx}`}
          className="flex items-center gap-2 text-sm"
        >
          <span
            className="inline-block w-3.5 h-3.5 rounded-sm"
            style={{ background: (entry as any)?.color ?? "#999" }}
          />
          <span>{(entry as any)?.value}</span>
        </li>
      ))}
    </ul>
  );
};

const AdminCommissionPage: React.FC = () => {
  const navigate = useNavigate();

  /* ------- State: Riwayat Komisi (UI) ------- */
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<"Semua" | "Regular" | "Early">("Semua");

  // server-side pagination (dari slice)
  const dispatch = useAppDispatch();
  const { items, total, page, limit, status, error, recap, recapmonthly } =
    useAppSelector(selectPayoutGuruState);

  // fetch initial & on deps change
  useEffect(() => {
    dispatch(
      fetchPayoutGuruListThunk({
        page,
        limit,
        sort_by: "paid_at",
        sort_dir: "DESC",
        status: "paid", // HANYA yang paid
        type:
          typeFilter === "Semua"
            ? undefined
            : typeFilter === "Regular"
            ? "regular"
            : "early",
        search: search.trim() || undefined,
      })
    );
  }, [dispatch, page, limit, typeFilter, search]);

  // === Build Recap Cards dari response backend ===
  const recapCards: RecapCard[] = useMemo(() => {
    const totalKomisi = recap?.total_komisi ?? 0;
    const jmlGuru = recap?.jumlah_guru ?? 0;
    const jmlPengajuan = recap?.jumlah_pengajuan ?? 0;

    return [
      {
        id: "total",
        title: "Total Komisi",
        amount: formatRupiah(totalKomisi),
        tone: "green",
      },
      {
        id: "teachers",
        title: "Jumlah Guru",
        amount: jmlGuru,
        tone: "primary",
      },
      {
        id: "requests",
        title: "Jumlah Pengajuan Komisi",
        amount: jmlPengajuan,
        tone: "blue",
      },
    ];
  }, [recap]);

  // === Build CHART DATA dari recapmonthly ===
  const chartData = useMemo(() => {
    const rm =
      (recapmonthly ?? {}) as Record<
        string,
        { total_komisi: number; jumlah_guru: number; jumlah_pengajuan: number }
      >;
    return MONTH_KEYS.map((k, i) => ({
      month: MONTH_LABELS_ID[i],
      total_komisi: Number(rm[k]?.total_komisi ?? 0),
      // jumlah_guru per-bulan (distinct guru dibayar bulan itu) → dari backend
      jumlah_guru: Number(rm[k]?.jumlah_guru ?? 0),
    }));
  }, [recapmonthly]);

  // Axis ranges (dinamis)
  const leftMax = useMemo(
    () => niceMax(Math.max(0, ...chartData.map((d) => d.total_komisi))),
    [chartData]
  );
  const leftTicks = useMemo(() => {
    const steps = 5;
    const max = leftMax || 5_000_000;
    return Array.from({ length: steps + 1 }, (_, i) =>
      Math.round((max / steps) * i)
    );
  }, [leftMax]);

  const rightMax = useMemo(() => {
    const m = Math.max(0, ...chartData.map((d) => d.jumlah_guru));
    const rounded = Math.max(5, Math.ceil(m / 5) * 5);
    return rounded;
  }, [chartData]);
  const rightTicks = useMemo(() => {
    const steps = 5;
    const max = rightMax;
    return Array.from({ length: steps + 1 }, (_, i) =>
      Math.round((max / steps) * i)
    );
  }, [rightMax]);

  // FE safeguard: tetap filter hanya "paid" + cari nama guru
  const filteredRows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((it: PayoutGuruDTO) => {
      if (it.status !== "paid") return false; // guard
      const okType =
        typeFilter === "Semua"
          ? true
          : it.type === (typeFilter === "Regular" ? "regular" : "early");
      const okSearchGuru =
        !s || (it.guru?.nama ?? "").toLowerCase().includes(s);
      return okType && okSearchGuru;
    });
  }, [items, typeFilter, search]);

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const current = page;

  return (
    <div className="space-y-6">
      {/* SECTION: Rekap (pakai recap dari backend) */}
      <section className="rounded-2xl bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-full"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              <RiCoinsLine size={24} className="text-black" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Rekap Komisi
            </h3>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-3xl border border-[var(--secondary-light-color)] bg-white px-4 text-sm text-[#0F172A] hover:bg-[var(--secondary-light-color)]"
          >
            <RiCalendar2Line
              size={22}
              className="text-[var(--secondary-color)]"
            />
            <span>{MONTH_LABEL}</span>
            <RiArrowDownSLine size={22} />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {recapCards.map((c) => (
              <div
                key={c.id}
                className={cls(
                  "relative rounded-2xl p-4 sm:p-5",
                  toneClasses[c.tone].bg
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-md text-[#0B1220]">{c.title}</p>
                </div>

                <div className="mt-2 flex items-start justify-between">
                  <div>
                    <div className="text-[20px] font-bold leading-tight text-[#0B122A] sm:text-[22px]">
                      {c.amount}
                    </div>
                    {c.deltaLabel && (
                      <div className="mt-1 inline-flex items-center text-sm text-[var(--accent-green-color)]">
                        <RiArrowRightUpLine size={18} />
                        <span>{c.deltaLabel}</span>
                      </div>
                    )}
                  </div>

                  <div className="self-end">
                    {c.id === "requests" && (
                      <button
                        onClick={() =>
                          navigate(
                            "/dashboard-admin/tutor-commision/cashout-verification"
                          )
                        }
                        className="rounded-xl mt-3 border border-[var(--secondary-color)] px-3 py-2 text-sm font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                      >
                        Lihat Request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {status === "loading" && (
              <div className="col-span-full text-sm text-[#6A7B98]">
                Memuat rekap…
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION: Performa (pakai recapmonthly) */}
      <section className="rounded-2xl bg-white">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-full"
              style={{ backgroundColor: "var(--accent-green-color)" }}
            >
              <RiBarChartFill size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Ringkasan Komisi Guru Musik
            </h3>
          </div>

          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--secondary-light-color)] bg-white px-3 text-sm text-[#0F172A] hover:bg-[var(--secondary-light-color)]"
          >
            <RiCalendar2Line
              size={20}
              className="text-[var(--secondary-color)]"
            />
            <span>{MONTH_RANGE}</span>
            <RiArrowDownSLine className="text-[18px]" />
          </button>
        </div>

        <div className="px-2 pb-4 sm:px-4">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap={18}>
                <CartesianGrid
                  stroke="var(--secondary-light-color)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6B7280", fontSize: 14 }}
                  axisLine={{ stroke: "var(--secondary-light-color)" }}
                  tickLine={false}
                />

                {/* Left axis: Rupiah (total_komisi) */}
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "var(--secondary-light-color)" }}
                  tickLine={false}
                  domain={[0, leftMax || 5_000_000]}
                  ticks={leftTicks}
                  tickFormatter={(v) =>
                    v === 0 ? "0" : `${Math.round((v as number) / 1_000_000)} jt`
                  }
                />

                {/* Right axis: Jumlah Guru */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "var(--secondary-light-color)" }}
                  tickLine={false}
                  domain={[0, rightMax]}
                  ticks={rightTicks}
                  allowDecimals={false}
                />

                <Tooltip
                  cursor={{ fill: "rgba(2,132,199,0.06)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--secondary-light-color)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value: any, name: any, item: any) => {
                    if (item?.dataKey === "total_komisi")
                      return [formatRupiah(value as number), "Total Komisi (Rp)"];
                    if (item?.dataKey === "jumlah_guru")
                      return [value as number, "Jumlah guru (Orang)"];
                    return [value, name];
                  }}
                />

                {/* ⬇️ Gunakan elemen untuk 'content' agar typing aman */}
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: 16 }}
                  iconType="square"
                  content={<ReversedLegend />}
                />

                {/* Hijau: total_komisi */}
                <Bar
                  yAxisId="left"
                  dataKey="total_komisi"
                  name="Total Komisi (Rp)"
                  radius={[6, 6, 0, 0]}
                  fill="var(--accent-green-color)"
                  shape={<TopBorderBar borderColor="var(--accent-green-color)" />}
                />

                {/* Kuning: jumlah_guru */}
                <Bar
                  yAxisId="right"
                  dataKey="jumlah_guru"
                  name="Jumlah guru (Orang)"
                  radius={[6, 6, 0, 0]}
                  fill="var(--warning-color, #F59E0B)"
                  shape={
                    <TopBorderBar borderColor="var(--warning-color, #F59E0B)" />
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION: Riwayat Komisi (PAID ONLY + TYPE MAPPING) */}
      <section className="rounded-2xl bg-white">
        {/* Header & Filters */}
        <div className="px-4 sm:px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              Riwayat Komisi
            </h3>

            <div className="flex items-center gap-2 w-4/5 justify-end">
              <div className="relative w-1/2">
                <RiSearchLine
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A7B98]"
                  size={18}
                />
                <input
                  value={search}
                  onChange={(e) => {
                    dispatch(
                      fetchPayoutGuruListThunk({
                        page: 1,
                        limit,
                        sort_by: "paid_at",
                        sort_dir: "DESC",
                        status: "paid", // tetap paid
                        type:
                          typeFilter === "Semua"
                            ? undefined
                            : typeFilter === "Regular"
                            ? "regular"
                            : "early",
                        search: e.target.value,
                      })
                    );
                    setSearch(e.target.value);
                  }}
                  className="w-full h-11 rounded-xl border border-[var(--secondary-light-color)] pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
                  placeholder="Cari Guru"
                />
              </div>

              <button
                onClick={() => {
                  const next =
                    typeFilter === "Semua"
                      ? "Regular"
                      : typeFilter === "Regular"
                      ? "Early"
                      : "Semua";
                  dispatch(
                    fetchPayoutGuruListThunk({
                      page: 1,
                      limit,
                      sort_by: "paid_at",
                      sort_dir: "DESC",
                      status: "paid", // tetap paid
                      type:
                        next === "Semua"
                          ? undefined
                          : next === "Regular"
                          ? "regular"
                          : "early",
                      search: search.trim() || undefined,
                    })
                  );
                  setTypeFilter(next);
                }}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--secondary-light-color)] bg-white px-4 text-sm hover:bg-[var(--secondary-light-color)]"
                title="Klik untuk berganti: Semua → Regular → Early"
              >
                <span>{typeFilter === "Semua" ? "Pilih Tipe" : typeFilter}</span>
                <RiArrowDownSLine size={18} />
              </button>

              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--secondary-light-color)] bg-white px-4 text-sm hover:bg-[var(--secondary-light-color)]"
              >
                <RiCalendar2Line
                  size={18}
                  className="text:[var(--secondary-color)]"
                />
                <span>30 Hari Terakhir</span>
                <RiArrowDownSLine size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-4 sm:px-5 pb-4">
          <div className="overflow-x-auto rounded-2xl border border-[var(--secondary-light-color)]">
            <table className="min-w-full text-md">
              <thead className="bg-[#F1F5F9] text-[#0B1220]">
                <tr className="text-left">
                  <th className="py-3 pl-4 pr-3 font-semibold">Profile</th>
                  <th className="py-3 px-3 font-semibold">Nama Guru</th>
                  <th className="py-3 px-3 font-semibold">Tipe</th>
                  <th className="py-3 px-3 font-semibold">Komisi</th>
                  <th className="py-3 px-3 font-semibold">Tanggal</th>
                  <th className="py-3 pr-4 pl-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {status === "loading" && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6A7B98]">
                      Memuat...
                    </td>
                  </tr>
                )}

                {status !== "loading" && filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6A7B98]">
                      {error ? `Gagal memuat: ${error}` : "Tidak ada data."}
                    </td>
                  </tr>
                )}

                {status !== "loading" &&
                  filteredRows.map((r) => {
                    const foto = resolveImageUrl(r.guru?.profile_pic_url ?? null);
                    const nama = r.guru?.nama ?? `Guru #${r.id_guru}`;
                    const tipeLabel = r.type === "early" ? "Pengajuan" : "Otomatis";
                    const komisi = r.amount == null ? "-" : formatRupiah(r.amount);
                    const tanggal = r.paid_at ? new Date(r.paid_at).toLocaleDateString("id-ID") : "-";

                    // ⬇️ NEW: boleh unduh slip hanya jika ada transfer_reference
                    const canDownloadSlip =
                      !!(r.transfer_reference && String(r.transfer_reference).trim());

                    return (
                      <tr key={r.id} className="border-t border-[var(--secondary-light-color)]">
                        <td className="py-3 pl-4 pr-3">
                          {foto ? (
                            <img src={foto} alt={nama} className="h-12 w-12 rounded-full object-cover" />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-slate-200" />
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#0B1220]">{nama}</td>
                        <td className="py-3 px-3">{tipeLabel}</td>
                        <td className="py-3 px-3">{komisi}</td>
                        <td className="py-3 px-3">{tanggal}</td>
                        <td className="py-3 pr-4 pl-3">
                          <button
                            className={cls(
                              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                              canDownloadSlip
                                ? "border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                                : "border-slate-300 text-slate-400 cursor-not-allowed opacity-60"
                            )}
                            onClick={() => {
                              if (!canDownloadSlip) return;
                              /* TODO: download slip by r.files?. */
                            }}
                            title={
                              canDownloadSlip
                                ? "Unduh Slip Komisi"
                                : "Slip belum tersedia (transfer reference belum ada)"
                            }
                            disabled={!canDownloadSlip}
                          >
                            <RiDownloadLine />
                            <span>Slip Komisi</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination (server-side) */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              className="disabled:opacity-50"
              onClick={() =>
                dispatch(
                  fetchPayoutGuruListThunk({
                    page: Math.max(1, current - 1),
                    limit,
                    sort_by: "paid_at",
                    sort_dir: "DESC",
                    status: "paid",
                    type:
                      typeFilter === "Semua"
                        ? undefined
                        : typeFilter === "Regular"
                        ? "regular"
                        : "early",
                    search: search.trim() || undefined,
                  })
                )
              }
              disabled={current <= 1}
              aria-label="Sebelumnya"
            >
              <RiArrowLeftSLine size={20} />
            </button>

            <span className="px-2 text-sm">
              {current} / {pageCount}
            </span>

            <button
              className="h-9 w-9 rounded-full border border-[var(--secondary-light-color)] disabled:opacity-50"
              onClick={() =>
                dispatch(
                  fetchPayoutGuruListThunk({
                    page: Math.min(pageCount, current + 1),
                    limit,
                    sort_by: "paid_at",
                    sort_dir: "DESC",
                    status: "paid",
                    type:
                      typeFilter === "Semua"
                        ? undefined
                        : typeFilter === "Regular"
                        ? "regular"
                        : "early",
                    search: search.trim() || undefined,
                  })
                )
              }
              disabled={current >= pageCount}
              aria-label="Berikutnya"
            >
              <RiArrowRightSLine size={20} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminCommissionPage;
