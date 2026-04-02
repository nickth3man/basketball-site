# Shared Components Guide

## Overview

`src/components/` holds reusable UI plus the main client-heavy widgets: search,
stats tables, favorites, charts, filters, and theme plumbing. This subtree mixes
server-safe presentational pieces with explicit client components.

## Structure

```text
components/
├── ui/         # base primitives such as Button, Card, Input, Skeleton
├── charts/     # chart components + chart theme constants
├── compare/    # comparison-specific interactive components
├── favorites/  # saved/favorite client widgets
├── filters/    # client-side filter controls
└── theme/      # next-themes provider + toggle
```

## Where To Look

| Task                                | Location                | Notes                                                                                              |
| ----------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Base button/card/input API          | `ui/`                   | Extend existing variants before inventing a new primitive                                          |
| Search UX                           | `search-box.tsx`        | Debounced fetch, localStorage recents, keyboard shortcuts                                          |
| Table UX                            | `stats-table.tsx`       | Export button, sorting, linkable cells                                                             |
| Chart styling                       | `charts/chart-theme.ts` | Reuse shared colors/labels                                                                         |
| Shared client hooks used by widgets | `../hooks/`             | `use-favorites`, `use-filter-state`, and `use-saved-views` normally evolve with component behavior |

## Conventions

- Add `'use client'` only to the component that truly needs browser APIs, local
  state, effects, or event handlers.
- Reuse shared primitives (`Button`, `Input`, `Card`, `Skeleton`) and helpers
  like `buttonStyles` / `cn` before creating one-off class piles.
- Preserve design-token classes and semantic utility groups already used across
  the subtree (`surface-*`, `text-*`, `ambient-*`, table style helpers).
- Keep tests co-located. Existing behavior-heavy widgets (`search-box`,
  `stats-table`) are the pattern to follow.

## Anti-Patterns

- Do not duplicate button/input/table styling inline if a shared primitive or
  style helper already exists.
- Do not move fetch/data composition into shared components; fetch in `src/app`
  or `src/lib/query`, then pass data down.
- Do not add client directives to whole folders; isolate them to the smallest
  component that needs them.

## Validation

- For component behavior changes, run the nearest `*.test.tsx` and then
  `npm run type-check`.
- If the change affects shared UI consumed broadly, prefer `npm run ci`.

## Notes

- `search-box.tsx` is the main risky edit zone in this subtree: debouncing,
  abort logic, recent-search persistence, and keyboard shortcuts all interact.
- `ui/` files are hand-written local primitives, not generated vendor code.
