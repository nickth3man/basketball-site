'use client';

import type { JSX } from 'react';
import { useFilterState } from '@/hooks/use-filter-state';

interface StatFilterProps {
  label: string;
  paramKey: string;
  placeholder?: string;
}

export function StatFilter({ label, paramKey, placeholder = 'Min' }: StatFilterProps): JSX.Element {
  const [value, setValue] = useFilterState(paramKey, '');
  const inputId = `stat-filter-${paramKey}`;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={inputId} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={inputId}
        type="number"
        value={value}
        onChange={e => {
          setValue(e.target.value);
        }}
        placeholder={placeholder}
        className="w-20 rounded-md bg-paper-soft/95 px-2 py-1.5 text-sm text-ink shadow-input outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_16%,transparent)] focus:border-transparent focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-none"
        min="0"
        step="0.1"
      />
    </div>
  );
}
