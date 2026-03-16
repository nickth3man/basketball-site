# Scripts Directory

This directory contains repository maintenance scripts.

## Available Scripts

- `migrate.sh`: legacy migration helper for older project layout workflows.

## Usage

Run scripts from the repository root unless the script states otherwise.

```bash
bash scripts/migrate.sh
```

## Notes

- `migrate.sh` is a legacy helper and is not part of the normal development or CI workflow.
- Prefer the documented `nba-reference/` npm scripts for day-to-day work (`dev`, `ci`, `build`, `verify:db`).
