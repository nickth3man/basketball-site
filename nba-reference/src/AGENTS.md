# SRC KNOWLEDGE BASE

## OVERVIEW
`src/` contains all runtime code: App Router routes (`app/`), reusable components (`components/`), and database/query layer (`lib/`).

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Add/modify pages | `src/app/` | Route-aligned folders and dynamic segments |
| Build reusable UI | `src/components/` | Shared table/search/header components |
| Change data retrieval | `src/lib/` | SQL-backed query modules and cache wrapper |
| Test environment setup | `src/test-setup.ts` | Vitest global setup |

## CONVENTIONS
- Keep imports alias-first (`@/components/...`, `@/lib/...`).
- Co-locate tests as `*.test.ts` or `*.test.tsx` under `src/`.
- Prefer server-side data loading in route files unless client interactivity is required.

## ANTI-PATTERNS (SRC)
- Do not bypass `src/lib/db.ts` for ad-hoc DB connections.
- Do not place non-test scratch files in `src/`.
- Do not duplicate query logic in pages when equivalent functions exist in `src/lib/query` or `src/lib/queries`.

## NOTES
- There is intentional naming split: `lib/query/` (feature-focused) and `lib/queries/` (domain-focused), plus legacy `lib/queries.ts`.
