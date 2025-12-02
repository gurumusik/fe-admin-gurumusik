type Variant = 'solid' | 'soft';

export function getPackageColor(pkg: string, variant: Variant = 'solid'): string {
  // normalisasi nama paket biar alias tetap nyambung
  const key = (pkg || '').toLowerCase();

  const map: Record<string, { solid: string; soft: string }> = {
    // Semester / ABK (contoh pakai orange)
    'paket semesteran': {
      solid: 'bg-(--accent-orange-color) text-white',
      soft: 'bg-[color-mix(in_srgb,var(--accent-orange-color) 12%,white)] text-[var(--accent-orange-color)] border border-[color-mix(in_srgb,var(--accent-orange-color) 32%,white)]',
    },
    'semesteran': {
      solid: 'bg-(--accent-orange-color) text-white',
      soft: 'bg-[color-mix(in_srgb,var(--accent-orange-color) 12%,white)] text-[var(--accent-orange-color)] border border-[color-mix(in_srgb,var(--accent-orange-color) 32%,white)]',
    },
    'abk': {
      solid: 'bg-(--accent-orange-color) text-white',
      soft: 'bg-[color-mix(in_srgb,var(--accent-orange-color) 12%,white)] text-[var(--accent-orange-color)] border border-[color-mix(in_srgb,var(--accent-orange-color) 32%,white)]',
    },

    // Reguler (ungu)
    'paket reguler': {
      solid: 'bg-(--accent-purple-color) text-white',
      soft: 'bg-[color-mix(in_srgb,var(--accent-purple-color) 12%,white)] text-[var(--accent-purple-color)] border border-[color-mix(in_srgb,var(--accent-purple-color) 32%,white)]',
    },
    'reguler': {
      solid: 'bg-(--accent-purple-color) text-white',
      soft: 'bg-[color-mix(in_srgb,var(--accent-purple-color) 12%,white)] text-[var(--accent-purple-color)] border border-[color-mix(in_srgb,var(--accent-purple-color) 32%,white)]',
    },

    // Bulanan (merah)
    'paket bulanan': {
      solid: 'bg-(--accent-red-color) text-white',
      soft: 'bg-[color-mix(in_srgb,var(--accent-red-color) 12%,white)] text-[var(--accent-red-color)] border border-[color-mix(in_srgb,var(--accent-red-color) 32%,white)]',
    },
    'bulanan': {
      solid: 'bg-(--accent-red-color) text-white',
      soft: 'bg-[color-mix(in_srgb,var(--accent-red-color) 12%,white)] text-[var(--accent-red-color)] border border-[color-mix(in_srgb,var(--accent-red-color) 32%,white)]',
    },

    // Tahunan (primary)
    'paket tahunan': {
      solid: 'bg-(--primary-color) text-black',
      soft: 'bg-[color-mix(in_srgb,var(--primary-color) 16%,white)] text-[var(--primary-color)] border border-[color-mix(in_srgb,var(--primary-color) 35%,white)]',
    },
    'tahunan': {
      solid: 'bg-(--primary-color) text-black',
      soft: 'bg-[color-mix(in_srgb,var(--primary-color) 16%,white)] text-[var(--primary-color)] border border-[color-mix(in_srgb,var(--primary-color) 35%,white)]',
    },
  };

  const found =
    map[key] ||
    { solid: 'bg-gray-300 text-black', soft: 'bg-gray-100 text-gray-700 border border-gray-300' };

  return variant === 'soft' ? found.soft : found.solid;
}