# NBA Reference Agent Guide

## Overview

This subtree is the real application: Next.js App Router, shared components,
SQLite access, Vitest tests, and app-local scripts. Most implementation work in
this repository should start here.

## Structure

```text
nba-reference/
├── src/app/         # Pages, route handlers, metadata, route-local tests
├── src/components/  # Shared UI, client widgets, charts, base primitives
├── src/lib/         # Database, query modules, formatters, validation, routes
├── scripts/         # DB verification + analytics setup helpers
├── package.json     # canonical command surface
└── vitest.config.ts # co-located test runner config
```

## Where To Look

| Task                                           | Location                                                      | Notes                           |
| ---------------------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| New page, route metadata, route handler        | `src/app/`                                                    | See `src/app/AGENTS.md`         |
| Shared visual component or client interaction  | `src/components/`                                             | See `src/components/AGENTS.md`  |
| DB access, caching, feature loaders, utilities | `src/lib/`                                                    | See `src/lib/AGENTS.md`         |
| Domain SQL/query modules                       | `src/lib/queries/`                                            | See `src/lib/queries/AGENTS.md` |
| DB/readiness setup                             | `scripts/verify-db.mjs`, `scripts/setup-analytics-tables.mjs` | Run from this directory         |

## Conventions

- TypeScript is intentionally strict: no `any`, no non-null assertions, explicit
  exported return types.
- Path alias is `@/*` → `src/*`.
- Tests are co-located as `*.test.ts` / `*.test.tsx`; API route tests live in
  route-local `__tests__/` folders.
- Use `@/lib/query` for page data composition and `@/lib/queries` /
  `@/lib/queries/*` for domain query modules.

## Anti-Patterns

- Do not write to the main stats DB from app code; only `newsletter-db.ts` owns
  a separate writable SQLite file.
- Do not bypass the lib layer from `src/app/**`; pages and routes should import
  helpers instead of embedding SQL.
- Do not put broad repo instructions here; child `AGENTS.md` files own
  subtree-specific rules.

## Commands

```bash
npm run dev
npm run verify:db
npm run type-check
npm run lint
npm run test
npm run ci
npm run build
```

## Notes

- CI does `npm ci`, `npm run verify:db`, `npm run ci`, then `npm run build`.
- `vitest.config.ts` runs `src/**/*.test.{ts,tsx}` and excludes
  `src/**/__tests__/**` from coverage thresholds even though those tests still
  run.
- Use this file as the parent for all work under `src/`; load the closer child
  file when present.
