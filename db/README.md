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

## Refresh Ownership

This repository treats the SQLite file as a published artifact from an external ETL pipeline.

- App code in `nba-reference/` remains read-only.
- Payload refreshes should follow the contract in [`docs/data-pipeline-contract.md`](../docs/data-pipeline-contract.md).
- If schema and app changes must ship together, keep them in the same pull request.

## Analytics Tables

Two analytics tables were added for lineups and on/off analysis. Run the setup script
once after a fresh checkout (or after the ETL pipeline refreshes the DB) to ensure
these tables exist:

```bash
cd nba-reference && npm run setup:analytics
```

### `fact_lineup_aggregation`

Stores aggregated 5-player lineup units per team per season. **Populated by the ETL pipeline.**
The table is created empty by the setup script; lineup rows will appear once the ETL pipeline
is updated to track substitution events in play-by-play data.

| Column          | Type    | Notes                              |
| --------------- | ------- | ---------------------------------- |
| `lineup_id`     | INTEGER | Primary key                        |
| `team_id`       | TEXT    | → `dim_team.team_id`               |
| `season_id`     | TEXT    | → `dim_season.season_id`           |
| `player_ids`    | TEXT    | JSON array of `bref_player_id`s    |
| `minutes`       | REAL    | Total minutes played by lineup     |
| `possessions`   | INTEGER | Possessions while lineup was on    |
| `points_scored` | INTEGER | Points scored by lineup            |
| `points_allowed`| INTEGER | Points allowed by lineup           |
| `net_rating`    | REAL    | Off Rtg − Def Rtg per 100 poss.    |
| `off_rating`    | REAL    | Points scored per 100 possessions  |
| `def_rating`    | REAL    | Points allowed per 100 possessions |

### `fact_on_off`

Stores per-player on/off court net rating analysis. **Derived from `fact_player_pbp_season`**
by the `setup:analytics` script. Re-run the script whenever the PBP season table is refreshed.

| Column              | Type    | Notes                                    |
| ------------------- | ------- | ---------------------------------------- |
| `id`                | INTEGER | Primary key                              |
| `bref_player_id`    | TEXT    | Basketball-Reference player ID           |
| `team_id`           | TEXT    | → `dim_team.team_id`                     |
| `season_id`         | TEXT    | → `dim_season.season_id`                 |
| `on_court_minutes`  | INTEGER | Minutes played on court                  |
| `on_net_rating`     | REAL    | Team net rating per 100 poss. when on    |
| `off_net_rating`    | REAL    | Team net rating per 100 poss. when off   |
| `net_impact`        | REAL    | `on_net_rating − off_net_rating`         |

