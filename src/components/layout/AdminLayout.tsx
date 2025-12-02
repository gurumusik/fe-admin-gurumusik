// src/components/layout/AdminLayout.tsx
import { useEffect, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import { tokenStorage } from "@/services/http/token";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ====== AUTH GUARD (tetap sama) ======
  useEffect(() => {
    if (!tokenStorage.get()) {
      navigate("/", { replace: true, state: { from: location } });
    }
  }, [navigate, location]);

  useEffect(() => {
    const onLogout = () => navigate("/", { replace: true, state: { from: location } });
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [navigate, location]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token" && e.newValue === null) {
        navigate("/", { replace: true, state: { from: location } });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate, location]);

  // ====== NO-CHROME ROUTES ======
  const noChrome = useMemo(() => {
    // tambahkan pola lain kalau perlu (mis. struk, fullscreen editor, dsb)
    const patterns = [/^\/dashboard-admin\/invoice(\/|$)/i];
    return patterns.some((re) => re.test(location.pathname));
  }, [location.pathname]);

  // ====== RENDER TANPA NAV & SIDEBAR UNTUK INVOICE ======
  if (noChrome) {
    return (
      <div className="min-h-screen bg-white">
        {/* Jangan beri padding—biar halaman invoice atur sendiri */}
        <Outlet />
      </div>
    );
  }

  // ====== DEFAULT LAYOUT ======
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-neutral-50">
      <aside className="border-r border-neutral-200">
        <AdminSidebar />
      </aside>

      <section className="flex min-h-screen flex-col">
        <AdminNavbar />
        <div className="p-6">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
