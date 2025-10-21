// src/pages/admin/LoginPage.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useState } from "react";
import { RiMailLine, RiKeyLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@/app/store";
import { loginThunk } from "@/features/slices/auth/slice";
import GuruMusik from "@/assets/images/gurumusik.png";

/* ===================== Helpers ===================== */
function humanizeAuthError(text: string): string {
  const badCred = /unauthorized|invalid credential|invalid password|wrong password|wrong credentials|invalid email|user not found|no user|not found|invalid login|authentication failed/i.test(
    text || ""
  );
  const networkish = /network error|failed to fetch|network request failed|ekoneksi|net::/i.test(
    text || ""
  );
  if (badCred) return "Email atau password salah.";
  if (networkish) return "Koneksi bermasalah. Coba lagi.";
  return text?.trim() ? text : "Login gagal. Coba lagi.";
}

/* ===================== Komponen ===================== */
export const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { status, error } = useSelector((s: RootState) => s.auth);
  const loading = status === "loading";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const uiError = formError ?? error ?? null;

  const roleIsAdmin = (u: any): boolean => {
  const role = String((u?.role ?? u?.user?.role) ?? "").toLowerCase();
  return role === "admin";
};

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      try {
        const me = await dispatch(
          loginThunk({ email: email.trim(), password })
        ).unwrap();


        // ✅ Tetap cek role admin
        if (!roleIsAdmin(me)) {
          setFormError("Akun ini bukan admin. Gunakan akun admin untuk masuk.");
          return;
        }

        // Sukses → arahkan ke root "/dashboard-admin"
        navigate("/dashboard-admin", { replace: true });
      } catch (err: any) {
        const friendly = humanizeAuthError(err?.message ?? String(err ?? ""));
        setFormError(friendly);
      }
    },
    [dispatch, email, password, navigate]
  );

  return (
    <div className="h-screen w-full grid place-items-center bg-neutral-50">
      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-[#E6EDF5] p-6 sm:p-7"
      >
        {/* Header (logo + title) */}
        <div className="flex items-center gap-3 mb-8">
          <img src={GuruMusik} alt="Guru Musik.ID" width={40} height={40} className="rounded object-contain" />
          <h1 className="text-xl font-bold text-[#0f172a]">Guru Musik.ID Admin</h1>
        </div>

        {/* Email */}
        <label htmlFor="email" className="block text-sm text-left font-medium text-[#0f172a] mb-1">
          Email
        </label>
        <div className="relative mb-4">
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

        {/* Password */}
        <label htmlFor="password" className="block text-sm text-left font-medium text-[#0f172a] mb-1">
          Password
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <RiKeyLine className="text-[18px] text-neutral-600" />
          </span>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="| Masukkan Password Admin"
            className="w-full h-11 rounded-xl border border-[#D7E1EF] bg-white pl-10 pr-3 outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:border-[#A7C7F3] text-[15px] placeholder:text-neutral-600 disabled:opacity-60"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        {/* Alert */}
        {(uiError || loading) && (
          <div
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              uiError ? "bg-red-50 text-red-700 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {uiError ?? "Memproses login..."}
          </div>
        )}

        {/* Button */}
        <button
          type="submit"
          className="w-full mt-6 h-12 rounded-full bg-[#F6C437] text-[#0b0b0b] font-semibold hover:brightness-95 transition disabled:opacity-60"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
