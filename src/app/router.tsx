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
import VerifiedTutorRevisionsPage from "@/features/dashboard/pages/verified-tutor/revisions/page";
import VerifiedTutorCertificationsPage from "@/features/dashboard/pages/verified-tutor/certifications/page";
import VerifiedTutorManualCertificationsPage from "@/features/dashboard/pages/verified-tutor/manual-certifications/page";
import AdminEarningsPage from "@/features/dashboard/pages/earnings/page";
import TutorListPage from "@/features/dashboard/pages/tutor-list/page";
import TutorIncompletePage from "@/features/dashboard/pages/tutor-incomplete/page";
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
import SlipKomisiPage from "@/features/dashboard/pages/commision/slip-komisi/page";
import RequestModulePage from "@/features/dashboard/pages/module/request-module/page";
import DetailRequestModulePage from "@/features/dashboard/pages/module/request-module/detail-request/page";
import ProfileTutorPage from "@/features/dashboard/pages/tutor-list/class-list-tutor/profile-tutor/page";
import DetailClassTutorPage from "@/features/dashboard/pages/tutor-list/class-list-tutor/detail-class/page";
import ManageRatingPage from "@/features/dashboard/pages/manage-rating/page";
import ReschedulePage from "@/features/dashboard/pages/reschedule/page";
import MakeReschedulePage from "@/features/dashboard/pages/make-reschedule/page";
import EntryTutorPage from "@/features/dashboard/pages/entry-tutor/page"
import InvoicePage from '@/features/dashboard/pages/invoice/page';
import ManageProgramPage from '@/features/dashboard/pages/programs/page';
import ManagePaketPage from '@/features/dashboard/pages/paket/page';
import CertificateInstrumentPage from '@/features/dashboard/pages/certificate-instrument/page';
import EmployeePage from '@/features/dashboard/pages/employee/page';
import TransactionListPage from '@/features/dashboard/pages/transaction-list/page';
import TransactionTicketPage from '@/features/dashboard/pages/transaction-ticket/page';
import BillingConfigPage from '@/features/dashboard/pages/billing-config/page';
import RequestAssistPage from "@/features/dashboard/pages/request-assist/page";
import WaHandoffsPage from "@/features/dashboard/pages/wa-handoffs/page";
import AdminLiveChatPage from "@/features/dashboard/pages/live-chat/page";
import TeacherChangePage from "@/features/dashboard/pages/teacher-change/page";
import AdminProfileTemplatesPage from '@/features/dashboard/pages/profile-templates/page';
import AdminProfileTemplateCreatePage from '@/features/dashboard/pages/profile-templates/new/page';
import AdminProfileTemplateDetailPage from '@/features/dashboard/pages/profile-templates/detail/page';
import AdminRevisionTemplatesPage from '@/features/dashboard/pages/revision-templates/page';
import ReferralMonitoringPage from '@/features/dashboard/pages/referrals/page';
import AdminNotificationsPage from '@/features/dashboard/pages/notifications/page';

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
    path: "/withdraw/slip/:id",
    element: (
      <AdminGuard>
        <SlipKomisiPage />
      </AdminGuard>
    ),
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
      { path: "/dashboard-admin/reschedule", element: <ReschedulePage /> },
      { path: "/dashboard-admin/make-reschedule", element: <MakeReschedulePage /> },
      { path: "/dashboard-admin/request-assist", element: <RequestAssistPage /> },
      { path: "/dashboard-admin/wa-handoffs", element: <WaHandoffsPage /> },
      { path: "/dashboard-admin/live-chat", element: <AdminLiveChatPage /> },
      { path: "/dashboard-admin/verified-tutor", element: <VerifiedTutorPage /> },
      { path: "/dashboard-admin/verified-tutor/revisions", element: <VerifiedTutorRevisionsPage /> },
      { path: "/dashboard-admin/verified-tutor/certifications", element: <VerifiedTutorCertificationsPage /> },
      { path: "/dashboard-admin/verified-tutor/manual-certifications", element: <VerifiedTutorManualCertificationsPage /> },
      { path: "/dashboard-admin/earnings", element: <AdminEarningsPage /> },
      { path: "/dashboard-admin/tutor-list", element: <TutorListPage /> },
      { path: "/dashboard-admin/tutor-incomplete", element: <TutorIncompletePage /> },
      { path: "/dashboard-admin/tutor-list/class-list-tutor", element: <ClassListTutorPage /> },
      { path: "/dashboard-admin/tutor-list/class-list-tutor/detail-class", element: <DetailClassTutorPage /> },
      { path: "/dashboard-admin/tutor-list/class-list-tutor/profile-tutor", element: <ProfileTutorPage /> },
      { path: "/dashboard-admin/student-list", element: <StudentListPage /> },
      { path: "/dashboard-admin/student-list/detail-student", element: <DetailStudentPage /> },
      { path: "/dashboard-admin/student-list/detail-student/detail-class/:classId", element: <DetailStudentClassPage /> },
      { path: "/dashboard-admin/transaction-list", element: <TransactionListPage /> },
      { path: "/dashboard-admin/transaction-ticket", element: <TransactionTicketPage /> },
      { path: "/dashboard-admin/teacher-change", element: <TeacherChangePage /> },
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
      { path: "/dashboard-admin/certificate-instrument", element: <CertificateInstrumentPage /> },
      { path: "/dashboard-admin/employees", element: <EmployeePage /> },
      { path: "/dashboard-admin/billing-config", element: <BillingConfigPage /> },
      { path: "/dashboard-admin/notifications", element: <AdminNotificationsPage /> },
      { path: "/dashboard-admin/profile-templates", element: <AdminProfileTemplatesPage /> },
      { path: "/dashboard-admin/profile-templates/new", element: <AdminProfileTemplateCreatePage /> },
      { path: "/dashboard-admin/profile-templates/:id", element: <AdminProfileTemplateDetailPage /> },
      { path: "/dashboard-admin/revision-templates", element: <AdminRevisionTemplatesPage /> },
      { path: "/dashboard-admin/referrals", element: <ReferralMonitoringPage /> },
    ],
  },
]);
