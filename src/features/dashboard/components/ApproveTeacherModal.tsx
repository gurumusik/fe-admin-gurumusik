'use client';

import React, { useState } from 'react';
import {
  RiCloseLine,
  RiDownloadLine,
} from 'react-icons/ri';

export type ApproveMode = 'approved' | 'rejected';

export type ApproveTeacherPayload =
  | { mode: 'approved' }
  | { mode: 'rejected'; reason: string; attachment?: File | null };

type BaseData = {
  image?: string;
  name?: string;
  phone?: string;
  city?: string;
  videoUrl?: string;
  cvUrl?: string;
  certificateUrl?: string;
};

type ApproveTeacherModalProps = {
  open: boolean;
  mode: ApproveMode;
  onClose: () => void;
  onSubmit: (payload: ApproveTeacherPayload) => void;
  data?: BaseData;
};

const inputCls =
  'w-full h-11 rounded-lg border border-[#DDE3EA] bg-[#F5F7FA] px-3 text-sm text-neutral-800 outline-none';
const labelCls = 'text-md text-neutral-900 mb-1 block';

const ApproveTeacherModal: React.FC<ApproveTeacherModalProps> = ({
  open,
  mode,
  onClose,
  onSubmit,
  data,
}) => {
  const [file] = useState<File | null>(null);
  const [reason, setReason] = useState('');

  if (!open) return null;

  const submitApproved = () => onSubmit({ mode: 'approved' });
  const submitRejected = () => onSubmit({ mode: 'rejected', reason, attachment: file });

  return (
    <div className="fixed inset-0 z-[80]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-[#0B1220]/60"
        onClick={onClose}
        aria-hidden
      />
      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6EAF0]">
            <h3 className="text-lg font-semibold text-neutral-900">
              {mode === 'approved'
                ? 'Formulir Calon Tutor'
                : 'Formulir Penolakan Calon Tutor'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-neutral-100 cursor-pointer"
              aria-label="Tutup"
              title="Tutup"
            >
              <RiCloseLine className="text-2xl text-neutral-900" />
            </button>
          </div>

          {/* body */}
          {mode === 'approved' ? (
            <div className="px-5 pb-5 pt-4">
              {/* Profile */}
              <div className="mb-4">
                <p className="text-md font-medium text-neutral-900 mb-2">Profile</p>
                <div className="w-20 h-20 rounded-full overflow-hidden">
                  <img
                    src={data?.image ?? 'https://i.pravatar.cc/100?img=1'}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelCls}>Nama Calon Tutor</label>
                  <input className={inputCls} value={data?.name ?? ''} readOnly />
                </div>
                <div>
                  <label className={labelCls}>No Telepon</label>
                  <input className={inputCls} value={data?.phone ?? ''} readOnly />
                </div>
                <div>
                  <label className={labelCls}>Asal Kota</label>
                  <input className={inputCls} value={data?.city ?? ''} readOnly />
                </div>

                {/* File Pendukung */}
                <div className="mt-1">
                  <label className={labelCls}>File Pendukung</label>
                  <div className="flex items-center gap-3">
                    <a
                      href={data?.cvUrl ?? '#'}
                      onClick={(e) => !data?.cvUrl && e.preventDefault()}
                      className="inline-flex items-center gap-2 h-8 px-3 rounded-full border border-[var(--secondary-color)] text-sm text-[var(--secondary-color)] bg-white"
                    >
                      <RiDownloadLine /> CV
                    </a>
                    <a
                      href={data?.certificateUrl ?? '#'}
                      onClick={(e) => !data?.certificateUrl && e.preventDefault()}
                      className="inline-flex items-center gap-2 h-8 px-3 rounded-full border border-[var(--secondary-color)] text-sm text-[var(--secondary-color)] bg-white"
                    >
                      <RiDownloadLine /> Sertifikat
                    </a>
                  </div>
                </div>

                {/* Video */}
                <div>
                  <label className={labelCls}>Video Demo</label>
                  <input
                    className={inputCls}
                    value={data?.videoUrl ?? 'Youtube.com'}
                    readOnly
                  />
                </div>
              </div>

              {/* actions */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={submitApproved}
                  className="w-full h-11 rounded-full font-semibold bg-[var(--primary-color)] text-neutral-900 cursor-pointer"
                >
                  Setujui
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-5 pt-4">
              {/* Perihal */}
              <div className="mb-3">
                <p className="text-sm text-neutral-600">Perihal:</p>
                <p className="text-md text-neutral-900">
                  <span className="font-medium">Hasil Seleksi Calon Tutor Guru Musik</span>
                </p>
              </div>


              {/* Reason */}
              <div className="mt-3">
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-[var(--secondary-color)] px-3 py-2 text-md outline-none"
                  placeholder="Masukkan keterangan Penolakan Calon Tutor"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {/* actions */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={submitRejected}
                  className="w-full h-11 rounded-full font-semibold bg-[var(--primary-color)] text-neutral-900 cursor-pointer"
                >
                  Kirim Laporan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApproveTeacherModal;
