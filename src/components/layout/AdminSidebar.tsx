import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  RiCoinsLine,
  RiInformationLine,
  RiFolderUserLine,
  RiCoupon2Line,
  RiArrowDownSLine,
  RiUserSearchLine,
  RiSoundModuleLine,
  RiStarLine,
  RiFileAddLine,
} from "react-icons/ri";
import logo from "@/assets/images/gurumusik.png";

/* Animasi dropdown */
const DropWrap: React.FC<{ open: boolean; className?: string; children: React.ReactNode }> = ({
  open,
  className = "",
  children,
}) => (
  <div
    className={`overflow-hidden transition-all duration-200 ease-out origin-top ${
      open ? "max-h-[80vh] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-95"
    } ${className}`}
  >
    {children}
  </div>
);

/* Subitem TANPA badge */
const SubItem: React.FC<{ to: string; label: string; active?: boolean; className?: string }> = ({
  to,
  label,
  active,
  className = "",
}) => (
  <Link
    to={to}
    className={`mt-2 flex items-center px-3 py-2 rounded-xl ${
      active
        ? "bg-[var(--secondary-light-color,#E6F4FF)] text-[var(--secondary-color,#0682DF)]"
        : "text-[#0f172a] hover:bg-[var(--accent-blue-light-color,#E7EFFD)]"
    } ${className}`}
  >
    <span className={`text-md ${active ? "font-medium" : ""}`}>{label}</span>
  </Link>
);

const AdminSidebar: React.FC = () => {
  const location = useLocation();

  // helpers active
  const isExact = (p: string) => location.pathname === p;
  const isUnder = (prefix: string) =>
    location.pathname === prefix || location.pathname.startsWith(prefix + "/");
  const starts = (xs: string[]) => xs.some((p) => isUnder(p) || isExact(p));

  // prefix route per grup
  const managePrefixes = [
    "/dashboard-admin/programs",
    "/dashboard-admin/paket",
    "/dashboard-admin/instrument",
    "/dashboard-admin/module",
    "/dashboard-admin/certificate-instrument",
  ];
  const financePrefixes = [
    "/dashboard-admin/earnings",
    "/dashboard-admin/tutor-commision",
    "/dashboard-admin/refund",
    "/dashboard-admin/data-rekrutmen",
  ];
  const reportPrefixes = [
    "/dashboard-admin/reschedule",
    "/dashboard-admin/tutor-report",
    "/dashboard-admin/student-report",
  ];
  const usersPrefixes = [
    "/dashboard-admin/tutor-list",
    "/dashboard-admin/student-list",
    "/dashboard-admin/employees",
    "/dashboard-admin/transaction-list",
  ];

  // cek aktif per grup
  const groupActiveManage = starts(managePrefixes);
  const groupActiveFinance = starts(financePrefixes);
  const groupActiveReport = starts(reportPrefixes);
  const groupActiveUsers = starts(usersPrefixes);

  // single-item actives
  const isPromoActive = isUnder("/dashboard-admin/manage-promo");
  const isVerifiedTutorActive = isUnder("/dashboard-admin/verified-tutor");
  const isRatingActive = isUnder("/dashboard-admin/manage-rating");
  const isEntryTutorActive = isUnder("/dashboard-admin/entry-tutor");

  // state dropdown
  const [openManage, setOpenManage] = React.useState(groupActiveManage);
  const [openFinance, setOpenFinance] = React.useState(groupActiveFinance);
  const [openReport, setOpenReport] = React.useState(groupActiveReport);
  const [openUsers, setOpenUsers] = React.useState(groupActiveUsers);

  // default buka HANYA grup yang rutenya aktif, lainnya ditutup
  React.useEffect(() => {
    setOpenManage(groupActiveManage);
    setOpenFinance(groupActiveFinance);
    setOpenReport(groupActiveReport);
    setOpenUsers(groupActiveUsers);
  }, [groupActiveManage, groupActiveFinance, groupActiveReport, groupActiveUsers]);

  // Accordion: cuma 1 section yang boleh kebuka
  const toggleSection = (section: "manage" | "finance" | "report" | "users") => {
    setOpenManage((prev) => (section === "manage" ? !prev : false));
    setOpenFinance((prev) => (section === "finance" ? !prev : false));
    setOpenReport((prev) => (section === "report" ? !prev : false));
    setOpenUsers((prev) => (section === "users" ? !prev : false));
  };

  return (
    <aside className="bg-white w-[260px] h-screen fixed left-0 top-0 p-4 shadow-md z-[11]">
      {/* Header */}
      <div className="flex items-center justify-center font-semibold gap-2 min-h-12 mb-4">
        <img src={logo} alt="GuruMusik Logo" className="w-[30px] h-[30px] object-contain" />
        <h2 className="text-xl font-bold text-[#121212]">Guru Musik.ID</h2>
      </div>

      <div className="h-px w-full bg-neutral-300 mb-3" />

      <nav>
        <ul className="space-y-2">
          {/* Manage Item */}
          <li>
            <button
              type="button"
              onClick={() => toggleSection("manage")}
              className={`w-full group flex items-center justify-between px-2 py-3 rounded-xl hover:bg-[var(--accent-blue-light-color,#E7EFFD)] ${
                groupActiveManage ? "bg-[var(--secondary-light-color,#E6F4FF)]/60" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <RiSoundModuleLine
                  className={`text-2xl transition-colors ${
                    groupActiveManage ? "text-[var(--secondary-color,#0682DF)]" : "text-[#6A7B98]"
                  }`}
                />
                <span
                  className={`ml-2 font-medium text-lg transition-colors ${
                    groupActiveManage ? "text-[var(--secondary-color,#0682DF)]" : "text-[#6A7B98]"
                  }`}
                >
                  Manage Item
                </span>
              </div>
              <RiArrowDownSLine
                className={`text-[18px] text-[#64748b] transition-transform ${
                  openManage ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropWrap open={openManage}>
              <div className="pl-6 relative">
                <span className="pointer-events-none absolute left-[12px] top-1 bottom-1 w-[3px] rounded bg-neutral-200" />
                <SubItem
                  to="/dashboard-admin/programs"
                  label="Programs"
                  active={isUnder("/dashboard-admin/programs")}
                  className="mt-0 px-3 py-3"
                />
                <SubItem
                  to="/dashboard-admin/paket"
                  label="Paket"
                  active={isUnder("/dashboard-admin/paket")}
                  className="mt-0 px-3 py-3"
                />
                <SubItem
                  to="/dashboard-admin/instrument"
                  label="Instrumen"
                  active={isUnder("/dashboard-admin/instrument")}
                  className="mt-0 px-3 py-3"
                />
                <SubItem
                  to="/dashboard-admin/module"
                  label="Module"
                  active={isUnder("/dashboard-admin/module")}
                />
                <SubItem
                  to="/dashboard-admin/certificate-instrument"
                  label="Certificate Instruments"
                  active={isUnder("/dashboard-admin/certificate-instrument")}
                />
              </div>
            </DropWrap>
          </li>

          {/* Finance */}
          <li>
            <button
              type="button"
              onClick={() => toggleSection("finance")}
              className={`w-full group flex items-center justify-between px-2 py-3 rounded-xl hover:bg-[var(--accent-blue-light-color,#E7EFFD)] ${
                groupActiveFinance ? "bg-[var(--secondary-light-color,#E6F4FF)]/60" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <RiCoinsLine
                  className={`text-2xl transition-colors ${
                    groupActiveFinance ? "text-[var(--secondary-color,#0682DF)]" : "text-[#6A7B98]"
                  }`}
                />
                <span
                  className={`ml-2 font-medium text-lg transition-colors ${
                    groupActiveFinance ? "text-[var(--secondary-color,#0682DF)]" : "text-[#6A7B98]"
                  }`}
                >
                  Finance
                </span>
              </div>
              <RiArrowDownSLine
                className={`text-[18px] text-[#64748b] transition-transform ${
                  openFinance ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropWrap open={openFinance}>
              <div className="pl-6 relative">
                <span className="pointer-events-none absolute left-[12px] top-1 bottom-1 w-[3px] rounded bg-neutral-200" />
                <SubItem
                  to="/dashboard-admin/earnings"
                  label="Earnings"
                  active={isExact("/dashboard-admin/earnings")}
                />
                <SubItem
                  to="/dashboard-admin/tutor-commision"
                  label="Tutor Commision"
                  active={isUnder("/dashboard-admin/tutor-commision")}
                />
                <SubItem
                  to="/dashboard-admin/refund"
                  label="Refund"
                  active={isExact("/dashboard-admin/refund")}
                />
              </div>
            </DropWrap>
          </li>

          {/* Report */}
          <li>
            <button
              type="button"
              onClick={() => toggleSection("report")}
              className={`w-full group flex items-center justify-between px-2 py-3 rounded-xl hover:bg-[var(--accent-blue-light-color,#E7EFFD)] ${
                groupActiveReport ? "bg-[var(--secondary-light-color,#E6F4FF)]/60" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <RiInformationLine
                  className={`text-2xl transition-colors ${
                    groupActiveReport ? "text-[var(--secondary-color,#0682DF)]" : "text-[#6A7B98]"
                  }`}
                />
                <span
                  className={`ml-2 font-medium text-lg transition-colors ${
                    groupActiveReport ? "text-[var(--secondary-color,#0682DF)]" : "text-[#6A7B98]"
                  }`}
                >
                  Report
                </span>
              </div>
              <RiArrowDownSLine
                className={`text-[18px] text-[#64748b] transition-transform ${
                  openReport ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropWrap open={openReport}>
              <div className="pl-6 relative">
                <span className="pointer-events-none absolute left-[12px] top-1 bottom-1 w-[3px] rounded bg-neutral-200" />
                <SubItem
                  to="/dashboard-admin/reschedule"
                  label="Reschedule"
                  active={isExact("/dashboard-admin/reschedule")}
                />
                <SubItem
                  to="/dashboard-admin/tutor-report"
                  label="Tutor Report"
                  active={isExact("/dashboard-admin/tutor-report")}
                />
                <SubItem
                  to="/dashboard-admin/student-report"
                  label="Student Report"
                  active={isExact("/dashboard-admin/student-report")}
                />
              </div>
            </DropWrap>
          </li>

          {/* List User */}
          <li>
            <button
              type="button"
              onClick={() => toggleSection("users")}
              className={`w-full group flex items-center justify-between px-2 py-3 rounded-xl hover:bg-[var(--accent-blue-light-color,#E7EFFD)] ${
                groupActiveUsers ? "bg-[var(--secondary-light-color,#E6F4FF)]/60" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <RiFolderUserLine
                  className={`text-2xl transition-colors ${
                    groupActiveUsers ? "text-[var(--secondary-color,#0682DF)]" : "text-[#6A7B98]"
                  }`}
                />
                <span
                  className={`ml-2 font-medium text-lg transition-colors ${
                    groupActiveUsers ? "text-[var(--secondary-color,#0682DF)]" : "text-[#6A7B98]"
                  }`}
                >
                  Data Lists
                </span>
              </div>
              <RiArrowDownSLine
                className={`text-[18px] text-[#64748b] transition-transform ${
                  openUsers ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropWrap open={openUsers}>
              <div className="pl-6 relative">
                <span className="pointer-events-none absolute left-[12px] top-1 bottom-1 w-[3px] rounded bg-neutral-200" />
                <SubItem
                  to="/dashboard-admin/tutor-list"
                  label="Tutor List"
                  active={isUnder("/dashboard-admin/tutor-list")}
                />
                <SubItem
                  to="/dashboard-admin/student-list"
                  label="Student List"
                  active={isUnder("/dashboard-admin/student-list")}
                />
                <SubItem
                  to="/dashboard-admin/employees"
                  label="Employee Access"
                  active={isUnder("/dashboard-admin/employees")}
                />
                <SubItem
                  to="/dashboard-admin/transaction-list"
                  label="Transaction List"
                  active={isUnder("/dashboard-admin/transaction-list")}
                />
              </div>
            </DropWrap>
          </li>

          {/* Single items */}
          <li>
            <Link
              to="/dashboard-admin/manage-rating"
              className={`group flex items-center justify-between px-2 py-3 rounded-xl
                ${
                  isRatingActive
                    ? "bg-[var(--secondary-light-color,#E6F4FF)]/60"
                    : "hover:bg-[var(--accent-blue-light-color,#E7EFFD)]"
                }`}
            >
              <div className="flex items-center gap-3">
                <RiStarLine
                  className={`text-2xl transition-colors ${
                    isRatingActive
                      ? "text-[var(--secondary-color,#0682DF)]"
                      : "text-[#6A7B98] group-hover:text-[var(--secondary-color,#0682DF)]"
                  }`}
                />
                <span
                  className={`ml-2 font-medium text-lg transition-colors ${
                    isRatingActive
                      ? "text-[var(--secondary-color,#0682DF)]"
                      : "text-[#6A7B98] group-hover:text-[var(--secondary-color,#0682DF)]"
                  }`}
                >
                  Manage Rating
                </span>
              </div>
            </Link>
          </li>

          <li>
            <Link
              to="/dashboard-admin/manage-promo"
              className={`group flex items-center justify-between px-2 py-3 rounded-xl
                ${
                  isPromoActive
                    ? "bg-[var(--secondary-light-color,#E6F4FF)]/60"
                    : "hover:bg-[var(--accent-blue-light-color,#E7EFFD)]"
                }`}
            >
              <div className="flex items-center gap-3">
                <RiCoupon2Line
                  className={`text-2xl transition-colors ${
                    isPromoActive
                      ? "text-[var(--secondary-color,#0682DF)]"
                      : "text-[#6A7B98] group-hover:text-[var(--secondary-color,#0682DF)]"
                  }`}
                />
                <span
                  className={`ml-2 font-medium text-lg transition-colors ${
                    isPromoActive
                      ? "text-[var(--secondary-color,#0682DF)]"
                      : "text-[#6A7B98] group-hover:text-[var(--secondary-color,#0682DF)]"
                  }`}
                >
                  Manage Promo
                </span>
              </div>
            </Link>
          </li>

          <li>
            <Link
              to="/dashboard-admin/verified-tutor"
              className={`group flex items-center justify-between px-2 py-3 rounded-xl
                ${
                  isVerifiedTutorActive
                    ? "bg-[var(--secondary-light-color,#E6F4FF)]/60"
                    : "hover:bg-[var(--accent-blue-light-color,#E7EFFD)]"
                }`}
            >
              <div className="flex items-center gap-3">
                <RiUserSearchLine
                  className={`text-2xl transition-colors ${
                    isVerifiedTutorActive
                      ? "text-[var(--secondary-color,#0682DF)]"
                      : "text-[#6A7B98] group-hover:text-[var(--secondary-color,#0682DF)]"
                  }`}
                />
                <span
                  className={`ml-2 font-medium text-lg transition-colors ${
                    isVerifiedTutorActive
                      ? "text-[var(--secondary-color,#0682DF)]"
                      : "text-[#6A7B98] group-hover:text-[var(--secondary-color,#0682DF)]"
                  }`}
                >
                  Verified Tutor
                </span>
              </div>
            </Link>
          </li>

          <li>
            <Link
              to="/dashboard-admin/entry-tutor"
              className={`group flex items-center justify-between px-2 py-3 rounded-xl
                ${
                  isEntryTutorActive
                    ? "bg-[var(--secondary-light-color,#E6F4FF)]/60"
                    : "hover:bg-[var(--accent-blue-light-color,#E7EFFD)]"
                }`}
            >
              <div className="flex items-center gap-3">
                <RiFileAddLine
                  className={`text-2xl transition-colors ${
                    isEntryTutorActive
                      ? "text-[var(--secondary-color,#0682DF)]"
                      : "text-[#6A7B98] group-hover:text-[var(--secondary-color,#0682DF)]"
                  }`}
                />
                <span
                  className={`ml-2 font-medium text-lg transition-colors ${
                    isEntryTutorActive
                      ? "text-[var(--secondary-color,#0682DF)]"
                      : "text-[#6A7B98] group-hover:text-[var(--secondary-color,#0682DF)]"
                  }`}
                >
                  Entry Tutor
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
