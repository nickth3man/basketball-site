## Commands

All commands run from this directory (`nba-reference/`):

```bash
npm run dev            # Start dev server at http://localhost:3000
npm run build          # Production build
npm run test           # Run all tests once (Vitest)
npm run test:watch     # Run tests in watch mode
npm run type-check     # TypeScript type checking
npm run lint           # ESLint
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier formatting
npm run ci             # Full pipeline: type-check → lint → format:check → test
```

Run a single test file:

```bash
npm run test -- src/lib/db.test.ts
```

## Architecture

The app uses a layered architecture with strict one-way dependencies:

```
Presentation (app/, components/) → Application (lib/queries/, lib/query/) → Infrastructure (lib/db.ts)
                        ↑
               API (app/api/) → Application
```

**Pages are React Server Components** — they call query functions directly. Use
`"use client"` only when client-side interactivity is required.

**The app is read-only** — no database writes anywhere.

### Key Modules

- **`src/lib/db.ts`** — Singleton `better-sqlite3` connection. Auto-patches
  `prepare()` to add a 30s LRU cache (max 500 entries) for all SELECT queries.
  Exports `getDb()`, `getCachedQueryOne<T>()`, `getCachedQueryMany<T>()`,
  `getLatestSeasonId()`.

- **`src/lib/queries/`** — Domain query modules (`players.ts`, `teams.ts`,
  `games.ts`, `seasons.ts`). Re-exported from `index.ts` for backward
  compatibility.

- **`src/lib/query/`** — Feature-specific queries (`home.ts`, `search.ts`,
  `directory.ts`) used directly by pages and API routes.

- **`src/components/`** — Shared UI: `site-header.tsx`, `search-box.tsx`,
  `stats-table.tsx`.

### API Routes

- `app/api/search/route.ts` — Search endpoint used by `search-box.tsx`; enforces
  minimum 2-character query
- `app/api/export/[type]/route.ts` — CSV/JSON export for stats tables; handles
  `standings`, `games`, `search` types

## Database Setup

The SQLite database is at `../db/nba_raw_data.db` (repo root `db/` directory,
Git LFS tracked).

Path resolution order:

1. `DB_PATH` environment variable
2. `nba_raw_data.db` in the Next.js process CWD (i.e.,
   `nba-reference/nba_raw_data.db`)

For local dev, either set `DB_PATH=../db/nba_raw_data.db` or symlink the
database:

```bash
ln -s ../db/nba_raw_data.db nba_raw_data.db
```

### Key Database Tables

| Table                         | Purpose                                      |
| ----------------------------- | -------------------------------------------- |
| `dim_player`                  | Player dimension (`bref_id`, `full_name`)    |
| `dim_team`                    | Team dimension (`abbreviation`, `name`)      |
| `dim_season`                  | Season dimension (`season_id`, `start_year`) |
| `fact_player_season_stats`    | Season counting stats per player             |
| `fact_player_advanced_season` | Advanced stats (PER, WS, BPM, VORP)          |
| `fact_team_season`            | Team season aggregates                       |
| `fact_game`                   | Individual game records                      |

## TypeScript Strictness

Rules that commonly cause issues:

- No `any` types (`@typescript-eslint/no-explicit-any: error`)
- All functions must declare return types
  (`explicit-function-return-type: error`)
- No implicit boolean coercion — use `=== null`, `=== undefined`, `.length > 0`
  (`strict-boolean-expressions: error`)
- All Promises must be handled (`no-floating-promises: error`)
- Index access requires null checks (`noUncheckedIndexedAccess: true`)
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `exactOptionalPropertyTypes: true` — optional properties cannot be assigned
  `undefined` explicitly
- Non-null assertions (`!`) are forbidden by ESLint — fix the type instead
- Use `interface` over `type` for object shapes
  (`consistent-type-definitions: error`)

## Page Patterns (Next.js 15)

Dynamic route params are typed as `Promise<{...}>` and must be awaited:

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ...
}
```

Use `notFound()` from `next/navigation` when an entity is not found in the
database.

## Utilities

- **`src/lib/utils.ts`** — `cn()` combines `clsx` + `tailwind-merge` for safe
  Tailwind class merging. Always use `cn()` instead of template strings for
  conditional class names.
- **`src/lib/formatters.ts`** — Three formatters: `formatPct()` (3-decimal
  FG%/3P%/FT%), `formatMoney()` (USD with `Intl.NumberFormat`),
  `formatSignedNumber()` (explicit +/- prefix).
- **`src/lib/table-styles.ts`** — Centralized Tailwind classes for table
  cell/header/body consistency.

## Testing

Tests are co-located with source files (`*.test.ts` / `*.test.tsx`). API route
tests live in `__tests__/` subdirectories next to `route.ts` files.

**Configuration**: `vitest.config.ts` with `jsdom` environment, globals enabled
(no need to import `describe`/`it`/`expect`), and `@testing-library/jest-dom`
matchers loaded via `src/test-setup.ts`.

## Keeping CLAUDE.md and AGENTS.md in Sync

This file is mirrored as `AGENTS.md` in the same directory. After making changes
to either file, run the sync script from the repo root to propagate updates to
the other:

```bash
bash scripts/sync-claude-agents.sh
```

The script compares modification times and overwrites the older file with the
newer one's contents.
