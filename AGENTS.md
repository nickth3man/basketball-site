# Basketball Site Agent Guide

## Search First

- Begin every codebase search with `tree` and `rg`.
- Use `tree -L 2` or `tree -L 3` first to confirm the local shape of the area you are about to inspect.
- Use `rg` immediately after `tree` to find the exact files, symbols, or strings you need.

## Workspace Scope

- Repository root contains documentation, the SQLite payload in `db/`, and a Next.js app in `nba-reference/`.
- Most product code changes belong in `nba-reference/`.
- Repository-level maintenance assets live in `scripts/`, but `scripts/migrate.sh` is legacy and not part of normal day-to-day work.

## Default Working Directory

- For app work, switch to `nba-reference/` before running `npm` commands.
- Useful commands from `nba-reference/`:
  - `npm run dev`
  - `npm run verify:db`
  - `npm run type-check`
  - `npm run lint`
  - `npm run test`
  - `npm run ci`

## Architecture Boundaries

- The application is a read-only stats site backed by `db/nba_raw_data.db`.
- Never add runtime writes to SQLite.
- Keep SQL and database access in `nba-reference/src/lib/`; do not scatter queries through route files or components.
- Pages and route segments in `nba-reference/src/app/` should stay Server Components by default; add `'use client'` only when interactivity requires it.

## Nested Instructions

- Check for more specific `AGENTS.md` files before editing inside a subtree.
- Follow `nba-reference/src/components/AGENTS.md` for shared component work.
- Follow `nba-reference/src/lib/queries/AGENTS.md` for query modules.
- When nested guidance exists, treat it as the source of truth for that subtree.

## Editing Expectations

- Keep changes minimal and scoped to the request.
- Match existing project patterns, naming, and file placement.
- Update nearby tests when behavior changes.
- Update documentation when commands, architecture boundaries, or contributor workflow changes.

## Validation

- Run the smallest relevant checks for the files you changed.
- If you touched shared UI, routing, data access, or multiple layers, prefer running `npm run ci` from `nba-reference/` before finishing.
- If your change depends on the local database payload, run `npm run verify:db` first.
