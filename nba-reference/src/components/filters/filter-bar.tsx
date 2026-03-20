'use client';

import type { JSX } from 'react';
import { SeasonRangeFilter, StatFilter } from '@/components/filters';

export function FilterBar(): JSX.Element {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-line bg-paper p-4">
      <SeasonRangeFilter minYear={1947} maxYear={2025} />
      <div className="h-6 w-px bg-line" />
      <StatFilter label="Min PPG" paramKey="minPPG" />
      <StatFilter label="Min RPG" paramKey="minRPG" />
      <StatFilter label="Min APG" paramKey="minAPG" />
    </div>
  );
}
