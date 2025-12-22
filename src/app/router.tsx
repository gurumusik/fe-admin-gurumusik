// src/app/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import AppLayout from "@/components/layout/AppLayout";
import { DashboardPage } from "@/features/dashboard/pages/page";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminGuard from "@/features/auth/components/AdminGuard";
import { AdminInstrumentPage } from "@/features/dashboard/pages/instrument/page";
import InstrumentDetailPage from "@/features/dashboard/pages/instrument/InstrumentDetailPage/page";
import AdminModulePage from "@/features/dashboard/pages/module/page";
import EditModulePage from "@/features/dashboard/pages/module/edit-module/page";
import AdminRefundPage from "@/features/dashboard/pages/refund/page";
import TutorReportPage from "@/features/dashboard/pages/tutor-report/page";
import StudentReportPage from "@/features/dashboard/pages/student-report/page";
import VerifiedTutorPage from "@/features/dashboard/pages/verified-tutor/page";
import AdminEarningsPage from "@/features/dashboard/pages/earnings/page";
import TutorListPage from "@/features/dashboard/pages/tutor-list/page";
import ClassListTutorPage from "@/features/dashboard/pages/tutor-list/class-list-tutor/page";
import StudentListPage from "@/features/dashboard/pages/student-list/page";
import DetailStudentPage from "@/features/dashboard/pages/student-list/detail-student/page";
import DetailStudentClassPage from "@/features/dashboard/pages/student-list/detail-student/detail-student-class/page";
import AdminManagePromoPage from "@/features/dashboard/pages/manage-promo/page";
import DetailPromoPage from "@/features/dashboard/pages/manage-promo/detail-promo/page";
import ManageFlashsalePage from "@/features/dashboard/pages/manage-promo/manage-flashsale/page";
import TutorCommisionPage from "@/features/dashboard/pages/commision/page";
import AuditCommisionPage from "@/features/dashboard/pages/commision/audit-commision/page";
import CashoutVerificationPage from "@/features/dashboard/pages/commision/cashout-verification/page";
import RequestModulePage from "@/features/dashboard/pages/module/request-module/page";
import DetailRequestModulePage from "@/features/dashboard/pages/module/request-module/detail-request/page";
import ProfileTutorPage from "@/features/dashboard/pages/tutor-list/class-list-tutor/profile-tutor/page";
import DetailClassTutorPage from "@/features/dashboard/pages/tutor-list/class-list-tutor/detail-class/page";
import ManageRatingPage from "@/features/dashboard/pages/manage-rating/page";
import EntryTutorPage from "@/features/dashboard/pages/entry-tutor/page"
import InvoicePage from '@/features/dashboard/pages/invoice/page';
import ManageProgramPage from '@/features/dashboard/pages/programs/page';
import ManagePaketPage from '@/features/dashboard/pages/paket/page';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Navigate to="/login" replace /> },
      { path: "/login", element: <LoginPage /> },
      // ...public routes
    ],
  },
  {
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    children: [
      { path: "/dashboard-admin", element: <DashboardPage /> },
      { path: "/dashboard-admin/instrument", element: <AdminInstrumentPage /> },
      { path: "/dashboard-admin/instrument/:type", element: <InstrumentDetailPage /> },
      { path: "/dashboard-admin/refund", element: <AdminRefundPage /> },
      { path: "/dashboard-admin/tutor-report", element: <TutorReportPage /> },
      { path: "/dashboard-admin/student-report", element: <StudentReportPage /> },
      { path: "/dashboard-admin/verified-tutor", element: <VerifiedTutorPage /> },
      { path: "/dashboard-admin/earnings", element: <AdminEarningsPage /> },
      { path: "/dashboard-admin/tutor-list", element: <TutorListPage /> },
      { path: "/dashboard-admin/tutor-list/class-list-tutor", element: <ClassListTutorPage /> },
      { path: "/dashboard-admin/tutor-list/class-list-tutor/detail-class", element: <DetailClassTutorPage /> },
      { path: "/dashboard-admin/tutor-list/class-list-tutor/profile-tutor", element: <ProfileTutorPage /> },
      { path: "/dashboard-admin/student-list", element: <StudentListPage /> },
      { path: "/dashboard-admin/student-list/detail-student", element: <DetailStudentPage /> },
      { path: "/dashboard-admin/student-list/detail-student/detail-class/:classId", element: <DetailStudentClassPage /> },
      { path: "/dashboard-admin/manage-promo", element: <AdminManagePromoPage /> },
      { path: "/dashboard-admin/manage-promo/detail-promo", element: <DetailPromoPage /> },
      { path: "/dashboard-admin/manage-promo/manage-flashsale", element: <ManageFlashsalePage /> },
      { path: "/dashboard-admin/tutor-commision", element: <TutorCommisionPage /> },
      { path: "/dashboard-admin/tutor-commision/audit-commision", element: <AuditCommisionPage /> },
      { path: "/dashboard-admin/tutor-commision/cashout-verification", element: <CashoutVerificationPage /> },
      { path: "/dashboard-admin/module", element: <AdminModulePage /> },
      { path: "/dashboard-admin/module/edit-module/:id", element: <EditModulePage /> },
      { path: "/dashboard-admin/module/request", element: <RequestModulePage /> },
      { path: "/dashboard-admin/module/request/detail/:id", element: <DetailRequestModulePage /> },
      { path: "/dashboard-admin/manage-rating", element: <ManageRatingPage /> },
      { path: "/dashboard-admin/entry-tutor", element: <EntryTutorPage /> },
      { path: "/dashboard-admin/invoice/:id", element: <InvoicePage /> },
      { path: "/dashboard-admin/programs", element: <ManageProgramPage /> },
      { path: "/dashboard-admin/paket", element: <ManagePaketPage /> },
    ],
  },
]);
