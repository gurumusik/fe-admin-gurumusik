import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { tokenStorage } from "@/services/http/token";
import LoadingScreen from "@/components/ui/common/LoadingScreen";

type Props = { children: React.ReactNode };

const SuperAdminGuard: React.FC<Props> = ({ children }) => {
  const { user, status } = useSelector((s: RootState) => s.auth);
  const currentUser = (user as any)?.user ?? user ?? null;

  if (!tokenStorage.get()) {
    return <Navigate to="/login" replace />;
  }

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (!currentUser?.is_super_admin) {
    return <Navigate to="/dashboard-admin" replace />;
  }

  return <>{children}</>;
};

export default SuperAdminGuard;
