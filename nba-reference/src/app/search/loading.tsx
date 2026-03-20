import type { JSX } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchLoading(): JSX.Element {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <Skeleton className="mb-1 h-9 w-24" />
      <Skeleton className="mb-5 h-5 w-96" />

      <section className="mb-6 panel-paper p-4">
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
      </section>

      <section className="mb-6 panel-paper p-4">
        <Skeleton className="h-5 w-64" />
      </section>

      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="mb-6 panel-paper p-4">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_item, itemIndex) => (
              <Skeleton key={itemIndex} className="h-16 w-full" />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
