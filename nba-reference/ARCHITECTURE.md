# NBA Reference Architecture

This document describes the runtime architecture for the `nba-reference/` app.

## System Overview

The app is a read-only Next.js App Router frontend backed by a local SQLite
database in `../db/nba_raw_data.db`.

```text
Request
  -> App Router page or API route (`src/app/`)
  -> Feature loader/query module (`src/lib/query/`)
  -> Domain query module (`src/lib/queries/`)
  -> SQLite access (`src/lib/db.ts`)
  -> Better SQLite3 read-only connection
```

## Layer Boundaries

### Presentation

- `src/app/`
- `src/components/`

Responsibilities:

- Render pages, layouts, and API routes
- Read route params and query params
- Choose which feature loaders to call
- Keep raw SQL out of route files

### Application

- `src/lib/query/`

Responsibilities:

- Compose domain queries for specific page or API use cases
- Shape search results and page-level datasets
- Keep route-specific orchestration out of page components

### Domain Query Layer

- `src/lib/queries/`

Responsibilities:

- Hold SQL and entity-specific data access
- Return typed rows or DTO-like records
- Stay independent from React and route concerns

### Infrastructure

- `src/lib/db.ts`

Responsibilities:

- Resolve the database path
- Open the shared read-only SQLite connection
- Provide explicit in-memory TTL caching helpers

## Caching Model

- Query caching is explicit through `getCachedQueryOne()` and
  `getCachedQueryMany()`.
- Cache entries are stored in-process with TTL expiry and simple LRU eviction.
- Statement-level monkey-patching is intentionally avoided so per-query TTLs
  remain predictable.

## Routing Model

- Pages are server components by default.
- Shared route builders live in `src/lib/routes.ts`.
- Search has two layers:
  - `/api/search` for fast suggestion requests
  - `/search` for URL-driven, filterable search results

## Shared UI Primitives

- `src/components/stats-table.tsx` handles sorting, CSV export, optional
  drill-down links, and optional URL-backed sort state.
- `src/components/search-box.tsx` is the shared search entry point used on
  discovery surfaces.
- `src/components/site-header.tsx` and `src/components/home-explore-links.tsx`
  expose top-level navigation.

## Operational Assumptions

- The database payload is provided by Git LFS and must exist before local dev or
  CI runs.
- `npm run verify:db` validates that the SQLite payload is readable.
- CI runs `verify:db`, the normal quality pipeline, and a production build.

## Constraints

- Never write to SQLite at runtime.
- Keep imports flowing downward: presentation -> application -> domain ->
  infrastructure.
- Prefer adding page-level loaders in `src/lib/query/` when a route fans out
  into many domain queries.
