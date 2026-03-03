# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-03 01:50:35 EST
**Commit:** 969b9c1
**Branch:** main

## OVERVIEW
Monorepo shell with one active app package: `nba-reference/` (Next.js App Router + TypeScript + SQLite via `better-sqlite3`).
Root also stores large DB assets under `db/` (Git LFS expected).

## STRUCTURE
```text
basketball-site/
|- db/                     # Raw SQLite asset copy
|- nba-reference/          # Actual web app and testable code
|- README.md
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Run app | `nba-reference/package.json` | `npm run dev` from `nba-reference/` |
| Build/test commands | `nba-reference/package.json` | `build`, `lint`, `test`, `test:watch` |
| System architecture intent | `nba-reference/ARCHITECTURE.md` | High-level rules; some sections are aspirational |
| DB source files | `db/`, `nba-reference/nba_raw_data.db` | Two copies exist; app resolves by `DB_PATH` or cwd |

## CONVENTIONS
- Work inside `nba-reference/`; root has no runnable app scripts.
- TypeScript strict mode is enabled in `nba-reference/tsconfig.json`.
- Tests use Vitest + jsdom (`nba-reference/vitest.config.ts`, `nba-reference/src/test-setup.ts`).
- Path alias is `@/*` => `src/*`.

## ANTI-PATTERNS (THIS PROJECT)
- Do not assume root `README.md` path descriptions are fully current (`skills/` is referenced but absent).
- Do not assume a single database file location; respect `DB_PATH` handling in `nba-reference/src/lib/db.ts`.
- Do not write migration/mutation logic into app data access: DB is opened readonly.

## UNIQUE STYLES
- Repository keeps large SQLite binaries under Git LFS.
- App package intentionally contains an architecture plan doc (`ARCHITECTURE.md`) alongside source.

## COMMANDS
```bash
cd nba-reference
npm install
npm run dev
npm run lint
npm test
npm run build
```

## NOTES
- If tests or pages fail with missing DB, verify `nba-reference/nba_raw_data.db` exists or set `DB_PATH`.
- Treat `nba-reference/` as project root for everyday development tasks.
