import { Card } from '@/app/_components/atoms/card';

const SKELETON_ROW_COUNT = 10;

export default function BillsLoading() {
  return (
    <main className="grid gap-6">
      <div className="grid gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
        <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="h-10 w-80 animate-pulse rounded bg-slate-100" />
      <Card className="overflow-hidden">
        <div className="h-11 border-b border-slate-200 bg-slate-50" />
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <div
            className="border-b border-slate-100 px-4 py-3 last:border-0"
            key={index}
          >
            <div className="h-5 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </Card>
    </main>
  );
}
