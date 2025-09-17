import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r border-neutral-200 p-4">
        <div className="font-semibold mb-4">Admin</div>
        {/* nav menu */}
      </aside>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
