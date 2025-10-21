// src/components/layout/AdminLayout.tsx
import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import { tokenStorage } from "@/services/http/token";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1) Cek awal: kalau token sudah tidak ada, segera pulang ke "/"
  useEffect(() => {
    if (!tokenStorage.get()) {
      navigate("/", { replace: true, state: { from: location } });
    }
  }, [navigate, location]);

  // 2) Dengarkan event dari fetcher saat refresh token gagal → redirect
  useEffect(() => {
    const onLogout = () => {
      navigate("/", { replace: true, state: { from: location } });
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [navigate, location]);

  // 3) Sync antar tab: jika access_token dihapus di tab lain → redirect
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token" && e.newValue === null) {
        navigate("/", { replace: true, state: { from: location } });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate, location]);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-neutral-50">
      <aside className="border-r border-neutral-200">
        <AdminSidebar />
      </aside>

      <section className="flex min-h-screen flex-col">
        <AdminNavbar />
        {/* content */}
        <div className="p-6">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
