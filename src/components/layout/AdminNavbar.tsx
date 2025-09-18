import React from "react";
import avatarDemo from "@/assets/images/teacher-demo.png";
import { RiArrowDownSFill } from "react-icons/ri";

const AdminNavbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-10 h-20 bg-white shadow flex justify-between items-center px-8">
      <div className="flex flex-col gap-1 px-4">
        <h2 className="text-lg font-semibold text-[#333]">Welcome Back, Admin</h2>
        <p className="text-sm text-[#777]">Semua kebutuhan mengajar musik dalam satu Dashboard</p>
      </div>

      <div className="flex items-center gap-3">
        <img
          src={avatarDemo}
          alt="Profile"
          width={50}
          height={50}
          className="cursor-pointer rounded-full object-cover"
        />
        <RiArrowDownSFill size={25} className="text-black" />
      </div>
    </nav>
  );
};

export default AdminNavbar;
