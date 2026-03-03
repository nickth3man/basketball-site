# LIB KNOWLEDGE BASE

## OVERVIEW

`src/lib/` owns data access, caching, typed query helpers, and shared formatting/style utilities.

## WHERE TO LOOK

| Task                          | Location                                       | Notes                                                  |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| DB connection and cache       | `db.ts`                                        | Readonly sqlite, statement caching, `DB_PATH` fallback |
| Home/search/directory queries | `query/`                                       | Feature-level query modules                            |
| Domain-heavy query helpers    | `queries/`                                     | Team/player/game/season modules                        |
| Legacy broad query surface    | `queries.ts`                                   | Large compatibility file still present                 |
| Shared presentation helpers   | `formatters.ts`, `table-styles.ts`, `utils.ts` | Used by route components                               |

## CONVENTIONS

- Keep query functions deterministic and read-only.
- Use explicit return typing for result objects/arrays.
- Reuse cached query helpers (`getCachedQueryOne`, `getCachedQueryMany`) where fitting.

## ANTI-PATTERNS (LIB)

- Never add mutation SQL paths; DB is opened with `{ readonly: true }`.
- Never create circular dependencies between `queries/*` modules.
- Never import from `src/app` or `src/components` into `src/lib`.

## NOTES

- Cache behavior: default ~30s TTL with bounded LRU-like map (`MAX_QUERY_CACHE_SIZE = 500`).
- If you add new query modules, keep naming aligned with existing `getX`/`searchX` patterns.
