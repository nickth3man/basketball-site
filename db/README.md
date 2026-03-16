# Database Directory

This directory stores the canonical SQLite data payload used by the application.

## Contents

- `nba_raw_data.db`: read-only NBA dataset tracked with Git LFS.

## Important Notes

- Run `git lfs install` before cloning, or LFS data may not download correctly.
- Application code must never write to this database at runtime.
- App queries are read-only and centralized in `nba-reference/src/lib/`.

## Runtime Path

Set `DB_PATH` to point to this file when running the app from `nba-reference/`:

```bash
DB_PATH=../db/nba_raw_data.db
```

## Validation

From `nba-reference/`, run the DB verification script to catch missing Git LFS payloads early:

```bash
npm run verify:db
```
