import type { JSX } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { buildPaginationTokens } from '@/lib/pagination';
import { cn } from '@/lib/utils';

interface PaginationNavProps {
  currentPage: number;
  pathname: Route;
  query?: Record<string, string | undefined> | undefined;
  summary?: string | undefined;
  totalPages: number;
}

function buildPageHref(
  pathname: Route,
  page: number,
  query: Record<string, string | undefined>
): Route {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value != null && value.length > 0) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const search = params.toString();
  return search.length > 0 ? `${pathname}?${search}` : pathname;
}

const pageBtnClass =
  'rounded-md bg-[var(--dc-surface-container-highest)] px-3 py-2 outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] transition-all duration-200 hover:bg-button-hover hover:shadow-[0_0_10px_color-mix(in_srgb,var(--dc-tertiary-container)_18%,transparent)]';

const pageActiveClass =
  'rounded-md bg-[color-mix(in_srgb,var(--dc-tertiary-container)_22%,var(--dc-surface-container-highest))] px-3 py-2 font-semibold text-heading shadow-[var(--shadow-input)]';

export function PaginationNav({
  currentPage,
  pathname,
  query = {},
  summary,
  totalPages,
}: PaginationNavProps): JSX.Element | null {
  if (totalPages <= 1) {
    return summary == null ? null : <p className="mt-3 text-sm text-muted">{summary}</p>;
  }

  const tokens = buildPaginationTokens(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted">{summary}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {currentPage > 1 ? (
          <Link href={buildPageHref(pathname, currentPage - 1, query)} className={pageBtnClass}>
            Previous
          </Link>
        ) : (
          <span
            className={cn(
              pageBtnClass,
              'cursor-not-allowed opacity-45 shadow-none hover:bg-[var(--dc-surface-container-highest)] hover:shadow-none'
            )}
          >
            Previous
          </span>
        )}

        {tokens.map((token, index) =>
          token === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-muted">
              ...
            </span>
          ) : token === currentPage ? (
            <span key={`page-${token}`} aria-current="page" className={pageActiveClass}>
              {token}
            </span>
          ) : (
            <Link
              key={`page-${token}`}
              href={buildPageHref(pathname, token, query)}
              className={pageBtnClass}
            >
              {token}
            </Link>
          )
        )}

        {currentPage < totalPages ? (
          <Link href={buildPageHref(pathname, currentPage + 1, query)} className={pageBtnClass}>
            Next
          </Link>
        ) : (
          <span
            className={cn(
              pageBtnClass,
              'cursor-not-allowed opacity-45 shadow-none hover:bg-[var(--dc-surface-container-highest)] hover:shadow-none'
            )}
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
