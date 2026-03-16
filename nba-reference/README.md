# NBA Reference

Next.js frontend application for basketball statistics. Serves comprehensive NBA
data including player stats, team records, game logs, awards, season indexes,
and cross-entity search from a local SQLite database.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack

| Technology            | Purpose                         |
| --------------------- | ------------------------------- |
| **Next.js 16**        | React framework with App Router |
| **React 19**          | UI library                      |
| **Tailwind CSS 4**    | Utility-first styling           |
| **better-sqlite3**    | SQLite database access          |
| **TypeScript 5**      | Type safety                     |
| **Vitest**            | Testing framework               |
| **ESLint + Prettier** | Code quality                    |

## Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── api/               # API routes
│   ├── search/            # Dedicated search results page
│   ├── players/           # Player pages
│   ├── teams/             # Team pages
│   ├── games/             # Game logs
│   ├── boxscores/         # Box score pages
│   ├── standings/         # Standings pages
│   ├── seasons/           # Season pages
│   ├── playoffs/          # Playoff pages
│   ├── awards/            # Awards pages
│   ├── draft/             # Draft pages
│   ├── leaders/           # Statistical leaders
│   ├── leagues/           # League pages
│   ├── allstar/           # All-Star pages
│   └── friv/              # Miscellaneous pages
├── components/            # Shared UI components
│   ├── ui/                # Base UI components
│   ├── site-header.tsx    # Navigation header
│   ├── search-box.tsx     # Global search entry point
│   ├── stats-table.tsx    # Statistics table with linkable cells
│   └── error-boundary.tsx # Error handling
└── lib/                   # Data layer
    ├── db.ts              # Database connection
    ├── queries/           # Query builders
    ├── query/             # Query utilities
    ├── types.ts           # TypeScript types
    ├── validation.ts      # Data validation
    └── utils.ts           # Utility functions
```

## Available Scripts

| Command                    | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| `npm run dev`              | Start development server with hot reload             |
| `npm run build`            | Create optimized production build                    |
| `npm run start`            | Start production server                              |
| `npm run lint`             | Run ESLint                                           |
| `npm run lint:fix`         | Run ESLint with auto-fix                             |
| `npm run format`           | Format code with Prettier                            |
| `npm run format:check`     | Check code formatting                                |
| `npm run type-check`       | Run TypeScript compiler check                        |
| `npm run type-check:watch` | Run TypeScript check in watch mode                   |
| `npm run test`             | Run Vitest test suite                                |
| `npm run test:watch`       | Run tests in watch mode                              |
| `npm run verify:db`        | Verify the SQLite payload is present and readable    |
| `npm run ci`               | Full CI pipeline (type-check + lint + format + test) |

## Development

### Starting Development

```bash
npm run dev
```

The page auto-updates as you edit files. Start with `src/app/page.tsx` for the
home page.

### Database Access

Database queries are centralized in `src/lib/`:

```typescript
import { getDb } from '@/lib/db';

// Example query
const db = getDb();
const players = db.prepare('SELECT * FROM players LIMIT 10').all();
```

### Environment Variables

| Variable  | Description             | Default                 |
| --------- | ----------------------- | ----------------------- |
| `DB_PATH` | Path to SQLite database | `../db/nba_raw_data.db` |

### Key Conventions

- **Server Components** — Pages use server components by default for data
  fetching
- **Client Components** — Add `"use client"` only when interactivity is needed
- **Data Layer** — All SQL queries live in `src/lib/`, not in route files
- **Feature Query Imports** — Prefer `@/lib/query` as the entrypoint
- **Read-Only** — Never write to the database at runtime

## Testing

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

Tests are co-located with source files (`*.test.ts`, `*.test.tsx`) or in
route-local `__tests__/` folders.

## Building for Production

```bash
# Verify the database payload first
npm run verify:db

# Create production build
npm run build

# Start production server
npm start
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn Tutorial](https://nextjs.org/learn)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Documentation

- [AGENTS.md](./AGENTS.md) — Development guidelines and conventions
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture and patterns

## License

MIT
