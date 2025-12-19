/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard-admin/tutor-list/EntryTutorPage.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import {
  createGuruFromEntryThunk,
  selectGuruCreate,
  resetGuruCreate,
} from '@/features/slices/guru/slice';
import { useNavigate } from 'react-router-dom';

import { fetchInstrumentsThunk } from '@/features/slices/instruments/slice';
import { fetchGradesThunk } from '@/features/slices/grades/slice';
import { resolveIconUrl } from '@/services/api/instrument.api';

// Wilayah API (baru)
import {
  getAllProvinces,
  getCitiesByProvince,
  type ProvinceItem,
  type CityItem,
} from '@/services/api/wilayah.api';

import EntryCertificateModal, {
  type CertificateItem,
  type CreateCertPayloadIds,
  type UpdateCertPayloadIds,
} from '@/features/dashboard/components/EntryCertificateModal';

import { getLanguageIcon } from '@/utils/getLanguageIcon';
import { clampCropFrame, cropImageToDataUrl, loadCropImage, type CropFrame } from '@/utils/cropPhoto';

import type {
  CreateGuruFromEntryCertificate,
  CreateGuruFromEntryPayload,
} from '@/features/slices/guru/types';

// ================== Bahasa (multi-select) ==================
const LANGUAGE_OPTIONS = [
  { code: 'id', label: 'Indonesia' },
  { code: 'en', label: 'Inggris' },
  { code: 'ch', label: 'China' },
  { code: 'ko', label: 'Korea' },
  { code: 'ja', label: 'Jepang' },
] as const;
type LanguageOption = typeof LANGUAGE_OPTIONS[number];

function LanguageSelector({
  value,
  onChange,
  invalid,
  onBlur,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  invalid?: boolean;
  onBlur?: () => void;
}) {
  const toggle = (lang: LanguageOption) => {
    const has = value.includes(lang.code);
    onChange(has ? value.filter((l) => l !== lang.code) : [...value, lang.code]);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={
          'flex flex-wrap gap-2 rounded-xl p-1.5 ' +
          (invalid ? 'border border-red-400' : 'border border-neutral-300')
        }
        onBlur={onBlur}
      >
        {LANGUAGE_OPTIONS.map((lang) => {
          const active = value.includes(lang.code);
          const icon = getLanguageIcon?.(lang.code) ?? null;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => toggle(lang)}
              className={
                active
                  ? 'inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-50 border border-blue-200 text-blue-700'
                  : 'inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-neutral-50 border border-neutral-300 text-neutral-800'
              }
              title={lang.label}
            >
              {icon ? (
                <img src={icon} alt={lang.label} className="h-5 w-5 object-contain" loading="lazy" />
              ) : (
                <span className="inline-grid place-items-center w-5 h-5 rounded-full bg-white border border-neutral-300 text-[10px]">
                  A
                </span>
              )}
              {lang.label}
            </button>
          );
        })}
      </div>
      {invalid && <p className="text-xs text-red-600">Pilih minimal satu bahasa.</p>}
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

// ===== tipe lokal: jadwal input UI =====
type UIScheduleRow = {
  day: number | '';
  start: string;
  end: string;
};

const DAY_OPTIONS = [
  { label: 'Senin', value: 1 },
  { label: 'Selasa', value: 2 },
  { label: 'Rabu', value: 3 },
  { label: 'Kamis', value: 4 },
  { label: 'Jumat', value: 5 },
  { label: 'Sabtu', value: 6 },
  { label: 'Minggu', value: 7 },
];
const CROP_BOX_SIZE = 320;

export default function EntryTutorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const createState = useSelector((s: RootState) => selectGuruCreate(s));
  const navigate = useNavigate();

  const instrumentsState = useSelector((s: RootState) => (s as any).instrument);
  const gradesState = useSelector((s: RootState) => (s as any).grades);

  useEffect(() => {
    if (instrumentsState?.status === 'idle') dispatch(fetchInstrumentsThunk(undefined) as any);
    if (gradesState?.status === 'idle') dispatch(fetchGradesThunk(undefined) as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==== Form dasar ====
  const [photoFile, setPhotoFile] = useState<File | null>(null); // final (pasca crop)
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null); // sebelum crop disimpan
  const [profilePicDataUrl, setProfilePicDataUrl] = useState<string | null>(null);
  const [rawPhotoDataUrl, setRawPhotoDataUrl] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSize, setCropImageSize] = useState({ w: 0, h: 0 }); // natural image size
  const [cropDisplaySize, setCropDisplaySize] = useState({ w: 0, h: 0 }); // fitted to viewport
  const [cropFrame, setCropFrame] = useState<CropFrame>({ x: 0, y: 0, size: 200 }); // 1:1 frame on display coords
  const cropDragRef = useRef({
    mode: null as 'move' | 'resize' | null,
    startX: 0,
    startY: 0,
    startFrame: { x: 0, y: 0, size: 200 } as CropFrame,
  });

  const [nama, setNama] = useState('');
  const [namaPanggilan, setNamaPanggilan] = useState('');
  const [email, setEmail] = useState('');
  const [telepon, setTelepon] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [alamat, setAlamat] = useState('');

  const [bio, setBio] = useState<string>('');
  const [abkChoice, setAbkChoice] = useState<'ya' | 'tidak' | ''>('');

  // Bahasa (REQUIRED)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [langTouched, setLangTouched] = useState(false);

  // Sertifikat
  const [certs, setCerts] = useState<LocalCert[]>([]);
  const [openEntryCert, setOpenEntryCert] = useState(false);

  // Jadwal UI
  const [schedules, setSchedules] = useState<UIScheduleRow[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [provId, setProvId] = useState<string>(''); // simpan ID provinsi
  const [cityId, setCityId] = useState<string>(''); // simpan ID kota/kab

  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [errProv, setErrProv] = useState<string | null>(null);
  const [errCity, setErrCity] = useState<string | null>(null);

  const selectedProvinceName = provinces.find((p) => p.id === provId)?.nama ?? '';
  const selectedCityName = cities.find((c) => c.id === cityId)?.nama ?? '';

  // Load provinces (once)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingProv(true);
        setErrProv(null);
        const data = await getAllProvinces();
        if (mounted) setProvinces(data);
      } catch {
        if (mounted) setErrProv('Gagal memuat provinsi');
      } finally {
        if (mounted) setLoadingProv(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load cities when province changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!provId) {
        setCities([]);
        setCityId('');
        return;
      }
      try {
        setLoadingCity(true);
        setErrCity(null);
        const data = await getCitiesByProvince(provId);
        if (mounted) setCities(data);
      } catch {
        if (mounted) setErrCity('Gagal memuat kota/kabupaten');
      } finally {
        if (mounted) setLoadingCity(false);
      }
    })();
    return () => { mounted = false; };
  }, [provId]);

  // Foto profil -> dataURL
  const handlePhotoChange = async (file?: File | null) => {
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setPendingPhotoFile(file);
        setRawPhotoDataUrl(dataUrl);
        setCropModalOpen(true);
      } catch {
        setPendingPhotoFile(null);
        setRawPhotoDataUrl(null);
      }
    } else {
        setPendingPhotoFile(null);
        setRawPhotoDataUrl(null);
    }
  };

  // load gambar untuk crop, hitung display-fit dan frame awal
  useEffect(() => {
    if (!rawPhotoDataUrl) return;
    let cancelled = false;
    loadCropImage(rawPhotoDataUrl, { maxWidth: 520, maxHeight: 520, maxFrameSize: 320 })
      .then((res) => {
        if (cancelled) return;
        setCropImageSize({ w: res.naturalWidth, h: res.naturalHeight });
        setCropDisplaySize({ w: res.displayWidth, h: res.displayHeight });
        setCropFrame(res.initialFrame);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [rawPhotoDataUrl]);

  const clampFrame = (frame: CropFrame) =>
    clampCropFrame(frame, cropDisplaySize.w, cropDisplaySize.h, 80);

  const startDrag = (mode: 'move' | 'resize', e: any) => {
    const point = 'touches' in e ? e.touches[0] : e;
    cropDragRef.current = {
      mode,
      startX: point.clientX,
      startY: point.clientY,
      startFrame: { ...cropFrame },
    };
  };

  const handleCropPointerMove = (e: any) => {
    const { mode, startX, startY, startFrame } = cropDragRef.current;
    if (!mode) return;
    if ('preventDefault' in e) e.preventDefault?.();
    const point = 'touches' in e ? e.touches[0] : e;
    const dx = point.clientX - startX;
    const dy = point.clientY - startY;
    if (mode === 'move') {
      setCropFrame((prev) => clampFrame({ ...prev, x: startFrame.x + dx, y: startFrame.y + dy }));
    } else {
      const delta = Math.max(dx, dy);
      setCropFrame((prev) => clampFrame({ ...prev, size: startFrame.size + delta }));
    }
  };

  const endDrag = () => {
    cropDragRef.current = { ...cropDragRef.current, mode: null };
  };

  const handleCancelCrop = () => {
    setCropModalOpen(false);
    setPendingPhotoFile(null);
    setRawPhotoDataUrl(null);
  };

  const handleConfirmCrop = async () => {
    if (!rawPhotoDataUrl) return;
    try {
      const dataUrl = await cropImageToDataUrl({
        imageUrl: rawPhotoDataUrl,
        frame: clampFrame(cropFrame),
        displayWidth: cropViewW,
        displayHeight: cropViewH,
        naturalWidth: cropImageSize.w || cropViewW,
        naturalHeight: cropImageSize.h || cropViewH,
        outputSize: CROP_BOX_SIZE,
      });
      setProfilePicDataUrl(dataUrl);
      setPhotoFile(pendingPhotoFile);
      setPendingPhotoFile(null);
      setRawPhotoDataUrl(null);
      setCropModalOpen(false);
    } catch {
      // ignore failure
    }
  };

  // Sertifikat handlers
  const handleCreateCertificate = async (payload: CreateCertPayloadIds) => {
    const localPreview = URL.createObjectURL(payload.file);
    const dataUrl = await fileToDataUrl(payload.file);
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

  // Jadwal handlers
  const addScheduleRow = () => setSchedules((prev) => [...prev, { day: '', start: '', end: '' }]);
  const removeScheduleRow = (idx: number) => setSchedules((prev) => prev.filter((_, i) => i !== idx));
  const updateScheduleRow = <K extends keyof UIScheduleRow>(idx: number, key: K, val: UIScheduleRow[K]) =>
    setSchedules((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)));

  // Submit guard: bahasa wajib
  const canSubmit =
    !!nama.trim() &&
    !!email.trim() &&
    !!telepon.trim() &&
    selectedLanguages.length > 0;

  // Map sertifikat
  function mapCertificatesToPayload(items: LocalCert[]): CreateGuruFromEntryCertificate[] {
    return items.map((it) => ({
      title: it.title,
      school: it.school,
      instrument_id: it.instrument_id,
      grade_id: it.grade_id,
      certif_path: it.certif_data_url || '',
    }));
  }

  const dayLabel = (day: number | '') =>
    DAY_OPTIONS.find((d) => d.value === day)?.label ?? `Hari ${day || ''}`;

  const toMinutes = (t?: string) => {
    if (!t) return null;
    const [h, m] = t.split(':').map((x) => Number(x));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };

  const toHHMM = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Map jadwal
  function mapSchedulesToPayload(rows: UIScheduleRow[]) {
    const slots: { hari: number; mulai: string; selesai: string; status: 'available' }[] = [];
    for (const r of rows) {
      const isEmpty = r.day === '' && !r.start && !r.end;
      if (isEmpty) continue; // abaikan baris kosong
      if (r.day === '' || !r.start || !r.end) {
        setScheduleError('Lengkapi hari, jam mulai, dan jam selesai untuk setiap baris jadwal.');
        return null;
      }
      const startMin = toMinutes(r.start);
      const endMin = toMinutes(r.end);
      if (startMin == null || endMin == null || endMin <= startMin) {
        setScheduleError('Jam mulai/selesai tidak valid atau jam selesai harus lebih besar.');
        return null;
      }
      const diff = endMin - startMin;
      if (diff < 60) {
        setScheduleError(`Slot ${dayLabel(r.day)} minimal 1 jam.`);
        return null;
      }
      for (let cur = startMin; cur + 60 <= endMin; cur += 60) {
        slots.push({
          hari: Number(r.day),
          mulai: toHHMM(cur),
          selesai: toHHMM(cur + 60),
          status: 'available' as const,
        });
      }
    }
    setScheduleError(null);
    return slots;
  }

  async function handleSubmitCreate() {
    setLangTouched(true);
    if (!canSubmit || createState.status === 'loading') return;

    const basePayload: CreateGuruFromEntryPayload = {
      nama,
      nama_panggilan: namaPanggilan || undefined,
      email,
      no_telp: telepon,
      // kirim NAMA (bukan ID) sesuai kebutuhan BE createGuruFromEntry
      province: selectedProvinceName || undefined,
      city: selectedCityName || undefined,
      alamat: alamat || undefined,
      bio: bio || undefined,
      profile_pic_url: profilePicDataUrl || undefined,
      intro_link: demoLink || undefined,
      bahasa: selectedLanguages,
      certificates: mapCertificatesToPayload(certs),
    };

    const mappedSchedules = mapSchedulesToPayload(schedules);
    if (mappedSchedules === null) return;

    const payloadWithExtras: any = {
      ...basePayload,
      is_abk: abkChoice === 'ya',
      jadwal_available_guru: mappedSchedules,
    };

    await dispatch(createGuruFromEntryThunk({ payload: payloadWithExtras }));
    resetAll();
    navigate('/dashboard-admin/entry-tutor', { replace: true });
  }

  function resetAll() {
    setNama('');
    setNamaPanggilan('');
    setEmail('');
    setTelepon('');
    setDemoLink('');
    setAlamat('');
    setBio('');
    setAbkChoice('');
    setSchedules([]);
    setCerts([]);
    setSelectedLanguages([]);
    setPhotoFile(null);
    setPendingPhotoFile(null);
    setProfilePicDataUrl(null);
    setRawPhotoDataUrl(null);
    setCropModalOpen(false);
    setCropDisplaySize({ w: 0, h: 0 });
    setCropFrame({ x: 0, y: 0, size: 200 });
    setLangTouched(false);
    setScheduleError(null);

    // wilayah
    setProvId('');
    setCityId('');
    setCities([]);

    dispatch(resetGuruCreate());
  }

  // ====== Ringkasan instrumen -> grade (dari sertifikat) ======
  type IG = { instrument_id: number; grade_id: number };
  const pickedIG: IG[] = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of certs) {
      if (typeof c.instrument_id === 'number') m.set(c.instrument_id, c.grade_id);
    }
    return Array.from(m.entries()).map(([instrument_id, grade_id]) => ({ instrument_id, grade_id }));
  }, [certs]);

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

  const cropViewW = cropDisplaySize.w || CROP_BOX_SIZE;
  const cropViewH = cropDisplaySize.h || CROP_BOX_SIZE;

  return (
    <>
      <div className="mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Entry Tutor</h1>
      </header>

      {/* Alert sukses/failed */}
      {createState.status === 'succeeded' && createState.lastCreated && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          Guru berhasil dibuat (ID: <b>{createState.lastCreated.id}</b>, <b>{createState.lastCreated.nama}</b>).
          <button className="ml-3 underline" onClick={resetAll} type="button">Buat lagi</button>
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
            {/* Profile Picture */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="photo" className="text-md font-medium text-slate-700">Profile Picture</label>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e.currentTarget.files?.[0] ?? null)}
                className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-md text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-md file:font-medium hover:file:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {profilePicDataUrl && (
                <div className="flex items-center gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-black/5 bg-neutral-100">
                    <img
                      src={profilePicDataUrl}
                      alt="Preview foto profil"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {photoFile && (
                    <div className="flex flex-col text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Preview</span>
                      <span className="text-slate-600 truncate max-w-[220px]">{photoFile.name}</span>
                    </div>
                  )}
                </div>
              )}
              {photoFile ? (
                <p className="text-xs text-slate-600">Dipilih: {photoFile.name}</p>
              ) : (
                <p className="text-xs text-slate-500">Format gambar (JPG/PNG/WebP). Disarankan rasio 1:1.</p>
              )}
            </div>

            {/* Nama */}
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

            {/* Nama Panggilan */}
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

            {/* Email */}
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

            {/* No Telp */}
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

            {/* Link Demo */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="demoLink" className="text-md font-medium text-slate-700">Link Video Demo</label>
              <input
                id="demoLink"
                name="demoLink"
                required
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
                placeholder="https://youtu.be/xxxxx atau link publik Google Drive"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Bio */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="bio" className="text-md font-medium text-slate-700">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tulis deskripsi singkat tentang pengalaman & keahlian mengajar..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ABK */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <span className="text-md font-medium text-slate-700">Menerima murid ABK?</span>
              <div className="flex items-center gap-4 mt-1">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="abk" value="ya" checked={abkChoice === 'ya'} onChange={() => setAbkChoice('ya')} className="h-4 w-4" />
                  <span>Ya</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="abk" value="tidak" checked={abkChoice === 'tidak'} onChange={() => setAbkChoice('tidak')} className="h-4 w-4" />
                  <span>Tidak</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* === Keahlian Guru === */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Keahlian Guru</h2>

          {/* Ringkasan instrumen (dari sertifikat) */}
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
                    >
                      {info.icon ? (
                        <img src={info.icon} alt={info.name || 'Instrument'} className="h-6 w-6 rounded object-contain ring-1 ring-black/10" />
                      ) : (
                        <span className="inline-grid place-items-center h-6 w-6 rounded bg-white border border-neutral-300 text-[11px] text-neutral-500">♪</span>
                      )}
                      <span className="text-md text-neutral-800">
                        {loadingIG ? 'Memuat…' : info.name ? `${info.name} • ${gradeName || '—'}` : 'Instrumen tidak ditemukan'}
                      </span>
                      <span className="ml-auto text-xs text-[var(--secondary-color)] underline">Ubah</span>
                    </button>
                  );
                })
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenEntryCert(true)}
                  className="w-full h-11 rounded-lg border border-gray-200 bg-neutral-50 px-3 flex items-center gap-2 text-left hover:bg-neutral-100"
                >
                  <span className="inline-grid place-items-center h-6 w-6 rounded bg-white border border-neutral-300 text-[11px] text-neutral-500">♪</span>
                  <span className="text-md text-neutral-800">Belum memilih instrumen</span>
                  <span className="ml-auto text-xs text-[var(--secondary-color)] underline">Ubah</span>
                </button>
              )}
            </div>
          </div>

          {/* Bahasa (required) */}
          <div className="space-y-2">
            <div className="text-md font-medium text-neutral-900">Bahasa <span className="text-red-600">*</span></div>
            <LanguageSelector
              value={selectedLanguages}
              onChange={(v) => {
                setSelectedLanguages(v);
                if (langTouched && v.length > 0) setLangTouched(false);
              }}
              invalid={langTouched && selectedLanguages.length === 0}
              onBlur={() => setLangTouched(true)}
            />
            {!selectedLanguages.length && !langTouched && (
              <div className="mt-1 text-xs text-neutral-500">Pilih satu atau lebih bahasa.</div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Alamat</h2>
          <div className="flex flex-col gap-4">
            {/* Provinsi */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="provinsi" className="text-md font-medium text-slate-700">Provinsi</label>
              <select
                id="provinsi"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={provId}
                onChange={(e) => setProvId(e.target.value)}
              >
                <option value="">{loadingProv ? 'Memuat provinsi…' : 'Pilih provinsi'}</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
              {errProv && <p className="text-xs text-red-600">{errProv}</p>}
            </div>

            {/* Kota/Kabupaten */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="kota" className="text-md font-medium text-slate-700">Kota/Kabupaten</label>
              <select
                id="kota"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-neutral-50"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                disabled={!provId || loadingCity || cities.length === 0}
              >
                <option value="">
                  {!provId ? 'Pilih provinsi dahulu' : loadingCity ? 'Memuat kota/kab…' : 'Pilih kota/kabupaten'}
                </option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.nama}</option>
                ))}
              </select>
              {errCity && <p className="text-xs text-red-600">{errCity}</p>}
            </div>

            {/* Alamat detail */}
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

        {/* === Jadwal Mengajar === */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Jadwal Mengajar</h2>
            <button
              type="button"
              onClick={addScheduleRow}
              className="rounded-full px-3 py-1.5 text-sm bg-[var(--primary-color)] font-semibold hover:opacity-90"
            >
              + Tambah Slot
            </button>
          </div>

          {schedules.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada slot jadwal. Klik <b>Tambah Slot</b> untuk menambahkan.</p>
          ) : (
            <div className="space-y-3">
              {schedules.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border border-neutral-200 rounded-xl p-3">
                  <div className="md:col-span-4 flex flex-col">
                    <label className="text-sm font-medium text-slate-700">Hari</label>
                    <select
                      className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={row.day}
                      onChange={(e) => updateScheduleRow(idx, 'day', e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">Pilih hari</option>
                      {DAY_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3 flex flex-col">
                    <label className="text-sm font-medium text-slate-700">Mulai</label>
                    <input
                      type="time"
                      className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={row.start}
                      onChange={(e) => updateScheduleRow(idx, 'start', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-3 flex flex-col">
                    <label className="text-sm font-medium text-slate-700">Selesai</label>
                    <input
                      type="time"
                      className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={row.end}
                      onChange={(e) => updateScheduleRow(idx, 'end', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2 flex md:justify-end">
                    <button
                      type="button"
                      onClick={() => removeScheduleRow(idx)}
                      className="mt-6 inline-flex items-center rounded-full px-3 py-2 text-xs font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    >
                      Hapus
                    </button>
                  </div>

                  {row.day !== '' && row.start && row.end && row.start >= row.end && (
                    <div className="md:col-span-12 text-xs text-red-600">Jam mulai harus lebih kecil dari jam selesai.</div>
                  )}
                </div>
              ))}
            </div>
          )}
          {scheduleError && <p className="mt-2 text-xs text-red-600">{scheduleError}</p>}
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
        </div>
      </form>

      <EntryCertificateModal
        isOpen={openEntryCert}
        onClose={() => setOpenEntryCert(false)}
        certificates={certs}
        onCreate={handleCreateCertificate}
        onUpdate={handleUpdateCertificate}
      />
      </div>

      {/* Modal crop 1:1 */}
      {cropModalOpen && rawPhotoDataUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Sesuaikan Foto Profil (1:1)</h3>
              <button
                type="button"
                onClick={handleCancelCrop}
                className="rounded-full px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                X
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div
                className="relative mx-auto overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100"
                style={{ width: cropViewW, height: cropViewH, touchAction: 'none' }}
                onMouseMove={handleCropPointerMove}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchMove={(e) => { e.preventDefault(); handleCropPointerMove(e); }}
                onTouchEnd={endDrag}
                onTouchCancel={endDrag}
              >
                <img
                  src={rawPhotoDataUrl}
                  alt="Crop source"
                  className="h-full w-full select-none object-contain"
                  draggable={false}
                />

                {/* Frame 1:1 yang bisa digeser/resize */}
                <div
                  className="absolute border-2 border-[var(--primary-color)] bg-white/5"
                  style={{
                    width: cropFrame.size,
                    height: cropFrame.size,
                    left: cropFrame.x,
                    top: cropFrame.y,
                    cursor: cropDragRef.current.mode ? 'grabbing' : 'move',
                  }}
                  onMouseDown={(e) => { e.preventDefault(); startDrag('move', e); }}
                  onTouchStart={(e) => { e.preventDefault(); startDrag('move', e); }}
                >
                  <div
                    className="absolute right-0 bottom-0 h-4 w-4 translate-x-1 translate-y-1 rounded-sm bg-[var(--primary-color)] border border-white cursor-nwse-resize"
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); startDrag('resize', e); }}
                    onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startDrag('resize', e); }}
                  />
                </div>
              </div>

              <p className="text-xs text-slate-600 text-center">
                Geser atau ubah ukuran frame 1:1. Area di dalam frame yang akan dikirim.
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                className="rounded-full px-5 py-2 text-sm font-semibold bg-[var(--primary-color)] text-black hover:brightness-95"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
