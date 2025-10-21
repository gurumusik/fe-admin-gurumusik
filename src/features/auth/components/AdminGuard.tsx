/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/auth/components/AdminGuard.tsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import type { AppDispatch, RootState } from "@/app/store";
import { meThunk } from "@/features/slices/auth/slice";
import { tokenStorage } from "@/services/http/token";
import LoadingScreen from "@/components/ui/common/LoadingScreen";

type Props = { children: React.ReactNode };

const AdminGuard: React.FC<Props> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { user, status } = useSelector((s: RootState) => s.auth);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    const verify = async () => {
      // tidak ada token → tidak usah panggil /me
      if (!tokenStorage.get()) {
        if (mounted) setChecked(true);
        return;
      }
      try {
        if (!user) {
          await dispatch(meThunk()).unwrap(); // isi user dari /auth/me
        }
      } catch {
        // biarkan guard di bawah yang memutuskan redirect
      } finally {
        if (mounted) setChecked(true);
      }
    };
    verify();
    return () => { mounted = false; };
  }, [dispatch, user]);

  // 1) tanpa token → redirect
  if (!tokenStorage.get()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // 2) tunggu sekali verifikasi /me
  if (!checked || status === "loading") {
    return <LoadingScreen />;
  }

  // 3) role check
  const role = String((user as any)?.role ?? (user as any)?.user?.role ?? "").toLowerCase();
  const isAdmin = role === "admin";
  if (!user || !isAdmin) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // 4) lolos
  return <>{children}</>;
};

export default AdminGuard;
