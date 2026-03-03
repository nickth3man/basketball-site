
## Repository Layout

```
basketball-site/
├── db/                    # SQLite database (Git LFS tracked)
│   └── nba_raw_data.db    # Pre-populated NBA statistics database
└── nba-reference/         # Next.js frontend application
```

All application work happens inside `nba-reference/`. The `db/` directory holds only the database file; it requires Git LFS to be installed to pull the actual data.

## Development Commands

All commands run from `nba-reference/`:

```bash
npm run dev            # Start development server (http://localhost:3000)
npm run build          # Production build
npm run test           # Run tests once (Vitest)
npm run test:watch     # Run tests in watch mode
npm run type-check     # TypeScript type checking
npm run lint           # ESLint
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier formatting
npm run ci             # Full pipeline: type-check → lint → format:check → test
```

To run a single test file:
```bash
npm run test -- src/lib/db.test.ts
```

## Database Setup

The SQLite database is at `db/nba_raw_data.db` (relative to repo root) and is tracked via Git LFS. When running the app, the database must be accessible. The app resolves the DB path as:

1. `DB_PATH` environment variable (if set)
2. `nba_raw_data.db` in the Next.js process CWD (i.e., `nba-reference/nba_raw_data.db`)

For local development, either set `DB_PATH=../db/nba_raw_data.db` or symlink/copy the database into `nba-reference/`.

## Architecture

The app uses a **layered architecture** with strict one-way dependencies:

```
Presentation (app/, components/) → Application (lib/queries/, lib/query/) → Infrastructure (lib/db.ts)
                        ↑
               API (app/api/) → Application
```

**Key modules:**
- `src/lib/db.ts` — Singleton `better-sqlite3` connection; auto-patches `prepare()` to add 30s LRU cache for all SELECT queries. Exports `getDb()`, `getCachedQueryOne<T>()`, `getCachedQueryMany<T>()`, `getLatestSeasonId()`.
- `src/lib/queries/` — Domain query modules (`players.ts`, `teams.ts`, `games.ts`, `seasons.ts`); re-exported from `index.ts` for backward compatibility.
- `src/lib/query/` — Feature-specific queries (`home.ts`, `search.ts`, `directory.ts`) used by pages and API routes directly.
- `src/components/` — Shared UI: `site-header.tsx`, `search-box.tsx`, `stats-table.tsx`.

**Pages are Server Components** that call query functions directly. Use `"use client"` only when client-side interactivity is required.

**The app is read-only** — there are no database writes anywhere.

## Key Database Tables

| Table | Purpose |
|---|---|
| `dim_player` | Player dimension (`bref_id`, `full_name`) |
| `dim_team` | Team dimension (`abbreviation`, `name`) |
| `fact_player_season_stats` | Season counting stats per player |
| `fact_player_advanced_season` | Advanced stats (PER, WS, BPM, VORP) |
| `fact_team_season` | Team season aggregates |
| `fact_game` | Individual game records |

## TypeScript Strictness

The project uses maximum TypeScript/ESLint strictness. Key rules that commonly cause issues:
- No `any` types (`@typescript-eslint/no-explicit-any: error`)
- All functions must declare return types (`explicit-function-return-type: error`)
- No implicit boolean coercion — use `=== null`, `=== undefined`, `.length > 0`, etc. (`strict-boolean-expressions: error`)
- All Promises must be handled (`no-floating-promises: error`)
- Index access requires null checks (`noUncheckedIndexedAccess: true`)
- Non-null assertions (`!`) forbidden — fix the type instead
- Use `import type` for type-only imports (`verbatimModuleSyntax: true`)

## Testing Patterns

Tests are co-located with source files (`*.test.ts` / `*.test.tsx`). API route tests live in `__tests__/` subdirectories next to `route.ts` files. See `nba-reference/CLAUDE.md` for page patterns, utilities, and detailed quality tooling docs.

## Keeping CLAUDE.md and AGENTS.md in Sync

This file is mirrored as `AGENTS.md` in the same directory. After making changes to either file, run the sync script from the repo root to propagate updates to the other:

```bash
bash scripts/sync-claude-agents.sh
```

The script compares modification times and overwrites the older file with the newer one's contents.
