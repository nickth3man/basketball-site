# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-03T23:52:51Z
**Commit:** 5ee774e
**Branch:** main

## OVERVIEW
Basketball stats repository with one runnable app (`nba-reference/`) and one data payload (`db/nba_raw_data.db`).
Top-level logic is orchestration/documentation; product code lives under `nba-reference/`.

## STRUCTURE
```text
basketball-site/
├── nba-reference/      # Next.js app (all feature work)
├── db/                 # SQLite payload (Git LFS)
├── scripts/            # Repo maintenance scripts
├── AGENTS.md           # Mirrors CLAUDE.md
└── CLAUDE.md           # This file (mirrors AGENTS.md)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Build feature/page/API | `nba-reference/src/` | App Router + server components |
| Query/data logic | `nba-reference/src/lib/` | Layer boundary and DB access |
| App-level constraints | `nba-reference/AGENTS.md` | Primary contributor guide |
| Database payload issues | `db/nba_raw_data.db` | Read-only runtime model |
| Keep docs mirrored | `scripts/sync-claude-agents.sh` | Syncs AGENTS/CLAUDE pairs |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `getDb` | function | `nba-reference/src/lib/db.ts` | high | Shared DB entry point |
| `getCachedQueryOne` | function | `nba-reference/src/lib/db.ts` | low | Single-row cached read helper |
| `getCachedQueryMany` | function | `nba-reference/src/lib/db.ts` | medium | Multi-row cached read helper |
| `Home` | page component | `nba-reference/src/app/page.tsx` | route | Home route server component |

## CONVENTIONS
- All application changes belong in `nba-reference/`; root is coordination and repo metadata.
- Database file is externalized in `db/` and consumed read-only by app code.
- `AGENTS.md` and `CLAUDE.md` are mirrored in each directory that has both.

## ANTI-PATTERNS (THIS PROJECT)
- Never add runtime database writes to app code.
- Never invert architecture dependencies (Infrastructure -> Application, Application -> Presentation).
- Never introduce circular module dependencies across layers.

## UNIQUE STYLES
- Strict TypeScript/ESLint setup is enforced in app workspace, not at repo root.
- Query-heavy design: data access is centralized in `src/lib/`, not in route components.

## COMMANDS
```bash
# From repo root
bash scripts/sync-claude-agents.sh

# App pipeline (runs in app workspace)
npm --prefix nba-reference run ci
```

## NOTES
- `db/` contains LFS-backed artifacts; missing LFS pull manifests as invalid SQLite file behavior.
- For DB resolution details and day-to-day app work, continue in `nba-reference/AGENTS.md`.
