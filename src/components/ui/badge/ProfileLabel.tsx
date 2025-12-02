'use client';
import { getPackageColor } from '@/utils/getPackageColor';

export default function ProfileLabel({ pkg }: { pkg: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPackageColor(pkg, 'solid')}`}>
      {pkg}
    </span>
  );
}
