import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* header/navbar di sini */}
      <main className="mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
