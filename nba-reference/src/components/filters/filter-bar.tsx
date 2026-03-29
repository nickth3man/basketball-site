'use client';

import type { JSX } from 'react';
import { SeasonRangeFilter, StatFilter } from '@/components/filters';

export function FilterBar(): JSX.Element {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-6 surface-pedestal rounded-lg p-5">
      <div className="flex flex-wrap items-center gap-3">
        <SeasonRangeFilter minYear={1947} maxYear={2025} />
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-md bg-[color-mix(in_srgb,var(--dc-surface-container-highest)50%,transparent)] px-4 py-3">
        <StatFilter label="Min PPG" paramKey="minPPG" />
        <StatFilter label="Min RPG" paramKey="minRPG" />
        <StatFilter label="Min APG" paramKey="minAPG" />
      </div>
    </div>
  );
}
