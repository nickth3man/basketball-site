import type { JSX } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlayerLetterLoading(): JSX.Element {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Skeleton className="mb-3 h-8 w-40" />
      <Skeleton className="mb-4 h-5 w-80" />

      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton className="h-7 w-10" />
        {letters.map(letter => (
          <Skeleton key={letter} className="h-7 w-8" />
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </main>
  );
}
