import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import AppLayout from '@/components/layout/AppLayout';
import { DashboardPage } from '@/features/dashboard/pages/page';
import AdminLayout from '@/components/layout/AdminLayout';
import { AdminInstrumentPage } from '@/features/dashboard/pages/instrument/page';
import { InstrumentDetailPage } from "@/features/dashboard/pages/instrument/InstrumentDetailPage/page";
import { AdminModulePage } from '@/features/dashboard/pages/module/page';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '/login', element: <LoginPage /> },
      // ...public routes
    ],
  },
  {
    element: <AdminLayout />,
    children: [
      { path: '/dashboard-admin', element: <DashboardPage /> },
      { path: '/dashboard-admin/instrument', element: <AdminInstrumentPage /> },
      { path: '/dashboard-admin/instrument/:type', element: <InstrumentDetailPage /> },

      // belum selesai
      { path: '/dashboard-admin/module', element: <AdminModulePage /> },
      { path: '/dashboard-admin/earnings', element: <LoginPage /> },
      { path: '/dashboard-admin/tutor-commision', element: <LoginPage /> },
      { path: '/dashboard-admin/refund', element: <LoginPage /> },
      { path: '/dashboard-admin/data-rekrutment', element: <LoginPage /> },
      { path: '/dashboard-admin/student-report', element: <LoginPage /> },
      { path: '/dashboard-admin/tutor-list', element: <LoginPage /> },
      { path: '/dashboard-admin/student-list', element: <LoginPage /> },
      { path: '/dashboard-admin/manage-promo', element: <LoginPage /> },
      { path: '/dashboard-admin/verified-teacher', element: <LoginPage /> },
      // ...public routes
    ],
  },
//   {
//     element: <RequireAuth />, // must be logged in
//     children: [
//       {
//         path: '/admin',
//         element: <AdminLayout />,
//         children: [
//           { index: true, element: <RoleGuard allow={['admin']} /> },
//           { path: '', element: <RoleGuard allow={['admin']} />, children: [
//             { index: true, element: <AdminHomePage /> },
//             { path: 'users', element: <UsersPage /> },
//           ]},
//         ],
//       },
//     ],
//   },
]);
