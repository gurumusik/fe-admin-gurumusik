/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/module/pages/EditModulePage.tsx
'use client';

import React, { useMemo, useRef, useState, useEffect, useRef as useRefAlias } from 'react';
import {
  RiMusic2Line, RiLinkM, RiUpload2Line, RiImage2Fill, RiAddLine, RiPlayCircleLine, RiCoinsLine,
  RiUploadCloudLine, RiArrowLeftLine, RiArrowGoBackLine, RiArrowGoForwardLine, RiBold, RiItalic,
  RiUnderline, RiStrikethrough, RiListUnordered, RiListOrdered, RiLink, RiCodeLine,
} from 'react-icons/ri';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

import type { ModuleForm, UploadItem, OwnerRouteState } from '@/features/slices/module/types';

// redux
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/store';
import { fetchGuruByIdThunk } from '@/features/slices/guru/slice';
import {
  fetchModuleAdminDetailThunk,
  saveModuleAdminThunk,
} from '@/features/slices/module/detailSlice';
import defaultUser from '@/assets/images/default-ebook.jpeg';

/* ================== utils ================== */
const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');
const nfIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const toNumber = (s: string) => {
  const n = Number(String(s).replace(/[^\d]/g, ''));
  return Number.isNaN(n) ? '' : n;
};
const padArray = (arr: string[], min = 3) => { const c = [...arr]; while (c.length < min) c.push(''); return c; };
const toInstrumentOption = (nama?: string | null) => (nama ? nama.toLowerCase() : '');

/* ================== WYSIWYG ================== */
function cmd(command: string, value?: string) { document.execCommand(command, false, value); }
const Wysiwyg: React.FC<{ value: string; onChange: (html: string) => void; placeholder?: string; }> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value || ''; }, [value]);
  return (
    <div className="rounded-xl border border-black/15 focus-within:border-(--secondary-color)">
      <div className="flex flex-wrap items-center gap-1 border-b border-black/10 px-2 py-1.5 text-neutral-700">
        <button type="button" className="rounded p-1.5 hover:bg-black/5" onClick={() => cmd('undo')} title="Undo"><RiArrowGoBackLine /></button>
        <button type="button" className="rounded p-1.5 hover:bg-black/5" onClick={() => cmd('redo')} title="Redo"><RiArrowGoForwardLine /></button>
        <span className="mx-2 h-5 w-px bg-black/10" />
        <button type="button" className="rounded p-1.5 hover:bg-black/5 font-bold" onClick={() => cmd('bold')} title="Bold"><RiBold /></button>
        <button type="button" className="rounded p-1.5 hover:bg-black/5 italic" onClick={() => cmd('italic')} title="Italic"><RiItalic /></button>
        <button type="button" className="rounded p-1.5 hover:bg-black/5 underline" onClick={() => cmd('underline')} title="Underline"><RiUnderline /></button>
        <button type="button" className="rounded p-1.5 hover:bg-black/5 line-through" onClick={() => cmd('strikeThrough')} title="Strikethrough"><RiStrikethrough /></button>
        <span className="mx-2 h-5 w-px bg-black/10" />
        <button type="button" className="rounded p-1.5 hover:bg-black/5" onClick={() => cmd('insertUnorderedList')} title="Bullet list"><RiListUnordered /></button>
        <button type="button" className="rounded p-1.5 hover:bg-black/5" onClick={() => cmd('insertOrderedList')} title="Numbered list"><RiListOrdered /></button>
        <span className="mx-2 h-5 w-px bg-black/10" />
        <button type="button" className="rounded p-1.5 hover:bg-black/5" onClick={() => { const url = window.prompt('Masukkan URL tautan:'); if (url) cmd('createLink', url); }} title="Insert link"><RiLink /></button>
        <button type="button" className="rounded p-1.5 hover:bg-black/5" onClick={() => cmd('formatBlock', 'pre')} title="Code"><RiCodeLine /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData('text/plain'); document.execCommand('insertText', false, text); }}
        className="min-h-[180px] whitespace-pre-wrap px-4 py-3 outline-none"
        data-placeholder={placeholder || 'Tulis deskripsi modul…'}
      />
      <style>{`[contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:rgb(100 116 139);}`}</style>
    </div>
  );
};

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-md font-semibold text-neutral-900">{label}</div>
      <div className="relative">{icon ? <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">{icon}</span> : null}{children}</div>
    </label>
  );
}

/* ====== Tiles ====== */
function PDFTile({ src, footer }: { src: string; footer?: React.ReactNode }) {
  return (
    <div className="relative rounded-xl bg-neutral-100 p-1">
      <object
        data={`${src}#page=1&zoom=100&toolbar=0&navpanes=0&scrollbar=0`}
        type="application/pdf"
        className="h-24 w-32 rounded-lg bg-white"
      >
        <iframe
          src={`${src}#page=1&zoom=100&toolbar=0&navpanes=0&scrollbar=0`}
          className="h-24 w-32 rounded-lg bg-white"
          title="pdf"
        />
      </object>
      {footer ? <div className="mt-1 text-[10px] text-center text-neutral-600">{footer}</div> : null}
    </div>
  );
}

function PreviewTile({ src, mime, footer }: { src: string; mime?: string; footer?: React.ReactNode }) {
  const isImage = (mime && mime.startsWith('image/')) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(src || '');
  return (
    <div className="relative rounded-xl bg-neutral-100 p-1">
      {isImage ? (
        <img src={src} alt="preview" className="h-24 w-32 rounded-lg object-cover bg-white" />
      ) : (
        <div className="h-24 w-32 rounded-lg grid place-items-center bg-white text-[10px] text-neutral-500">
          {mime || 'file'}
        </div>
      )}
      {footer ? <div className="mt-1 text-[10px] text-center text-neutral-600">{footer}</div> : null}
    </div>
  );
}

/* ================== Page ================== */
export default function EditModulePage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: OwnerRouteState };
  const { id } = useParams<{ id: string }>();

  // redux
  const dispatch = useDispatch<AppDispatch>();
  const guru = useSelector((s: RootState) => (s as any).guruDetail ?? { item: null, status: 'idle', error: null });
  const {
    item: detail,
    status: detailStatus,
    error: detailError,
    saving,
    saveError,
    lastSavedAt,
  } = useSelector((s: RootState) => (s as any).moduleAdminDetail ?? {
    item: null, status: 'idle', error: null, saving: false, saveError: null, lastSavedAt: null,
  });

  // teacherId dari modul → trigger fetch guru
  const [teacherId, setTeacherId] = useState<number | null>(null);

  const headerGuru = detail?.guru ?? null;

  // header: fallback ke route state saat belum ada guru dari redux
  const ownerName =
    headerGuru?.nama
    ?? guru.item?.nama
    ?? state?.ownerName
    ?? '—';

  const ownerId =
    headerGuru?.ucode
    ?? (headerGuru?.id != null ? `#${headerGuru.id}` : undefined)
    ?? (guru.item?.id != null ? `#${guru.item.id}` : undefined)
    ?? state?.ownerId
    ?? '';

  const ownerAvatar =
    headerGuru?.profile_pic_url
    ?? guru.item?.profile_pic_url
    ?? state?.avatar
    ?? defaultUser;

  const [form, setForm] = useState<ModuleForm>({
    title: '', basePrice: '', salePrice: '', promoPrice: '', instrument: '',
    previewUrl: '', description: '', audience: '', playlists: ['', '', ''],
    thumbnail: undefined, clips: [],
  });

  const [thumbServerUrl, setThumbServerUrl] = useState<string>('');
  const thumbUrl = useObjectUrl(form.thumbnail ?? null);

  // ====== e-book state ======
  const [ebooks, setEbooks] = useState<UploadItem[]>([]); // lokal (baru diupload)
  const [ebookIdsToDelete, setEbookIdsToDelete] = useState<number[]>([]);

  // ====== preview (gambar) lokal ======
  const [clipsUp, setClipsUp] = useState<UploadItem[]>([]); // treat as "previews up"

  const maxEbooks = 4;
  const maxClips = 4;

  const serverEbooks = Array.isArray(detail?.ebooks) ? detail!.ebooks : [];
  const serverPreviews = Array.isArray(detail?.previews) ? detail!.previews : [];

  // --- Fetch detail via Redux
  useEffect(() => {
    const numericId = Number(id);
    if (Number.isFinite(numericId)) {
      dispatch(fetchModuleAdminDetailThunk(numericId));
    }
  }, [id, dispatch]);

  // --- Seed form dari detail (sekali per id)
  const seededRef = useRefAlias<{ id?: number }>({ id: undefined });
  useEffect(() => {
    if (!detail) return;
    const numericId = Number(id);
    if (seededRef.current.id === numericId) return; // sudah di-seed

    const playlists = Array.isArray(detail.playlists)
      ? detail.playlists.map((p: { link_playlist: any; }) => p?.link_playlist || '').filter(Boolean)
      : [];

    setForm({
      title: detail.judul ?? '',
      basePrice: typeof detail.harga === 'number' ? detail.harga : '',
      salePrice: typeof detail.harga_bid === 'number' ? detail.harga_bid : '',
      promoPrice: typeof detail.harga_discount === 'number' ? detail.harga_discount : '',
      instrument: toInstrumentOption((detail as any).instrument?.nama),
      previewUrl: detail.preview_class ?? '',
      description: detail.deskripsi ?? '',
      audience: detail.appropriate_module ?? '',
      playlists: padArray(playlists, 3),
      thumbnail: undefined,
      clips: [],
    });

    setThumbServerUrl(detail.thumbnail_path || '');

    if (detail.id_guru != null) setTeacherId(Number(detail.id_guru));
    seededRef.current.id = numericId;
  }, [detail, id, seededRef]);

  // --- Fetch guru setelah tahu teacherId
  useEffect(() => {
    if (teacherId != null && Number.isFinite(teacherId)) {
      dispatch(fetchGuruByIdThunk(teacherId));
    }
  }, [teacherId, dispatch]);

  const onChange =
    <K extends keyof ModuleForm>(key: K) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const v = key === 'basePrice' || key === 'salePrice' || key === 'promoPrice' ? (toNumber(e.target.value) as any) : (e.target.value as any);
        setForm((f) => ({ ...f, [key]: v }));
      };

  const onPickThumbnail = (f?: File | null) => setForm((s) => ({ ...s, thumbnail: f ?? null }));
  const clearThumbnail = () => { setForm((s) => ({ ...s, thumbnail: null })); if (!form.thumbnail) setThumbServerUrl(''); };
  const setPlaylistAt = (i: number, value: string) => setForm((s) => ({ ...s, playlists: s.playlists.map((p, idx) => (idx === i ? value : p)) }));
  const addPlaylist = () => setForm((s) => ({ ...s, playlists: [...s.playlists, ''] }));

  // ====== helper upload progress dummy ======
  const startFakeUpload = (setter: React.Dispatch<React.SetStateAction<UploadItem[]>>, id: string) => {
    let p = 0; const t = setInterval(() => {
      p = Math.min(100, p + Math.floor(10 + Math.random() * 25));
      setter((prev) => prev.map((it) => (it.id === id ? { ...it, progress: p, done: p >= 100 } : it)));
      if (p >= 100) clearInterval(t);
    }, 300);
  };

  // ====== pick e-book (PDF) – hormati kuota dengan memperhitungkan yang akan dihapus ======
  const onPickEbooks = (files: FileList | null) => {
    if (!files) return;

    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    if (!pdfs.length) return;

    const serverCountAfterDelete = Math.max(0, (serverEbooks?.length || 0) - ebookIdsToDelete.length);
    const remaining = Math.max(0, maxEbooks - serverCountAfterDelete - ebooks.length);
    if (remaining <= 0) return;

    const allowed = pdfs.slice(0, remaining);
    const items = allowed.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return { id, file, url: URL.createObjectURL(file), progress: 0, done: false } as UploadItem;
    });

    setEbooks((prev) => [...prev, ...items]);
    items.forEach((it) => startFakeUpload(setEbooks, it.id));
  };

  // ====== toggle delete untuk e-book server ======
  const toggleDeleteServerEbook = (ebookId: number) => {
    setEbookIdsToDelete((prev) =>
      prev.includes(ebookId) ? prev.filter((x) => x !== ebookId) : [...prev, ebookId]
    );
  };

  // ====== PREVIEW (image) pick ======
  const onPickPreviews = (files: FileList | null) => {
    if (!files) return;

    const imgs = Array.from(files).filter(f =>
      f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f.name)
    );
    if (!imgs.length) return;

    const remaining = Math.max(0, maxClips - clipsUp.length);
    if (remaining <= 0) return;

    const allowed = imgs.slice(0, remaining);
    const items = allowed.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return { id, file, url: URL.createObjectURL(file), progress: 0, done: false } as UploadItem;
    });

    setClipsUp((prev) => [...prev, ...items]);
    items.forEach((it) => startFakeUpload(setClipsUp, it.id));
  };

  const removeClip = (id: string) => {
    setClipsUp((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.url);
      return prev.filter((x) => x.id !== it!.id);
    });
  };

  useEffect(() => () => { ebooks.forEach((e) => URL.revokeObjectURL(e.url)); clipsUp.forEach((c) => URL.revokeObjectURL(c.url)); }, [ebooks, clipsUp]);

  // ================== SUBMIT ==================
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;

    // file PDF yang selesai di-“upload” (preview) saja
    const ebooksToAppend = ebooks
      .filter(it => it.done && it.file)
      .map(it => it.file as File);

    // file IMAGE cuplikan siap kirim
    const previewFiles = clipsUp
      .filter(it => it.done && it.file)
      .map(it => it.file as File);

    dispatch(
      saveModuleAdminThunk({
        id: numericId,
        form,
        ebookFiles: ebooksToAppend,
        ebookIdsToDelete,
        previewFiles, // <— kirim ke thunk untuk di-convert base64 & create list_preview
      }) as any
    )
      .unwrap()
      .then(() => {
        // reset draft & navigate
        setEbookIdsToDelete([]);
        setEbooks([]);
        setClipsUp([]);
        navigate('/dashboard-admin/module');
      })
      .catch(() => { /* error handled by slice */ });
  };

  const loadingDetail = detailStatus === 'loading';

  return (
    <div className="w-full">
      {/* ===== Header ===== */}
      <header className="sticky top-20 z-40 -m-6 mb-6 px-6 border-t bg-white border-black/10 rounded-b-3xl">
        <div className="py-3 flex items-center justify-between gap-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color)] px-3 py-1.5 text-sm text-[var(--secondary-color)] hover:bg-black/5" type="button">
            <RiArrowLeftLine className="text-lg" /> Kembali
          </button>

          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <img
                src={ownerAvatar}
                alt="owner"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-black/5"
              />
              <div className="flex flex-col">
                <div className="font-semibold text-md text-neutral-900">
                  {ownerName || '—'}
                  {(guru.status === 'loading' || detailStatus === 'loading') && (
                    <span className="ml-2 text-xs text-neutral-500">(memuat…)</span>
                  )}
                </div>
                <span className="text-sm text-neutral-500">{ownerId}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            form="edit-module-form"
            className="rounded-full px-6 py-2 text-sm font-semibold text-black bg-[var(--primary-color)] hover:brightness-95 disabled:opacity-60"
            disabled={loadingDetail || saving || detailStatus !== 'succeeded'}
          >
            {saving ? 'Menyimpan…' : 'Simpan Modul'}
          </button>
        </div>
      </header>

      {/* Loading / Error banner */}
      {loadingDetail && <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">Memuat detail modul…</div>}
      {detailError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{String(detailError)}</div>}
      {saveError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{String(saveError)}</div>}
      {lastSavedAt && !saveError && (
        <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">Perubahan tersimpan.</div>
      )}

      {/* ===== FORM ===== */}
      <form id="edit-module-form" onSubmit={submit} className="w-full">
        <div className="grid gap-6 md:grid-cols-12">
          {/* LEFT */}
          <section className="md:col-span-7 rounded-2xl bg-white p-4 sm:p-5 text-md">
            <div className="grid gap-5">
              <Field label="Judul Modul" icon={<RiPlayCircleLine size={22} />}>
                <input value={form.title} onChange={onChange('title')} placeholder="| Masukkan Judul Modul" className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 focus:bg-neutral-50 focus:outline-none" />
              </Field>
              <Field label="Harga Awal (Modal)" icon={<RiCoinsLine size={22} />}>
                <input value={form.basePrice === '' ? '' : nfIDR(form.basePrice)} onChange={(e) => setForm((f) => ({ ...f, basePrice: toNumber(e.target.value) }))} placeholder="| Rp150.000" inputMode="numeric" className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 focus:bg-neutral-50 focus:outline-none" />
              </Field>
              <Field label="Harga Jual (Normal)" icon={<RiCoinsLine size={22} />}>
                <input value={form.salePrice === '' ? '' : nfIDR(form.salePrice)} onChange={(e) => setForm((f) => ({ ...f, salePrice: toNumber(e.target.value) }))} placeholder="| Harga Normal, cth: 150.000" inputMode="numeric" className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 focus:bg-neutral-50 focus:outline-none" />
              </Field>
              <Field label="Harga Promo (Diskon)" icon={<RiCoinsLine size={22} />}>
                <input value={form.promoPrice === '' ? '' : nfIDR(form.promoPrice)} onChange={(e) => setForm((f) => ({ ...f, promoPrice: toNumber(e.target.value) }))} placeholder="| Harga Diskon, cth: 120.000" inputMode="numeric" className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 focus:bg-neutral-50 focus:outline-none" />
              </Field>
              <Field label="Instrumen Musik" icon={<RiMusic2Line size={22} />}>
                <select value={form.instrument} onChange={onChange('instrument')} className="w-full h-11 pl-10 pr-9 rounded-lg border border-gray-200 focus:bg-neutral-50 focus:outline-none">
                  <option value="" hidden>| Pilih Kategori Musik</option>
                  <option value="gitar">Gitar</option><option value="piano">Piano</option><option value="biola">Biola</option><option value="drum">Drum</option><option value="vokal">Vokal</option>
                </select>
              </Field>
              <Field label="Preview Kelas" icon={<RiLinkM size={22} />}>
                <input value={form.previewUrl} onChange={onChange('previewUrl')} placeholder="| Masukkan link video preview kelas, cth: youtube.com" className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 focus:bg-neutral-50 focus:outline-none" />
              </Field>

              <div>
                <div className="mb-2 text-sm font-semibold text-neutral-800">Tentang Produk</div>
                <Wysiwyg value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} placeholder="Masukkan deskripsi modul…" />
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-neutral-800">Modul Ini Cocok Untuk</div>
                <textarea value={form.audience} onChange={onChange('audience')} rows={4} placeholder="Pisahkan dengan titik koma (;)" className="w-full p-3 rounded-lg border border-gray-200 focus:bg-neutral-50 focus:outline-none" />
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-neutral-800">Tambahkan Module (Playlist)</div>
                <div className="space-y-3">
                  {form.playlists.map((link, idx) => (
                    <input key={idx} value={link} onChange={(e) => setPlaylistAt(idx, e.target.value)} placeholder="Masukkan Link Playlist" className="w-full h-11 px-4 rounded-lg border border-gray-200 focus:bg-neutral-50 focus:outline-none" />
                  ))}
                </div>
                <button type="button" onClick={addPlaylist} className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-blue-50">
                  <RiAddLine /> Tambahkan Link Playlist
                </button>
              </div>

              {/* === Upload E-Book Pendukung === */}
              <div>
                <div className="mb-2 text-sm font-semibold text-neutral-800">Upload E-Book Pendukung</div>
                <EbookDropArea onPick={onPickEbooks} />
                <p className="mt-2 text-xs text-neutral-500">Supported formats: <b>.PDF only</b></p>

                {ebookIdsToDelete.length > 0 && (
                  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {ebookIdsToDelete.length} e-book akan dihapus saat kamu menyimpan modul.
                  </div>
                )}

                {(serverEbooks.length + ebooks.length) > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-sm font-semibold text-neutral-800">
                      Daftar File – {serverEbooks.length + ebooks.length}/{maxEbooks} files
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {serverEbooks.map((eb: any) => {
                        const selected = ebookIdsToDelete.includes(eb.id);
                        return (
                          <div key={`srv-${eb.id}`} className="relative">
                            <PDFTile
                              src={eb.ebook_path || defaultUser}
                              footer={`${eb.total_pages ?? '-'} hlm${eb.pendukung ? ' • Pendukung' : ''}`}
                            />
                            <button
                              type="button"
                              onClick={() => toggleDeleteServerEbook(eb.id)}
                              className={cls(
                                'absolute -top-2 -right-2 h-7 px-2 rounded-full text-xs shadow',
                                selected ? 'bg-red-600 text-white' : 'bg-white text-neutral-700'
                              )}
                              title={selected ? 'Batalkan hapus' : 'Hapus e-book ini'}
                            >
                              {selected ? 'Batal' : 'Hapus'}
                            </button>
                            {selected && (
                              <div className="absolute inset-0 rounded-xl ring-2 ring-red-500/80 pointer-events-none opacity-90" />
                            )}
                          </div>
                        );
                      })}

                      {ebooks.map((it) => (
                        <div key={it.id} className="relative">
                          <PDFTile src={it.url} footer={it.done ? 'Siap disimpan' : 'Mengunggah…'} />
                          <button
                            type="button"
                            onClick={() => {
                              setEbooks((prev) => {
                                const it2 = prev.find((x) => x.id === it.id);
                                if (it2) URL.revokeObjectURL(it2.url);
                                return prev.filter((x) => x.id !== it.id);
                              });
                            }}
                            className="absolute -top-2 -right-2 h-7 w-7 grid place-items-center rounded-full bg-white shadow text-neutral-700"
                            title="Hapus draft upload"
                          >
                            ×
                          </button>
                          {!it.done && (
                            <div className="absolute left-2 right-2 bottom-2 h-2 rounded-full bg-white/70 overflow-hidden">
                              <div className="h-full bg-[var(--accent-green-color)]" style={{ width: `${it.progress}%` }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <aside className="md:col-span-5 md:sticky md:top-6 md:self-start space-y-5">
            <div>
              <div className="mb-2 text-lg font-semibold text-neutral-800">Thumbnail Modul</div>
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-neutral-200">
                {thumbUrl ? <img src={thumbUrl} className="h-full w-full object-cover" /> :
                  thumbServerUrl ? <img src={thumbServerUrl} className="h-full w-full object-cover" /> :
                    <div className="h-full w-full grid place-items-center text-neutral-400"><RiImage2Fill /></div>}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-white border border-[var(--secondary-color)] text-[var(--secondary-color)] cursor-pointer hover:bg-blue-50">
                  <RiUpload2Line /><span>Upload Thumbnail</span>
                  <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" className="hidden" onChange={(e) => onPickThumbnail(e.target.files?.[0] ?? null)} />
                </label>
                {(form.thumbnail || thumbServerUrl) ? (
                  <button type="button" onClick={clearThumbnail} className="text-sm text-neutral-600 hover:text-neutral-800">Hapus</button>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-neutral-500">Supported formats: .JPEG, .PNG, .JPG, .WEBP</p>
            </div>

            {/* ======= Cuplikan Modul (Images only) ======= */}
            <div>
              <div className="mb-2 text-lg font-semibold text-neutral-800">Cuplikan Modul</div>

              {/* Drop area image only */}
              <ImageDropArea onPick={onPickPreviews} />
              <p className="mt-2 text-xs text-neutral-500">Supported formats: .JPG, .PNG, .GIF, .WEBP</p>

              {/* Server previews */}
              {serverPreviews.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-semibold text-neutral-800">Preview cuplikan</div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {serverPreviews.map((pv: any) => (
                      <PreviewTile
                        key={`pv-${pv.id}`}
                        src={pv.file_path}
                        mime={pv.mime_type}
                        footer={`${pv.mime_type?.split('/')[1] || 'img'} • ${formatBytes(pv.file_size || 0)}`}
                      />
                      ))}
                  </div>
                </div>
              )}
              

              {/* Local previews (baru dipilih) */}
              {clipsUp.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-semibold text-neutral-800">Preview Baru (Belum Disimpan)</div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {clipsUp.map((it) => (
                      <div key={it.id} className="relative rounded-xl bg-neutral-100 p-1">
                        <img src={it.url} className="h-24 w-32 rounded-lg object-cover bg-white" />
                        <button
                          type="button"
                          onClick={() => removeClip(it.id)}
                          className="absolute -top-2 -right-2 h-6 w-6 grid place-items-center rounded-full bg-white shadow text-neutral-600"
                          title="Hapus"
                        >
                          ×
                        </button>
                        {!it.done && (
                          <div className="absolute left-2 right-2 bottom-2 h-2 rounded-full bg-white/70 overflow-hidden">
                            <div className="h-full bg-[var(--accent-green-color)]" style={{ width: `${it.progress}%` }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

/* ================== Drop areas & hooks ================== */
function ImageDropArea({ onPick }: { onPick: (files: FileList | null) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onPick(e.dataTransfer.files); }}
      className={cls('w-full rounded-2xl border-2 border-dashed px-4 py-8', over ? 'border-[var(--secondary-color)] bg-blue-50/40' : 'border-blue-200 bg-blue-50')}
    >
      <div className="flex flex-col items-center gap-2">
        <RiUploadCloudLine size={45} className="text-[var(--secondary-color)]" />
        <div className="text-sm font-semibold text-black">
          Drag &amp; drop images or{' '}
          <button type="button" onClick={() => inputRef.current?.click()} className="underline text-[var(--secondary-color)]">Browse</button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
        multiple
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
    </div>
  );
}

function EbookDropArea({ onPick }: { onPick: (files: FileList | null) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onPick(e.dataTransfer.files); }}
      className={cls(over ? 'bg-blue-100 ring-2 ring-blue-200' : 'bg-blue-50', 'w-full rounded-2xl px-4 py-8')}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="grid place-items-center text-[var(--secondary-color)] "><RiUploadCloudLine size={50} /></div>
        <div className="text-md font-semibold text-black">
          Drag &amp; drop files or{' '}
          <button type="button" onClick={() => inputRef.current?.click()} className="underline text-[var(--secondary-color)]">Browse</button>
        </div>
        <div className="text-md text-neutral-600">Supported formats: .PDF</div>
      </div>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
    </div>
  );
}

function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  return url;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizes = ['B','KB','MB','GB','TB'];
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
