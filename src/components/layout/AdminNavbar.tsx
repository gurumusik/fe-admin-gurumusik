/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/layout/AdminNavbar.tsx
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import { meThunk, logoutThunk } from "@/features/slices/auth/slice";
import defaultUser from "@/assets/images/default-user.png";
import { RiArrowDownSFill, RiLogoutBoxRLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { getWaAgentSettings, updateWaAgentSettings } from "@/services/api/waGateway.api";

const AdminNavbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Ambil user dari slice; handle 2 bentuk: { user: {...} } atau langsung {...}
  const rawUser = useSelector((s: RootState) => s.auth.user as any);
  const user = (rawUser?.user ?? rawUser) || null;

  // (opsional) hydrate kalau user belum ada
  useEffect(() => {
    if (!user) {
      dispatch(meThunk()).catch(() => {});
    }
  }, [dispatch, user]);

  useEffect(() => {
    let active = true;
    setWaLoading(true);
    getWaAgentSettings()
      .then((data) => {
        if (!active) return;
        setWaEnabled(Boolean((data as any)?.enabled));
        setWaError(null);
      })
      .catch((err: any) => {
        if (!active) return;
        setWaError(err?.message || "Gagal mengambil status WA");
      })
      .finally(() => {
        if (!active) return;
        setWaLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const name = user?.nama || "Admin";
  const photoUrl = resolveImageUrl(user?.profile_pic_url) || (defaultUser as unknown as string);

  const [waEnabled, setWaEnabled] = useState<boolean | null>(null);
  const [waLoading, setWaLoading] = useState(true);
  const [waUpdating, setWaUpdating] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  // Dropdown state
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (containerRef.current?.contains(t) || toggleRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap().catch(() => {});
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const handleToggleWa = async () => {
    if (waEnabled === null || waUpdating) return;
    const next = !waEnabled;
    setWaUpdating(true);
    try {
      const updated = await updateWaAgentSettings({ enabled: next });
      setWaEnabled(Boolean((updated as any)?.enabled));
      setWaError(null);
    } catch (err: any) {
      setWaError(err?.message || "Gagal update WA");
    } finally {
      setWaUpdating(false);
    }
  };

  return (
    <nav className="sticky top-0 z-20 h-20 bg-white shadow flex justify-between items-center px-8">
      <div className="flex flex-col gap-1 px-4">
        <h2 className="text-lg font-semibold text-[#333]">Welcome Back, {name}</h2>
        <p className="text-sm text-[#777]">
          Semua kebutuhan mengajar musik dalam satu Dashboard
        </p>
      </div>

      <div className="relative flex items-center gap-3 select-none">
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500">WA Auto Reply</span>
            {waLoading ? (
              <span className="text-xs text-neutral-400">Loading...</span>
            ) : (
              <span
                className={`text-xs font-semibold ${
                  waEnabled ? "text-emerald-600" : "text-neutral-500"
                }`}
              >
                {waEnabled ? "ON" : "OFF"}
              </span>
            )}
            {waError ? <span className="text-[10px] text-red-500">{waError}</span> : null}
          </div>
          <button
            type="button"
            onClick={handleToggleWa}
            disabled={waLoading || waUpdating || waEnabled === null}
            aria-pressed={waEnabled ? "true" : "false"}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              waEnabled ? "bg-emerald-500" : "bg-neutral-300"
            } ${waLoading || waUpdating ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            title="Toggle WA auto reply"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                waEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <img
          src={photoUrl}
          alt={user ? `Foto ${user.nama}` : "Profile"}
          width={44}
          height={44}
          loading="lazy"
          className="rounded-full object-cover w-11 h-11"
        />

        <button
          ref={toggleRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid place-items-center w-8 h-8 rounded-xl hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          title="Menu akun"
        >
          <RiArrowDownSFill
            size={22}
            className={`text-black transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Overlay dropdown */}
        {open && (
          <div
            ref={containerRef}
            role="menu"
            aria-label="Account menu"
            className="absolute top-12 right-0 w-72 bg-white border border-neutral-200 rounded-2xl shadow-xl p-4"
          >
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wider text-neutral-500">Admin,</p>
              <p className="text-[15px] font-semibold text-neutral-900 truncate">{name}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-white
                         bg-[var(--accent-red-color,#F14A7E)] hover:brightness-95 active:brightness-90"
            >
              <RiLogoutBoxRLine size={18} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
