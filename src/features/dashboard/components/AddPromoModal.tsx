import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  RiCalendar2Line, RiCloseLine, RiBold, RiItalic, RiUnderline,
  RiListUnordered, RiListOrdered, RiLink, RiCodeLine,
  RiArrowGoBackLine, RiArrowGoForwardLine, RiStrikethrough
} from 'react-icons/ri';

export type AddPromoPayload = {
  code: string;           // Kode promo
  title: string;          // Judul Promo -> promo.title
  notesHtml: string;      // Deskripsi Promo (HTML) -> promo.notes
  bannerHeadline: string; // Banner Headline -> promo.headline_text
  discountPct: number;    // persentase_diskon
  maxUsage: number;       // Kuota Kupon -> promo.max_usage
  startDate: string;      // yyyy-MM-dd -> promo.started_at
  endDate: string;        // yyyy-MM-dd -> promo.expired_at
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddPromoPayload) => void;

  /** opsional untuk edit/prefill */
  initial?: Partial<AddPromoPayload>;
  titleOverride?: string;
  submitLabel?: string;
};

/** execCommand helper */
function cmd(command: string, value?: string) {
  document.execCommand(command, false, value);
}

const AddPromoModal: React.FC<Props> = ({
  open, onClose, onSubmit,
  initial,
  titleOverride,
  submitLabel,
}) => {
  // form states
  const [code, setCode] = useState('');
  const [promoTitle, setPromoTitle] = useState('');         // Judul Promo
  const [bannerHeadline, setBannerHeadline] = useState(''); // Banner Headline
  const [discountPct, setDiscountPct] = useState<string>('');
  const [maxUsage, setMaxUsage] = useState<string>('');     // Kuota Kupon
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // WYSIWYG untuk Deskripsi Promo (notes)
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string>('');

  const descPlaceholder =
    'Tulis deskripsi promo. Contoh: Diskon 50% untuk semua kelas tertentu selama periode promo.';

  // Prefill saat open / initial berubah
  useEffect(() => {
    if (!open) return;
    setCode(initial?.code ?? '');
    setPromoTitle(initial?.title ?? '');
    setBannerHeadline(initial?.bannerHeadline ?? '');
    setDiscountPct(
      initial?.discountPct != null ? String(initial.discountPct) : ''
    );
    setMaxUsage(
      initial?.maxUsage != null ? String(initial.maxUsage) : ''
    );
    setStartDate(initial?.startDate ?? '');
    setEndDate(initial?.endDate ?? '');
    setHtml(initial?.notesHtml ?? '');

    // isi editor innerHTML saat prefill
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = initial?.notesHtml ?? '';
    });
  }, [open, initial]);

  // reset ketika ditutup
  useEffect(() => {
    if (!open) {
      setCode('');
      setPromoTitle('');
      setBannerHeadline('');
      setDiscountPct('');
      setMaxUsage('');
      setStartDate('');
      setEndDate('');
      setHtml('');
    }
  }, [open]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const endDateTooEarly = useMemo(() => {
    if (!endDate) return false;
    const [yy, mm, dd] = endDate.split('-').map((v) => Number(v));
    if (!yy || !mm || !dd) return false;
    const d = new Date(yy, mm - 1, dd);
    d.setHours(0, 0, 0, 0);
    return d.getTime() <= today.getTime();
  }, [endDate, today]);

  const canSubmit = useMemo(() => {
    const pct = Number(discountPct);
    const quota = Number(maxUsage);
    const cleanHtml = html.replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/g, ' ').trim();
    return (
      code.trim().length > 0 &&
      promoTitle.trim().length > 0 &&
      bannerHeadline.trim().length > 0 &&
      cleanHtml.length > 0 &&
      !Number.isNaN(pct) && pct > 0 &&
      !Number.isNaN(quota) && quota > 0 &&
      startDate &&
      endDate &&
      new Date(startDate) <= new Date(endDate) &&
      !endDateTooEarly
    );
  }, [code, promoTitle, bannerHeadline, html, discountPct, maxUsage, startDate, endDate, endDateTooEarly]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="mt-6 w-full max-w-3xl rounded-2xl bg-white p-5 md:p-6 shadow-xl">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">
            {titleOverride ?? 'Tambah Promo'}
          </h3>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-black/5" aria-label="Tutup">
            <RiCloseLine size={22} />
          </button>
        </div>

        <hr className="mb-4 border-black/10" />
        <div className='flex gap-4 items-center justify-between'>
          <div className='w-1/2'> 
            {/* Kode Promo */}
            <label className="mb-2 block text-md font-medium text-neutral-900">Kode Promo</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Masukkan Kode Promo, cth: GURUMUSIK"
              className="mb-4 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
            />
          </div>

          <div className='w-1/2'> 
            {/* Judul Promo */}
            <label className="mb-2 block text-md font-medium text-neutral-900">Judul Promo</label>
            <input
              value={promoTitle}
              onChange={(e) => setPromoTitle(e.target.value)}
              placeholder="Judul promo (cth: Promo Back To School 50%)"
              className="mb-4 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
            />
          </div>
        </div>  

        {/* Deskripsi Promo (notes/WYSIWYG) */}
        <label className="mb-2 block text-md font-medium text-neutral-900">Deskripsi Promo</label>
        <div className="rounded-xl border border-black/15 focus-within:border-(--secondary-color)">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 border-b border-black/10 px-2 py-1.5 text-neutral-700">
            <button type="button" className="rounded p-1.5 hover:bg-black/5" onClick={() => cmd('undo')} title="Undo">
              <RiArrowGoBackLine />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-black/5" onClick={() => cmd('redo')} title="Redo">
              <RiArrowGoForwardLine />
            </button>

            <span className="mx-2 h-5 w-px bg-black/10" />

            <button type="button" className="rounded p-1.5 hover:bg-black/5 font-bold data-[active=true]:bg-black/20" onClick={() => cmd('bold')} title="Bold">
              <RiBold />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-black/5 italic data-[active=true]:bg-black/20" onClick={() => cmd('italic')} title="Italic">
              <RiItalic />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-black/5 underline data-[active=true]:bg-black/20" onClick={() => cmd('underline')} title="Underline">
              <RiUnderline />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-black/5 line-through data-[active=true]:bg-black/20" onClick={() => cmd('strikeThrough')} title="Strikethrough">
              <RiStrikethrough />
            </button>

            <span className="mx-2 h-5 w-px bg-black/10" />

            <button type="button" className="rounded p-1.5 hover:bg-black/5" onClick={() => cmd('insertUnorderedList')} title="Bullet list">
              <RiListUnordered />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-black/5" onClick={() => cmd('insertOrderedList')} title="Numbered list">
              <RiListOrdered />
            </button>

            <span className="mx-2 h-5 w-px bg-black/10" />

            <button
              type="button"
              className="rounded p-1.5 hover:bg-black/5"
              onClick={() => {
                const url = window.prompt('Masukkan URL tautan:');
                if (url) cmd('createLink', url);
              }}
              title="Insert link"
            >
              <RiLink />
            </button>

            <button
              type="button"
              className="rounded p-1.5 hover:bg-black/5"
              onClick={() => cmd('formatBlock', 'pre')}
              title="Code"
            >
              <RiCodeLine />
            </button>
          </div>

          {/* Editable area */}
          <div
            ref={editorRef}
            contentEditable
            onInput={(e) => setHtml((e.target as HTMLDivElement).innerHTML)}
            className="min-h-[130px] whitespace-pre-wrap px-4 py-3 outline-none"
            data-placeholder={descPlaceholder}
          />
        </div>
        <style>
          {`
            [contenteditable][data-placeholder]:empty:before{
              content: attr(data-placeholder);
              color: rgb(100 116 139);
            }
          `}
        </style>

        {/* Banner Headline */}
        <label className="mb-2 block text-md font-medium text-neutral-900">Banner Headline</label>
        <input
          value={bannerHeadline}
          onChange={(e) => setBannerHeadline(e.target.value)}
          placeholder="Teks headline untuk banner. Contoh: Belajar Musik Hemat! Diskon 50% 🎶"
          className="mb-4 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
        />

        <div className='flex gap-4 items-center justify-between'>
          <div className='w-1/2'>
            {/* Besar Promo */}
            <label className="mb-2 block text-md font-medium text-neutral-900">Besar Promo</label>
            <input
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="Masukkan Besaran Promo Dalam Persen, cth: 50"
              className="mb-4 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
            />
          </div>
          {/* Kuota */}
          <div className='w-1/2'> 
            <label className="mb-2 block text-md font-medium text-neutral-900">Kuota Kupon</label>
            <input
              value={maxUsage}
              inputMode="numeric"
              onChange={(e) => setMaxUsage(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="Masukkan kuota kupon (contoh: 1000)"
              className="mb-4 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
            />
          </div>
        </div>
        
        {/* Tanggal */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-md font-medium text-neutral-900">Tanggal Awal</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--secondary-color)">
                <RiCalendar2Line size={20} />
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full appearance-none rounded-xl border border-black/15 bg-white py-3 pl-10 pr-9 text-neutral-900 outline-none focus:border-(--secondary-color)"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">▾</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-md font-medium text-neutral-900">Tanggal Akhir</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--secondary-color)">
                <RiCalendar2Line size={20} />
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={[
                  "w-full appearance-none rounded-xl border bg-white py-3 pl-10 pr-9 text-neutral-900 outline-none focus:border-(--secondary-color)",
                  endDateTooEarly ? "border-red-400" : "border-black/15",
                ].join(" ")}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">▾</span>
            </div>
            {endDateTooEarly && (
              <div className="mt-1 text-sm text-red-500">
                Tanggal berakhir promo harus lebih dari hari ini!
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              code: code.trim(),
              title: promoTitle.trim(),
              notesHtml: html,
              bannerHeadline: bannerHeadline.trim(),
              discountPct: Number(discountPct),
              maxUsage: Number(maxUsage),
              startDate,
              endDate,
            })
          }
          className="mt-6 w-full rounded-xl bg-(--primary-color) px-4 py-3 text-center text-md font-semibold text-black disabled:opacity-50"
        >
          {submitLabel ?? 'Tambah Promo'}
        </button>
      </div>
    </div>
  );
};

export default AddPromoModal;
