export function getStatusChip(status: string): string {
  switch (status) {
    case 'absen awal':
      return 'bg-(--accent-blue-light-color) text-(--accent-blue-color)';
    case 'kelas berlangsung':
      return 'bg-(--accent-orange-light-color) text-(--accent-orange-color)';
    case 'ganti guru':
      return 'bg-(--accent-orange-light-color) text-(--accent-orange-color)';
    case 'waktu habis':
      return 'bg-(--accent-purple-light-color) text-(--accent-purple-color)';
    case 'segera diselesaikan':
      return 'bg-(--accent-purple-light-color) text-(--accent-purple-color)';
    case 'absen akhir':
      return 'bg-(--accent-purple-light-color) text-(--accent-purple-color)';
    case 'kelas dimulai':
      return 'bg-(--secondary-light-color) text-(--secondary-color)';
    case 'review kelas':
      return 'bg-(--accent-blue-light-color) text-(--accent-blue-color)';
    case 'kelas selesai':
      return 'bg-(--accent-green-light-color) text-(--accent-green-color)';
    case 'belum dimulai':
      return 'bg-(--accent-red-light-color) text-(--accent-red-color)';
    case 'kelas terlewat':
      return 'bg-(--accent-red-light-color) text-(--accent-red-color)';
    case 're-schedule':
      return 'bg-(--accent-purple-light-color) text-(--accent-purple-color)';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}