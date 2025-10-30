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

  const name = user?.nama || "Admin";
  const photoUrl = resolveImageUrl(user?.profile_pic_url) || (defaultUser as unknown as string);

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

  return (
    <nav className="sticky top-0 z-20 h-20 bg-white shadow flex justify-between items-center px-8">
      <div className="flex flex-col gap-1 px-4">
        <h2 className="text-lg font-semibold text-[#333]">Welcome Back, {name}</h2>
        <p className="text-sm text-[#777]">
          Semua kebutuhan mengajar musik dalam satu Dashboard
        </p>
      </div>

      <div className="relative flex items-center gap-3 select-none">
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
