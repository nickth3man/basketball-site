# Project Structure

This map describes where code should live so contributors can place changes quickly and consistently.

## Repository Layout

```text
basketball-site/
├── db/                    # Canonical SQLite payload (Git LFS)
├── docs/                  # Documentation navigation and structure guides
├── nba-reference/         # Next.js app workspace (main implementation surface)
├── scripts/               # Repository maintenance scripts
├── .github/               # CI, issue templates, and PR templates
├── AGENTS.md              # Repo-level constraints and conventions
└── README.md              # Project overview and quick start
```

## App Layout (`nba-reference/`)

```text
nba-reference/
├── src/
│   ├── app/               # App Router pages, layouts, and API routes
│   ├── components/        # Shared UI components
│   ├── lib/               # Data/query/utilities layer
│   │   ├── queries/       # Domain query modules (players, teams, seasons, etc.)
│   │   └── query/         # Feature query modules (home/search/directory/boxscores)
│   └── middleware/        # Shared middleware helpers
├── public/                # Static assets
├── AGENTS.md              # App-specific conventions
└── ARCHITECTURE.md        # Detailed architectural decisions
```

## Placement Rules

- Put pages and route handlers in `nba-reference/src/app/`.
- Put reusable presentational components in `nba-reference/src/components/`.
- Put SQL/data logic in `nba-reference/src/lib/`; avoid raw SQL in route files.
- Prefer importing feature queries from `@/lib/query` (barrel) instead of deep single-file paths.
- Keep tests colocated (`*.test.ts` / `*.test.tsx`) or route-local in `__tests__/`.
