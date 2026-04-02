# Data Pipeline Contract

This document describes the schema contract between the ETL pipeline and the application layer.

---

## `fact_play_by_play`

### Schema Audit (current)

| Column | Type | Description | Available |
|---|---|---|---|
| `event_id` | TEXT PK | Unique event identifier | ✅ |
| `game_id` | TEXT FK | References `fact_game` | ✅ |
| `period` | INTEGER | Game period (1–4, 5+ for OT) | ✅ |
| `pc_time_string` | TEXT | Time remaining in period (e.g., `10:46`) | ✅ |
| `wc_time_string` | TEXT | Wall-clock time of event | ✅ |
| `eventmsgtype` | INTEGER | Event type code (see below) | ✅ |
| `eventmsgactiontype` | INTEGER | Sub-type code within event type | ✅ |
| `player1_id` | TEXT FK | Primary player (shooter, fouler, etc.) | ✅ |
| `player2_id` | TEXT FK | Secondary player (defender, assister, etc.) | ✅ |
| `player3_id` | TEXT FK | Tertiary player (rare; e.g., second assister) | ✅ |
| `person1type` | INTEGER | Role code for player1 | ✅ |
| `person2type` | INTEGER | Role code for player2 | ✅ |
| `person3type` | INTEGER | Role code for player3 | ✅ |
| `team1_id` | TEXT FK | Team of primary player | ✅ |
| `team2_id` | TEXT FK | Team of secondary player | ✅ |
| `home_description` | TEXT | Event description (home perspective) | ✅ |
| `visitor_description` | TEXT | Event description (away perspective) | ✅ |
| `neutral_description` | TEXT | Event description (neutral/jump balls) | ✅ |
| `score` | TEXT | Cumulative score at event (e.g., `45-52`) | ✅ |
| `score_margin` | TEXT | Score margin at event (`+5`, `-3`, `TIE`) | ✅ |

### Missing / Proposed Columns

The following columns do not currently exist in `fact_play_by_play`. Their addition is required to support fully structured shot analytics without client-side text parsing.

| Column | Type | Description | Priority |
|---|---|---|---|
| `shot_distance` | INTEGER | Distance of shot attempt in feet | P1 |
| `shot_zone` | TEXT | Shot zone category (`Restricted Area`, `In The Paint`, `Mid-Range`, `Corner 3`, `Above Break 3`) | P1 |
| `shot_value` | INTEGER | Point value of the shot attempt (2 or 3) | P1 |
| `shot_result` | TEXT | `made` or `missed` (for shot events only) | P1 |
| `assisted` | INTEGER | 1 if shot was assisted, 0 otherwise | P2 |
| `closest_defender_distance` | REAL | Distance to nearest defender at shot release (feet) | P2 |
| `shot_x` | REAL | Shot x-coordinate on court (half-court feet) | P2 |
| `shot_y` | REAL | Shot y-coordinate on court (half-court feet) | P2 |

### `eventmsgtype` Reference Codes

| Code | Description |
|---|---|
| 1 | Made field goal |
| 2 | Missed field goal |
| 3 | Free throw |
| 4 | Rebound |
| 5 | Turnover |
| 6 | Foul |
| 7 | Violation |
| 8 | Substitution |
| 10 | Jump ball |
| 11 | Ejection |
| 12 | Period start |
| 13 | Period end |

### Current Workaround

Because structured shot columns are absent, the application parses shot metadata from the free-text `home_description` / `visitor_description` columns at query time. This parsing covers:

- **Shot result** — derived from `eventmsgtype` (1 = made, 2 = missed)
- **Shot value** — detected via `3PT` substring in description
- **Shot distance** — extracted from `\d+'` pattern (e.g., `"25'"`)
- **Shot type** — keyword matching (`Layup`, `Dunk`, `Jump Shot`, `Hook Shot`, etc.)
- **Shot zone** — inferred from distance + shot type heuristics
- **Assisted** — detected by `AST)` pattern in description

Accuracy of this parsing is best-effort. Adding the structured columns above would eliminate parsing errors and support exact zone breakdowns.

---

## Related Issues

- Shot chart aggregation by zone for team/season pages is **out of scope** for the current implementation and is tracked as a future issue.
- Lineups and on/off analysis do not depend on these columns and are tracked separately.
