'use client';

import React from 'react';
import EmptyRefundIllustration from '@/assets/images/Maintenance.png'; // ganti sesuai lokasi asetmu

const AdminRefundPage: React.FC = () => {
  return (
    <main className="w-full flex items-center justify-center px-4 mt-10">
      <section className="max-w-3xl w-full text-center">
        <div className="flex justify-center mb-6">
          {/* Gambar */}
          <img
            src={EmptyRefundIllustration}
            alt="Fitur refund belum tersedia"
            className="w-[520px] max-w-full select-none pointer-events-none drop-shadow-sm"
            draggable={false}
          />
        </div>

        {/* Judul */}
        <h1 className="text-base md:text-lg font-semibold text-slate-800">
          Fitur Refund Belum Tersedia
        </h1>

        {/* Deskripsi */}
        <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600">
          Saat ini sistem pencatatan refund belum tersedia. Jika ada transaksi gagal,
          admin perlu melakukan pengembalian dana secara manual dengan menghubungi
          pengguna melalui WhatsApp.
        </p>
      </section>
    </main>
  );
};

export default AdminRefundPage;
