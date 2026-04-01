'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useSavedViews, type SavedView } from '@/hooks/use-saved-views';

interface SaveViewButtonProps {
  currentUrl: string;
  type: SavedView['type'];
}

export function SaveViewButton({ currentUrl, type }: SaveViewButtonProps): JSX.Element {
  const { saveView } = useSavedViews();
  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = (): void => {
    if (name.trim().length > 0) {
      saveView(name.trim(), currentUrl, type);
      setName('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
        }}
        className="rounded-md bg-[var(--dc-surface-container-highest)] px-3 py-1.5 text-xs outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] transition-all hover:bg-button-hover"
      >
        Save View
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={e => {
          setName(e.target.value);
        }}
        placeholder="View name..."
        className="rounded-md bg-[var(--dc-surface-container-highest)] px-3 py-1.5 text-xs outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)]"
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setIsOpen(false);
        }}
      />
      <button
        type="button"
        onClick={handleSave}
        className="rounded-md bg-[var(--dc-primary)] px-3 py-1.5 text-xs text-[var(--dc-on-primary)] transition-opacity hover:opacity-90"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
        }}
        className="rounded-md px-2 py-1.5 text-xs text-muted hover:bg-button-hover"
      >
        Cancel
      </button>
    </div>
  );
}

interface SavedViewsWidgetProps {
  type?: SavedView['type'];
}

export function SavedViewsWidget({ type }: SavedViewsWidgetProps): JSX.Element | null {
  const { savedViews, removeView, isLoaded } = useSavedViews();

  if (!isLoaded || savedViews.length === 0) return null;

  const filtered = type != null ? savedViews.filter(v => v.type === type) : savedViews;
  if (filtered.length === 0) return null;

  return (
    <section className="mb-6 surface-pedestal p-4">
      <div className="mb-2 text-xs font-bold tracking-wide text-crumb uppercase">Saved Views</div>
      <div className="flex flex-wrap gap-2">
        {filtered.map(view => (
          <div
            key={view.id}
            className="flex items-center gap-2 rounded-md bg-[var(--dc-surface-container-highest)] px-3 py-1.5 text-xs outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)]"
          >
            <Link
              href={view.url as `/search?q=${string}`}
              className="text-link hover:brightness-110"
            >
              {view.name}
            </Link>
            <button
              type="button"
              onClick={() => {
                removeView(view.id);
              }}
              className="text-muted hover:text-heading"
              aria-label={`Remove ${view.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
