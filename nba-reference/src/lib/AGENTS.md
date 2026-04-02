# Data Layer Guide

## Overview

`src/lib/` owns database access, query composition, validation, formatting,
routes, and cross-app utilities. This is the only place where SQLite access
belongs.

## Where To Look

| Task                                | Location                                      | Notes                                                                                   |
| ----------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Read-only stats DB access + cache   | `db.ts`                                       | Singleton connection, TTL cache, query logging                                          |
| Writable newsletter storage         | `newsletter-db.ts`                            | Separate SQLite file; only sanctioned runtime writes                                    |
| Page-oriented loaders               | `query/`                                      | Compose domain queries for app routes                                                   |
| Domain SQL/query modules            | `queries/`                                    | See `queries/AGENTS.md`                                                                 |
| Puzzle/grid support data            | `puzzles/`                                    | Keep puzzle-specific types/data here instead of leaking them into generic query modules |
| Shared validation/formatting/routes | `validation.ts`, `formatters.ts`, `routes.ts` | Keep framework-agnostic where possible                                                  |

## Conventions

- Distinguish layers: `queries/` = domain/data retrieval, `query/` =
  page/feature assembly.
- Reuse `getDb`, `getCachedQueryOne`, and `getCachedQueryMany` for read-only
  stats queries instead of opening new connections.
- Keep exported function signatures explicit and reuse shared types/interfaces.
- Preserve logging, cache, and validation behavior when refactoring data access.

## Anti-Patterns

- Do not open ad-hoc SQLite connections outside `db.ts` and `newsletter-db.ts`.
- Do not mix writable newsletter concerns into the read-only stats DB.
- Do not make `src/app/**` import raw SQL strings from random files; route code
  should consume helpers from this layer.

## Validation

- Data-layer changes should run the nearest lib tests first.
- Changes touching caching, query exports, or multiple consumers should run
  `npm run ci`.
- DB-path or schema-sensitive changes should start with `npm run verify:db`.

## Notes

- `newsletter-db.ts` is the deliberate exception to the repo-wide read-only DB
  rule: it writes to `db/newsletter.db` (or `NEWSLETTER_DB_PATH`), not
  `nba_raw_data.db`.
- `query/index.ts` is intentionally small; it is the curated page-loader
  surface, not a dumping ground for every query helper.
