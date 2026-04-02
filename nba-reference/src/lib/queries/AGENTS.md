# Domain Query Modules Guide

## Overview

`src/lib/queries/` is the dense domain-query layer: raw SQL, typed row mapping,
and domain-specific fetch helpers for players, teams, games, awards, standings,
leagues, and analytics.

## Structure

```text
queries/
├── index.ts        # high fan-out barrel; keep exports intentional
├── players/        # player-specific query slices
├── awards/         # award-specific helpers
├── *.test.ts       # domain coverage near the affected modules
└── *.ts            # one module per data domain
```

## Where To Look

| Task                                      | Location                                                  | Notes                                                               |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| Player profile/career/splits/game history | `players/`                                                | Keep player logic grouped there before creating new top-level files |
| Team/game/season domain retrieval         | `teams.ts`, `games.ts`, `seasons.ts`, `team-schedule.ts`  | Reuse existing shapes and filters                                   |
| Cross-league variants                     | `wnba.ts`, `gleague.ts`, `college.ts`, `international.ts` | Parallel patterns already exist                                     |
| Barrel exports                            | `index.ts`                                                | High blast radius; update carefully                                 |

## Conventions

- Prefer extending an existing domain module over adding a near-duplicate file.
- Keep SQL close to the exported helper that owns it; do not bounce between
  `src/app` and this layer.
- Reuse read helpers from `@/lib/db` and existing shared type interfaces; avoid
  manual connection management.
- When adding a new domain helper, decide whether it belongs here (`queries/`)
  or in `../query` (page composition) before coding.
- Update `index.ts` only when the helper should be part of the public
  domain-query surface.

## Anti-Patterns

- Do not re-export everything by default just because a function exists.
- Do not place page orchestration logic here; combining multiple domain helpers
  belongs in `../query`.
- Do not create league-specific copies if an existing generic query can be
  parameterized cleanly.

## Validation

- Add or update the nearest domain test file (`players.test.ts`,
  `games.test.ts`, `teams.test.ts`, etc.).
- If you touch `index.ts` or shared query shapes, run the broader lib test set
  and prefer `npm run ci`.

## Notes

- This subtree contains the highest fan-out export surface in the app;
  `index.ts` affects consumers across pages and API routes.
- Large modules (`awards.ts`, `games.ts`, `teams.ts`, `playoffs.ts`) are risky
  edit zones—prefer surgical extensions and preserve existing return shapes
  unless the caller change is intentional.
