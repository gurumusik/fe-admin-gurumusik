/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard-admin/tutor-list/class-list-tutor/profile-tutor/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  RiUser3Fill,
  RiMailLine,
  RiPhoneLine,
  RiCheckboxCircleFill,
  RiMusic2Line,
  RiFileList2Line,
  RiUserLocationLine,
  RiMusic2Fill,
  RiFileList2Fill,
  RiPlayMiniFill,
  RiArrowLeftLine,
  RiQuestionFill,
  RiCloseLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import defaultUser from '@/assets/images/default-user.png';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { AppDispatch } from '@/app/store';

import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import TeacherVacationModal from '@/features/dashboard/components/TeacherVacationModal';
import ManageCertificateModal from '@/features/dashboard/components/ManageCertificateModal';
import type { CertificateItem, CertStatus } from '@/features/dashboard/components/ManageCertificateModal';

import { fetchGuruProfileThunk, selectGuruProfile } from '@/features/slices/guru/slice';

// ⬇️ thunk untuk update status sertifikat
import { patchSertifikatStatusThunk } from '@/features/slices/sertifikat/slice';

// utils
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { getLanguageIcon } from '@/utils/getLanguageIcon';

// API
import { updateGuruStatus } from '@/services/api/guru.api';

type NavKey = 'profile' | 'skills' | 'classes';
type Status = 'aktif' | 'non-aktif';
type LocationState = { guruId?: number };

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

const Chip: React.FC<{ icon?: React.ReactNode; label: string }> = ({ icon, label }) => (
  <span className="inline-flex items-center gap-2 px-3 py-2 text-sm text-black/80">
    {icon ? <span className="text-lg">{icon}</span> : null}
    {label}
  </span>
);

/** VM instrumen (lengkap untuk filter & icon) */
type TutorVMInstrument = {
  instrumentId: number | null;
  name: string;
  icon: string | null;
  gradeId: number | null;
  gradeName: string | null;
};

/* ===================== YouTube helpers ===================== */
function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  const str = String(input).trim();

  // Value yang jelas tidak valid
  if (!str || str === '-' || str === '#' || str.toLowerCase() === 'null') return null;

  // Kalau langsung ID 11 karakter
  if (/^[A-Za-z0-9_-]{11}$/.test(str)) return str;

  let u: URL;
  try {
    u = new URL(str);
  } catch {
    // Bukan URL valid → coba cari pattern ID 11 karakter, kalau nggak ada ya null
    const m = str.match(/[A-Za-z0-9_-]{11}/);
    return m ? m[0] : null;
  }

  const host = u.hostname.replace(/^www\./, '');

  // youtu.be/<id>
  if (host === 'youtu.be') {
    const id = u.pathname.split('/').filter(Boolean)[0];
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;
  }

  // youtube.com/* variasi
  if (host.endsWith('youtube.com')) {
    // /watch?v=<id>
    if (u.pathname === '/watch') {
      const v = u.searchParams.get('v');
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    }

    const parts = u.pathname.split('/').filter(Boolean);
    const takeNext = (marker: string) => {
      const idx = parts.indexOf(marker);
      const id = idx >= 0 ? parts[idx + 1] : '';
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    };

    const fromPath = takeNext('embed') || takeNext('shorts');
    if (fromPath) return fromPath;
  }

  // Fallback terakhir: cari pattern 11 char di string
  const m = str.match(/[A-Za-z0-9_-]{11}/);
  return m ? m[0] : null;
}

function getYouTubeThumb(id: string | null): string | null {
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/* ===================== Map status backend -> modal ===================== */
const mapCertStatus = (raw?: string | null): CertStatus => {
  const v = String(raw || '').toLowerCase();
  if (v === 'approved' || v === 'disetujui') return 'Disetujui';
  if (v === 'rejected' || v === 'tidak_disetujui' || v === 'ditolak') return 'Tidak Disetujui';
  return 'Menunggu Verifikasi';
};

export default function ProfileTutorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { state } = useLocation() as { state?: LocationState };

  // Ambil guruId dari state atau query (?guru_id / ?id)
  const search =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams('');
  const guruIdFromQuery = Number(search.get('guru_id')) || Number(search.get('id')) || undefined;
  const guruId = state?.guruId ?? guruIdFromQuery;

  // Redux profile
  const profile = useSelector(selectGuruProfile);
  const p = profile.data;

  // Fetch profile awal (admin boleh override dengan ?id)
  useEffect(() => {
    if (guruId) dispatch(fetchGuruProfileThunk({ id: guruId } as any));
    else dispatch(fetchGuruProfileThunk() as any);
  }, [dispatch, guruId]);

  // Lookup nama & icon instrument + nama grade
  const lookups = useMemo(() => {
    const instNameById = new Map<number, string>();
    const instIconById = new Map<number, string | null>();
    const gradeNameById = new Map<number, string>();
    (p?.instruments ?? []).forEach((it) => {
      const iid = it.instrument?.id ?? it.instrument_id;
      const gid = it.grade?.id ?? it.grade_id;
      if (typeof iid === 'number') {
        if (it.instrument?.nama) instNameById.set(iid, it.instrument.nama);
        const iconUrl = resolveImageUrl(it.instrument?.icon ?? null);
        instIconById.set(iid, iconUrl);
      }
      if (typeof gid === 'number' && it.grade?.nama) gradeNameById.set(gid, it.grade.nama);
    });
    return { instNameById, instIconById, gradeNameById };
  }, [p?.instruments]);

  // Susun daftar sertifikat (payload -> CertificateItem[])
// Susun daftar sertifikat (payload -> CertificateItem[])
  const allCertificates: CertificateItem[] = useMemo(() => {
    const rows = p?.sertifikat ?? [];

    return rows.map((s: any): CertificateItem => {
      // ⬇⬇ raw boleh null
      const rawFileUrl: string | null =
        s.certif_path ? resolveImageUrl(s.certif_path) : null;

      // ⬇⬇ DI SINI kita paksa jadi string | undefined (bukan null)
      const fileUrl: string | undefined = rawFileUrl ?? undefined;

      const instrumentName: string =
        s.instrument?.nama ||
        (typeof s.instrument_id === 'number' &&
          lookups.instNameById.get(s.instrument_id)) ||
        '—';

      const instrumentIcon: string | undefined =
        (s.instrument?.icon && resolveImageUrl(s.instrument.icon)) ||
        (typeof s.instrument_id === 'number' &&
          lookups.instIconById.get(s.instrument_id)) ||
        undefined;

      const gradeName: string =
        s.grade?.nama ||
        (typeof s.grade_id === 'number' &&
          lookups.gradeNameById.get(s.grade_id)) ||
        '—';

      return {
        id: s.id,
        title: s.keterangan || 'Sertifikat',
        school: s.penyelenggara || '—',
        instrument: instrumentName,
        instrumentIcon,
        grade: gradeName,
        status: mapCertStatus(s.status),
        link: fileUrl,                 // ✅ sekarang string | undefined
        rejectReason: s.alasan_penolakan ?? null,
      };
    });
  }, [p?.sertifikat, lookups]);

  // View model
  const tutor = useMemo(() => {
    const u = p?.user;
    const d = p?.detail;

    const name = u?.nama ?? '—';
    const email = u?.email ?? '—';
    const phone = u?.no_telp ?? '—';
    const city = u?.city ?? '';
    const province = u?.province ?? '';
    const location = [city, province].filter(Boolean).join(', ') || '—';
    const avatar = u?.profile_pic_url || '/avatar-placeholder.png';

    const instruments: TutorVMInstrument[] =
      (p?.instruments ?? [])
        .map((x: any) => ({
          instrumentId: x.instrument?.id ?? x.instrument_id ?? null,
          name: x.instrument?.nama ?? '',
          icon: resolveImageUrl(x.instrument?.icon ?? null),
          gradeId: x.grade?.id ?? x.grade_id ?? null,
          gradeName: x.grade?.nama ?? null,
        }))
        .filter((it) => it.name) as TutorVMInstrument[];

    const languages = Array.isArray(d?.bahasa) ? d!.bahasa : [];

    const raw = (u?.status_akun || '').toLowerCase();
    const status: Status = raw === 'non_aktif' ? 'non-aktif' : 'aktif';

    const introLink = (d?.intro_link || '').trim();
    const videoId = extractYouTubeId(introLink);
    const previewThumb = getYouTubeThumb(videoId);
    const previewHref = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

    return {
      name,
      email,
      phone,
      location,
      avatar,
      instruments,
      languages,
      status,
      previewThumb,
      previewHref,
    };
  }, [p]);

  // ====== UI & flows ======
  const [status, setStatus] = useState<Status>('aktif');
  const [isUpdating, setIsUpdating] = useState(false);
  useEffect(() => {
    if (tutor.status) setStatus(tutor.status);
  }, [tutor.status]);

  // ==== visibility tombol berdasarkan status_akun backend ====
  const statusAkunRaw = String(p?.user?.status_akun || '').toLowerCase();
  const showBeriCuti = statusAkunRaw === 'aktif'; // hanya tampil saat aktif
  const showToggleAktif = statusAkunRaw !== 'cuti'; // hilang saat cuti

  // State modal sertifikat
  const [openManageCert, setOpenManageCert] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<TutorVMInstrument | null>(null);

  // Sertifikat terfilter berdasarkan chip
  const filteredCertificates: CertificateItem[] = useMemo(() => {
    if (!selectedInstrument?.instrumentId) return allCertificates;
    return allCertificates.filter(
      (c) => c.instrument.toLowerCase() === selectedInstrument.name.toLowerCase()
    );
  }, [selectedInstrument, allCertificates]);

  const profileRef = useRef<HTMLElement>(null!);
  const skillsRef = useRef<HTMLElement>(null!);
  const classesRef = useRef<HTMLElement>(null!);
  const [active, setActive] = useState<NavKey>('profile');

  type Flow =
    | null
    | 'ask-deactivate'
    | 'ok-deactivate'
    | 'fail-deactivate'
    | 'ask-activate'
    | 'ok-activate'
    | 'fail-activate';
  const [flow, setFlow] = useState<Flow>(null);

  const [openVacation, setOpenVacation] = useState(false);
  const [vacationResult, setVacationResult] = useState<null | 'ok' | 'fail'>(null);

  const openDeactivateAsk = () => setFlow('ask-deactivate');
  const openActivateAsk = () => setFlow('ask-activate');

  const doRefreshProfile = () => {
    if (guruId) dispatch(fetchGuruProfileThunk({ id: guruId } as any));
    else dispatch(fetchGuruProfileThunk() as any);
  };

  const confirmDeactivate = async () => {
    try {
      setFlow(null);
      setIsUpdating(true);
      await updateGuruStatus({ status_akun: 'non_aktif', id: guruId } as any);
      setStatus('non-aktif');
      doRefreshProfile();
      setFlow('ok-deactivate');
    } catch {
      setFlow('fail-deactivate');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmActivate = async () => {
    try {
      setFlow(null);
      setIsUpdating(true);
      await updateGuruStatus({ status_akun: 'aktif', id: guruId } as any);
      setStatus('aktif');
      doRefreshProfile();
      setFlow('ok-activate');
    } catch {
      setFlow('fail-activate');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVacationConfirm = async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    try {
      setOpenVacation(false);
      setIsUpdating(true);
      await updateGuruStatus({
        status_akun: 'cuti',
        cuti_start_date: startDate,
        cuti_end_date: endDate,
        id: guruId,
      } as any);
      doRefreshProfile();
      setVacationResult('ok');
    } catch {
      setVacationResult('fail');
    } finally {
      setIsUpdating(false);
    }
  };

  // ====== hasil approve/reject sertifikat
  const [certApproveResult, setCertApproveResult] = useState<null | 'ok' | 'fail'>(null);
  const [certRejectResult, setCertRejectResult] = useState<null | 'ok' | 'fail'>(null);

  const handleApproveCertificate = async (item: CertificateItem) => {
    try {
      await dispatch(
        patchSertifikatStatusThunk({ id: item.id, status: 'approved' })
      ).unwrap();

      setOpenManageCert(false);
      setCertApproveResult('ok');
      doRefreshProfile();
    } catch (e) {
      console.error(e);
      setCertApproveResult('fail');
    }
  };

  const handleRejectSubmit = async (item: CertificateItem, payload: { reason: string }) => {
    try {
      await dispatch(
        patchSertifikatStatusThunk({
          id: item.id,
          status: 'rejected',
          alasan_penolakan: payload.reason,
        })
      ).unwrap();

      setOpenManageCert(false);
      setCertRejectResult('ok');
      doRefreshProfile();
    } catch (e) {
      console.error(e);
      setCertRejectResult('fail');
    }
  };

  // scrollspy
  useEffect(() => {
    const sections: Array<[NavKey, React.RefObject<HTMLElement>]> = [
      ['profile', profileRef],
      ['skills', skillsRef],
      ['classes', classesRef],
    ];
    const onScroll = () => {
      const offsets = sections.map(([k, r]) => {
        const el = r.current;
        if (!el) return { k, top: Number.POSITIVE_INFINITY };
        const rect = el.getBoundingClientRect();
        const topScore = rect.top >= -100 ? rect.top : Math.abs(rect.top) + 1000;
        return { k, top: topScore };
      });
      offsets.sort((a, b) => a.top - b.top);
      setActive(offsets[0].k);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (key: NavKey) => {
    const map: Record<NavKey, React.RefObject<HTMLElement>> = {
      profile: profileRef,
      skills: skillsRef,
      classes: classesRef,
    };
    map[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const NavBtn: React.FC<{ k: NavKey; icon: React.ReactNode; label: string }> = ({
    k,
    icon,
    label,
  }) => {
    const isActive = active === k;
    return (
      <button
        onClick={() => goTo(k)}
        className={cls(
          'w-full flex items-center justify-between rounded-xl p-3 text-md transition',
          isActive
            ? 'bg-[var(--secondary-light-color)] border-none text-neutral-900'
            : 'bg-white border-black/10 text-neutral-600 hover:bg-neutral-50'
        )}
      >
        <span className="inline-flex items-center gap-3">
          <span
            className={cls(
              isActive ? 'text-[var(--secondary-color)]' : 'text-neutral-500'
            )}
          >
            {icon}
          </span>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 60% */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top actions */}
          <section className="flex justify-between">
            <button
              onClick={() => typeof window !== 'undefined' && window.history.back()}
              className="flex gap-3 bg-white border border-[var(--secondary-color)] text-[var(--secondary-color)] text-sm rounded-full py-1.5 px-4 items-center"
            >
              <RiArrowLeftLine size={20} />
              <span>Kembali</span>
            </button>

            <div className="flex gap-3">
              {showBeriCuti && (
                <button
                  onClick={() => setOpenVacation(true)}
                  disabled={isUpdating}
                  className={cls(
                    'bg-white border border-[var(--secondary-color)] text-[var(--secondary-color)] text-sm rounded-full py-1.5 px-4',
                    isUpdating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Beri Cuti
                </button>
              )}

              {showToggleAktif &&
                (status === 'aktif' ? (
                  <button
                    onClick={openDeactivateAsk}
                    disabled={isUpdating}
                    className={cls(
                      'bg-white border border-[var(--secondary-color)] text-[var(--secondary-color)] text-sm rounded-full py-1.5 px-4',
                      isUpdating && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Non-Aktifkan
                  </button>
                ) : (
                  <button
                    onClick={openActivateAsk}
                    disabled={isUpdating}
                    className={cls(
                      'bg-white border border-[var(--secondary-color)] text-[var(--secondary-color)] text-sm rounded-full py-1.5 px-4',
                      isUpdating && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Aktifkan
                  </button>
                ))}
            </div>
          </section>

          {/* Profile Guru */}
          <section
            ref={profileRef}
            id="profil"
            className="rounded-2xl bg-white p-4 md:p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-grid place-items-center w-9 h-9 rounded-full text-white bg-[var(--secondary-color)]">
                <RiUser3Fill size={20} />
              </span>
              <h2 className="text-lg font-semibold text-neutral-900">Profile Guru</h2>
            </div>

            {profile.status === 'loading' ? (
              <div className="flex items-start gap-5">
                <div className="h-20 w-20 rounded-full bg-black/10 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-56 bg-black/10 rounded animate-pulse" />
                  <div className="h-4 w-72 bg-black/10 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-black/10 rounded animate-pulse" />
                </div>
              </div>
            ) : profile.status === 'failed' ? (
              <div className="text-red-600 text-sm">{profile.error}</div>
            ) : (
              <div className="flex items-start gap-5">
                <img
                  src={resolveImageUrl(tutor.avatar) || defaultUser}
                  alt={tutor.name}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-black/5"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900">{tutor.name}</h3>

                  <div className="mt-2 flex flex-wrap items-start gap-x-5 gap-y-2 text-md text-neutral-900">
                    <div className="flex flex-col gap-2">
                      <div className="inline-flex items-center gap-2">
                        <RiMailLine />
                        {tutor.email}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <RiUserLocationLine className="text-[var(--secondary-color)]" />
                        <div className="text-[var(--secondary-color)] hover:underline cursor-pointer">
                          {tutor.location}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2">
                      <RiPhoneLine />
                      {tutor.phone}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Keahlian Guru */}
          <section
            ref={skillsRef}
            id="keahlian"
            className="rounded-2xl bg-white p-4 md:p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-grid place-items-center w-9 h-9 rounded-full bg-[var(--accent-purple-color)] text-white">
                <RiMusic2Fill size={20} />
              </span>
              <h2 className="text-lg font-semibold text-neutral-900">Keahlian Guru</h2>
            </div>

            {profile.status !== 'succeeded' ? (
              <div className="space-y-3">
                <div className="h-6 w-40 bg-black/10 rounded animate-pulse" />
                <div className="h-10 w-full bg-black/5 rounded-xl animate-pulse" />
                <div className="h-6 w-24 bg-black/10 rounded animate-pulse" />
                <div className="h-10 w-full bg-black/5 rounded-xl animate-pulse" />
              </div>
            ) : (
              <div className="space-y-5">
                {/* Instrumen Musik (klik -> modal, auto filter) */}
                <div>
                  <div className="mb-2 text-md font-medium text-neutral-900">
                    Instrumen Musik
                  </div>
                  <div className="flex flex-wrap gap-2 items-center rounded-xl border border-neutral-300 p-1.5">
                    {tutor.instruments.length ? (
                      tutor.instruments.map((ins) => (
                        <button
                          key={`${ins.name}-${ins.instrumentId ?? 'noid'}`}
                          type="button"
                          onClick={() => {
                            setSelectedInstrument(ins);
                            setOpenManageCert(true);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-black/80 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
                          title={
                            ins.gradeName
                              ? `${ins.name} • ${ins.gradeName}`
                              : ins.name
                          }
                        >
                          {ins.icon ? (
                            <img
                              src={ins.icon}
                              alt={ins.name}
                              className="h-5 w-5 object-contain"
                              loading="lazy"
                            />
                          ) : null}
                          <span>
                            {ins.name}
                            {ins.gradeName ? ` • ${ins.gradeName}` : ''}
                          </span>
                        </button>
                      ))
                    ) : (
                      <span className="px-3 py-2 text-sm text-black/50">—</span>
                    )}

                    {Boolean(allCertificates.length) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInstrument(null);
                          setOpenManageCert(true);
                        }}
                        className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-sm text-[var(--secondary-color)] rounded-lg hover:bg-neutral-50"
                      >
                        Lihat Semua <RiArrowRightSLine size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bahasa */}
                <div>
                  <div className="mb-2 text-md font-medium text-neutral-900">Bahasa</div>
                  <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-300">
                    {tutor.languages.length ? (
                      tutor.languages.map((lang) => {
                        const iconUrl = getLanguageIcon(lang || '');
                        return (
                          <Chip
                            key={lang}
                            label={lang}
                            icon={
                              iconUrl ? (
                                <img
                                  src={iconUrl}
                                  alt={lang}
                                  className="h-5 w-5 object-contain"
                                  loading="lazy"
                                />
                              ) : null
                            }
                          />
                        );
                      })
                    ) : (
                      <span className="px-3 py-2 text-sm text-black/50">—</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Detail Kelas */}
          <section
            ref={classesRef}
            id="kelas"
            className="rounded-2xl bg-white p-4 md:p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-grid place-items-center w-9 h-9 rounded-full bg-[var(--accent-orange-color)] text-white">
                <RiFileList2Fill size={20} />
              </span>
              <h2 className="text-lg font-semibold text-neutral-900">Detail Kelas</h2>
            </div>

            {/* Preview Kelas */}
            <div className="text-lg text-neutral-900 mb-2">Preview Kelas</div>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-200 mb-5">
              {tutor.previewThumb && tutor.previewHref ? (
                <a
                  href={tutor.previewHref}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full h-full"
                  aria-label="Buka video intro di YouTube"
                >
                  <img
                    src={tutor.previewThumb}
                    alt="Thumbnail video intro"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-black/40 backdrop-blur text-white">
                      <RiPlayMiniFill size={36} />
                    </span>
                  </div>
                </a>
              ) : (
                // DEFAULT: abu-abu + icon play di tengah (tidak bisa diklik)
                <div className="w-full h-full grid place-items-center">
                  <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-black/30 text-white">
                    <RiPlayMiniFill size={36} />
                  </span>
                </div>
              )}
            </div>

            {/* Headline */}
            <div className="mb-3 border-y border-neutral-400 py-3">
              <div className="text-md font-semibold text-neutral-600 mb-1">
                Headline
              </div>
              <p className="text-md font-semibold text-neutral-900">
                {p?.detail?.title || '—'}
              </p>
            </div>

            {/* Tentang Guru */}
            <div className="mb-4 border-b border-neutral-400 pb-3">
              <div className="text-md font-semibold text-neutral-600 mb-1">
                Tentang Guru
              </div>
              <p className="text-md leading-relaxed text-neutral-900">
                {p?.user?.bio || '—'}
              </p>
            </div>

            {/* Cocok untuk */}
            <div>
              <div className="text-md font-semibold text-neutral-700 mb-2">
                Cocok untuk
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {(
                  (p?.detail?.designed_for && p.detail.designed_for.length > 0
                    ? p.detail.designed_for
                    : p?.detail?.appropriate_list ?? [])
                )
                  .slice(0, 6)
                  .map((txt, i) => (
                    <div
                      key={i}
                      className="inline-flex items-start gap-2 text-md text-neutral-900 font-semibold"
                    >
                      <RiCheckboxCircleFill
                        size={25}
                        className="mt-0.5 text-[var(--accent-green-color)]"
                      />
                      <span>{txt}</span>
                    </div>
                  ))}

                {(!p?.detail?.designed_for || p.detail.designed_for.length === 0) &&
                  (!p?.detail?.appropriate_list ||
                    p.detail.appropriate_list.length === 0) && (
                    <div className="text-neutral-500">—</div>
                  )}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT 40% */}
        <aside className="lg:col-span-5 lg:sticky lg:top-20 self-start">
          <div className="rounded-2xl bg-white p-4 md:p-6">
            <h3 className="mb-3 text-lg font-semibold text-neutral-500">
              Navigasi
            </h3>
            <div className="space-y-2">
              <NavBtn k="profile" icon={<RiUser3Fill size={25} />} label="Profile Guru" />
              <NavBtn k="skills" icon={<RiMusic2Line size={25} />} label="Keahlian Guru" />
              <NavBtn k="classes" icon={<RiFileList2Line size={25} />} label="Detail Kelas" />
            </div>
          </div>
        </aside>
      </div>

      {/* ====== Modals & flows ====== */}
      <TeacherVacationModal
        isOpen={openVacation}
        onClose={() => setOpenVacation(false)}
        onConfirm={handleVacationConfirm}
      />

      {/* Flows konfirmasi aktif/nonaktif */}
      {[
        'ask-deactivate',
        'ok-deactivate',
        'fail-deactivate',
        'ask-activate',
        'ok-activate',
        'fail-activate',
      ].includes(String(flow)) && (
        <>
          {flow === 'ask-deactivate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-lg"
              icon={<RiQuestionFill />}
              iconTone="warning"
              title="Yakin…Mau Nonaktifkan Guru?"
              texts={[
                'Kalau dinonaktifkan, guru ini tidak akan muncul di landing page dan tidak bisa dipesan oleh murid.',
              ]}
              button2={{
                label: 'Ga Jadi Deh',
                variant: 'outline',
                onClick: () => setFlow(null),
              }}
              button1={{
                label: isUpdating ? 'Memproses…' : 'Ya, Saya Yakin',
                variant: 'primary',
                onClick: confirmDeactivate,
              }}
            />
          )}
          {flow === 'ok-deactivate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-lg"
              icon={<RiCheckboxCircleFill />}
              iconTone="success"
              title="Guru Berhasil Dinonaktifkan"
              texts={[
                'Guru ini sudah tidak akan muncul di landing page dan tidak bisa dipesan oleh murid.',
              ]}
              button1={{
                label: 'Tutup',
                variant: 'primary',
                onClick: () => setFlow(null),
              }}
            />
          )}
          {flow === 'fail-deactivate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-md"
              icon={<RiCloseLine />}
              iconTone="danger"
              title="Guru Gagal Dinonaktifkan"
              texts={[
                'Terjadi kendala saat menonaktifkan guru ini. Silakan coba lagi beberapa saat lagi.',
              ]}
              button1={{
                label: 'Tutup',
                variant: 'primary',
                onClick: () => setFlow(null),
              }}
            />
          )}

          {flow === 'ask-activate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-lg"
              icon={<RiQuestionFill />}
              iconTone="warning"
              title="Yakin…Mau Aktifkan Guru?"
              texts={[
                'Kalau diaktifkan, guru ini akan muncul di landing page dan dapat dipesan oleh murid.',
              ]}
              button2={{
                label: 'Ga Jadi Deh',
                variant: 'outline',
                onClick: () => setFlow(null),
              }}
              button1={{
                label: isUpdating ? 'Memproses…' : 'Ya, Saya Yakin',
                variant: 'primary',
                onClick: confirmActivate,
              }}
            />
          )}
          {flow === 'ok-activate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-md"
              icon={<RiCheckboxCircleFill />}
              iconTone="success"
              title="Guru Berhasil Diaktifkan"
              texts={[
                'Guru ini akan muncul di landing page dan dapat dipesan oleh murid.',
              ]}
              button1={{
                label: 'Tutup',
                variant: 'primary',
                onClick: () => setFlow(null),
              }}
            />
          )}
          {flow === 'fail-activate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-md"
              icon={<RiCloseLine />}
              iconTone="danger"
              title="Guru Gagal Diaktifkan"
              texts={[
                'Terjadi kendala saat mengaktifkan guru ini. Silakan coba lagi.',
              ]}
              button1={{
                label: 'Tutup',
                variant: 'primary',
                onClick: () => setFlow(null),
              }}
            />
          )}
        </>
      )}

      {vacationResult && (
        <ConfirmationModal
          isOpen
          onClose={() => setVacationResult(null)}
          align="center"
          widthClass="max-w-md"
          icon={
            vacationResult === 'ok' ? <RiCheckboxCircleFill /> : <RiCloseLine />
          }
          iconTone={vacationResult === 'ok' ? 'success' : 'danger'}
          title={
            vacationResult === 'ok'
              ? 'Guru Berhasil Dicutikan'
              : 'Guru Gagal Dicutikan'
          }
          texts={
            vacationResult === 'ok'
              ? [
                  'Guru ini tidak akan muncul di landing page dan tidak bisa dipesan murid selama periode cuti. Setelah periode berakhir, status guru akan otomatis aktif kembali.',
                ]
              : [
                  'Terjadi kendala saat mencutikan guru ini. Silakan coba lagi beberapa saat lagi.',
                ]
          }
          button1={{
            label: 'Tutup',
            variant: 'primary',
            onClick: () => setVacationResult(null),
          }}
        />
      )}

      {/* ====== Hasil Approve Sertifikat ====== */}
      {certApproveResult && (
        <ConfirmationModal
          isOpen
          onClose={() => setCertApproveResult(null)}
          align="center"
          widthClass="max-w-md"
          icon={certApproveResult === 'ok' ? <RiCheckboxCircleFill /> : <RiCloseLine />}
          iconTone={certApproveResult === 'ok' ? 'success' : 'danger'}
          title={
            certApproveResult === 'ok'
              ? 'Sertifikat Berhasil Disetujui'
              : 'Sertifikat Gagal Disetujui'
          }
          texts={
            certApproveResult === 'ok'
              ? [
                  'Instrumen yang diajukan akan tampil pada profil Guru & dapat mengajar instrumen tersebut.',
                ]
              : [
                  'Maaf, terjadi kendala saat menyetujui sertifikat. Silakan coba lagi.',
                ]
          }
          button1={{
            label: 'Tutup',
            variant: 'primary',
            onClick: () => setCertApproveResult(null),
          }}
        />
      )}

      {/* Hasil REJECT */}
      {certRejectResult && (
        <ConfirmationModal
          isOpen
          onClose={() => setCertRejectResult(null)}
          align="center"
          widthClass="max-w-md"
          icon={certRejectResult === 'ok' ? <RiCheckboxCircleFill /> : <RiCloseLine />}
          iconTone={certRejectResult === 'ok' ? 'success' : 'danger'}
          title={
            certRejectResult === 'ok'
              ? 'Laporan Penolakan Terkirim'
              : 'Gagal Mengirim Laporan'
          }
          texts={
            certRejectResult === 'ok'
              ? [
                  'Status sertifikat telah diperbarui menjadi Ditolak dan alasan penolakan tersimpan.',
                ]
              : [
                  'Terjadi kendala saat menolak sertifikat. Silakan coba lagi.',
                ]
          }
          button1={{
            label: 'Tutup',
            variant: 'primary',
            onClick: () => setCertRejectResult(null),
          }}
        />
      )}

      {/* Modal ManageCertificate: pakai payload & icon */}
      <ManageCertificateModal
        isOpen={openManageCert}
        onClose={() => {
          setOpenManageCert(false);
          setSelectedInstrument(null);
        }}
        certificates={filteredCertificates}
        onApprove={handleApproveCertificate}
        onRejectSubmit={handleRejectSubmit}
      />
    </div>
  );
}
