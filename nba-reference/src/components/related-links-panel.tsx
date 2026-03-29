import type { JSX } from 'react';
import type { Route } from 'next';
import Link from 'next/link';

interface RelatedLink {
  description?: string;
  href: Route;
  label: string;
}

interface RelatedLinksPanelProps {
  links: RelatedLink[];
  title: string;
}

export function RelatedLinksPanel({ links, title }: RelatedLinksPanelProps): JSX.Element {
  if (links.length === 0) {
    return <></>;
  }

  return (
    <section className="panel-paper p-5">
      <h2 className="mb-5 inscription-title text-xl">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="block surface-inset px-4 py-4 transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--dc-surface-container-highest)70%,var(--dc-surface-container-low))] hover:shadow-[var(--shadow-input)]"
          >
            <div className="font-semibold text-link">{link.label}</div>
            {link.description != null && link.description.length > 0 ? (
              <div className="mt-2 text-sm text-muted-strong">{link.description}</div>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
