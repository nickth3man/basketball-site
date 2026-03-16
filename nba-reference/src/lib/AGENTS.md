# SRC/LIB KNOWLEDGE BASE

## OVERVIEW

`src/lib/` is the data and utility layer for the app. It contains DB
infrastructure, domain/feature query modules, and cross-cutting helpers used by
pages, API routes, and components.

## STRUCTURE

```text
src/lib/
├── db.ts                  # SQLite singleton + query cache patching
├── queries/               # Domain query modules (players/teams/games/seasons)
├── query/                 # Feature query modules (home/search/directory)
├── csv.ts                 # CSV conversion utilities (client + server use)
├── validation.ts          # Route-param coercion + notFound guards
├── types.ts               # Shared row/value types
├── formatters.ts          # Display formatting helpers
├── table-styles.ts        # Shared table class constants
├── routes.ts              # Route definitions and URL builders
├── season-utils.ts        # Season formatting and calculation helpers
├── site-config.ts         # Global site configuration
└── utils.ts               # General utility functions (e.g., cn for Tailwind)
```

## WHERE TO LOOK

| Task                        | Location                           | Notes                                       |
| --------------------------- | ---------------------------------- | ------------------------------------------- |
| DB behavior/path/cache      | `db.ts`                            | Central DB entry; read-only model           |
| Add entity query            | `queries/`                         | Domain-aligned functions + index re-exports |
| Add page/API-specific query | `query/`                           | Home/search/directory use cases             |
| CSV export behavior         | `csv.ts`                           | RFC-4180 compatible encoding                |
| Route param guards          | `validation.ts`                    | Throws via `notFound()` on invalid params   |
| Shared table formatting     | `formatters.ts`, `table-styles.ts` | UI data presentation helpers                |

## CONVENTIONS

- `db.ts` is the only infrastructure module that opens SQLite connections.
- Domain queries belong in `queries/`; feature glue logic belongs in `query/`.
- Prefer `@/lib/query` as the import entrypoint for feature query functions.
- Keep SQL in query modules, not in route/page components.
- Prefer typed helpers (`getCachedQueryOne<T>`, `getCachedQueryMany<T>`) over
  ad-hoc result casts.
- Add/maintain exports in `queries/index.ts` when introducing new query modules.

## ANTI-PATTERNS (THIS LAYER)

- Never perform database writes; this layer is read-only.
- Never import presentation modules (`src/app`, `src/components`) into
  `src/lib/`.
- Never bypass validation helpers for dynamic route identifiers.
- Never duplicate formatter/class constants in pages when `formatters.ts` or
  `table-styles.ts` already covers the case.

## NOTES

- Query cache defaults are short-lived; tune TTL only where user-facing
  freshness requires it.
- `csv.ts` is consumed from both API and client-side table interactions, so keep
  it runtime-agnostic.
