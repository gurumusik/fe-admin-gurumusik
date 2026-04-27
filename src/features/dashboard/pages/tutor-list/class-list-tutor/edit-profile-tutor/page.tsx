/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import {
  RiArrowLeftLine,
  RiUser3Fill,
  RiMusic2Fill,
  RiFileList2Fill,
  RiSaveLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiImageAddLine,
  RiAddLine,
  RiDeleteBinLine,
  RiPlayCircleLine,
  RiLinkM,
  RiExternalLinkLine,
} from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppDispatch } from '@/app/store';

import { fetchGuruProfileThunk } from '@/features/slices/guru/slice';
import {
  updateGuruBasicApi,
  updateGuruDetailApi,
  updateGuruLanguagesApi,
  uploadGuruAvatarApi,
} from '@/services/api/guru.api';
import { updateSertifikatVideoUrl } from '@/services/api/sertifikat.api';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { listProvincesApi, listCitiesApi } from '@/services/api/wilayah.api';
import type { ProvinceItem, CityItem } from '@/services/api/wilayah.api';
import defaultUser from '@/assets/images/default-user.png';

type LocationState = { guruId?: number };

const LANGUAGE_OPTIONS = [
  { id: 'id', label: 'Indonesia' },
  { id: 'en', label: 'Inggris' },
  { id: 'ch', label: 'China' },
  { id: 'ko', label: 'Korea' },
  { id: 'ja', label: 'Jepang' },
];

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

const SectionHeader: React.FC<{ icon: React.ReactNode; color: string; title: string }> = ({ icon, color, title }) => (
  <div className="mb-5 flex items-center gap-2">
    <span className={`inline-grid place-items-center w-9 h-9 rounded-full text-white ${color}`}>{icon}</span>
    <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
  </div>
);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; hint?: string }> = ({ label, required, children, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-neutral-700">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-neutral-500">{hint}</p>}
  </div>
);

const inputCls = "w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-[var(--secondary-color)]/20 transition";

export default function EditProfileTutorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: LocationState };

  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams('');
  const guruIdFromQuery = Number(search.get('guru_id')) || Number(search.get('id')) || undefined;
  const guruId = state?.guruId ?? guruIdFromQuery;

  // Loading/save state
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<null | 'ok' | 'fail'>(null);
  const [saveError, setSaveError] = useState('');

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Basic fields
  const [nama, setNama] = useState('');
  const [namaPanggilan, setNamaPanggilan] = useState('');
  const [email, setEmail] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [bio, setBio] = useState('');

  // Wilayah
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [provName, setProvName] = useState('');
  const [cityName, setCityName] = useState('');
  const [loadingCities, setLoadingCities] = useState(false);

  // Detail fields
  const [title, setTitle] = useState('');
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [designedFor, setDesignedFor] = useState<string[]>(['']);

  // Instrument videos (sertifikat.video_url per instrument)
  type InstrumentVideo = {
    sertifikatId: number;
    instrumentId: number | null;
    instrumentName: string;
    instrumentIcon: string | null;
    videoUrl: string;
  };
  const [instrumentVideos, setInstrumentVideos] = useState<InstrumentVideo[]>([]);

  // Load provinces
  useEffect(() => {
    listProvincesApi({ limit: 500 }).then(r => setProvinces(r.data)).catch(() => {});
  }, []);

  // Load cities when province changes
  useEffect(() => {
    if (!selectedProvId) { setCities([]); return; }
    setLoadingCities(true);
    listCitiesApi({ province_id: selectedProvId, limit: 500 })
      .then(r => { setCities(r.data); })
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [selectedProvId]);

  // Fetch guru profile
  useEffect(() => {
    if (!guruId) { setLoadingProfile(false); return; }
    setLoadingProfile(true);
    dispatch(fetchGuruProfileThunk({ id: guruId } as any))
      .then((action: any) => {
        const p = action.payload;
        if (!p) return;
        const u = p.user ?? {};
        const d = p.detail ?? {};

        setNama(u.nama ?? '');
        setNamaPanggilan(u.nama_panggilan ?? '');
        setEmail(u.email ?? '');
        setNoTelp(u.no_telp ?? '');
        setAlamat(u.alamat ?? '');
        setBio(u.bio ?? '');
        setProvName(u.province ?? '');
        setCityName(u.city ?? '');
        setTitle(d.title ?? '');

        const bahasaArr: string[] = Array.isArray(d.bahasa) ? d.bahasa : [];
        setSelectedLangs(bahasaArr);

        const df: string[] = Array.isArray(d.designed_for) && d.designed_for.length
          ? d.designed_for
          : Array.isArray(d.appropriate_list) && d.appropriate_list.length
            ? d.appropriate_list
            : [''];
        setDesignedFor(df.length ? df : ['']);

        if (u.profile_pic_url) setAvatarPreview(resolveImageUrl(u.profile_pic_url) || '');

        // Build instrument video list from sertifikat[]
        const sertifikatList: any[] = Array.isArray(p.sertifikat) ? p.sertifikat : [];
        // Deduplicate: one entry per unique instrument (use latest sertifikat per instrument)
        const byInstrument = new Map<number, any>();
        sertifikatList.forEach((s: any) => {
          const iid = s.instrument_id ?? s.instrument?.id;
          if (!iid) return;
          const existing = byInstrument.get(iid);
          if (!existing || s.id > existing.id) byInstrument.set(iid, s);
        });
        const videos: InstrumentVideo[] = Array.from(byInstrument.values()).map((s: any) => ({
          sertifikatId: s.id,
          instrumentId: s.instrument_id ?? s.instrument?.id ?? null,
          instrumentName: s.instrument?.nama || `Instrumen #${s.instrument_id}`,
          instrumentIcon: s.instrument?.icon ? resolveImageUrl(s.instrument.icon) : null,
          videoUrl: String(s.video_url || ''),
        }));
        setInstrumentVideos(videos);

        // Match province
        if (u.province_id) {
          setSelectedProvId(String(u.province_id));
        } else if (u.province) {
          listProvincesApi({ limit: 500 }).then(r => {
            const hit = r.data.find((p: ProvinceItem) => p.nama.toLowerCase() === u.province.toLowerCase());
            if (hit) setSelectedProvId(hit.id);
          }).catch(() => {});
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [dispatch, guruId]);

  // Match city_id from city name after cities load
  useEffect(() => {
    if (!cities.length || !cityName || selectedCityId) return;
    const hit = cities.find(c => c.nama.toLowerCase() === cityName.toLowerCase());
    if (hit) setSelectedCityId(hit.id);
  }, [cities, cityName, selectedCityId]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleLang = (id: string) => {
    setSelectedLangs(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleDesignedForChange = (idx: number, val: string) => {
    setDesignedFor(prev => prev.map((v, i) => i === idx ? val : v));
  };

  const addDesignedFor = () => setDesignedFor(prev => [...prev, '']);
  const removeDesignedFor = (idx: number) => setDesignedFor(prev => prev.filter((_, i) => i !== idx));

  const handleVideoChange = (sertifikatId: number, val: string) => {
    setInstrumentVideos(prev => prev.map(v => v.sertifikatId === sertifikatId ? { ...v, videoUrl: val } : v));
  };

  function extractYtId(url: string): string | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0] || null;
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    } catch { /* ignore */ }
    const m = url.match(/[A-Za-z0-9_-]{11}/);
    return m ? m[0] : null;
  }

  const handleSave = async () => {
    if (!nama.trim()) { setSaveError('Nama tidak boleh kosong'); setSaveResult('fail'); return; }
    setIsSaving(true);
    setSaveResult(null);
    setSaveError('');
    try {
      if (avatarFile) await uploadGuruAvatarApi(avatarFile, guruId);

      const selectedProv = provinces.find(p => p.id === selectedProvId);
      const selectedCity = cities.find(c => c.id === selectedCityId);

      await updateGuruBasicApi({
        nama: nama.trim(),
        nama_panggilan: namaPanggilan.trim() || undefined,
        no_telp: noTelp.trim() || undefined,
        alamat: alamat.trim() || undefined,
        bio: bio.trim() || undefined,
        province: selectedProv?.nama || provName || undefined,
        province_id: selectedProvId || undefined,
        city: selectedCity?.nama || cityName || undefined,
        city_id: selectedCityId || undefined,
      }, guruId);

      const cleanDesignedFor = designedFor.map(s => s.trim()).filter(Boolean);
      await updateGuruDetailApi({
        title: title.trim() || undefined,
        designed_for: cleanDesignedFor.length ? cleanDesignedFor : undefined,
      }, guruId);

      if (selectedLangs.length) await updateGuruLanguagesApi(selectedLangs, guruId);

      // Save video_url per instrument sertifikat
      await Promise.all(
        instrumentVideos.map(v =>
          updateSertifikatVideoUrl(v.sertifikatId, v.videoUrl.trim() || null)
        )
      );

      if (guruId) dispatch(fetchGuruProfileThunk({ id: guruId } as any));
      setSaveResult('ok');
    } catch (e: any) {
      setSaveError(e?.message || 'Terjadi kesalahan saat menyimpan');
      setSaveResult('fail');
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    navigate('/dashboard-admin/tutor-list/class-list-tutor/profile-tutor', {
      state: { guruId },
    });
  };

  if (loadingProfile) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-black/10 rounded-xl" />
        <div className="rounded-2xl bg-white p-6 space-y-4">
          <div className="h-20 w-20 rounded-full bg-black/10" />
          <div className="h-5 w-64 bg-black/10 rounded" />
          <div className="h-5 w-48 bg-black/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT — Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top actions */}
          <section className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex gap-3 bg-white border border-[var(--secondary-color)] text-[var(--secondary-color)] text-sm rounded-full py-1.5 px-4 items-center hover:bg-[var(--secondary-light-color)] transition"
            >
              <RiArrowLeftLine size={20} />
              <span>Kembali</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cls(
                'flex gap-2 items-center bg-[var(--secondary-color)] text-white text-sm rounded-full py-1.5 px-5 transition',
                isSaving ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-95'
              )}
            >
              <RiSaveLine size={18} />
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </section>

          {/* ===== PROFILE SECTION ===== */}
          <section className="rounded-2xl bg-white p-4 md:p-6">
            <SectionHeader
              icon={<RiUser3Fill size={20} />}
              color="bg-[var(--secondary-color)]"
              title="Profile Guru"
            />

            {/* Avatar */}
            <div className="mb-6 flex items-center gap-5">
              <div className="relative shrink-0">
                <img
                  src={avatarPreview || defaultUser}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-black/10"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--secondary-color)] text-white shadow-md hover:brightness-90 transition"
                  title="Ganti foto"
                >
                  <RiImageAddLine size={16} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Foto Profil</p>
                <p className="text-xs text-neutral-500 mt-0.5">Klik ikon kamera untuk mengganti foto.</p>
                <p className="text-xs text-neutral-400">Format: JPG, PNG. Maks 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nama Lengkap" required>
                <input
                  className={inputCls}
                  placeholder="Nama lengkap guru"
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                />
              </Field>

              <Field label="Nama Panggilan">
                <input
                  className={inputCls}
                  placeholder="Nama panggilan"
                  value={namaPanggilan}
                  onChange={e => setNamaPanggilan(e.target.value)}
                />
              </Field>

              <Field label="Email">
                <input
                  className={cls(inputCls, 'bg-neutral-50 cursor-not-allowed')}
                  placeholder="Email"
                  value={email}
                  disabled
                  title="Email tidak dapat diubah dari sini"
                />
              </Field>

              <Field label="No. Telepon">
                <input
                  className={inputCls}
                  placeholder="08xxxxxxxxxx"
                  value={noTelp}
                  onChange={e => setNoTelp(e.target.value)}
                />
              </Field>

              <Field label="Provinsi">
                <select
                  className={inputCls}
                  value={selectedProvId}
                  onChange={e => {
                    setSelectedProvId(e.target.value);
                    setSelectedCityId('');
                    const found = provinces.find(p => p.id === e.target.value);
                    setProvName(found?.nama || '');
                    setCityName('');
                  }}
                >
                  <option value="">-- Pilih Provinsi --</option>
                  {provinces.map(p => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </Field>

              <Field label="Kota / Kabupaten">
                <select
                  className={cls(inputCls, (!selectedProvId || loadingCities) && 'opacity-60')}
                  value={selectedCityId}
                  disabled={!selectedProvId || loadingCities}
                  onChange={e => {
                    setSelectedCityId(e.target.value);
                    const found = cities.find(c => c.id === e.target.value);
                    setCityName(found?.nama || '');
                  }}
                >
                  <option value="">
                    {loadingCities ? 'Memuat kota...' : '-- Pilih Kota --'}
                  </option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>{c.nama}</option>
                  ))}
                </select>
              </Field>

              <div className="md:col-span-2">
                <Field label="Alamat Lengkap">
                  <textarea
                    className={cls(inputCls, 'resize-none')}
                    rows={3}
                    placeholder="Alamat lengkap"
                    value={alamat}
                    onChange={e => setAlamat(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* ===== KEAHLIAN SECTION ===== */}
          <section className="rounded-2xl bg-white p-4 md:p-6">
            <SectionHeader
              icon={<RiMusic2Fill size={20} />}
              color="bg-[var(--accent-purple-color)]"
              title="Keahlian Guru"
            />

            <Field label="Bahasa Pengajaran">
              <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-300 p-3">
                {LANGUAGE_OPTIONS.map(opt => {
                  const active = selectedLangs.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleLang(opt.id)}
                      className={cls(
                        'rounded-full px-4 py-1.5 text-sm font-medium border transition',
                        active
                          ? 'bg-[var(--secondary-color)] text-white border-[var(--secondary-color)]'
                          : 'bg-white text-neutral-600 border-neutral-300 hover:border-[var(--secondary-color)]'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </section>

          {/* ===== DETAIL KELAS SECTION ===== */}
          <section className="rounded-2xl bg-white p-4 md:p-6">
            <SectionHeader
              icon={<RiFileList2Fill size={20} />}
              color="bg-[var(--accent-orange-color)]"
              title="Detail Kelas"
            />

            <div className="space-y-4">
              <Field label="Bio / Tentang Guru" hint="Deskripsi singkat tentang guru ini.">
                <textarea
                  className={cls(inputCls, 'resize-none')}
                  rows={4}
                  placeholder="Ceritakan tentang guru ini..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </Field>

              <Field label="Headline (Judul Kelas)" hint="Judul singkat yang mewakili kelas/keahlian guru.">
                <input
                  className={inputCls}
                  placeholder="Contoh: Guru Piano Berpengalaman 10 Tahun"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </Field>

              {/* ===== Video Preview per Instrumen ===== */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-blue-100 text-blue-600">
                    <RiPlayCircleLine size={16} />
                  </span>
                  <span className="text-sm font-semibold text-neutral-800">Video Preview per Instrumen</span>
                </div>
                <p className="text-xs text-neutral-500 mb-3">Masukkan link YouTube untuk setiap instrumen yang diajarkan guru ini. Video akan ditampilkan di halaman profil guru.</p>

                {instrumentVideos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">
                    Belum ada sertifikat instrumen untuk guru ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {instrumentVideos.map(iv => {
                      const ytId = extractYtId(iv.videoUrl);
                      const thumbUrl = ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : null;
                      return (
                        <div key={iv.sertifikatId} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                          {/* Instrument header */}
                          <div className="flex items-center gap-2 mb-3">
                            {iv.instrumentIcon ? (
                              <img src={iv.instrumentIcon} alt={iv.instrumentName} className="h-6 w-6 object-contain" />
                            ) : (
                              <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-[var(--accent-purple-color)]/20 text-[var(--accent-purple-color)]">
                                <RiMusic2Fill size={13} />
                              </span>
                            )}
                            <span className="text-sm font-semibold text-neutral-800">{iv.instrumentName}</span>
                          </div>

                          {/* YouTube preview thumbnail */}
                          {thumbUrl && (
                            <div className="mb-3 relative aspect-video w-full max-w-xs rounded-xl overflow-hidden bg-neutral-200">
                              <img src={thumbUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 grid place-items-center">
                                <span className="inline-grid place-items-center w-10 h-10 rounded-full bg-black/40 text-white">
                                  <RiPlayCircleLine size={24} />
                                </span>
                              </div>
                              {iv.videoUrl && (
                                <a
                                  href={iv.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white hover:bg-black/70"
                                >
                                  <RiExternalLinkLine size={12} /> Buka
                                </a>
                              )}
                            </div>
                          )}

                          {/* Video URL input */}
                          <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
                              <RiLinkM size={15} />
                            </span>
                            <input
                              className={cls(inputCls, 'pl-9 bg-white')}
                              placeholder="https://youtube.com/watch?v=..."
                              value={iv.videoUrl}
                              onChange={e => handleVideoChange(iv.sertifikatId, e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cocok untuk */}
              <Field label="Cocok Untuk" hint='Isi target murid yang cocok. Klik "+ Tambah" untuk menambah baris.'>
                <div className="space-y-2">
                  {designedFor.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        className={cls(inputCls, 'flex-1')}
                        placeholder={`Contoh: Pemula yang ingin belajar dari nol`}
                        value={item}
                        onChange={e => handleDesignedForChange(idx, e.target.value)}
                      />
                      {designedFor.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDesignedFor(idx)}
                          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
                          title="Hapus baris"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDesignedFor}
                    className="flex items-center gap-2 text-sm text-[var(--secondary-color)] hover:underline"
                  >
                    <RiAddLine size={16} />
                    Tambah baris
                  </button>
                </div>
              </Field>
            </div>
          </section>
        </div>

        {/* RIGHT — Sticky summary */}
        <aside className="lg:col-span-5 lg:sticky lg:top-20 self-start space-y-4">
          <div className="rounded-2xl bg-white p-4 md:p-6">
            <h3 className="mb-3 text-lg font-semibold text-neutral-500">Ringkasan</h3>

            <div className="space-y-3 text-sm text-neutral-700">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                <img
                  src={avatarPreview || defaultUser}
                  alt="Avatar"
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-black/5"
                />
                <div>
                  <p className="font-semibold text-neutral-900">{nama || '—'}</p>
                  <p className="text-neutral-500 text-xs">{namaPanggilan || 'Tanpa panggilan'}</p>
                </div>
              </div>

              <div className="space-y-2 px-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Email</span>
                  <span className="font-medium text-right truncate max-w-[180px]">{email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Telepon</span>
                  <span className="font-medium">{noTelp || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Lokasi</span>
                  <span className="font-medium text-right max-w-[180px]">
                    {[cities.find(c => c.id === selectedCityId)?.nama || cityName, provinces.find(p => p.id === selectedProvId)?.nama || provName].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Headline</span>
                  <span className="font-medium text-right max-w-[180px] truncate">{title || '—'}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-neutral-500 shrink-0">Bahasa</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {selectedLangs.length
                      ? selectedLangs.map(l => (
                          <span key={l} className="rounded-full bg-[var(--secondary-light-color)] px-2 py-0.5 text-xs text-[var(--secondary-color)] font-medium">
                            {LANGUAGE_OPTIONS.find(o => o.id === l)?.label || l}
                          </span>
                        ))
                      : <span>—</span>}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cls(
                  'w-full flex justify-center gap-2 items-center rounded-xl py-3 text-sm font-semibold text-white bg-[var(--secondary-color)] transition',
                  isSaving ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-95'
                )}
              >
                <RiSaveLine size={18} />
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ===== Success / Error Toast ===== */}
      {saveResult === 'ok' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-xl">
            <div className="flex justify-center mb-4">
              <span className="inline-grid place-items-center w-16 h-16 rounded-full bg-green-100">
                <RiCheckboxCircleFill size={36} className="text-green-500" />
              </span>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Profil Berhasil Disimpan</h3>
            <p className="text-sm text-neutral-600 mb-6">Data profil guru telah berhasil diperbarui.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setSaveResult(null)}
                className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
              >
                Tetap di Sini
              </button>
              <button
                onClick={goBack}
                className="flex-1 rounded-xl bg-[var(--secondary-color)] py-2.5 text-sm font-semibold text-white hover:brightness-95 transition"
              >
                Lihat Profil
              </button>
            </div>
          </div>
        </div>
      )}

      {saveResult === 'fail' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-xl">
            <div className="flex justify-center mb-4">
              <span className="inline-grid place-items-center w-16 h-16 rounded-full bg-red-100">
                <RiCloseLine size={36} className="text-red-500" />
              </span>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Gagal Menyimpan</h3>
            <p className="text-sm text-neutral-600 mb-6">{saveError || 'Terjadi kesalahan. Silakan coba lagi.'}</p>
            <button
              onClick={() => setSaveResult(null)}
              className="w-full rounded-xl bg-[var(--secondary-color)] py-2.5 text-sm font-semibold text-white hover:brightness-95 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
