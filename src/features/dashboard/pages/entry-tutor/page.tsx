  /* eslint-disable @typescript-eslint/no-explicit-any */
  // src/pages/dashboard-admin/tutor-list/EntryTutorPage.tsx
  'use client';

  import { useEffect, useMemo, useState } from 'react';
  import { useDispatch, useSelector } from 'react-redux';
  import type { AppDispatch, RootState } from '@/app/store';
  import {
    createGuruFromEntryThunk,
    selectGuruCreate,
    resetGuruCreate,
  } from '@/features/slices/guru/slice';
  import { useNavigate } from 'react-router-dom';

  // ===== fetch instruments & grades untuk resolve label/icon
  import { fetchInstrumentsThunk } from '@/features/slices/instruments/slice';
  import { fetchGradesThunk } from '@/features/slices/grades/slice';
  import { resolveIconUrl } from '@/services/api/instrument.api';

  // ===== Modal entry/kelola sertifikat (pakai ID, bukan nama)
  import EntryCertificateModal, {
    type CertificateItem,
    type CreateCertPayloadIds,
    type UpdateCertPayloadIds,
  } from '@/features/dashboard/components/EntryCertificateModal';

  // (Opsional) icon bahasa
  import { getLanguageIcon } from '@/utils/getLanguageIcon';

  // ====== TYPES dari slice (sudah Anda sediakan)
  import type {
    CreateGuruFromEntryCertificate,
    CreateGuruFromEntryPayload,
  } from '@/features/slices/guru/types';

  // ================== Bahasa (multi-select) ==================
  const LANGUAGE_OPTIONS = ['Indonesia', 'Inggris', 'Korea', 'Jepang', 'China'] as const;
  type Language = typeof LANGUAGE_OPTIONS[number];

  function LanguageSelector({
    value,
    onChange,
  }: {
    value: string[];
    onChange: (next: string[]) => void;
  }) {
    const toggle = (lang: Language) => {
      const has = value.includes(lang);
      onChange(has ? value.filter((l) => l !== lang) : [...value, lang]);
    };
    return (
      <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-300 p-1.5">
        {LANGUAGE_OPTIONS.map((lang) => {
          const active = value.includes(lang);
          const icon = getLanguageIcon?.(lang) ?? null;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => toggle(lang)}
              className={
                active
                  ? 'inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-50 border border-blue-200 text-blue-700'
                  : 'inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-neutral-50 border border-neutral-300 text-neutral-800'
              }
              title={lang}
            >
              {icon ? (
                <img src={icon} alt={lang} className="h-5 w-5 object-contain" loading="lazy" />
              ) : (
                <span className="inline-grid place-items-center w-5 h-5 rounded-full bg-white border border-neutral-300 text-[10px]">
                  A
                </span>
              )}
              {lang}
            </button>
          );
        })}
      </div>
    );
  }

  // ==== helper: file -> dataURL (base64) ====
  async function fileToDataUrl(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  }

  // ===== tipe lokal: tambah field dataURL untuk sertifikat =====
  type LocalCert = CertificateItem & { certif_data_url?: string };

  // ----------------- Mulai Page -----------------
  export default function EntryTutorPage() {
    const dispatch = useDispatch<AppDispatch>();
    const createState = useSelector((s: RootState) => selectGuruCreate(s));
    const navigate = useNavigate();
    // ==== instruments & grades state (untuk resolve nama/icon) ====
    const instrumentsState = useSelector((s: RootState) => (s as any).instrument);
    const gradesState = useSelector((s: RootState) => (s as any).grades);

    useEffect(() => {
      if (instrumentsState?.status === 'idle') dispatch(fetchInstrumentsThunk(undefined) as any);
      if (gradesState?.status === 'idle') dispatch(fetchGradesThunk(undefined) as any);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ==== Form dasar (controlled) ====
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [profilePicDataUrl, setProfilePicDataUrl] = useState<string | null>(null);

    const [nama, setNama] = useState('');
    const [namaPanggilan, setNamaPanggilan] = useState('');
    const [email, setEmail] = useState('');
    const [telepon, setTelepon] = useState('');
    const [demoLink, setDemoLink] = useState(''); // Link Video Demo
    const [provinsi, setProvinsi] = useState('');
    const [kota, setKota] = useState('');
    const [alamat, setAlamat] = useState('');
    const [bio] = useState<string | null>(null);          // opsional

    // ==== Bahasa (multi-select) ====
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    // ==== Sertifikat (master list di page, simpan id + dataURL untuk upload) ====
    const [certs, setCerts] = useState<LocalCert[]>([]);

    // ==== Modal EntryCertificate ====
    const [openEntryCert, setOpenEntryCert] = useState(false);

    // ==== onChange foto profil -> simpan dataURL (untuk dikirim ke BE) ====
    const handlePhotoChange = async (file?: File | null) => {
      setPhotoFile(file ?? null);
      if (file) {
        try {
          const dataUrl = await fileToDataUrl(file);
          setProfilePicDataUrl(dataUrl);
        } catch {
          setProfilePicDataUrl(null);
        }
      } else {
        setProfilePicDataUrl(null);
      }
    };

    // ==== Callback create/update dari modal (push/update di list lokal) ====
    const handleCreateCertificate = async (payload: CreateCertPayloadIds) => {
      const localPreview = URL.createObjectURL(payload.file); // preview UI tetap
      const dataUrl = await fileToDataUrl(payload.file);       // untuk upload ke BE
      setCerts((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          title: payload.title,
          school: payload.school,
          instrument_id: payload.instrument_id,
          grade_id: payload.grade_id,
          status: 'Menunggu Verifikasi',
          link: localPreview,
          certif_data_url: dataUrl,
        },
      ]);
    };

    const handleUpdateCertificate = async (payload: UpdateCertPayloadIds) => {
      const localUrl = payload.file ? URL.createObjectURL(payload.file) : undefined;
      const maybeDataUrl = payload.file ? await fileToDataUrl(payload.file) : undefined;
      setCerts((prev) =>
        prev.map((it) =>
          it.id === payload.id
            ? {
                ...it,
                title: payload.title,
                school: payload.school,
                instrument_id: payload.instrument_id,
                grade_id: payload.grade_id,
                link: localUrl ?? it.link,
                certif_data_url: maybeDataUrl ?? it.certif_data_url,
              }
            : it
        )
      );
    };

    const canSubmit = nama.trim() && email.trim() && telepon.trim();

    // Map sertifikat ke payload backend (sudah berupa ID + dataURL)
    function mapCertificatesToPayload(items: LocalCert[]): CreateGuruFromEntryCertificate[] {
      return items.map((it) => ({
        title: it.title,
        school: it.school,
        instrument_id: it.instrument_id,
        grade_id: it.grade_id,
        // KIRIM dataURL ke BE via certif_path
        certif_path: it.certif_data_url || '', 
      }));
    }

    async function handleSubmitCreate() {
      if (!canSubmit || createState.status === 'loading') return;

    const payload: CreateGuruFromEntryPayload = {
      nama,
      nama_panggilan: namaPanggilan || undefined,
      email,
      no_telp: telepon,
      province: provinsi || undefined,
      city: kota || undefined,
      alamat: alamat || undefined,
      bio,
      // KIRIM dataURL (image/*) di field YANG SAMA: profile_pic_url
      profile_pic_url: profilePicDataUrl || undefined,
      intro_link: demoLink || undefined,
      bahasa: selectedLanguages,
      certificates: mapCertificatesToPayload(certs),
    };

      await dispatch(createGuruFromEntryThunk({ payload }));
      resetAll();

      navigate('/dashboard-admin/entry-tutor', { replace: true });
    }

    function resetAll() {
      setNama('');
      setNamaPanggilan('');
      setEmail('');
      setTelepon('');
      setDemoLink('');
      setProvinsi('');
      setKota('');
      setAlamat('');
      setCerts([]);
      setSelectedLanguages([]);
      setPhotoFile(null);
      setProfilePicDataUrl(null);
      dispatch(resetGuruCreate());
    }

    // ====== Build daftar unik instrumen -> grade (grade terakhir untuk setiap instrumen)
    type IG = { instrument_id: number; grade_id: number };
    const pickedIG: IG[] = useMemo(() => {
      const m = new Map<number, number>();
      for (const c of certs) {
        if (typeof c.instrument_id === 'number') m.set(c.instrument_id, c.grade_id);
      }
      return Array.from(m.entries()).map(([instrument_id, grade_id]) => ({ instrument_id, grade_id }));
    }, [certs]);

    // helpers resolve
    const getInstrumentInfo = (id?: number) => {
      if (!id) return { name: '', icon: '' };
      const found = (instrumentsState?.items ?? []).find((it: any) => it?.id === id);
      const name = found?.nama_instrumen ?? found?.nama ?? '';
      const icon = resolveIconUrl?.(found?.icon ?? null) ?? (found?.icon ?? '');
      return { name, icon };
    };
    const getGradeName = (id?: number) => {
      if (!id) return '';
      const found = (gradesState?.items ?? []).find((g: any) => g?.id === id);
      return found?.nama_grade ?? found?.nama ?? '';
    };

    const loadingIG =
      instrumentsState?.status === 'loading' || gradesState?.status === 'loading';

    return (
      <div className="mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Entry Tutor</h1>
        </header>

        {/* Alert sukses/failed */}
        {createState.status === 'succeeded' && createState.lastCreated && (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
            Guru berhasil dibuat (ID: <b>{createState.lastCreated.id}</b>, <b>{createState.lastCreated.nama}</b>).
            <button className="ml-3 underline" onClick={resetAll} type="button">
              Buat lagi
            </button>
          </div>
        )}
        {createState.status === 'failed' && createState.error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Gagal membuat guru: {createState.error}
          </div>
        )}

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitCreate();
          }}
        >
          {/* === Profil === */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-800">Profil</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* 1. Profile Picture Upload */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="photo" className="text-md font-medium text-slate-700">
                  Profile Picture
                </label>
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e.currentTarget.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-md text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-md file:font-medium hover:file:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {photoFile ? (
                  <p className="text-xs text-slate-600">Dipilih: {photoFile.name}</p>
                ) : (
                  <p className="text-xs text-slate-500">Format gambar (JPG/PNG/WebP). Disarankan rasio 1:1.</p>
                )}
              </div>

              {/* 2. Nama */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nama" className="text-md font-medium text-slate-700">Nama</label>
                <input
                  id="nama"
                  name="nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama lengkap"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* 3. Nama Panggilan */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="namaPanggilan" className="text-md font-medium text-slate-700">Nama Panggilan</label>
                <input
                  id="namaPanggilan"
                  name="namaPanggilan"
                  type="text"
                  value={namaPanggilan}
                  onChange={(e) => setNamaPanggilan(e.target.value)}
                  placeholder="Contoh: Rafi"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 4. Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-md font-medium text-slate-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@contoh.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* 5. No Telpon */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="telepon" className="text-md font-medium text-slate-700">No Telpon</label>
                <input
                  id="telepon"
                  name="telepon"
                  type="tel"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="+62812xxxxxxx"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Link Video Demo */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="demoLink" className="text-md font-medium text-slate-700">
                  Link Video Demo
                </label>
                <input
                  id="demoLink"
                  name="demoLink"
                  type="url"
                  value={demoLink}
                  onChange={(e) => setDemoLink(e.target.value)}
                  placeholder="https://youtu.be/xxxxx atau link publik Google Drive"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* === Keahlian Guru === */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-800">Keahlian Guru</h2>

            {/* ====== Ringkasan Instrumen Musik (bisa lebih dari satu) + tombol Ubah ====== */}
            <div className="mb-5">
              <div className="mb-2 text-md font-medium text-neutral-900">Instrumen Musik</div>

              <div className="space-y-2">
                {pickedIG.length > 0 ? (
                  pickedIG.map(({ instrument_id, grade_id }) => {
                    const info = getInstrumentInfo(instrument_id);
                    const gradeName = getGradeName(grade_id);
                    return (
                      <button
                        key={instrument_id}
                        type="button"
                        onClick={() => setOpenEntryCert(true)}
                        className="w-full h-11 rounded-lg border border-gray-200 bg-neutral-50 px-3 flex items-center gap-2 text-left hover:bg-neutral-100"
                        title="Klik untuk mengelola sertifikat (pilih instrumen & grade)"
                      >
                        {info.icon ? (
                          <img
                            src={info.icon}
                            alt={info.name || 'Instrument'}
                            className="h-6 w-6 rounded object-contain ring-1 ring-black/10"
                          />
                        ) : (
                          <span className="inline-grid place-items-center h-6 w-6 rounded bg-white border border-neutral-300 text-[11px] text-neutral-500">
                            ♪
                          </span>
                        )}

                        <span className="text-md text-neutral-800">
                          {loadingIG
                            ? 'Memuat…'
                            : info.name
                            ? `${info.name} • ${gradeName || '—'}`
                            : 'Instrumen tidak ditemukan'}
                        </span>

                        <span className="ml-auto text-xs text-[var(--secondary-color)] underline">
                          Ubah
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenEntryCert(true)}
                    className="w-full h-11 rounded-lg border border-gray-200 bg-neutral-50 px-3 flex items-center gap-2 text-left hover:bg-neutral-100"
                  >
                    <span className="inline-grid place-items-center h-6 w-6 rounded bg-white border border-neutral-300 text-[11px] text-neutral-500">
                      ♪
                    </span>
                    <span className="text-md text-neutral-800">Belum memilih instrumen</span>
                    <span className="ml-auto text-xs text-[var(--secondary-color)] underline">Ubah</span>
                  </button>
                )}
              </div>
            </div>

            {/* ===== Bahasa -> multi-select chips (posisi di bawah ringkasan instrumen) ===== */}
            <div className="space-y-2">
              <div className="text-md font-medium text-neutral-900">Bahasa</div>
              <LanguageSelector value={selectedLanguages} onChange={setSelectedLanguages} />
              {!selectedLanguages.length && (
                <div className="mt-1 text-xs text-neutral-500">Pilih satu atau lebih bahasa.</div>
              )}
            </div>
          </section>

          {/* === Alamat === */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-800">Alamat</h2>
            <div className="flex flex-col gap-4">
              {/* Provinsi */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="provinsi" className="text-md font-medium text-slate-700">Provinsi</label>
                <input
                  id="provinsi"
                  name="provinsi"
                  type="text"
                  value={provinsi}
                  onChange={(e) => setProvinsi(e.target.value)}
                  placeholder="Contoh: Jawa Barat"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Kota */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="kota" className="text-md font-medium text-slate-700">Kota</label>
                <input
                  id="kota"
                  name="kota"
                  type="text"
                  value={kota}
                  onChange={(e) => setKota(e.target.value)}
                  placeholder="Contoh: Depok"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Alamat */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="alamat" className="text-md font-medium text-slate-700">Alamat</label>
                <textarea
                  id="alamat"
                  name="alamat"
                  rows={4}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan, kode pos"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit || createState.status === 'loading'}
              className="rounded-full px-6 py-3 font-semibold bg-[var(--primary-color)] text-neutral-900 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createState.status === 'loading' ? 'Membuat…' : 'Buat Guru'}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-full px-6 py-3 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              Reset
            </button>

            <div className="text-sm text-neutral-500 basis-full">
              * Sertifikat disimpan tanpa file permanen hingga integrasi uploader siap.
            </div>
          </div>
        </form>

        {/* ===== Modal Entry Certificate (list + create) ===== */}
        <EntryCertificateModal
          isOpen={openEntryCert}
          onClose={() => setOpenEntryCert(false)}
          certificates={certs}
          onCreate={handleCreateCertificate}
          onUpdate={handleUpdateCertificate}
        />
      </div>
    );
  }
