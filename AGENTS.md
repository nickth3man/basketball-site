# Basketball Site Agent Guide

**Generated:** 2026-04-02 America/New_York
**Commit:** `83ae9ef`
**Branch:** `dev`

## Overview

Repository root is mostly coordination: docs, database payload, content, and one real product app in `nba-reference/`.
Treat `nba-reference/` as the default destination for code changes unless the task is explicitly about docs, content, or data payload ownership.

## Structure

```text
basketball-site/
├── nba-reference/   # Next.js 16 app, tests, scripts, all product code
├── db/              # SQLite payload + migration artifact + runtime notes
├── content/         # Blog and podcast markdown source
├── docs/            # Data-pipeline and repo docs
├── scripts/         # Legacy repo-level shell helper
└── .github/         # CI and OpenCode workflow files
```

## Where To Look

| Task | Location | Notes |
|---|---|---|
| App pages, route handlers, metadata | `nba-reference/src/app/` | See `nba-reference/src/app/AGENTS.md` |
| Shared UI, client widgets, table/search UX | `nba-reference/src/components/` | See `nba-reference/src/components/AGENTS.md` |
| DB access, caching, feature loaders | `nba-reference/src/lib/` | See `nba-reference/src/lib/AGENTS.md` |
| Raw SQL/domain query modules | `nba-reference/src/lib/queries/` | See `nba-reference/src/lib/queries/AGENTS.md` |
| Database payload/runtime notes | `db/` | App reads from `nba_raw_data.db`; payload refresh is external |
| Long-form content | `content/` | Markdown-only; not the live data layer |
| Legacy repo helper | `scripts/migrate.sh` | Legacy; not normal product workflow |

## Conventions

- Start codebase discovery with `tree -L 2` or `tree -L 3`, then `rg`.
- Ignore `nba-reference/node_modules` during search.
- Run app commands from `nba-reference/`, not repo root.
- Keep code changes scoped; update nearby tests and adjacent docs when behavior or workflow changes.

## Anti-Patterns (This Project)

- Do not add runtime writes to `db/nba_raw_data.db`.
- Do not place SQL in route files or shared components; keep DB access in `nba-reference/src/lib/`.
- Do not treat `scripts/migrate.sh` as an active workflow.
- Do not add `'use client'` to `src/app/**` pages by default; prefer Server Components unless interactivity forces a client boundary.

## Unique Styles

- Repo docs point at app-local guidance when a subtree has sharper rules; always load the nearest child `AGENTS.md` before editing there.
- `README.md` and `CONTRIBUTING.md` document commands and architecture; keep AGENTS files terse and action-oriented rather than explanatory.
- CI runs from `nba-reference/` and verifies DB readability before the normal quality pipeline.

## Commands

```bash
cd nba-reference
npm run verify:db
npm run type-check
npm run lint
npm run test
npm run ci
npm run build
```

## Notes

- `README.md` references `nba-reference/AGENTS.md`; that file should exist and remain the app-level entry point.
- `db/README.md` documents the only intentional write exception: newsletter data uses a separate writable SQLite file, not the read-only stats DB.
- If a task spans shared UI, routing, or data access, prefer `npm run ci` over narrow checks.
