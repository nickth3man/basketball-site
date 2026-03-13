import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { StatsTable } from '@/components/stats-table';
import { formatUsd } from '@/lib/formatters';
import { getLeagueSalaryCapHistory } from '@/lib/queries';

export default function LeagueSalaryCapPage(): React.JSX.Element {
  const rows = getLeagueSalaryCapHistory(60);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/leagues">Leagues</Link> / Salary Cap
      </div>

      <h1 className="mb-2 text-3xl font-bold">NBA Salary Cap History</h1>
      <p className="mb-4 text-sm text-muted-strong">Historical NBA salary cap values by season.</p>

      <StatsTable
        columns={[
          { key: 'season_id', label: 'Season' },
          { key: 'cap_amount_fmt', label: 'Cap Amount', align: 'right' },
        ]}
        rows={rows.map(row => ({
          ...row,
          cap_amount_fmt: formatUsd(row.cap_amount),
        }))}
        initialSort="season_id"
      />

      <div className="mt-4 text-xs text-muted">
        <Link href={'/leagues' as Route} className="text-link hover:underline">
          Back to leagues
        </Link>
      </div>
    </main>
  );
}
