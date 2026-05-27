'use client';

import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  bills: 'Bills',
  payments: 'Payments',
  vendors: 'Vendors',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const [segment] = pathname.split('/').filter(Boolean);
  const label = segment ? LABELS[segment] ?? segment : 'Dashboard';

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-700">
      <span>Dashboard /</span>
      <span className="ml-1">{label}</span>
    </nav>
  );
}
