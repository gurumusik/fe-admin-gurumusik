'use client';

import React, { useEffect, useRef, useState } from 'react';
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

import TeacherDemo from '@/assets/images/teacher-demo.png';
import Landscape from '@/assets/images/Landscape.png';
import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import TeacherVacationModal from '@/features/dashboard/components/TeacherVacationModal';
import ManageCertificateModal from '@/features/dashboard/components/ManageCertificateModal';
import type { CertificateItem } from '@/features/dashboard/components/ManageCertificateModal';

type NavKey = 'profile' | 'skills' | 'classes';
type Status = 'aktif' | 'non-aktif';

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

const Chip: React.FC<{ icon?: React.ReactNode; label: string }> = ({ icon, label }) => (
  <span className="inline-flex items-center gap-2 px-3 py-2 text-sm text-black/80">
    {icon ? <span className="text-lg">{icon}</span> : null}
    {label}
  </span>
);

export default function ProfileTutorPage() {
  // ---------- dummy data ----------
  const tutor = {
    name: 'Dicka Taksa Rabbani / NcenN',
    email: 'dickataksa@gmail.com',
    phone: '+62-813-8887-6690',
    location: 'Kota Bekasi, Jawa Barat',
    avatar: TeacherDemo as string,
    instruments: ['Piano', 'Guitar', 'Vocal'],
    languages: ['Bahasa', 'Jepang', 'Inggris'],
    status: 'aktif' as Status,
  };

  const [openManageCert, setOpenManageCert] = useState(false);

  // ====== HASIL APPROVAL SERTIFIKAT (success/error) ======
  const [certApproveResult, setCertApproveResult] = useState<null | 'ok' | 'fail'>(null);
  const simulateCertApproveError = false;

  // ====== HASIL REJECT SERTIFIKAT (success/error) ======
  const [certRejectResult, setCertRejectResult] = useState<null | 'ok' | 'fail'>(null);
  const simulateCertRejectError = false;

  // status tombol aktif/non-aktif
  const [status, setStatus] = useState<Status>(tutor.status);

  // refs section (HTMLElement non-null)
  const profileRef = useRef<HTMLElement>(null!);
  const skillsRef = useRef<HTMLElement>(null!);
  const classesRef = useRef<HTMLElement>(null!);
  const [active, setActive] = useState<NavKey>('profile');

  // ====== Flow modal aktif/non-aktif ======
  type Flow =
    | null
    | 'ask-deactivate'
    | 'ok-deactivate'
    | 'fail-deactivate'
    | 'ask-activate'
    | 'ok-activate'
    | 'fail-activate';
  const [flow, setFlow] = useState<Flow>(null);

  // ====== Flow modal cuti ======
  const [openVacation, setOpenVacation] = useState(false);
  const [vacationResult, setVacationResult] = useState<null | 'ok' | 'fail'>(null);

  // simulasi API (ubah ke true untuk lihat error)
  const simulateErrorDeactivate = false;
  const simulateErrorActivate = false;
  const simulateVacationError = false;

  const openDeactivateAsk = () => setFlow('ask-deactivate');
  const openActivateAsk = () => setFlow('ask-activate');

  const confirmDeactivate = () => {
    setFlow(null);
    setTimeout(() => {
      if (simulateErrorDeactivate) setFlow('fail-deactivate');
      else {
        setStatus('non-aktif');
        setFlow('ok-deactivate');
      }
    }, 0);
  };

  const confirmActivate = () => {
    setFlow(null);
    setTimeout(() => {
      if (simulateErrorActivate) setFlow('fail-activate');
      else {
        setStatus('aktif');
        setFlow('ok-activate');
      }
    }, 0);
  };

  // konfirmasi dari TeacherVacationModal
  const handleVacationConfirm = ({
    startDate,
    endDate,
  }: {
    startDate: string;
    endDate: string;
  }) => {
    console.log('Set vacation:', { startDate, endDate });
    setOpenVacation(false);
    setTimeout(() => {
      setVacationResult(simulateVacationError ? 'fail' : 'ok');
    }, 0);
  };

  // ====== APPROVE CERTIFICATE from ManageCertificateModal (PHASE 3 "Setujui") ======
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleApproveCertificate = (item: any) => {
    console.log('Approve certificate:', item);
    setOpenManageCert(false);
    setTimeout(() => {
      setCertApproveResult(simulateCertApproveError ? 'fail' : 'ok');
    }, 0);
  };

  // ====== REJECT SUBMIT (PHASE 4 "Kirim Laporan") ======
  const handleRejectSubmit = async (
    item: CertificateItem,
    payload: { reason: string; files: File[]; imagesBase64: string[] }
  ) => {
    console.log('Reject submit:', item, payload);
    setOpenManageCert(false);
    setTimeout(() => {
      setCertRejectResult(simulateCertRejectError ? 'fail' : 'ok');
    }, 0);
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
          <span className={cls(isActive ? 'text-[var(--secondary-color)]' : 'text-neutral-500')}>
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
            <button className="flex gap-3 bg-white border border-[var(--secondary-color)] text-[var(--secondary-color)] text-sm rounded-full py-1.5 px-4 items-center">
              <RiArrowLeftLine size={20} />
              <span>Kembali</span>
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setOpenVacation(true)}
                className="bg-white border border-[var(--secondary-color)] text-[var(--secondary-color)] text-sm rounded-full py-1.5 px-4"
              >
                Beri Cuti
              </button>

              {/* Tombol aktif/non-aktif dinamis */}
              {status === 'aktif' ? (
                <button
                  onClick={openDeactivateAsk}
                  className="bg-white border border-[var(--secondary-color)] text-[var(--secondary-color)] text-sm rounded-full py-1.5 px-4"
                >
                  Non-Aktifkan
                </button>
              ) : (
                <button
                  onClick={openActivateAsk}
                  className="bg-white border border-[var(--secondary-color)] text-[var(--secondary-color)] text-sm rounded-full py-1.5 px-4"
                >
                  Aktifkan
                </button>
              )}
            </div>
          </section>

          {/* Profile Guru */}
          <section ref={profileRef} id="profil" className="rounded-2xl bg-white p-4 md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-grid place-items-center w-9 h-9 rounded-full text-white bg-[var(--secondary-color)]">
                <RiUser3Fill size={20} />
              </span>
              <h2 className="text-lg font-semibold text-neutral-900">Profile Guru</h2>
            </div>

            <div className="flex items-start gap-5">
              <img
                src={tutor.avatar}
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
          </section>

          {/* Keahlian Guru */}
          <section ref={skillsRef} id="keahlian" className="rounded-2xl bg-white p-4 md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-grid place-items-center w-9 h-9 rounded-full bg-[var(--accent-purple-color)] text-white">
                <RiMusic2Fill size={20} />
              </span>
              <h2 className="text-lg font-semibold text-neutral-900">Keahlian Guru</h2>
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2 text-md font-medium text-neutral-900">Instrumen Musik</div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenManageCert(true)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenManageCert(true)}
                  className="flex flex-wrap gap-2 items-center rounded-xl border border-neutral-300 hover:bg-neutral-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
                >
                  {tutor.instruments.map((ins) => (
                    <Chip
                      key={ins}
                      label={ins}
                      icon={
                        ins.toLowerCase().includes('piano')
                          ? '🎹'
                          : ins.toLowerCase().includes('guitar')
                          ? '🎸'
                          : '🎤'
                      }
                    />
                  ))}
                  <RiArrowRightSLine size={25} className="ml-auto text-neutral-600" />
                </div>
              </div>

              <div>
                <div className="mb-2 text-md font-medium text-neutral-900">Bahasa</div>
                <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-300">
                  {tutor.languages.map((lang) => (
                    <Chip
                      key={lang}
                      label={lang}
                      icon={lang === 'Bahasa' ? '🇲🇨' : lang === 'Jepang' ? '🇯🇵' : '🇬🇧'}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Detail Kelas */}
          <section ref={classesRef} id="kelas" className="rounded-2xl bg-white p-4 md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-grid place-items-center w-9 h-9 rounded-full bg-[var(--accent-orange-color)] text-white">
                <RiFileList2Fill size={20} />
              </span>
              <h2 className="text-lg font-semibold text-neutral-900">Detail Kelas</h2>
            </div>

            {/* Preview Kelas */}
            <div className="text-lg text-neutral-900 mb-2">Preview Kelas</div>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-200 mb-5">
              <img src={Landscape as string} alt="Preview kelas" className="h-full w-full object-cover" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-black/40 backdrop-blur text-white">
                  <RiPlayMiniFill size={36} />
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="mb-3 border-y border-neutral-400 py-3">
              <div className="text-md font-semibold text-neutral-600 mb-1">Headline</div>
              <p className="text-md font-semibold text-neutral-900">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum mollis nunc a molestie dictum.
              </p>
            </div>

            {/* Tentang Guru */}
            <div className="mb-4 border-b border-neutral-400 pb-3">
              <div className="text-md font-semibold text-neutral-600 mb-1">Tentang Guru</div>
              <p className="text-md leading-relaxed text-neutral-900">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum mollis nunc a molestie dictum.
                Mauris venenatis, felis scelerisque aliquet lacinia, nulla nisl venenatis odio, id blandit mauris ipsum id sapien.
                Vestibulum malesuada orci sit amet pretium facilisis. In lobortis congue augue, a commodo libero tincidunt
                scelerisque. Donec tempor congue lacinia. Phasellus lacinia felis quis placerat commodo odio blandit
                laoreet. Class aptent taciti sociosqu ad litora torquent per conubia nostra.
              </p>
            </div>

            {/* Cocok untuk */}
            <div>
              <div className="text-md font-semibold text-neutral-700 mb-2">Cocok untuk</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {[
                  'Kamu yang mau jago musik',
                  'Kamu yang ingin naik level',
                  'Kamu yang mau jago gitar',
                  'Kamu yang ingin meningkatkan skill',
                  'Anak-anak yang mau belajar musik',
                  'Kamu yang suka kopi',
                ].map((txt, i) => (
                  <div key={i} className="inline-flex items-start gap-2 text-md text-neutral-900 font-semibold">
                    <RiCheckboxCircleFill size={25} className="mt-0.5 text-[var(--accent-green-color)]" />
                    <span>{txt}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT 40% */}
        <aside className="lg:col-span-5 lg:sticky lg:top-20 self-start">
          <div className="rounded-2xl bg-white p-4 md:p-6">
            <h3 className="mb-3 text-lg font-semibold text-neutral-500">Navigasi</h3>
            <div className="space-y-2">
              <NavBtn k="profile" icon={<RiUser3Fill size={25} />} label="Profile Guru" />
              <NavBtn k="skills" icon={<RiMusic2Line size={25} />} label="Keahlian Guru" />
              <NavBtn k="classes" icon={<RiFileList2Line size={25} />} label="Detail Kelas" />
            </div>
          </div>
        </aside>
      </div>

      {/* ===== TeacherVacationModal ===== */}
      <TeacherVacationModal
        isOpen={openVacation}
        onClose={() => setOpenVacation(false)}
        onConfirm={handleVacationConfirm}
      />

      {/* ===== Flow: aktif / non-aktif ===== */}
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
          button2={{ label: 'Ga Jadi Deh', variant: 'outline', onClick: () => setFlow(null) }}
          button1={{ label: 'Ya, Saya Yakin', variant: 'primary', onClick: confirmDeactivate }}
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
          button1={{ label: 'Tutup', variant: 'primary', onClick: () => setFlow(null) }}
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
          button1={{ label: 'Tutup', variant: 'primary', onClick: () => setFlow(null) }}
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
          button2={{ label: 'Ga Jadi Deh', variant: 'outline', onClick: () => setFlow(null) }}
          button1={{ label: 'Ya, Saya Yakin', variant: 'primary', onClick: confirmActivate }}
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
          texts={['Guru ini akan muncul di landing page dan dapat dipesan oleh murid.']}
          button1={{ label: 'Tutup', variant: 'primary', onClick: () => setFlow(null) }}
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
          texts={['Terjadi kendala saat mengaktifkan guru ini. Silakan coba lagi.']}
          button1={{ label: 'Tutup', variant: 'primary', onClick: () => setFlow(null) }}
        />
      )}

      {/* ===== Hasil: cuti (success / error) ===== */}
      {vacationResult && (
        <ConfirmationModal
          isOpen
          onClose={() => setVacationResult(null)}
          align="center"
          widthClass="max-w-md"
          icon={vacationResult === 'ok' ? <RiCheckboxCircleFill /> : <RiCloseLine />}
          iconTone={vacationResult === 'ok' ? 'success' : 'danger'}
          title={vacationResult === 'ok' ? 'Guru Berhasil Dicutikan' : 'Guru Gagal Dicutikan'}
          texts={
            vacationResult === 'ok'
              ? [
                  'Guru ini tidak akan muncul di landing page dan tidak bisa dipesan murid selama periode cuti. Setelah periode berakhir, status guru akan otomatis aktif kembali.',
                ]
              : ['Terjadi kendala saat mencutikan guru ini. Silakan coba lagi beberapa saat lagi.']
          }
          button1={{ label: 'Tutup', variant: 'primary', onClick: () => setVacationResult(null) }}
        />
      )}

      {/* ===== Hasil: APPROVE SERTIFIKAT (success / error) ===== */}
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
              ? ['Instrumen yang diajukan akan tampil pada profil Guru & dapat mengajar instrumen tersebut']
              : ['Maaf, terjadi kendala saat Menyetujui sertifikat. Silakan coba lagi dalam beberapa saat, atau hubungi admin']
          }
          button1={{ label: 'Tutup', variant: 'primary', onClick: () => setCertApproveResult(null) }}
        />
      )}

      {/* ===== Hasil: REJECT SERTIFIKAT (success / error) ===== */}
      {certRejectResult && (
        <ConfirmationModal
          isOpen
          onClose={() => setCertRejectResult(null)}
          align="center"
          widthClass="max-w-md"
          icon={certRejectResult === 'ok' ? <RiCheckboxCircleFill /> : <RiCloseLine />}
          iconTone={certRejectResult === 'ok' ? 'success' : 'danger'}
          title={certRejectResult === 'ok' ? 'Laporan Penolakan Terkirim' : 'Gagal Mengirim Laporan'}
          texts={
            certRejectResult === 'ok'
              ? [
                  'Laporan penolakan sudah terkirim ke guru.',
                  'Instrumen tidak akan ditampilkan pada profil guru.',
                ]
              : ['Terjadi kendala saat mengirim laporan penolakan. Silakan coba lagi beberapa saat lagi.']
          }
          button1={{ label: 'Tutup', variant: 'primary', onClick: () => setCertRejectResult(null) }}
        />
      )}

      <ManageCertificateModal
        isOpen={openManageCert}
        onClose={() => setOpenManageCert(false)}
        onApprove={handleApproveCertificate}
        onRejectSubmit={handleRejectSubmit}  // ⬅️ penting untuk Phase 4
      />
    </div>
  );
}
