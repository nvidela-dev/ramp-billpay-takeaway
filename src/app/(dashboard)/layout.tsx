import type { ReactNode } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

import { Breadcrumb } from './_components/breadcrumb';

export const dynamic = 'force-dynamic';

const navItems = [
  { href: '/bills', label: 'Bills' },
  { href: '/payments', label: 'Payments' },
  { href: '/vendors', label: 'Vendors' },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="mx-auto grid max-w-[1200px] gap-4 p-4">
        <header
          className={[
            'flex items-center justify-between gap-3 rounded-lg border border-slate-200',
            'bg-white px-4 py-3',
          ].join(' ')}
        >
          <Breadcrumb />
          {clerkEnabled ? (
            <UserButton />
          ) : (
            <span className="text-sm text-slate-600">User</span>
          )}
        </header>

        <details className="rounded-lg border border-slate-200 bg-white px-3 py-2 md:hidden">
          <summary className="cursor-pointer font-semibold">Menu</summary>
          <nav aria-label="Mobile navigation" className="mt-2 flex flex-wrap gap-3">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-slate-800">
                {item.label}
              </Link>
            ))}
          </nav>
        </details>

        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <aside
            className="hidden self-start rounded-lg border border-slate-200 bg-white p-4 md:block"
          >
            <nav aria-label="Sidebar navigation" className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md bg-slate-100 px-2.5 py-2 text-slate-900 no-underline"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section className="min-h-[420px] rounded-lg border border-slate-200 bg-white p-4">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
