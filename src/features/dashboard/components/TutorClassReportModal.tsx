'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { RiCalendar2Line, RiCloseLine, RiExternalLinkLine, RiEyeLine } from 'react-icons/ri';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import { getProgramColor } from '@/utils/getProgramColor';
import { getStatusColor } from '@/utils/getStatusColor';
import { getSessionAbsenMedia, getSessionGuruReview, resolveAvatarUrl } from '@/services/api/guruClasses.api';

export type TutorClassReportRow = {
  no: number | string;
  timestamp: string;
  progress: string;
  type?: 'scheduled' | 'absen_awal' | 'absen_akhir' | 'review' | 'ended' | 'status';
};

type TutorClassReportModalProps = {
  open: boolean;
  onClose: () => void;

  guruId?: number;
  sesiId?: number;

  tutorImage: string;
  tutorName: string;
  statusLabel?: string;
  programLabel?: string;
  instrumentLabel?: string;
  schedule?: string;
  sesiLabel?: string;

  loading?: boolean;
  error?: string | null;
  rows?: TutorClassReportRow[];
};

function toDDMMYYYYHHmm(input?: string | Date | null) {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(String(input));
  if (Number.isNaN(d.getTime())) return String(input);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

const TutorClassReportModal: React.FC<TutorClassReportModalProps> = ({
  open,
  onClose,
  guruId,
  sesiId,
  tutorImage,
  tutorName,
  statusLabel = 'Aktif',
  programLabel = '—',
  instrumentLabel = '—',
  schedule = '—',
  sesiLabel = '—',
  loading = false,
  error = null,
  rows = [],
}) => {
  if (!open) return null;

  const canFetchDetails = Number(guruId) > 0 && Number(sesiId) > 0;

  // ===== Absen media modal =====
  const [absenOpen, setAbsenOpen] = useState(false);
  const [absenKind, setAbsenKind] = useState<'awal' | 'akhir'>('awal');
  const [absenStatus, setAbsenStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');
  const [absenError, setAbsenError] = useState<string | null>(null);
  const [absenUrls, setAbsenUrls] = useState<string[]>([]);

  const openAbsen = useCallback(
    async (kind: 'awal' | 'akhir') => {
      if (!canFetchDetails) return;
      try {
        setAbsenKind(kind);
        setAbsenError(null);
        setAbsenStatus('loading');
        setAbsenOpen(true);

        const raw = await getSessionAbsenMedia({ guruId: Number(guruId), sesiId: Number(sesiId), kind });
        const urls = (raw?.data ?? [])
          .map((r) => resolveAvatarUrl(r?.absen_url ?? null))
          .filter((u): u is string => typeof u === 'string' && u.length > 0);
        setAbsenUrls(urls);
        setAbsenStatus('succeeded');
      } catch (e: any) {
        setAbsenUrls([]);
        setAbsenStatus('failed');
        setAbsenError(e?.message || 'Gagal memuat foto absen');
      }
    },
    [canFetchDetails, guruId, sesiId]
  );

  // ===== Guru review modal =====
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewAttachments, setReviewAttachments] = useState<string[]>([]);

  const openReview = useCallback(async () => {
    if (!canFetchDetails) return;
    try {
      setReviewError(null);
      setReviewStatus('loading');
      setReviewOpen(true);

      const raw = await getSessionGuruReview({ guruId: Number(guruId), sesiId: Number(sesiId) });
      setReviewText(String(raw?.keterangan ?? ''));
      const urls = (raw?.attachments ?? [])
        .map((u) => resolveAvatarUrl(u ?? null))
        .filter((u): u is string => typeof u === 'string' && u.length > 0);
      setReviewAttachments(urls);
      setReviewStatus('succeeded');
    } catch (e: any) {
      setReviewText('');
      setReviewAttachments([]);
      setReviewStatus('failed');
      setReviewError(e?.message || 'Gagal memuat review guru');
    }
  }, [canFetchDetails, guruId, sesiId]);

  const showAbsenEye = useMemo(() => new Set(['absen_awal', 'absen_akhir']), []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-[101] max-w-[650px] rounded-3xl bg-white shadow-2xl border border-black/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <h3 className="text-xl font-semibold text-neutral-900">Laporan Kelas</h3>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5"
            aria-label="Close"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="px-6 pt-5 pb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={tutorImage}
                alt={tutorName}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-black/5"
              />
              <div className="flex flex-col">
                <div className="text-xl font-semibold text-neutral-900 leading-5">{tutorName}</div>
                <div className={`text-md font-medium capitalize ${getStatusColor(statusLabel)} mt-1`}>
                  {statusLabel}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-neutral-500">Sesi</span>
              <span className="text-sm font-semibold text-neutral-900">{sesiLabel}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-black/10">
            <div className="px-4 pt-4 pb-3">
              <div className="flex justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-md text-neutral-500">Program</span>
                  <div className="mt-2 text-center">
                    <span
                      className={`inline-flex items-center rounded-lg text-xs font-semibold px-2.5 py-1 ${getProgramColor(programLabel)}`}
                    >
                      {programLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-md text-neutral-500">Alat Musik</span>
                  <div className="mt-2 inline-flex items-center gap-2 text-neutral-900">
                    <img
                      src={getInstrumentIcon((instrumentLabel || '').toLowerCase())}
                      alt={instrumentLabel}
                      className="h-5 w-5"
                    />
                    <span className="font-medium">{instrumentLabel}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-md text-neutral-500">Jadwal</span>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <RiCalendar2Line className="text-(--secondary-color)" />
                    <span className="font-medium text-(--secondary-color)">{schedule}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-neutral-100 text-left text-md rounded-xl">
                    <th className="w-[60px] p-5 font-medium">No</th>
                    <th className="w-[190px] p-5 font-medium">Timestamp</th>
                    <th className="p-5 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-neutral-500">
                        Memuat…
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-neutral-500">
                        Tidak ada data.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={`row-${r.no}`} className="border-t border-black/5 text-md">
                        <td className="px-4 py-4">{r.no}</td>
                        <td className="px-4 py-4">{toDDMMYYYYHHmm(r.timestamp)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <span>{r.progress}</span>

                            {canFetchDetails && showAbsenEye.has(String(r.type)) ? (
                              <button
                                type="button"
                                onClick={() => openAbsen(String(r.type) === 'absen_awal' ? 'awal' : 'akhir')}
                                className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-black/5 text-neutral-700"
                                aria-label="Lihat foto absen"
                                title="Lihat foto absen"
                              >
                                <RiEyeLine size={18} />
                              </button>
                            ) : canFetchDetails && String(r.type) === 'review' ? (
                              <button
                                type="button"
                                onClick={openReview}
                                className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-black/5 text-neutral-700"
                                aria-label="Lihat review guru"
                                title="Lihat review guru"
                              >
                                <RiExternalLinkLine size={18} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Sub-modal: Foto Absen ===== */}
      {absenOpen ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAbsenOpen(false)} />
          <div className="relative z-[111] w-[min(760px,95vw)] rounded-3xl bg-white shadow-2xl border border-black/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
              <h3 className="text-xl font-semibold text-neutral-900">
                Foto Absen {absenKind === 'awal' ? 'Awal' : 'Akhir'}
              </h3>
              <button
                onClick={() => setAbsenOpen(false)}
                className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5"
                aria-label="Close"
              >
                <RiCloseLine size={22} />
              </button>
            </div>
            <div className="px-6 py-5">
              {absenStatus === 'loading' ? (
                <div className="py-10 text-center text-neutral-500">Memuat</div>
              ) : absenStatus === 'failed' ? (
                <div className="py-10 text-center text-red-600">{absenError || 'Gagal memuat.'}</div>
              ) : absenUrls.length === 0 ? (
                <div className="py-10 text-center text-neutral-500">Tidak ada foto.</div>
              ) : (
                absenUrls.length === 1 ? (
                  <div className="flex justify-center">
                    <a
                      href={absenUrls[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full max-w-[520px]"
                    >
                      <img
                        src={absenUrls[0]}
                        alt="absen"
                        className="w-full max-h-[65vh] rounded-2xl border border-black/10 object-contain bg-neutral-50"
                      />
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {absenUrls.map((u, idx) => (
                      <a key={`absen-${idx}`} href={u} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={u}
                          alt={`absen-${idx}`}
                          className="w-full max-h-[45vh] rounded-2xl border border-black/10 object-contain bg-neutral-50"
                        />
                      </a>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ===== Sub-modal: Review Guru ===== */}
      {reviewOpen ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReviewOpen(false)} />
          <div className="relative z-[111] w-[min(760px,95vw)] rounded-3xl bg-white shadow-2xl border border-black/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
              <h3 className="text-xl font-semibold text-neutral-900">Guru Review</h3>
              <button
                onClick={() => setReviewOpen(false)}
                className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5"
                aria-label="Close"
              >
                <RiCloseLine size={22} />
              </button>
            </div>
            <div className="px-6 py-5">
              {reviewStatus === 'loading' ? (
                <div className="py-10 text-center text-neutral-500">Memuat</div>
              ) : reviewStatus === 'failed' ? (
                <div className="py-10 text-center text-red-600">{reviewError || 'Gagal memuat.'}</div>
              ) : (
                <>
                  <div className="rounded-2xl border border-black/10 bg-neutral-50 p-4 text-neutral-900 whitespace-pre-wrap">
                    {reviewText || 'â€”'}
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-semibold text-neutral-900 mb-2">Lampiran</div>
                    {reviewAttachments.length === 0 ? (
                      <div className="text-neutral-500 text-sm">Tidak ada lampiran.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reviewAttachments.map((u, idx) => (
                          <a key={`lamp-${idx}`} href={u} target="_blank" rel="noreferrer" className="block">
                            <img
                              src={u}
                              alt={`lampiran-${idx}`}
                              className="w-full rounded-2xl border border-black/10 object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TutorClassReportModal;
