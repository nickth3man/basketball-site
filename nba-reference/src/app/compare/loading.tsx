import type { JSX } from 'react';

export default function CompareLoading(): JSX.Element {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-1 h-9 w-48 animate-pulse rounded bg-paper-soft" />
      <div className="mb-6 h-5 w-80 animate-pulse rounded bg-paper-soft" />

      <section className="mb-6 panel-paper p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-[60px] animate-pulse rounded bg-paper-soft" />
          <div className="h-[60px] animate-pulse rounded bg-paper-soft" />
        </div>
      </section>

      <section className="panel-paper p-4">
        <div className="h-6 w-48 animate-pulse rounded bg-paper-soft" />
        <div className="mt-4 h-[400px] animate-pulse rounded bg-paper-soft" />
      </section>
    </main>
  );
}
