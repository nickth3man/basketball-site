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
    <section className="panel-paper p-4">
      <h2 className="mb-3 text-xl font-bold text-heading">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded border border-line-soft bg-white px-4 py-3 transition-colors hover:bg-paper-soft"
          >
            <div className="font-semibold text-link">{link.label}</div>
            {link.description != null && link.description.length > 0 ? (
              <div className="mt-1 text-sm text-muted-strong">{link.description}</div>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
