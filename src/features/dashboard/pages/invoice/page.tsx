// src/features/dashboard/pages/invoice/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo } from 'react';
import {
  useLocation,
  useParams,
  useSearchParams,
  useNavigate,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTxByPromoThunk,
  fetchAllTxThunk,
  getTxDetailThunk,
} from '@/features/slices/transaksi/slice';
import guruMusik from '@/assets/images/gurumusik.png';

/* ===================== Utils ===================== */
const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const mapStatus = (raw?: string) => {
  const s = String(raw || '').toLowerCase();
  if (s === 'success' || s === 'lunas') return 'Success';
  if (s === 'pending' || s === 'menunggu_pembayaran' || s === 'on progress') return 'On Progress';
  if (s === 'expired') return 'Expired';
  if (s === 'failed' || s === 'gagal') return 'Failed';
  return 'Canceled';
};

/* ===================== Skeleton ===================== */
const SkBar = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-neutral-200/80 ${className}`} />
);

const SkeletonInvoice = ({ transaksiId }: { transaksiId: number }) => (
  <section className="min-h-screen bg-white px-4 sm:px-6 py-8 grid place-items-center">
    <div className="invoice-container mx-auto w-full max-w-4xl bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <SkBar className="h-[35px] w-[35px] rounded-lg" />
          <SkBar className="h-6 w-40" />
        </div>
        <div className="text-left sm:text-right w-full sm:w-64">
          <SkBar className="h-5 w-24 ml-0 sm:ml-auto" />
          <SkBar className="h-4 w-40 mt-2 ml-0 sm:ml-auto" />
          <SkBar className="h-4 w-36 mt-2 ml-0 sm:ml-auto" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between mt-8 gap-6 sm:gap-8">
        <div className="flex-1">
          <SkBar className="h-4 w-48" />
          <div className="mt-3 space-y-2">
            <SkBar className="h-4 w-80" />
            <SkBar className="h-4 w-60" />
          </div>
        </div>
        <div className="flex-1">
          <SkBar className="h-4 w-20" />
          <div className="mt-3 space-y-2">
            <SkBar className="h-4 w-72" />
            <SkBar className="h-4 w-56" />
            <SkBar className="h-4 w-48" />
            <SkBar className="h-4 w-64" />
          </div>
        </div>
      </div>

      <div className="mt-10 -mx-4 sm:mx-0">
        <div className="bg-neutral-200">
          <div className="grid grid-cols-4 gap-4 p-4">
            <SkBar className="h-4 w-24" />
            <SkBar className="h-4 w-16" />
            <SkBar className="h-4 w-28" />
            <SkBar className="h-4 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 p-4">
          <SkBar className="h-4 w-56" />
          <SkBar className="h-4 w-28" />
          <SkBar className="h-4 w-48" />
          <SkBar className="h-4 w-24" />
        </div>
        <div className="mx-4 sm:mx-0 mt-2 border-t border-neutral-300" />
      </div>

      <div className="px-4 sm:px-0 py-5 ml-auto w-full sm:w-1/2 lg:w-1/3">
        <SkBar className="h-5 w-40" />
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <SkBar className="h-4 w-24" />
            <SkBar className="h-4 w-28" />
          </div>
          <div className="flex items-center justify-between">
            <SkBar className="h-4 w-24" />
            <SkBar className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <SkBar className="h-4 w-16" />
            <SkBar className="h-4 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <SkBar className="h-5 w-28" />
            <SkBar className="h-6 w-32" />
          </div>
        </div>
        <SkBar className="h-3 w-64 mt-3" />
      </div>

      <div className="no-print mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SkBar className="h-12 w-full sm:w-44 rounded-full" />
        <SkBar className="h-12 w-full sm:w-40 rounded-full" />
        <SkBar className="h-12 w-full sm:w-40 rounded-full" />
      </div>

      <div className="sr-only">Memuat invoice #{transaksiId}…</div>
    </div>
  </section>
);

/* ===================== Page ===================== */
const InvoicePage: React.FC = () => {
  const { id = '' } = useParams();
  const transaksiId = Number(id);
  const dispatch = useDispatch();
  const location = useLocation();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  // promoId opsional (tetap dipakai hanya untuk sumber data fetch, BUKAN untuk logika harga)
  const promoIdFromQuery = search.get('promoId');
  const promoIdFromState = (location.state as any)?.promoId;
  const promoId = promoIdFromQuery ?? promoIdFromState ?? null;

  // Slice (bisa mounted sbg transaksiByPromo atau transaksi)
  const txState = useSelector((s: any) => s.transaksi ?? s.transaksiByPromo ?? {});
  const {
    status = 'idle',
    error = null,
    allStatus = 'idle',
    allError = null,
    detail,
    detailStatus = 'idle',
  } = txState;

  // Pilih sumber list untuk lookup awal
  const list: any[] = useMemo(
    () =>
      promoId
        ? (Array.isArray(txState.items) ? txState.items : Array.isArray(txState.data) ? txState.data : [])
        : (Array.isArray(txState.allItems) ? txState.allItems
            : Array.isArray(txState.items) ? txState.items
            : Array.isArray(txState.data) ? txState.data
            : []),
    [txState, promoId]
  );

  // Loading / Error flag (hanya untuk UX, tidak mempengaruhi kalkulasi)
  const isLoading = promoId ? status === 'loading' : (allStatus === 'loading' || detailStatus === 'loading');
  const errMsg    = promoId ? (error as string | null) : (allError as string | null);

  // Fetch data: byPromo jika ada promoId, selain itu ambil list umum; fallback ke detail jika belum ketemu
  useEffect(() => {
    if (!Number.isFinite(transaksiId)) return;

    if (promoId) {
      dispatch(
        fetchTxByPromoThunk({
          promoId,
          params: { page: 1, limit: 50, q: String(transaksiId), range: 'ALL' },
        }) as any
      );
    } else {
      dispatch(fetchAllTxThunk({ page: 1, limit: 100, q: '' }) as any);
    }
  }, [dispatch, transaksiId, promoId]);

  const rowFromList = useMemo(
    () => (Array.isArray(list) ? list.find((t: any) => Number(t?.id) === transaksiId) : null),
    [list, transaksiId]
  );

  useEffect(() => {
    if (rowFromList) return;
    if (!promoId && (allStatus === 'succeeded' || allStatus === 'failed')) {
      dispatch(getTxDetailThunk({ id: transaksiId }) as any);
    }
  }, [dispatch, promoId, rowFromList, allStatus, transaksiId]);

  // Adapt detail → bentuk list item (kalau perlu)
  const rowFromDetail = useMemo(() => {
    if (!detail || !detail.transaksi) return null;
    const trx = detail.transaksi;
    const sum = detail.summary || ({} as any);
    const pricing = detail.pricing || ({} as any);

    const adapted: any = {
      id: Number(trx.id),
      type: sum?.module ? 'Modul' : 'Kursus',
      student: {
        id: sum?.student?.id,
        name: sum?.student?.name,
        email: sum?.student?.email ?? null,
        phone: sum?.student?.phone ?? null,
        no_telp: sum?.student?.phone ?? null,
        alamat: sum?.student?.city ?? null,
        avatar: sum?.student?.avatar ?? null,
      },
      teacher: sum?.teacher ? { id: sum.teacher.id, name: sum.teacher.name } : null,
      instrument: sum?.instrument
        ? { id: sum.instrument.id, name: sum.instrument.name, icon: sum.instrument.icon ?? null }
        : null,
      paket: sum?.paket ? { id: sum.paket.id, name: sum.paket.name, sessions: sum.paket.sessions } : null,
      module: sum?.module
        ? { id: sum.module.id, title: sum.module.title, type: sum.module.type, thumbnail: sum.module.thumbnail }
        : null,
      program: sum?.program ? { id: sum.program.id, name: sum.program.name } : null,

      promo: trx?.promo ?? sum?.promo ?? null,

      // Net price (total dibayar)
      price: Number(pricing?.total ?? 0),
      date: trx?.tanggal_transaksi,
      status: trx?.status,
      status_label: mapStatus(trx?.status),

      // pricing untuk kalkulasi unified
      _pricing: {
        gross: Number(pricing?.gross ?? pricing?.subtotal ?? 0) || null,
        discount_amount: (pricing?.discount_amount ?? pricing?.discount) != null
          ? Number(pricing?.discount_amount ?? pricing?.discount)
          : null,
        discount_percent: Number(pricing?.discount_percent ?? pricing?.percent ?? NaN),
        fees: Number(pricing?.fees ?? 0),
        tax_amount: Number(pricing?.tax_amount ?? 0),
        code: pricing?.discount_code ?? pricing?.code ?? null,
      },

      invoice: null,
    };

    return adapted;
  }, [detail]);

  const row: any = rowFromList || rowFromDetail;

  // ========= Derivasi (prioritas invoice.*) =========
  const invoice = row?.invoice ?? null;

  const issueDateISO = invoice?.issue_date || row?.date || row?.tanggal_transaksi || '';

  const isModule =
    String(invoice?.category || row?.type || '').toLowerCase() === 'modul';

  // Buyer/bill-to
  const bill = invoice?.bill_to || row?.student || {};
  const buyerName = bill?.name ?? row?.student?.name ?? '-';
  const buyerEmail = bill?.email ?? row?.student?.email ?? '-';
  const buyerPhone = bill?.phone ?? row?.student?.phone ?? row?.student?.no_telp ?? '-';
  const buyerAddress = bill?.city ?? row?.student?.alamat ?? '-';

  // Item
  const invItem = Array.isArray(invoice?.items) && invoice.items.length > 0 ? invoice.items[0] : null;

  const itemName =
    invItem?.name ||
    (isModule
      ? row?.module?.title || 'Modul'
      : `${row?.program?.name || 'Program'}${row?.paket?.name ? ` — ${row.paket.name}` : ''}`) ||
    (isModule ? 'Modul' : 'Program');

  const teacherName = !isModule ? (row?.teacher?.name || '-') : undefined;

  // Instrument (opsional)
  const instrumentName =
    invoice?.context?.instrument?.name ||
    row?.instrument?.name ||
    undefined;

  // Status label
  const statusLabel = mapStatus(
    invoice?.payment?.status_label || row?.status_label || row?.status
  );

  /* ===================== HARGA & PROMO (UNIFIED) ===================== */
  // Sumber kandidat (dipakai SAMA untuk kasus promoId maupun tidak):
  const grossFromInvoice  = Number(invoice?.totals?.gross ?? NaN);
  const discAmtFromInv    = invoice?.totals?.discount_amount != null ? Number(invoice?.totals?.discount_amount) : null;
  const pctFromItem       = Number(invItem?.discount_percent ?? NaN);
  const codeFromItem      = invItem?.discount_code ?? undefined;

  const pricing = row?._pricing || {};
  const grossFromDetail   = Number(pricing?.gross ?? NaN);
  const discAmtFromDetail = pricing?.discount_amount != null ? Number(pricing?.discount_amount) : null;
  const pctFromDetail     = Number(pricing?.discount_percent ?? NaN);
  const codeFromDetail    = pricing?.code ?? undefined;

  const pctFromRowPromo   = Number(row?.promo?.percent ?? NaN);
  const codeFromRowPromo  = row?.promo?.code ?? undefined;

  // Net (dibayar)
  const net = Number(
    invoice?.totals?.net ??
    row?.price ??
    row?.total_harga ??
    0
  );

  // Gross terbaik
  const grossCandidates = [
    Number.isFinite(grossFromInvoice) && grossFromInvoice > 0 ? grossFromInvoice : NaN,
    Number.isFinite(grossFromDetail)  && grossFromDetail  > 0 ? grossFromDetail  : NaN,
  ].filter(Number.isFinite) as number[];

  let gross = grossCandidates.length ? grossCandidates[0] : 0;

  // Persentase terbaik
  const pctCandidates = [
    Number.isFinite(pctFromItem)     ? pctFromItem     : NaN,
    Number.isFinite(pctFromDetail)   ? pctFromDetail   : NaN,
    Number.isFinite(pctFromRowPromo) ? pctFromRowPromo : NaN,
  ].filter(Number.isFinite) as number[];

  const pct = pctCandidates.length ? pctCandidates[0] : NaN;

  // Jika gross kosong tapi ada persen → infer gross dari net
  if ((!gross || gross === 0) && Number.isFinite(pct) && pct > 0 && pct < 100 && net > 0) {
    gross = Math.round(net / (1 - pct / 100));
  }
  if (!gross || gross <= 0) {
    gross = net;
  }

  // Discount amount terbaik
  const discAmtCandidates = [
    discAmtFromInv != null ? discAmtFromInv : null,
    discAmtFromDetail != null ? discAmtFromDetail : null,
  ].filter((v) => v != null) as number[];

  let discountAmount: number;
  if (discAmtCandidates.length) {
    discountAmount = Math.max(0, Number(discAmtCandidates[0]));
  } else if (Number.isFinite(pct) && pct > 0 && pct < 100) {
    discountAmount = Math.max(0, Math.round(gross * (pct / 100)));
  } else {
    discountAmount = Math.max(0, gross - net);
  }

  // Percent untuk tampilan (fallback dari gross & net bila perlu)
  let promoPercentToShow: number;
  if (Number.isFinite(pct) && pct >= 0) {
    promoPercentToShow = Math.max(0, Math.min(99, Math.round(pct)));
  } else if (gross > 0) {
    promoPercentToShow = Math.max(0, Math.min(99, Math.round((1 - net / gross) * 100)));
  } else {
    promoPercentToShow = 0;
  }

  // Kode promo kandidat
  const promoCode =
    codeFromItem ??
    codeFromDetail ??
    codeFromRowPromo ??
    undefined;

  // OUTPUT TERUNIFIKASI (dipakai di semua tampilan)
  const baseBeforePromo = gross;                 // harga kotor (pre-discount)
  const promoValue      = Math.max(0, discountAmount);
  const totalTagihan    = Math.max(0, net);
  const hargaItemDisplay = Math.max(0, baseBeforePromo + promoValue); // sesuai kebijakan kamu

  // Pajak & biaya
  const taxAmount = Number(
    invoice?.totals?.tax_amount ??
    pricing?.tax_amount ??
    0
  );
  const feesAmount = Number(
    invoice?.totals?.fees ??
    pricing?.fees ??
    0
  );

  // Kode Invoice → INV/{ddmmyy}/{Program|Modul}/{id}
  const ddmmyy = useMemo(() => {
    if (!issueDateISO) return '';
    const d = new Date(issueDateISO);
    if (Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}${mm}${yy}`;
  }, [issueDateISO]);

  const invoiceCode = `INV/${ddmmyy}/${isModule ? 'Modul' : 'Program'}/${row?.id ?? transaksiId}`;

  const onDownload = () => {
    const oldTitle = document.title;
    document.title = `${String(invoiceCode).replace(/\//g, '-')}.pdf`;
    window.print();
    setTimeout(() => {
      document.title = oldTitle;
    }, 500);
  };

  /* ===================== Guards ===================== */
  if (!Number.isFinite(transaksiId)) return <div className="p-8">ID invoice tidak valid.</div>;
  if (isLoading && !row) return <SkeletonInvoice transaksiId={transaksiId} />;

  if (!row) {
    return (
      <section className="min-h-screen grid place-items-center px-4">
        <div className="rounded-xl border bg-white px-6 py-5 shadow-sm w-full max-w-lg">
          <div className="font-semibold mb-1">Transaksi tidak ditemukan</div>
          <div className="text-sm text-neutral-600">
            {errMsg || 'Pastikan ID transaksi benar.'}
          </div>
        </div>
      </section>
    );
  }

  /* ===================== View ===================== */
  return (
    <section className="min-h-screen bg-white px-4 sm:px-6 py-8 grid place-items-center">
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .invoice-container { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="invoice-container mx-auto w-full max-w-4xl bg-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={guruMusik} alt="GuruMusik" width={35} height={35} />
            <span className="font-bold text-xl">GuruMusik</span>
          </div>

        <div className="text-left sm:text-right">
            <h1 className="font-bold tracking-wide text-lg">INVOICE</h1>
            <p className="text-md font-medium text-[var(--secondary-color)] break-all">{invoiceCode}</p>
          </div>
        </div>

        {/* Info blok */}
        <div className="flex flex-col sm:flex-row sm:justify-between mt-8 gap-6 sm:gap-8 text-sm sm:text-base">
          <div>
            <p className="font-bold">DITERBITKAN ATAS NAMA</p>
            <p className="mt-2">
              Penjual : <span className="font-medium">PT PRIMAVISTA NADA NUSANTARA</span>
            </p>
            {instrumentName && (
              <p className="mt-1 text-neutral-700">Instrumen : <span className="font-medium">{instrumentName}</span></p>
            )}
          </div>

          <div>
            <p className="font-bold">Untuk</p>
            <div className="mt-2 space-y-1">
              <p>Pembeli : <span className="font-medium">{buyerName}</span></p>
              <p className="break-all">Email : {buyerEmail || '-'}</p>
              <p>No Telepon : {buyerPhone || '-'}</p>
              <p className="break-words">Alamat : {buyerAddress || '-'}</p>
            </div>
          </div>
        </div>

        {/* Tabel ringkas */}
        <div className="mt-10 overflow-hidden">
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <table className="min-w-[640px] w-full table-auto text-sm sm:text-base">
              <thead className="bg-neutral-200 text-neutral-900">
                <tr className="font-semibold">
                  <th className="p-4 text-left">{isModule ? 'Modul' : 'Program'}</th>
                  <th className="p-4 text-left">Harga</th>
                  {!isModule && <th className="p-4 text-left">Guru Musik</th>}
                  <th className="p-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4">{itemName}</td>
                  <td className="p-4">{formatIDR(hargaItemDisplay)}</td>
                  {!isModule && <td className="p-4">{teacherName}</td>}
                  <td className="p-4">
                    <span
                      className={
                        statusLabel === 'Success'
                          ? 'text-emerald-600'
                          : statusLabel === 'On Progress'
                          ? 'text-yellow-700'
                          : 'text-rose-600'
                      }
                    >
                      {statusLabel}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Garis */}
          <div className="mx-4 sm:mx-0 mt-2 border-t border-neutral-300" />

          {/* Detail total */}
          <div className="px-4 sm:px-0 py-5 ml-auto w-full sm:w-1/2 lg:w-1/3">
            <p className="font-semibold text-lg">Detail Transaksi</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span>Harga Item</span>
                <span className="tabular-nums">{formatIDR(hargaItemDisplay)}</span>
              </div>

              {promoValue > 0 && (
                <div className="flex items-center justify-between">
                  <span>
                    Promo
                    {promoPercentToShow > 0 || promoCode ? (
                      <> ({promoPercentToShow > 0 ? `${promoPercentToShow}%` : ''}{promoPercentToShow > 0 && promoCode ? ', ' : ''}{promoCode ? promoCode : ''})</>
                    ) : null}
                  </span>
                  <span className="tabular-nums">−{formatIDR(promoValue)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span>Pajak</span>
                <span className="tabular-nums">{formatIDR(taxAmount)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Biaya Lain</span>
                <span className="tabular-nums">{formatIDR(feesAmount)}</span>
              </div>

              <div className="flex items-center justify-between font-semibold">
                <span>Total Tagihan</span>
                <span className="tabular-nums text-xl">{formatIDR(totalTagihan)}</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              Semua biaya sudah termasuk di Total.
            </p>
          </div>
        </div>

        {/* CTA (non-print) */}
        <div className="no-print mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary-color)] px-6 py-4 text-sm sm:text-base font-medium text-black hover:brightness-95 w-full sm:w-auto"
          >
            ← Go To Dashboard
          </button>

          <button
            onClick={onDownload}
            className="rounded-full border px-5 py-4 text-sm sm:text-base hover:bg-neutral-50 w-full sm:w-auto"
          >
            Download PDF
          </button>
        </div>
      </div>
    </section>
  );
};

export default InvoicePage;
