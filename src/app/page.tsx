import {
  ArrowRight,
  Building2,
  CreditCard,
  ReceiptText,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const scaffoldRoutes = [
  {
    href: '/bills',
    label: 'Bills',
    description: 'List shell with tabs, metrics, actions, and placeholder table.',
    icon: ReceiptText,
  },
  {
    href: '/bills/demo-bill',
    label: 'Bill detail',
    description: 'Detail route placeholder ready for future bill data wiring.',
    icon: ReceiptText,
  },
  {
    href: '/payments',
    label: 'Payments',
    description: 'Payment surface with tabs, metrics, actions, and table shell.',
    icon: CreditCard,
  },
  {
    href: '/payments/demo-payment',
    label: 'Payment detail',
    description: 'Detail route placeholder ready for future payment behavior.',
    icon: CreditCard,
  },
  {
    href: '/vendors',
    label: 'Vendors',
    description: 'Vendor surface with metrics and a placeholder table contract.',
    icon: Building2,
  },
  {
    href: '/vendors/demo-vendor',
    label: 'Vendor detail',
    description: 'Detail route placeholder ready for future vendor profiles.',
    icon: Building2,
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <header className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            PR-4 scaffold
          </p>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Ready to start building
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                The runtime check has been replaced with direct access to every
                scaffolded surface this PR introduces.
              </p>
            </div>
            <Button asChild>
              <Link href="/bills">
                Open dashboard
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scaffoldRoutes.map((route) => {
            const Icon = route.icon;

            return (
              <Card key={route.href}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        'grid size-10 place-items-center rounded-md',
                        'bg-slate-100 text-slate-700',
                      ].join(' ')}
                    >
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <CardTitle>{route.label}</CardTitle>
                  </div>
                  <CardDescription>{route.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <Link href={route.href}>
                      {route.href}
                      <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
