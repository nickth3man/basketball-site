# Basketball Site

[![CI](https://github.com/nickth3man/basketball-site/actions/workflows/ci.yml/badge.svg)](https://github.com/nickth3man/basketball-site/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/nickth3man/basketball-site)](https://github.com/nickth3man/basketball-site/commits/main)

A full-stack basketball statistics website built with Next.js and SQLite. Access comprehensive NBA statistics, historical team records, player attributes, game logs, and more.

## Features

- **Player Statistics** - Career stats, season stats, game logs, and advanced metrics
- **Team Information** - Franchise history, rosters, and team records
- **Game Data** - Box scores, schedules, and historical games
- **Awards & Leaders** - NBA awards, statistical leaders, and records
- **Search Functionality** - Search players, teams, seasons, games, and awards
- **Export Data** - Download statistics in CSV format

## Quick Start

```bash
# Clone with Git LFS (required for the database)
git lfs install
git clone https://github.com/nickth3man/basketball-site.git
cd basketball-site

# Install dependencies and start development
cd nba-reference
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 20+ | Running the Next.js frontend |
| **Git** | Latest | Version control |
| **Git LFS** | Latest | Downloading the large SQLite database |

## Project Structure

```
basketball-site/
├── db/                         # SQLite database (Git LFS tracked)
│   └── nba_raw_data.db         # Pre-populated NBA statistics
├── docs/                       # Repository documentation hub
├── nba-reference/              # Next.js frontend application
│   ├── src/
│   │   ├── app/               # Routes and API endpoints
│   │   ├── components/        # Shared UI components
│   │   └── lib/               # Data access and queries
│   ├── package.json           # Dependencies and scripts
│   └── README.md              # Frontend-specific docs
├── scripts/                    # Repository maintenance scripts
├── .github/                    # GitHub Actions and templates
├── CONTRIBUTING.md             # Contribution guidelines
└── README.md                   # This file
```

## Development

### Available Commands

From the `nba-reference/` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run test suite with Vitest |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run verify:db` | Verify the SQLite payload is present and readable |
| `npm run ci` | Run full CI pipeline |

### Database Architecture

The application uses a **read-only database** architecture. The SQLite database (`db/nba_raw_data.db`) contains pre-populated NBA statistics and is never modified at runtime.

**Key Points:**
- Database is tracked in Git LFS
- App only reads from the database
- Updates happen through separate ETL processes

See [nba-reference/ARCHITECTURE.md](nba-reference/ARCHITECTURE.md) for the app architecture and layer boundaries.

## Documentation

- **[docs/README.md](docs/README.md)** - Documentation index and navigation
- **[docs/project-structure.md](docs/project-structure.md)** - Canonical structure map
- **[docs/data-pipeline-contract.md](docs/data-pipeline-contract.md)** - Data refresh contract and ownership model
- **[db/README.md](db/README.md)** - Database payload and runtime path notes
- **[scripts/README.md](scripts/README.md)** - Maintenance script reference
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to this project
- **[nba-reference/README.md](nba-reference/README.md)** - Frontend-specific documentation
- **[nba-reference/AGENTS.md](nba-reference/AGENTS.md)** - Development guidelines
- **[nba-reference/ARCHITECTURE.md](nba-reference/ARCHITECTURE.md)** - System architecture

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library |
| [TypeScript 5](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | SQLite database access |
| [Vitest](https://vitest.dev/) | Testing framework |
| [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) | Code quality |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Setting up your development environment
- Code style and conventions
- Submitting pull requests
- Reporting issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note:** This is a personal project for learning and demonstration purposes. NBA data is sourced from publicly available statistics.
