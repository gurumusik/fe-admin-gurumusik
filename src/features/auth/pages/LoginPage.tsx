/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RiCheckLine, RiMailLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@/app/store";
import {
  consumeMagicLinkThunk,
  requestMagicLinkThunk,
} from "@/features/slices/auth/slice";
import GuruMusik from "@/assets/images/gurumusik.png";

function humanizeAuthError(text: string): string {
  const invalidToken = /token|kedaluwarsa|expired|invalid|akses admin/i.test(text || "");
  const networkish = /network error|failed to fetch|network request failed|ekoneksi|net::/i.test(
    text || ""
  );

  if (invalidToken) return "Link login tidak valid atau sudah kedaluwarsa.";
  if (networkish) return "Koneksi bermasalah. Coba lagi.";
  return text?.trim() ? text : "Permintaan login gagal. Coba lagi.";
}

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const consumedRef = useRef<string | null>(null);

  const { status, error, magicLinkMessage } = useSelector((s: RootState) => s.auth);
  const loading = status === "loading";

  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const uiError = formError ?? error ?? null;
  const magicToken = new URLSearchParams(location.search).get("token")?.trim() ?? "";

  const roleIsAdmin = (u: any): boolean => {
    const role = String((u?.role ?? u?.user?.role) ?? "").toLowerCase();
    return role === "admin" || role === "superadmin";
  };

  useEffect(() => {
    if (!magicToken || consumedRef.current === magicToken) return;

    consumedRef.current = magicToken;
    setFormError(null);
    setSuccessMessage(null);

    dispatch(consumeMagicLinkThunk(magicToken))
      .unwrap()
      .then((me) => {
        if (!roleIsAdmin(me)) {
          setFormError("Akun ini bukan admin. Gunakan akun admin untuk masuk.");
          return;
        }

        navigate("/dashboard-admin", { replace: true });
      })
      .catch((err: any) => {
        setFormError(humanizeAuthError(err?.message ?? String(err ?? "")));
      });
  }, [dispatch, magicToken, navigate]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      setSuccessMessage(null);

      try {
        const result = await dispatch(
          requestMagicLinkThunk({ email: email.trim() })
        ).unwrap();
        setSuccessMessage(result.message ?? magicLinkMessage ?? "Link login berhasil dikirim.");
      } catch (err: any) {
        const friendly = humanizeAuthError(err?.message ?? String(err ?? ""));
        setFormError(friendly);
      }
    },
    [dispatch, email, magicLinkMessage]
  );

  return (
    <div className="h-screen w-full grid place-items-center bg-neutral-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-[#E6EDF5] p-6 sm:p-7"
      >
        <div className="flex items-center gap-3 mb-8">
          <img
            src={GuruMusik}
            alt="Guru Musik.ID"
            width={40}
            height={40}
            className="rounded object-contain"
          />
          <h1 className="text-xl font-bold text-[#0f172a]">Guru Musik.ID Admin.</h1>
        </div>

        <label htmlFor="email" className="block text-sm text-left font-medium text-[#0f172a] mb-1">
          Email
        </label>
        <div className="relative mb-5">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <RiMailLine className="text-[18px] text-neutral-600" />
          </span>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="| cth: admin@gurumusik.id"
            className="w-full h-11 rounded-xl border border-[#D7E1EF] bg-white pl-10 pr-3 outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:border-[#A7C7F3] text-[15px] placeholder:text-neutral-600 disabled:opacity-60"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="username"
          />
        </div>

        <div className="rounded-xl border border-[#E6EDF5] bg-[#F8FBFF] px-4 py-3 text-sm text-neutral-700">
          Login admin menggunakan magic-link. Masukkan email admin aktif, lalu buka link yang kami kirimkan ke inbox Anda.
        </div>

        {(uiError || loading || successMessage) && (
          <div
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              uiError
                ? "bg-red-50 text-red-700 border border-red-200"
                : successMessage
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {uiError ? (
              uiError
            ) : successMessage ? (
              <span className="inline-flex items-center gap-2">
                <RiCheckLine />
                {successMessage}
              </span>
            ) : magicToken ? (
              "Memverifikasi link login..."
            ) : (
              "Mengirim link login..."
            )}
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-6 h-12 rounded-full bg-[#F6C437] text-[#0b0b0b] font-semibold hover:brightness-95 transition disabled:opacity-60"
          disabled={loading}
          aria-busy={loading}
        >
          {loading && magicToken ? "Memverifikasi..." : loading ? "Mengirim..." : "Kirim Link Login"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
