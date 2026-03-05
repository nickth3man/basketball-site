# Contributing to Basketball Site

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project adheres to a standard of professional conduct. Be respectful, constructive, and inclusive in all interactions.

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **Git** with LFS support
- **npm** (comes with Node.js)

### Setup

1. **Fork and clone the repository**
   ```bash
   git lfs install
   git clone https://github.com/YOUR_USERNAME/basketball-site.git
   cd basketball-site
   ```

2. **Install dependencies**
   ```bash
   cd nba-reference
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names with the following prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or improvements
- `chore/` - Maintenance tasks

Example: `feature/player-stats-comparison`

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

Examples:
```
feat(players): add career stats comparison
fix(api): handle missing player data gracefully
docs(readme): update setup instructions
```

## Code Style

This project uses strict TypeScript and ESLint configurations. All code must pass the quality checks.

### Running Quality Checks

```bash
# From nba-reference/
npm run ci           # Run full pipeline
npm run type-check   # TypeScript check
npm run lint         # ESLint
npm run format:check # Prettier check
npm run test         # Run tests
```

### Key Style Rules

- **2 spaces** for indentation
- **100 characters** max line length
- **camelCase** for variables and functions
- **PascalCase** for types, interfaces, and components
- **Explicit return types** on exported functions
- **No `any` types** - strict typing required
- **No non-null assertions** (`!`)

### File Organization

```
src/
├── app/           # Next.js routes and pages
├── components/    # Reusable UI components
├── lib/           # Utilities, queries, and data layer
│   ├── queries/   # Database queries organized by domain
│   └── query/     # Query utilities and helpers
```

### Layer Architecture

Maintain strict layer boundaries:

```
Presentation (app/, components/)
    ↓
Application (lib/queries/)
    ↓
Infrastructure (lib/db.ts)
```

Never import from a higher layer to a lower layer in reverse.

## Testing

### Writing Tests

- Co-locate tests with source files: `*.test.ts` or `*.test.tsx`
- For API routes, use `__tests__/` folders
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern

### Running Tests

```bash
npm run test        # Run once
npm run test:watch  # Run in watch mode
```

### Test Coverage

Aim for high coverage on:
- Utility functions
- Query logic
- API routes
- Component interactions

## Pull Request Process

1. **Before submitting:**
   - Ensure all checks pass: `npm run ci`
   - Update documentation if needed
   - Add tests for new functionality
   - Review your own changes first

2. **PR Description should include:**
   - What changes were made and why
   - How to test the changes
   - Any breaking changes
   - Screenshots (for UI changes)

3. **Review process:**
   - At least one review required
   - Address all review comments
   - Keep the PR focused on a single concern

4. **After merge:**
   - Delete your branch
   - Monitor for any issues

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS)
- Screenshots if applicable

### Feature Requests

Include:
- Description of the feature
- Use case and motivation
- Possible implementation approach
- Any relevant examples

## Database Notes

⚠️ **Important**: The database is **read-only** at runtime.

- Never write to SQLite in application code
- Data updates happen through separate ETL processes
- The database file is tracked in Git LFS

## Questions?

- Start with [docs/project-structure.md](docs/project-structure.md) for placement guidance.
- Check existing documentation in `AGENTS.md` files
- Review the `ARCHITECTURE.md` for system design
- Open an issue for discussion

Thank you for contributing!
