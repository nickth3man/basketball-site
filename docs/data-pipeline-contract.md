# Data Pipeline Contract

This document defines how the application should consume refreshed SQLite payloads without moving runtime writes into the app.

## Current Decision

`basketball-site` remains a read-only application repo.

- The Next.js app in `nba-reference/` only reads SQLite data.
- Dataset refreshes are produced by an external ETL process.
- This repo owns the runtime contract, validation steps, and release expectations for those payloads.

## Required Artifacts

Every dataset refresh should produce:

1. `db/nba_raw_data.db`
2. A release note or manifest with:
   - dataset version or release timestamp
   - source snapshot window
   - schema compatibility note
   - row-count or validation summary

## Import Workflow

1. Produce the SQLite payload in the external ETL pipeline.
2. Validate the payload before copying it into this repo.
3. Replace `db/nba_raw_data.db` through Git LFS.
4. Run `npm --prefix nba-reference run verify:db`.
5. Run `npm --prefix nba-reference run ci`.
6. Record the dataset version in the PR description or release notes.

## Compatibility Rules

- Keep runtime schema changes backwards-compatible with the current query layer where possible.
- If schema changes require app updates, land app changes and payload changes in the same PR.
- Never ship a payload that requires runtime writes, migrations, or startup mutation logic inside `nba-reference/`.

## Validation Expectations

The external ETL process should validate:

- SQLite file integrity
- presence of tables queried by `nba-reference/src/lib/`
- representative row counts for core tables
- season, player, team, game, and play-by-play coverage

The application repo validates:

- payload readability through `npm run verify:db`
- type, lint, format, and test health through `npm run ci`
- build compatibility through `npm run build`

## Future Expansion

If the ETL process is later moved into this repository, place it in a separate top-level workspace such as `etl/` or `data-pipeline/`.

That workspace should own:

- source ingestion
- transforms and schema generation
- release metadata generation
- payload publishing

The application must remain a downstream consumer of the published SQLite artifact.
