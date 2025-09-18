import React from "react";
import { RiMailLine, RiKeyLine } from "react-icons/ri";
import GuruMusik from "@/assets/images/gurumusik.png";

export const LoginPage: React.FC = () => {
  return (
    <div className="h-screen w-full grid place-items-center bg-neutral-50">
      {/* Card */}
      <form className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-[#E6EDF5] p-6 sm:p-7">
        {/* Header (logo + title) */}
        <div className="flex items-center gap-3 mb-8">
          <img
            src={GuruMusik}
            alt="Guru Musik.ID"
            width={40}
            height={40}
            className="rounded object-contain"
          />
          <h1 className="text-xl font-bold text-[#0f172a]">Guru Musik.ID</h1>
        </div>

        {/* Email */}
        <label htmlFor="email" className="block text-sm text-left font-medium text-[#0f172a] mb-1">
          Email
        </label>
        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <RiMailLine className="text-[18px] text-neutral-600" />
          </span>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="| cth: guruku@gmail.com"
            className="w-full h-11 rounded-xl border border-[#D7E1EF] bg-white pl-10 pr-3 outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:border-[#A7C7F3] text-[15px] placeholder:text-neutral-600"
            required
          />
        </div>

        {/* Password */}
        <label htmlFor="password" className="block text-sm text-left font-medium text-[#0f172a] mb-1">
          Password
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <RiKeyLine className="text-[18px] text-neutral-600" />
          </span>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="| Masukkan Password Admin"
            className="w-full h-11 rounded-xl border border-[#D7E1EF] bg-white pl-10 pr-3 outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:border-[#A7C7F3] text-[15px] placeholder:text-neutral-600"
            required
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          className="w-full mt-6 h-12 rounded-full bg-[#F6C437] text-[#0b0b0b] font-semibold hover:brightness-95 transition"
        >
          Masuk
        </button>
      </form>
    </div>
  );
};
