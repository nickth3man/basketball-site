# NBA-REFERENCE KNOWLEDGE BASE

## OVERVIEW

Next.js App Router frontend for read-only basketball statistics backed by
SQLite. This directory is the primary implementation surface for features,
pages, API routes, and query logic.

## STRUCTURE

```text
nba-reference/
├── src/app/                 # Routes, layouts, API endpoints
├── src/components/          # Shared UI components
├── src/lib/                 # Data access and query orchestration
├── vitest.config.ts         # Test configuration
├── eslint.config.mjs        # Lint rules
└── AGENTS.md                # This file (mirrors CLAUDE.md)
```

## WHERE TO LOOK

| Task                     | Location                                                 | Notes                                            |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------ |
| New pages/routes         | `src/app/`                                               | Server components by default                     |
| API handlers             | `src/app/api/**/route.ts`                                | Route tests in sibling `__tests__/`              |
| Query/data work          | `src/lib/`                                               | See `src/lib/AGENTS.md` for detailed constraints |
| Shared presentational UI | `src/components/`                                        | Reuse table/header/search patterns               |
| Type/lint/test behavior  | `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts` | Strict TS + ESLint enforced                      |

## CONVENTIONS

- Layer direction is fixed: Presentation/API -> Application query layer ->
  Infrastructure DB layer.
- Pages are server components unless interactivity requires explicit
  `"use client"`.
- Dynamic route params in pages are `Promise<{...}>` and must be awaited.
- Query and DB reads are centralized in `src/lib/`; route/page files should not
  embed raw SQL.
- Tests are colocated (`*.test.ts`, `*.test.tsx`) or in route-local `__tests__/`
  folders.

## ANTI-PATTERNS (THIS APP)

- Never write to SQLite at runtime; app is read-only.
- Never import across layers in reverse direction.
- Never bypass strict TS rules with loose typing.

## COMMANDS

```bash
npm run dev
npm run build
npm run test
npm run type-check
npm run lint
npm run ci
```

## NOTES

- DB path resolution order: `DB_PATH`, then local `nba_raw_data.db` in this
  directory.
- Root docs are mirrored (`AGENTS.md` <-> `CLAUDE.md`) via
  `bash ../scripts/sync-claude-agents.sh` from this directory or
  `bash scripts/sync-claude-agents.sh` from repo root.
