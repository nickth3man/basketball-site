import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { AllDefenseSelectionsTable } from '@/components/all-defense-selections-table';
import { getAllDefensiveHistory } from '@/lib/queries/awards';

export default function AllDefensePage(): React.JSX.Element {
  const selections = getAllDefensiveHistory();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href={'/awards' as Route} className="mb-2 inline-block text-link hover:underline">
          ← All Awards
        </Link>
        <h1 className="text-3xl font-bold text-heading">All-Defensive Teams</h1>
        <p className="mt-1 text-muted">
          Historical first-team and second-team All-Defensive selections by season.
        </p>
      </div>

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">All-Defensive Selections by Season</h2>
        <AllDefenseSelectionsTable selections={selections} />
      </section>
    </main>
  );
}
