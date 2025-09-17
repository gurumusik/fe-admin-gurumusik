import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import AppLayout from '@/components/layout/AppLayout';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
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
