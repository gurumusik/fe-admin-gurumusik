import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-neutral-50">
      <aside className="border-r border-neutral-200">
        <AdminSidebar />
      </aside>

      <section className="flex min-h-screen flex-col">
        <AdminNavbar />             
        {/* cntent */}
        <div className="p-10">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
