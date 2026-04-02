# App Router Guide

## Overview

`src/app/` owns page composition, metadata, route handlers, loading/error
boundaries, and route-local tests. Keep this layer thin: validate params, call
lib helpers, render sections.

## Where To Look

| Task                                    | Location                                                             | Notes                                      |
| --------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| Global shell, metadata, not-found/error | `layout.tsx`, `error.tsx`, `not-found.tsx`                           | Root `error.tsx` is a client boundary      |
| API handlers                            | `api/**/route.ts`                                                    | Tests live in sibling `__tests__/` folders |
| Large entity pages                      | `players/[letter]/[id]/page.tsx`, `teams/[abbrev]/page.tsx`          | Pull heavy data through `@/lib/query`      |
| Route-local client islands              | `newsletter/subscribe-form.tsx`, `friv/immaculate-grid/GridGame.tsx` | Keep client scope local                    |

## Conventions

- Default to Server Components; only small interactive leaves should use
  `'use client'`.
- Put `generateMetadata` / `metadata` next to the page that owns the route.
- Validate route params early (`notFound`, schema validators, canonical
  letter/id checks) before rendering.
- Route handlers should use shared API helpers from `@/lib/api-response` and
  shared data utilities from `@/lib/*`.
- Keep route-level tests near the route: `api/**/__tests__/route.test.ts`.

## Anti-Patterns

- Do not embed SQL or direct `better-sqlite3` calls in `src/app/**`.
- Do not widen client boundaries from convenience; move interactivity into a
  leaf component instead.
- Do not let API routes write to the main stats DB; newsletter routes use
  `@/lib/newsletter-db` only.

## Validation

- Page-only changes: run the nearest related tests plus `npm run type-check`.
- Shared route or API changes: run the affected route tests and prefer
  `npm run ci`.
- If route behavior depends on DB availability, run `npm run verify:db` first.

## Notes

- `players/[letter]/[id]/page.tsx` and similar large pages already split UI into
  route-local components; extend those instead of inlining more JSX.
- `error.tsx`, team/player route error boundaries, and route-local client forms
  are the main sanctioned client files here.
