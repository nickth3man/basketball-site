'use client';

import type { JSX } from 'react';
import { useFilterState } from '@/hooks/use-filter-state';

interface SeasonRangeFilterProps {
  minYear: number;
  maxYear: number;
}

export function SeasonRangeFilter({ minYear, maxYear }: SeasonRangeFilterProps): JSX.Element {
  const [startYear, setStartYear] = useFilterState('startYear', '');
  const [endYear, setEndYear] = useFilterState('endYear', '');

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="season-start" className="text-sm text-muted">
        From
      </label>
      <select
        id="season-start"
        value={startYear}
        onChange={e => {
          setStartYear(e.target.value);
        }}
        className="rounded border border-line bg-paper px-2 py-1 text-sm"
      >
        <option value="">All</option>
        {years.map(year => (
          <option key={year} value={year}>
            {year}-{String(year + 1).slice(-2)}
          </option>
        ))}
      </select>
      <label htmlFor="season-end" className="text-sm text-muted">
        to
      </label>
      <select
        id="season-end"
        value={endYear}
        onChange={e => {
          setEndYear(e.target.value);
        }}
        className="rounded border border-line bg-paper px-2 py-1 text-sm"
      >
        <option value="">All</option>
        {years.map(year => (
          <option key={year} value={year}>
            {year}-{String(year + 1).slice(-2)}
          </option>
        ))}
      </select>
    </div>
  );
}
