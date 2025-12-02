export function getStatusColor(status: string): string {
  switch (status) {
    case 'Menunggu Verifikasi':
      return 'text-(--accent-orange-color)';
    case 'Tampil':
      return 'text-(--accent-green-color)';
    case 'aktif':
      return 'text-(--accent-green-color)';
    case 'Aktif':
      return 'text-(--accent-green-color)';
    case 'Success':
      return 'text-(--accent-green-color)';
    case 'Finished':
      return 'text-(--accent-green-color)';
    case 'Selesai Tepat Waktu':
      return 'text-(--accent-green-color)';
    case 'kelas selesai':
      return 'text-(--accent-green-color)';
    case 'Selesai':
      return 'text-(--accent-green-color)';
    case 'Disetujui':
      return 'text-(--accent-green-color)';
    case 'non_aktif':
      return 'text-(--accent-red-color)';
    case 'Non-Aktif':
      return 'text-(--accent-red-color)';
    case 'Non Aktif':
      return 'text-(--accent-red-color)';
    case 'Belum Selesai':
      return 'text-(--accent-red-color)';
    case 'belum dimulai':
      return 'text-(--accent-red-color)';
    case 'Dibatalkan':
      return 'text-(--accent-red-color)';
    case 'Terlewat':
      return 'text-(--accent-red-color)';
    case 'Tidak Disetujui':
      return 'text-(--accent-red-color)';
    case 'Tidak Tampil':
      return 'text-(--accent-red-color)';
    case 'Dialihkan Ke Guru Lain':
      return 'text-(--accent-purple-color)';
    case 'Refund':
      return 'text-(--accent-orange-color)';
    case 'Pending':
      return 'text-(--primary-color)';
    case 'Cuti':
      return 'text-(--primary-color)';
    case 'cuti':
      return 'text-(--primary-color)';
    case 'On Going':
      return 'text-(--primary-color)';
    case 'On Progress':
      return 'text-(--primary-color)';
    case 'Diperiksa Admin':
      return 'text-(--primary-color)';
    case 'Selesai Terlambat':
      return 'text-(--primary-color)';
    default:
      return 'text-gray-500';
  }
}
