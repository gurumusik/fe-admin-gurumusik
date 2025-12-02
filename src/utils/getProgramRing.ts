export function getProgramRing(pkg: string): string {
  switch (pkg) {
    case 'Reguler':
      return 'ring-[var(--accent-purple-color)]';
    case 'ABK':
      return 'ring-[var(--accent-orange-color)]';
    case 'Internasional':
      return 'ring-[var(--accent-red-color)]';
    case 'Hobby':
      return 'ring-[var(--primary-color)]';
    default:
      return 'ring-gray-300';
  }
}