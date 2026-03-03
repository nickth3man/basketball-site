# NBA-REFERENCE KNOWLEDGE BASE

**Generated:** 2026-03-03 01:50:35 EST
**Commit:** 969b9c1
**Branch:** main

## OVERVIEW

Primary Next.js 16 app package. All daily engineering work (dev, build, test, lint) happens here.

## STRUCTURE

```text
nba-reference/
|- src/                    # App routes, components, data layer
|- docs/                   # Plans and architecture notes
|- public/                 # Static assets
|- reference_screenshots/  # Visual parity references
|- package.json
|- ARCHITECTURE.md
```

## WHERE TO LOOK

| Task                      | Location          | Notes                                            |
| ------------------------- | ----------------- | ------------------------------------------------ |
| Route UI/pages            | `src/app/`        | App Router pages and dynamic routes              |
| API endpoints             | `src/app/api/`    | Search and export endpoints                      |
| Shared UI                 | `src/components/` | `StatsTable`, `SearchBox`, `SiteHeader`          |
| Data access               | `src/lib/`        | DB wrapper, query modules, formatters            |
| Query architecture intent | `ARCHITECTURE.md` | Includes dependency rules and anti-pattern notes |

## CONVENTIONS

- Use `@/*` imports (maps to `src/*`).
- Vitest tests are matched by `src/**/*.test.{ts,tsx}`.
- Image allowlist is explicit in `next.config.ts` (`www.basketball-reference.com`).
- Tailwind CSS v4 + eslint flat config are baseline toolchain assumptions.

## ANTI-PATTERNS (PACKAGE)

- Do not run app commands from repo root; use `nba-reference/`.
- Do not commit runtime artifacts (`.next/`, `coverage/`, WAL files).
- Do not assume `ARCHITECTURE.md` migration sections are fully completed; validate against current tree.

## COMMANDS

```bash
npm run dev
npm run lint
npm test
npm run test:watch
npm run build
npm start
```

## NOTES

- `scripts/` currently exists but is empty.
- DB path fallback is `process.cwd()/nba_raw_data.db`; running commands here aligns with that default.
