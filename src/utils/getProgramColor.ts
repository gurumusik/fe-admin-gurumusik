export function getProgramColor(pkg: string): string {
  switch (pkg) {
    case 'Reguler':
      return 'bg-[var(--accent-purple-color)] text-white';
    case 'ABK':
      return 'bg-[var(--accent-orange-color)] text-white';
    case 'Internasional':
      return 'bg-[var(--accent-red-color)] text-white';
    case 'Hobby':
      return 'bg-[var(--primary-color)] text-black';
    default:
      return 'bg-gray-300 text-black';
  }
}

export function getProgramBg(pkg?: string | null): string {
  switch (pkg) {
    case 'Reguler':
      return 'bg-[var(--accent-purple-color)]';
    case 'ABK':
      return 'bg-[var(--accent-orange-color)]';
    case 'Internasional':
      return 'bg-[var(--accent-red-color)]';
    case 'Hobby':
      return 'bg-[var(--primary-color)]';
    default:
      return 'bg-gray-300';
  }
}
