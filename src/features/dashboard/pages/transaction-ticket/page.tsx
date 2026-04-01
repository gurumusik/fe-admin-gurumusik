'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RiTicket2Line,
  RiSearchLine,
  RiUser3Line,
  RiUserStarLine,
  RiCalendar2Line,
  RiTimeLine,
  RiClipboardLine,
  RiCloseLine,
  RiCheckLine,
} from 'react-icons/ri';
import { listStudents, type StudentListItem } from '@/services/api/murid.api';
import { listGuru } from '@/services/api/guru.api';
import { listPrograms } from '@/services/api/program.api';
import { listInstruments } from '@/services/api/instrument.api';
import { listAllGrades } from '@/services/api/grade.api';
import {
  adminCheckoutTransaksi,
  getTeacherSchedule,
  listTransaksiPackages,
  type TeacherScheduleItem,
  type TransaksiPackageItem,
} from '@/services/api/transaksi.api';

const languageOptions = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'cn', label: 'Mandarin' },
];

const DAY_MAP: Record<string, number> = {
  minggu: 0,
  sunday: 0,
  senin: 1,
  monday: 1,
  selasa: 2,
  tuesday: 2,
  rabu: 3,
  wednesday: 3,
  kamis: 4,
  thursday: 4,
  jumat: 5,
  friday: 5,
  sabtu: 6,
  saturday: 6,
};

const dayLabel = (d: number | string | null | undefined) => {
  const idx = Number(d);
  const map = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  if (Number.isFinite(idx)) return map[idx] ?? String(d ?? '-');
  const key = String(d ?? '').trim().toLowerCase();
  if (!key) return '-';
  const resolved = DAY_MAP[key];
  return Number.isFinite(resolved) ? map[resolved] : String(d ?? '-');
};

const parseScheduleDay = (d: number | string | null | undefined): number | null => {
  if (d === null || d === undefined) return null;
  const idx = Number(d);
  if (Number.isFinite(idx)) return idx;
  const key = String(d).trim().toLowerCase();
  if (!key) return null;
  const mapped = DAY_MAP[key];
  return Number.isFinite(mapped) ? mapped : null;
};

const formatDateInput = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateLabel = (raw: string) => {
  if (!raw) return '-';
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getUpcomingDatesForDay = (day: number, monthsAhead = 3): string[] => {
  if (!Number.isFinite(day)) return [];
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(base);
  end.setMonth(end.getMonth() + Math.max(1, monthsAhead));

  const diff = (day - base.getDay() + 7) % 7;
  const first = new Date(base);
  first.setDate(base.getDate() + diff);

  const out: string[] = [];
  for (let d = new Date(first); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 7)) {
    out.push(formatDateInput(d));
  }
  return out;
};

const toKey = (value: string | null | undefined) => String(value ?? '').trim().toLowerCase();

const formatIDR = (n?: number | null) =>
  typeof n === 'number'
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
    : '-';

const useDebouncedValue = <T,>(value: T, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

type StudentOption = {
  id: number;
  uuid: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type GuruOption = {
  id: number;
  nama: string;
  nama_panggilan?: string | null;
  email?: string | null;
  no_telp?: string | null;
  city?: string | null;
};

type CheckoutResult = {
  id: number;
  code?: string | null;
  status?: string | null;
  total?: number | null;
  url: string;
};

function resolveWebBase(): string {
  const raw = (import.meta as any)?.env?.VITE_WEB_BASE_URL ?? '';
  const cleaned = String(raw || '').trim().replace(/\/+$/, '');
  if (cleaned) return cleaned;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export default function TransactionTicketPage() {
  const [studentQuery, setStudentQuery] = useState('');
  const [studentResults, setStudentResults] = useState<StudentOption[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

  const [teacherQuery, setTeacherQuery] = useState('');
  const [teacherResults, setTeacherResults] = useState<GuruOption[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<GuruOption | null>(null);

  const [programs, setPrograms] = useState<Array<{ id: number; nama_program: string }>>([]);
  const [instruments, setInstruments] = useState<Array<{ id: number; nama_instrumen: string }>>([]);
  const [grades, setGrades] = useState<Array<{ id: number; nama_grade: string }>>([]);

  const [programId, setProgramId] = useState<number | ''>('');
  const [instrumentId, setInstrumentId] = useState<number | ''>('');
  const [gradeId, setGradeId] = useState<number | ''>('');
  const [packages, setPackages] = useState<TransaksiPackageItem[]>([]);
  const [paketKey, setPaketKey] = useState('');

  const [schedules, setSchedules] = useState<TeacherScheduleItem[]>([]);
  const [scheduleId, setScheduleId] = useState<number | ''>('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [bahasa, setBahasa] = useState('id');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [allowedStartDates, setAllowedStartDates] = useState<string[]>([]);
  const [experienced, setExperienced] = useState<boolean | null>(null);
  const [forceAutoApprove, setForceAutoApprove] = useState(true);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [copied, setCopied] = useState(false);

  const debouncedStudentQuery = useDebouncedValue(studentQuery);
  const debouncedTeacherQuery = useDebouncedValue(teacherQuery);

  const selectedPackage = useMemo(() => {
    const key = paketKey;
    if (!key) return null;
    return packages.find((p) => toKey(p.nama_paket) === key) ?? null;
  }, [packages, paketKey]);

  const isTrialPackage = useMemo(() => {
    if (!selectedPackage) return false;
    if (selectedPackage.is_trial) return true;
    const name = toKey(selectedPackage.nama_paket);
    if (name.includes('trial')) return true;
    const sessions = Number(selectedPackage.jumlah_sesi || 0);
    return sessions === 1;
  }, [selectedPackage]);

  const selectedSchedule = useMemo(
    () => schedules.find((s) => Number(s.id) === Number(scheduleId)) ?? null,
    [schedules, scheduleId]
  );
  const selectedScheduleDay = useMemo(
    () => parseScheduleDay(selectedSchedule?.day ?? null),
    [selectedSchedule?.day]
  );

  const showStudentPanel = !selectedStudent && debouncedStudentQuery.trim().length >= 2;
  const showTeacherPanel = !selectedTeacher && debouncedTeacherQuery.trim().length >= 2;

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [programRes, instrumentRes, gradeRes] = await Promise.all([
          listPrograms({ page: 1, limit: 200 }),
          listInstruments({ page: 1, limit: 200 }),
          listAllGrades(),
        ]);
        setPrograms(programRes?.data ?? []);
        setInstruments(instrumentRes?.data ?? []);
        setGrades(gradeRes ?? []);
      } catch (err) {
        console.error('Gagal memuat data master', err);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (selectedStudent) return;
    const q = debouncedStudentQuery.trim();
    if (q.length < 2) {
      setStudentResults([]);
      setStudentError(null);
      setStudentLoading(false);
      return;
    }
    let active = true;
    setStudentLoading(true);
    setStudentError(null);
    listStudents({ q, page: 1, limit: 8 })
      .then((res) => {
        if (!active) return;
        const items = (res?.students ?? []) as StudentListItem[];
        const mapped: StudentOption[] = items
          .map((s) => ({
            id: Number(s.id ?? 0),
            uuid: s.uuid,
            name: s.name,
            email: s.email ?? null,
            phone: s.phone ?? null,
          }))
          .filter((s) => Number.isFinite(s.id) && s.id > 0);
        setStudentResults(mapped);
      })
      .catch((err: any) => {
        if (!active) return;
        setStudentError(err?.message || 'Gagal memuat murid');
        setStudentResults([]);
      })
      .finally(() => {
        if (!active) return;
        setStudentLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedStudentQuery, selectedStudent]);

  useEffect(() => {
    if (selectedTeacher) return;
    const q = debouncedTeacherQuery.trim();
    if (q.length < 2) {
      setTeacherResults([]);
      setTeacherError(null);
      setTeacherLoading(false);
      return;
    }
    let active = true;
    setTeacherLoading(true);
    setTeacherError(null);
    listGuru({ q, page: 1, limit: 8 })
      .then((res: any) => {
        if (!active) return;
        const items = (res?.data ?? []) as GuruOption[];
        const mapped = items
          .map((g: any) => ({
            id: Number(g.id ?? 0),
            nama: g.nama,
            nama_panggilan: g.nama_panggilan ?? null,
            email: g.email ?? null,
            no_telp: g.no_telp ?? null,
            city: g.city ?? null,
          }))
          .filter((g) => Number.isFinite(g.id) && g.id > 0);
        setTeacherResults(mapped);
      })
      .catch((err: any) => {
        if (!active) return;
        setTeacherError(err?.message || 'Gagal memuat guru');
        setTeacherResults([]);
      })
      .finally(() => {
        if (!active) return;
        setTeacherLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedTeacherQuery, selectedTeacher]);

  useEffect(() => {
    if (!selectedTeacher?.id) {
      setSchedules([]);
      setScheduleId('');
      return;
    }
    let active = true;
    setScheduleLoading(true);
    setScheduleError(null);
    getTeacherSchedule(selectedTeacher.id)
      .then((res) => {
        if (!active) return;
        setSchedules(res?.data ?? []);
        setScheduleId('');
      })
      .catch((err: any) => {
        if (!active) return;
        setScheduleError(err?.message || 'Gagal memuat jadwal guru');
        setSchedules([]);
      })
      .finally(() => {
        if (!active) return;
        setScheduleLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedTeacher?.id]);

  useEffect(() => {
    if (!programId || !instrumentId) {
      setPackages([]);
      setPaketKey('');
      return;
    }
    let active = true;
    listTransaksiPackages({
      program_id: Number(programId),
      instrument_id: Number(instrumentId),
      grade_id: gradeId ? Number(gradeId) : undefined,
    })
      .then((res) => {
        if (!active) return;
        const data = res?.data ?? [];
        setPackages(data);
        setPaketKey((prev) => {
          if (prev && data.some((p) => toKey(p.nama_paket) === prev)) return prev;
          const fallback = data[0] ? toKey(data[0].nama_paket) : '';
          return fallback;
        });
      })
      .catch((err) => {
        if (!active) return;
        console.error('Gagal memuat paket', err);
        setPackages([]);
        setPaketKey('');
      });
    return () => {
      active = false;
    };
  }, [programId, instrumentId, gradeId]);

  useEffect(() => {
    if (selectedScheduleDay === null) {
      setAllowedStartDates([]);
      setTanggalMulai('');
      return;
    }
    const dates = getUpcomingDatesForDay(selectedScheduleDay, 3);
    setAllowedStartDates(dates);
    setTanggalMulai((prev) => (prev && dates.includes(prev) ? prev : dates[0] ?? ''));
  }, [selectedScheduleDay]);

  useEffect(() => {
    if (!isTrialPackage) setExperienced(null);
  }, [isTrialPackage]);

  const handleCopy = useCallback(async () => {
    if (!checkoutResult?.url) return;
    try {
      await navigator.clipboard.writeText(checkoutResult.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin link', err);
    }
  }, [checkoutResult?.url]);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    if (!selectedStudent?.id) {
      setSubmitError('Pilih murid terlebih dahulu.');
      return;
    }
    if (!selectedTeacher?.id) {
      setSubmitError('Pilih guru terlebih dahulu.');
      return;
    }
    if (!scheduleId) {
      setSubmitError('Pilih jadwal guru terlebih dahulu.');
      return;
    }
    if (!programId || !instrumentId) {
      setSubmitError('Program dan instrumen wajib diisi.');
      return;
    }
    if (!paketKey) {
      setSubmitError('Paket belum dipilih.');
      return;
    }
    if (isTrialPackage && experienced === null) {
      setSubmitError('Status pengalaman murid wajib diisi untuk paket trial.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await adminCheckoutTransaksi({
        murid_id: selectedStudent.id,
        guru_id: selectedTeacher.id,
        schedule_id: Number(scheduleId),
        program_id: Number(programId),
        instrument_id: Number(instrumentId),
        grade_id: gradeId ? Number(gradeId) : null,
        paket_key: paketKey,
        metode_pembayaran: 'midtrans',
        bahasa: bahasa || null,
        tanggal_mulai_sesi: tanggalMulai || null,
        experienced: experienced ?? undefined,
        force_auto_approve: forceAutoApprove,
      });

      const trxId = Number(resp?.transaksi?.id ?? 0);
      const code = resp?.transaksi?.transaction_code ?? null;
      const checkoutId = code || (trxId ? String(trxId) : null);
      if (!checkoutId) throw new Error('Transaksi dibuat, tetapi ID tidak tersedia.');

      const base = resolveWebBase();
      const url = base ? `${base}/class/checkout/${checkoutId}` : `https://gurumusik.id/class/checkout/${checkoutId}`;

      setCheckoutResult({
        id: trxId,
        code,
        status: resp?.transaksi?.status ?? null,
        total: resp?.pricing?.total ?? null,
        url,
      });
    } catch (err: any) {
      setSubmitError(err?.message || 'Gagal membuat transaksi.');
    } finally {
      setSubmitting(false);
    }
  }, [
    selectedStudent,
    selectedTeacher,
    scheduleId,
    programId,
    instrumentId,
    gradeId,
    paketKey,
    bahasa,
    tanggalMulai,
    experienced,
    isTrialPackage,
    forceAutoApprove,
  ]);

  const studentInputHint = selectedStudent
    ? `${selectedStudent.name}${selectedStudent.email ? ` - ${selectedStudent.email}` : ''}`
    : 'Cari murid via nama, email, atau shortname';

  const teacherInputHint = selectedTeacher
    ? `${selectedTeacher.nama_panggilan || selectedTeacher.nama}${selectedTeacher.email ? ` - ${selectedTeacher.email}` : ''}`
    : 'Cari guru via nama, email, atau shortname';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--primary-color)] text-black">
            <RiTicket2Line size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Ticket Transaksi</h1>
            <p className="text-sm text-neutral-500">Buat transaksi langsung untuk murid &amp; guru tanpa approval guru.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <section className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-semibold text-neutral-900">Pilih Murid</h2>
            <div className="relative">
              <RiSearchLine className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value);
                  if (selectedStudent) setSelectedStudent(null);
                }}
                placeholder={studentInputHint}
                className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-10 text-sm outline-none focus:border-[var(--secondary-color)]"
              />
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentQuery('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
                >
                  <RiCloseLine size={18} />
                </button>
              )}
            </div>

            {showStudentPanel && (
              <div className="rounded-2xl border border-neutral-200 bg-white">
                {studentLoading && (
                  <div className="px-4 py-3 text-sm text-neutral-500">Memuat murid...</div>
                )}
                {!studentLoading && studentError && (
                  <div className="px-4 py-3 text-sm text-red-600">{studentError}</div>
                )}
                {!studentLoading && !studentError && studentResults.length === 0 && (
                  <div className="px-4 py-3 text-sm text-neutral-500">Tidak ada hasil.</div>
                )}
                {!studentLoading && !studentError && studentResults.length > 0 && (
                  <ul className="divide-y divide-neutral-200">
                    {studentResults.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setStudentQuery(`${s.name}${s.email ? ` - ${s.email}` : ''}`);
                            setStudentResults([]);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                        >
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-500">
                            <RiUser3Line />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">{s.name}</p>
                            <p className="text-xs text-neutral-500 truncate">{s.email || s.phone || s.uuid}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {selectedStudent && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Murid terpilih: <span className="font-semibold">{selectedStudent.name}</span>
                {selectedStudent.email ? ` - ${selectedStudent.email}` : ''}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-semibold text-neutral-900">Pilih Guru</h2>
            <div className="relative">
              <RiSearchLine className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={teacherQuery}
                onChange={(e) => {
                  setTeacherQuery(e.target.value);
                  if (selectedTeacher) setSelectedTeacher(null);
                }}
                placeholder={teacherInputHint}
                className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-10 text-sm outline-none focus:border-[var(--secondary-color)]"
              />
              {selectedTeacher && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeacher(null);
                    setTeacherQuery('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
                >
                  <RiCloseLine size={18} />
                </button>
              )}
            </div>

            {showTeacherPanel && (
              <div className="rounded-2xl border border-neutral-200 bg-white">
                {teacherLoading && (
                  <div className="px-4 py-3 text-sm text-neutral-500">Memuat guru...</div>
                )}
                {!teacherLoading && teacherError && (
                  <div className="px-4 py-3 text-sm text-red-600">{teacherError}</div>
                )}
                {!teacherLoading && !teacherError && teacherResults.length === 0 && (
                  <div className="px-4 py-3 text-sm text-neutral-500">Tidak ada hasil.</div>
                )}
                {!teacherLoading && !teacherError && teacherResults.length > 0 && (
                  <ul className="divide-y divide-neutral-200">
                    {teacherResults.map((g) => (
                      <li key={g.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeacher(g);
                            setTeacherQuery(`${g.nama_panggilan || g.nama}${g.email ? ` - ${g.email}` : ''}`);
                            setTeacherResults([]);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                        >
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-500">
                            <RiUserStarLine />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {g.nama_panggilan || g.nama}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                              {g.email || g.no_telp || g.city || '-'}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {selectedTeacher && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Guru terpilih: <span className="font-semibold">{selectedTeacher.nama_panggilan || selectedTeacher.nama}</span>
                {selectedTeacher.email ? ` - ${selectedTeacher.email}` : ''}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900">Detail Transaksi</h2>
            <div className="grid grid-cols-1 gap-4">
              <label className="space-y-1 text-sm text-neutral-600">
                Program
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                >
                  <option value="">Pilih program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_program}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm text-neutral-600">
                Instrumen
                <select
                  value={instrumentId}
                  onChange={(e) => setInstrumentId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                >
                  <option value="">Pilih instrumen</option>
                  {instruments.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nama_instrumen}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm text-neutral-600">
                Grade (opsional)
                <select
                  value={gradeId}
                  onChange={(e) => setGradeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                >
                  <option value="">Auto</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama_grade}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm text-neutral-600">
                Paket
                <select
                  value={paketKey}
                  onChange={(e) => setPaketKey(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                  disabled={!packages.length}
                >
                  <option value="">{packages.length ? 'Pilih paket' : 'Pilih program & instrumen dulu'}</option>
                  {packages.map((p) => {
                    const key = toKey(p.nama_paket);
                    return (
                      <option key={key} value={key}>
                        {p.nama_paket}{p.jumlah_sesi ? ` (${p.jumlah_sesi} sesi)` : ''}
                      </option>
                    );
                  })}
                </select>
                {selectedPackage?.pricing?.total != null && (
                  <div className="text-xs text-neutral-500">Harga dasar: {formatIDR(selectedPackage.pricing.total)}</div>
                )}
              </label>

              {isTrialPackage && (
                <label className="space-y-2 text-sm text-neutral-600">
                  Pengalaman murid (wajib untuk paket trial)
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setExperienced(true)}
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        experienced === true
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                          : 'border-neutral-200 text-neutral-600'
                      }`}
                    >
                      Pernah
                    </button>
                    <button
                      type="button"
                      onClick={() => setExperienced(false)}
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        experienced === false
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                          : 'border-neutral-200 text-neutral-600'
                      }`}
                    >
                      Belum Pernah
                    </button>
                  </div>
                </label>
              )}

              <label className="space-y-1 text-sm text-neutral-600">
                Bahasa
                <select
                  value={bahasa}
                  onChange={(e) => setBahasa(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm text-neutral-600">
                Jadwal Guru
                <div className="relative">
                  <select
                    value={scheduleId}
                    onChange={(e) => setScheduleId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                    disabled={scheduleLoading || !selectedTeacher}
                  >
                    <option value="">{scheduleLoading ? 'Memuat jadwal...' : selectedTeacher ? 'Pilih jadwal' : 'Pilih guru dulu'}</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {dayLabel(s.day)} - {s.start || '--'} - {s.end || '--'}{s.timezone ? ` (${s.timezone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {scheduleError && <div className="text-xs text-red-600">{scheduleError}</div>}
              </label>

              <label className="space-y-1 text-sm text-neutral-600">
                Tanggal mulai sesi
                <select
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                  disabled={!allowedStartDates.length}
                >
                  <option value="">
                    {selectedScheduleDay === null ? 'Pilih jadwal dulu' : 'Pilih tanggal mulai'}
                  </option>
                  {allowedStartDates.map((dateStr) => (
                    <option key={dateStr} value={dateStr}>
                      {formatDateLabel(dateStr)}
                    </option>
                  ))}
                </select>
                {selectedScheduleDay !== null && allowedStartDates.length > 0 && (
                  <div className="text-xs text-neutral-500">
                    Hanya tersedia untuk hari {dayLabel(selectedScheduleDay)} hingga 3 bulan ke depan.
                  </div>
                )}
              </label>

              <label className="flex items-center gap-3 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={forceAutoApprove}
                  onChange={(e) => setForceAutoApprove(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Lewati approval guru (langsung menunggu pembayaran)
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900">Hasil &amp; Link Checkout</h2>

            {checkoutResult ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <RiCheckLine />
                    <span>Transaksi berhasil dibuat.</span>
                    {checkoutResult.status ? <span>Status: {checkoutResult.status}</span> : null}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    ID: {checkoutResult.id}
                    {checkoutResult.code ? ` - Code: ${checkoutResult.code}` : ''}
                    {checkoutResult.total ? ` - Total: ${formatIDR(checkoutResult.total)}` : ''}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    value={checkoutResult.url}
                    readOnly
                    className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <RiClipboardLine />
                    {copied ? 'Tersalin' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-4 text-sm text-neutral-500">
                Link checkout akan muncul setelah transaksi dibuat.
              </div>
            )}

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--secondary-color)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Membuat transaksi...' : 'Buat Transaksi & Generate Link'}
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white/60 p-4 text-xs text-neutral-500">
        <div className="flex flex-wrap items-center gap-2">
          <RiCalendar2Line />
          <span>Pastikan data murid &amp; guru sudah sesuai sebelum membuat transaksi.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <RiTimeLine />
          <span>Link checkout bisa dibuka murid untuk lanjutkan pembayaran tanpa approval guru.</span>
        </div>
      </section>
    </div>
  );
}
