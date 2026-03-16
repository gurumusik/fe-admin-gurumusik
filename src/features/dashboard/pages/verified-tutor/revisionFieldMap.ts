export function humanizeFieldKey(fieldKey: string) {
  const k = String(fieldKey || '').trim();
  if (!k) return '-';
  return k
    .replace(/\./g, ' / ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Label yang kita tampilkan di UI (kalau key tidak ada -> fallback humanizeFieldKey)
export const REVISION_FIELD_LABELS: Record<string, string> = {
  'profile.avatar': 'Foto profil',
  'profile.nama_panggilan': 'Nama panggilan',
  'profile.email': 'Email',
  'profile.phone': 'Nomor telepon',

  'location.province': 'Provinsi',
  'location.city': 'Kota',
  // backward-compatible keys (older drafts)
  'location.alamat': 'Alamat',
  'location.coordinate': 'Titik koordinat lokasi',

  // current backend keys
  'location.address': 'Alamat',
  'location.coordinates': 'Titik koordinat lokasi',

  'intro.video': 'Video perkenalan',

  'documents.cv': 'CV',
  'documents.portfolio': 'Sertifikat instrumen (portfolio)',
  'documents.award_certificate': 'Sertifikat penghargaan',

  'certificates.instrument': 'Sertifikat instrumen',
  'certificates.education': 'Sertifikat pendidikan',
  'certificates.award': 'Sertifikat penghargaan',

  languages: 'Bahasa',

  'class.title': 'Judul kelas',
  'class.about': 'Tentang kelas',
  'class.values': 'Value kelas',
};

export function getRevisionFieldLabel(fieldKey: string) {
  return REVISION_FIELD_LABELS[fieldKey] ?? humanizeFieldKey(fieldKey);
}
