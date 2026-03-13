import type React from 'react';
import Link from 'next/link';
import type { Route } from 'next';

const exploreLinks = [
  { href: '/playoffs', label: 'Playoffs' },
  { href: '/awards', label: 'Awards' },
  { href: '/allstar', label: 'All-Star' },
  { href: '/standings', label: 'Standings by Date' },
  { href: '/draft', label: 'Draft' },
] satisfies Array<{ href: Route; label: string }>;

export function HomeExploreLinks(): React.JSX.Element {
  return (
    <section className="mb-8 fade-slide-in panel-paper p-3 [animation-delay:170ms]">
      <h2 className="mb-2 text-xl font-bold text-heading">Explore More</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        {exploreLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded border border-line bg-button-bg px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-button-hover active:translate-y-0 active:scale-[0.98]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
