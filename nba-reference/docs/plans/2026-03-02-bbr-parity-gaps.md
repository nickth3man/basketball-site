# BBR Parity Gaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close Basketball-Reference (BBR) parity gaps across player, team, game, and season pages.

**Architecture:** Extend existing Next.js 15 + SQLite architecture with incremental additions to queries.ts and page components. Follow established patterns: query functions in lib/queries.ts, page components in app/[entity]/[param]/page.tsx, minimal new abstractions.

**Tech Stack:** Next.js 15, TypeScript, better-sqlite3, Tailwind CSS

---

## Current State Summary

- **Player Page** (`app/players/[id]/page.tsx`): 332 lines, comprehensive stats but missing Per 36 Min, Per 100 Poss, Adjusted Shooting, full game log, transactions, FAQ
- **Team Page** (`app/teams/[abbrev]/page.tsx`): 192 lines, basic info but missing game charts, injury reports, staff, player stat tables, leaderboards
- **Game Page** (`app/games/[id]/page.tsx`): 50 lines, very basic - only header and team box score
- **Season Page**: Does not exist - needs full implementation
- **Queries** (`lib/queries.ts`): 393 lines, 20 query functions

---

## Phase 1: Player Page Enhancements

### Task 1.1: Add Per 36 Minutes Stats Query

**Files:**
- Modify: `src/lib/queries.ts` (after line 65, after getPlayerPerGameStats)
- Modify: `src/app/players/[id]/page.tsx` (after line 184, after Per Game section)

**Step 1: Add query function to queries.ts**

Add after getPlayerPerGameStats (line 65):

```typescript
export function getPlayerPer36Stats(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g,
              CASE WHEN mp > 0 THEN ROUND(36.0 * pts / mp, 1) END AS pts_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * reb / mp, 1) END AS reb_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * ast / mp, 1) END AS ast_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * stl / mp, 1) END AS stl_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * blk / mp, 1) END AS blk_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * tov / mp, 1) END AS tov_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * fg / mp, 1) END AS fg_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * fga / mp, 1) END AS fga_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * x3p / mp, 1) END AS x3p_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * x3pa / mp, 1) END AS x3pa_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * ft / mp, 1) END AS ft_per36,
              CASE WHEN mp > 0 THEN ROUND(36.0 * fta / mp, 1) END AS fta_per36
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}
```

**Step 2: Add section to player page**

In `src/app/players/[id]/page.tsx`:
1. Import the new query (add to imports at line 15): `getPlayerPer36Stats,`
2. Add data fetch (after line 50): `const per36Stats = getPlayerPer36Stats(id, 25);`
3. Add to anchorSections (line 67): `{ id: "per-36", label: "Per 36 Min" },`
4. Add section HTML (after Per Game section, after line 184):

```tsx
          <section id="per-36" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Per 36 Minutes</h2>
            <StatsTable
              columns={[
                { key: "season_id", label: "Season" },
                { key: "team_abbrev", label: "Tm" },
                { key: "g", label: "G", align: "right" },
                { key: "pts_per36", label: "PTS", align: "right" },
                { key: "reb_per36", label: "TRB", align: "right" },
                { key: "ast_per36", label: "AST", align: "right" },
                { key: "stl_per36", label: "STL", align: "right" },
                { key: "blk_per36", label: "BLK", align: "right" },
                { key: "tov_per36", label: "TOV", align: "right" },
                { key: "fg_per36", label: "FG", align: "right" },
                { key: "fga_per36", label: "FGA", align: "right" },
                { key: "x3p_per36", label: "3P", align: "right" },
                { key: "x3pa_per36", label: "3PA", align: "right" },
              ]}
              rows={per36Stats}
              initialSort="season_id"
            />
          </section>
```

**Step 3: Verify with diagnostics**

Run: `cd C:\Users\nicolas\Documents\GitHub\sites\test\nba-reference && npx tsc --noEmit`
Expected: No errors

---

### Task 1.2: Add Per 100 Possessions Stats Query

**Files:**
- Modify: `src/lib/queries.ts` (after getPlayerPer36Stats)
- Modify: `src/app/players/[id]/page.tsx`

**Step 1: Add query function to queries.ts**

Add after getPlayerPer36Stats:

```typescript
export function getPlayerPer100Stats(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g,
              CASE WHEN mp > 0 THEN ROUND(100.0 * pts / mp * (48.0 / 5.0), 1) END AS pts_per100,
              CASE WHEN mp > 0 THEN ROUND(100.0 * reb / mp * (48.0 / 5.0), 1) END AS reb_per100,
              CASE WHEN mp > 0 THEN ROUND(100.0 * ast / mp * (48.0 / 5.0), 1) END AS ast_per100,
              CASE WHEN mp > 0 THEN ROUND(100.0 * stl / mp * (48.0 / 5.0), 1) END AS stl_per100,
              CASE WHEN mp > 0 THEN ROUND(100.0 * blk / mp * (48.0 / 5.0), 1) END AS blk_per100,
              CASE WHEN mp > 0 THEN ROUND(100.0 * tov / mp * (48.0 / 5.0), 1) END AS tov_per100,
              CASE WHEN mp > 0 THEN ROUND(100.0 * fg / mp * (48.0 / 5.0), 1) END AS fg_per100,
              CASE WHEN mp > 0 THEN ROUND(100.0 * fga / mp * (48.0 / 5.0), 1) END AS fga_per100
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}
```

**Step 2: Add section to player page**

1. Import: add `getPlayerPer100Stats,` to imports
2. Add data fetch: `const per100Stats = getPlayerPer100Stats(id, 25);`
3. Add to anchorSections: `{ id: "per-100", label: "Per 100 Poss" },`
4. Add section HTML (after Per 36 section):

```tsx
          <section id="per-100" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Per 100 Possessions</h2>
            <StatsTable
              columns={[
                { key: "season_id", label: "Season" },
                { key: "team_abbrev", label: "Tm" },
                { key: "g", label: "G", align: "right" },
                { key: "pts_per100", label: "PTS", align: "right" },
                { key: "reb_per100", label: "TRB", align: "right" },
                { key: "ast_per100", label: "AST", align: "right" },
                { key: "stl_per100", label: "STL", align: "right" },
                { key: "blk_per100", label: "BLK", align: "right" },
                { key: "tov_per100", label: "TOV", align: "right" },
              ]}
              rows={per100Stats}
              initialSort="season_id"
            />
          </section>
```

---

### Task 1.3: Add Adjusted Shooting Stats Query

**Files:**
- Modify: `src/lib/queries.ts`
- Modify: `src/app/players/[id]/page.tsx`

**Step 1: Add query function**

```typescript
export function getPlayerAdjustedShooting(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, g,
              ts_pct,
              fg_pct,
              fg3_pct,
              ft_pct,
              e_fg_pct,
              CASE WHEN fga > 0 THEN ROUND(1.0 * x3pa / fga, 3) END AS pct_3pa
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}
```

**Step 2: Add to player page**

1. Import: `getPlayerAdjustedShooting,`
2. Fetch: `const adjustedShooting = getPlayerAdjustedShooting(id, 25);`
3. Anchor: `{ id: "adj-shooting", label: "Adjusted Shooting" },`
4. Section (after Shooting section):

```tsx
          <section id="adj-shooting" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Adjusted Shooting</h2>
            <StatsTable
              columns={[
                { key: "season_id", label: "Season" },
                { key: "team_abbrev", label: "Tm" },
                { key: "g", label: "G", align: "right" },
                { key: "ts_pct", label: "TS%", align: "right" },
                { key: "e_fg_pct", label: "eFG%", align: "right" },
                { key: "fg_pct", label: "FG%", align: "right" },
                { key: "fg3_pct", label: "3P%", align: "right" },
                { key: "ft_pct", label: "FT%", align: "right" },
                { key: "pct_3pa", label: "%3PA", align: "right" },
              ]}
              rows={adjustedShooting}
              initialSort="season_id"
            />
          </section>
```

---

### Task 1.4: Add Full Game Log (All Games)

**Files:**
- Modify: `src/lib/queries.ts`
- Modify: `src/app/players/[id]/page.tsx`

**Step 1: Add query function**

```typescript
export function getPlayerFullGameLog(brefId: string, limit = 100) {
  return getDb()
    .prepare(
      `SELECT pgl.game_id, g.game_date, t.abbreviation as team_abbrev,
              opp.abbreviation as opp_abbrev,
              CASE WHEN g.home_team_id = pgl.team_id THEN 1 ELSE 0 END AS is_home,
              pgl.minutes_played, pgl.pts, pgl.reb, pgl.ast, pgl.stl, pgl.blk,
              pgl.fgm, pgl.fga, pgl.fg3m, pgl.fg3a, pgl.ftm, pgl.fta,
              pgl.tov, pgl.pf
       FROM player_game_log pgl
       JOIN fact_game g ON g.game_id = pgl.game_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       JOIN dim_team opp ON opp.team_id = CASE 
         WHEN g.home_team_id = pgl.team_id THEN g.away_team_id 
         ELSE g.home_team_id 
       END
       WHERE pgl.player_id = (SELECT player_id FROM dim_player WHERE bref_id = ?)
       ORDER BY g.game_date DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}
```

**Step 2: Add to player page**

1. Import: `getPlayerFullGameLog,`
2. Fetch: `const fullGameLog = getPlayerFullGameLog(id, 100);`
3. Replace existing game-log section (lines 271-287) with expanded version:

```tsx
          <section id="game-log" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Game Log</h2>
            <StatsTable
              columns={[
                { key: "game_date", label: "Date" },
                { key: "team_abbrev", label: "Tm" },
                { key: "opp_abbrev", label: "Opp" },
                { key: "is_home", label: "Site" },
                { key: "minutes_played", label: "MP", align: "right" },
                { key: "pts", label: "PTS", align: "right" },
                { key: "reb", label: "REB", align: "right" },
                { key: "ast", label: "AST", align: "right" },
                { key: "stl", label: "STL", align: "right" },
                { key: "blk", label: "BLK", align: "right" },
                { key: "tov", label: "TOV", align: "right" },
                { key: "fgm", label: "FG", align: "right" },
                { key: "fga", label: "FGA", align: "right" },
              ]}
              rows={fullGameLog.map((r) => ({
                ...r,
                is_home: Number(r.is_home) === 1 ? "Home" : "Away",
              }))}
              initialSort="game_date"
            />
          </section>
```

---

## Phase 2: Game Page Enhancements

### Task 2.1: Add Player Box Score Queries

**Files:**
- Modify: `src/lib/queries.ts` (after line 393)

**Step 1: Add query functions**

```typescript
export function getGamePlayerBox(gameId: string, teamId: string) {
  return getDb()
    .prepare(
      `SELECT dp.bref_id, dp.full_name, dp.position,
              pgl.minutes_played, pgl.fgm, pgl.fga, pgl.fg3m, pgl.fg3a,
              pgl.ftm, pgl.fta, pgl.reb, pgl.ast, pgl.stl, pgl.blk,
              pgl.tov, pgl.pf, pgl.pts,
              CASE WHEN pgl.fga > 0 THEN ROUND(1.0 * pgl.fgm / pgl.fga, 3) END AS fg_pct,
              CASE WHEN pgl.fg3a > 0 THEN ROUND(1.0 * pgl.fg3m / pgl.fg3a, 3) END AS fg3_pct,
              CASE WHEN pgl.fta > 0 THEN ROUND(1.0 * pgl.ftm / pgl.fta, 3) END AS ft_pct
       FROM player_game_log pgl
       JOIN dim_player dp ON dp.player_id = pgl.player_id
       WHERE pgl.game_id = ? AND pgl.team_id = ?
       ORDER BY pgl.pts DESC, pgl.minutes_played DESC`,
    )
    .all(gameId, teamId) as Array<Record<string, string | number | null>>;
}

export function getGameQuarterScores(gameId: string) {
  return getDb()
    .prepare(
      `SELECT ht.abbreviation as home_abbrev, at.abbreviation as away_abbrev,
              g.home_score, g.away_score,
              g.q1_home, g.q1_away, g.q2_home, g.q2_away,
              g.q3_home, g.q3_away, g.q4_home, g.q4_away,
              g.ot_home, g.ot_away
       FROM fact_game g
       JOIN dim_team ht ON ht.team_id = g.home_team_id
       JOIN dim_team at ON at.team_id = g.away_team_id
       WHERE g.game_id = ?`,
    )
    .get(gameId) as Record<string, string | number | null> | undefined;
}
```

---

### Task 2.2: Enhance Game Page with Player Box Scores

**Files:**
- Modify: `src/app/games/[id]/page.tsx` (complete rewrite to 150+ lines)

**Step 1: Replace page content**

```tsx
import Link from "next/link";
import { StatsTable } from "@/components/stats-table";
import { getGameById, getTeamGameBox, getGamePlayerBox, getGameQuarterScores } from "@/lib/queries";
import { notFound } from "next/navigation";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = getGameById(id);
  if (!game) notFound();

  const box = getTeamGameBox(id);
  const quarterScores = getGameQuarterScores(id);
  
  // Get team IDs from the game data (need to query for them)
  const homeTeamId = box.find(b => b.team === game.home_abbrev)?.team as string;
  const awayTeamId = box.find(b => b.team === game.away_abbrev)?.team as string;
  
  // Fetch player box scores - we need to get team IDs differently
  const homePlayerBox = getGamePlayerBox(id, game.home_team_id as string);
  const awayPlayerBox = getGamePlayerBox(id, game.away_team_id as string);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-[#6b604b]">
        <Link href="/">Home</Link> / <Link href="/games">Games</Link> / {game.game_id}
      </div>
      
      <section className="mb-5 border border-[#b8ab8f] bg-[#f8f3e8] p-4">
        <h1 className="mb-2 text-2xl font-bold">
          {game.away_name} at {game.home_name}
        </h1>
        <p className="text-sm text-[#3b3428]">
          {game.game_date} | Final
        </p>
        
        {/* Scoreboard */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="border border-[#c9b998] bg-white p-3">
            <div className="text-lg font-bold">{game.away_abbrev}</div>
            <div className="text-3xl font-bold">{game.away_score}</div>
          </div>
          <div className="flex items-center justify-center text-sm text-[#6b604b]">
            Final
          </div>
          <div className="border border-[#c9b998] bg-white p-3">
            <div className="text-lg font-bold">{game.home_abbrev}</div>
            <div className="text-3xl font-bold">{game.home_score}</div>
          </div>
        </div>
        
        {/* Quarter Scores */}
        {quarterScores && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#ece5d7]">
                  <th className="border border-[#b8ab8f] px-2 py-1">Team</th>
                  <th className="border border-[#b8ab8f] px-2 py-1">Q1</th>
                  <th className="border border-[#b8ab8f] px-2 py-1">Q2</th>
                  <th className="border border-[#b8ab8f] px-2 py-1">Q3</th>
                  <th className="border border-[#b8ab8f] px-2 py-1">Q4</th>
                  {quarterScores.ot_home && <th className="border border-[#b8ab8f] px-2 py-1">OT</th>}
                  <th className="border border-[#b8ab8f] px-2 py-1">Final</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#d2c8b3] px-2 py-1 font-bold">{game.away_abbrev}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right">{quarterScores.q1_away ?? "-"}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right">{quarterScores.q2_away ?? "-"}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right">{quarterScores.q3_away ?? "-"}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right">{quarterScores.q4_away ?? "-"}</td>
                  {quarterScores.ot_away && <td className="border border-[#d2c8b3] px-2 py-1 text-right">{quarterScores.ot_away}</td>}
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right font-bold">{game.away_score}</td>
                </tr>
                <tr>
                  <td className="border border-[#d2c8b3] px-2 py-1 font-bold">{game.home_abbrev}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right">{quarterScores.q1_home ?? "-"}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right">{quarterScores.q2_home ?? "-"}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right">{quarterScores.q3_home ?? "-"}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right">{quarterScores.q4_home ?? "-"}</td>
                  {quarterScores.ot_home && <td className="border border-[#d2c8b3] px-2 py-1 text-right">{quarterScores.ot_home}</td>}
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right font-bold">{game.home_score}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Team Box Score */}
      <section className="mb-5">
        <h2 className="mb-2 text-xl font-bold">Team Box Score</h2>
        <StatsTable
          columns={[
            { key: "team", label: "Team" },
            { key: "fgm", label: "FG", align: "right" },
            { key: "fga", label: "FGA", align: "right" },
            { key: "fg3m", label: "3P", align: "right" },
            { key: "fg3a", label: "3PA", align: "right" },
            { key: "ftm", label: "FT", align: "right" },
            { key: "fta", label: "FTA", align: "right" },
            { key: "reb", label: "REB", align: "right" },
            { key: "ast", label: "AST", align: "right" },
            { key: "pts", label: "PTS", align: "right" },
          ]}
          rows={box}
          initialSort="pts"
        />
      </section>

      {/* Player Box Scores */}
      <section className="mb-5">
        <h2 className="mb-2 text-xl font-bold">{game.away_abbrev} Player Box Score</h2>
        <StatsTable
          columns={[
            { key: "full_name", label: "Player" },
            { key: "position", label: "Pos" },
            { key: "minutes_played", label: "MP", align: "right" },
            { key: "fgm", label: "FG", align: "right" },
            { key: "fga", label: "FGA", align: "right" },
            { key: "fg3m", label: "3P", align: "right" },
            { key: "fg3a", label: "3PA", align: "right" },
            { key: "reb", label: "REB", align: "right" },
            { key: "ast", label: "AST", align: "right" },
            { key: "pts", label: "PTS", align: "right" },
          ]}
          rows={awayPlayerBox}
          initialSort="pts"
        />
      </section>

      <section className="mb-5">
        <h2 className="mb-2 text-xl font-bold">{game.home_abbrev} Player Box Score</h2>
        <StatsTable
          columns={[
            { key: "full_name", label: "Player" },
            { key: "position", label: "Pos" },
            { key: "minutes_played", label: "MP", align: "right" },
            { key: "fgm", label: "FG", align: "right" },
            { key: "fga", label: "FGA", align: "right" },
            { key: "fg3m", label: "3P", align: "right" },
            { key: "fg3a", label: "3PA", align: "right" },
            { key: "reb", label: "REB", align: "right" },
            { key: "ast", label: "AST", align: "right" },
            { key: "pts", label: "PTS", align: "right" },
          ]}
          rows={homePlayerBox}
          initialSort="pts"
        />
      </section>
    </main>
  );
}
```

**Note:** The game page needs game.home_team_id and game.away_team_id. Update getGameById query to include these.

---

### Task 2.3: Update getGameById Query

**Files:**
- Modify: `src/lib/queries.ts` (lines 366-378)

**Step 1: Update query to include team IDs**

Replace getGameById:

```typescript
export function getGameById(gameId: string) {
  return getDb()
    .prepare(
      `SELECT g.game_id, g.game_date, g.season_type, g.status,
              g.home_team_id, g.away_team_id, g.home_score, g.away_score,
              g.q1_home, g.q1_away, g.q2_home, g.q2_away,
              g.q3_home, g.q3_away, g.q4_home, g.q4_away,
              ht.abbreviation as home_abbrev, ht.full_name as home_name,
              at.abbreviation as away_abbrev, at.full_name as away_name
       FROM fact_game g
       JOIN dim_team ht ON ht.team_id = g.home_team_id
       JOIN dim_team at ON at.team_id = g.away_team_id
       WHERE g.game_id = ?`,
    )
    .get(gameId) as Record<string, string | number | null> | undefined;
}
```

---

## Phase 3: Team Page Enhancements

### Task 3.1: Add Team vs Opponent Stats Query

**Files:**
- Modify: `src/lib/queries.ts`

**Step 1: Add query function**

```typescript
export function getTeamVsOpponentStats(teamAbbrev: string) {
  return getDb()
    .prepare(
      `SELECT season_id,
              fg, fga, CASE WHEN fga > 0 THEN ROUND(1.0 * fg / fga, 3) END AS fg_pct,
              x3p, x3pa, CASE WHEN x3pa > 0 THEN ROUND(1.0 * x3p / x3pa, 3) END AS fg3_pct,
              ft, fta, CASE WHEN fta > 0 THEN ROUND(1.0 * ft / fta, 3) END AS ft_pct,
              reb, ast, stl, blk, tov, pts
       FROM fact_team_season
       WHERE bref_abbrev = ?
       ORDER BY season_id DESC
       LIMIT 1`,
    )
    .get(teamAbbrev) as Record<string, number | null> | undefined;
}
```

---

### Task 3.2: Add Team Roster with Stats Query

**Files:**
- Modify: `src/lib/queries.ts`

**Step 1: Add query function**

```typescript
export function getTeamRosterWithStats(teamId: string) {
  const latestRosterSeason = getDb()
    .prepare(
      `SELECT season_id
       FROM fact_roster
       WHERE team_id = ?
       ORDER BY season_id DESC
       LIMIT 1`,
    )
    .get(teamId) as { season_id: string } | undefined;
  const seasonId = latestRosterSeason?.season_id ?? getLatestSeasonId();

  return getDb()
    .prepare(
      `SELECT p.bref_id, p.full_name, p.position, p.height_cm, p.weight_kg, p.birth_date,
              pgl_stats.g, pgl_stats.pts_pg, pgl_stats.reb_pg, pgl_stats.ast_pg
       FROM fact_roster r
       JOIN dim_player p ON p.player_id = r.player_id
       LEFT JOIN (
         SELECT pgl.player_id,
                COUNT(*) AS g,
                ROUND(1.0 * SUM(pgl.pts) / COUNT(*), 1) AS pts_pg,
                ROUND(1.0 * SUM(pgl.reb) / COUNT(*), 1) AS reb_pg,
                ROUND(1.0 * SUM(pgl.ast) / COUNT(*), 1) AS ast_pg
         FROM player_game_log pgl
         JOIN fact_game fg ON fg.game_id = pgl.game_id
         WHERE fg.season_id = ? AND pgl.team_id = ?
         GROUP BY pgl.player_id
       ) pgl_stats ON pgl_stats.player_id = r.player_id
       WHERE r.team_id = ? AND r.season_id = ?
       ORDER BY pgl_stats.pts_pg DESC NULLS LAST`,
    )
    .all(seasonId, teamId, teamId, seasonId) as Array<Record<string, string | number | null>>;
}
```

---

### Task 3.3: Add Player Stats Tables to Team Page

**Files:**
- Modify: `src/app/teams/[abbrev]/page.tsx`

**Step 1: Add roster with stats to team page**

Update the roster section to use the new query with stats. Add new sections for team player stats tables.

---

## Phase 4: Season Page (New)

### Task 4.1: Create Season Queries

**Files:**
- Modify: `src/lib/queries.ts`

**Step 1: Add season queries**

```typescript
export function getSeasonById(seasonId: string) {
  return getDb()
    .prepare(
      `SELECT season_id, start_year, end_year, is_current
       FROM dim_season
       WHERE season_id = ?`,
    )
    .get(seasonId) as
    | {
        season_id: string;
        start_year: number;
        end_year: number;
        is_current: number;
      }
    | undefined;
}

export function getSeasonStandings(seasonId: string) {
  return getDb()
    .prepare(
      `SELECT dt.abbreviation, dt.full_name, dt.conference, dt.division,
              fts.w, fts.l, fts.n_rtg, fts.pace, fts.srs
       FROM fact_team_season fts
       JOIN dim_team dt ON dt.team_id = fts.team_id
       WHERE fts.season_id = ?
       ORDER BY fts.w DESC, fts.l ASC`,
    )
    .all(seasonId) as Array<Record<string, string | number | null>>;
}

export function getSeasonLeaders(seasonId: string, category: string, limit = 10) {
  const validCategories = ['pts', 'reb', 'ast', 'stl', 'blk'];
  if (!validCategories.includes(category)) {
    throw new Error(`Invalid category: ${category}`);
  }
  
  return getDb()
    .prepare(
      `SELECT dp.full_name, dt.abbreviation as team_abbrev,
              fpss.g, fpss.pts, fpss.reb, fpss.ast, fpss.stl, fpss.blk,
              CASE WHEN fpss.g > 0 THEN ROUND(1.0 * fpss.pts / fpss.g, 1) END AS pts_pg,
              CASE WHEN fpss.g > 0 THEN ROUND(1.0 * fpss.reb / fpss.g, 1) END AS reb_pg,
              CASE WHEN fpss.g > 0 THEN ROUND(1.0 * fpss.ast / fpss.g, 1) END AS ast_pg
       FROM fact_player_season_stats fpss
       JOIN dim_player dp ON dp.player_id = fpss.player_id
       JOIN dim_team dt ON dt.team_id = fpss.team_id
       WHERE fpss.season_id = ?
       ORDER BY fpss.${category} DESC
       LIMIT ?`,
    )
    .all(seasonId, limit) as Array<Record<string, string | number | null>>;
}

export function getSeasonAwards(seasonId: string) {
  return getDb()
    .prepare(
      `SELECT fpa.award_name, fpa.award_type, dp.full_name, dt.abbreviation as team_abbrev
       FROM fact_player_award fpa
       JOIN dim_player dp ON dp.player_id = fpa.player_id
       LEFT JOIN dim_team dt ON dt.team_id = fpa.team_id
       WHERE fpa.season_id = ?
       ORDER BY fpa.award_name ASC`,
    )
    .all(seasonId) as Array<Record<string, string | null>>;
}
```

---

### Task 4.2: Create Season Page Route

**Files:**
- Create: `src/app/seasons/[id]/page.tsx`

**Step 1: Create season page**

```tsx
import Link from "next/link";
import { StatsTable } from "@/components/stats-table";
import {
  getSeasonById,
  getSeasonStandings,
  getSeasonLeaders,
  getSeasonAwards,
} from "@/lib/queries";
import { notFound } from "next/navigation";

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const season = getSeasonById(id);
  if (!season) notFound();

  const standings = getSeasonStandings(id);
  const ptsLeaders = getSeasonLeaders(id, "pts", 10);
  const rebLeaders = getSeasonLeaders(id, "reb", 10);
  const astLeaders = getSeasonLeaders(id, "ast", 10);
  const awards = getSeasonAwards(id);

  const anchors = [
    { id: "standings", label: "Standings" },
    { id: "leaders", label: "League Leaders" },
    { id: "awards", label: "Awards" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-[#6b604b]">
        <Link href="/">Home</Link> / <Link href="/seasons">Seasons</Link> / {season.season_id}
      </div>

      <section className="mb-5 border border-[#b8ab8f] bg-[#f8f3e8] p-4">
        <h1 className="mb-2 text-3xl font-bold">{season.season_id} NBA Season</h1>
        <p className="text-sm text-[#3b3428]">
          {season.start_year}-{season.end_year} Season
          {season.is_current ? " (Current)" : ""}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-max border border-[#c9b998] bg-white p-3 lg:sticky lg:top-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6b604b]">On this page</div>
          <nav className="space-y-1 text-sm">
            {anchors.map((a) => (
              <a key={a.id} href={`#${a.id}`} className="block rounded px-2 py-1 hover:bg-[#f5efe2]">
                {a.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-8">
          <section id="standings">
            <h2 className="mb-2 text-xl font-bold">Standings</h2>
            <StatsTable
              columns={[
                { key: "abbreviation", label: "Team" },
                { key: "conference", label: "Conf" },
                { key: "w", label: "W", align: "right" },
                { key: "l", label: "L", align: "right" },
                { key: "n_rtg", label: "NetRtg", align: "right" },
                { key: "pace", label: "Pace", align: "right" },
                { key: "srs", label: "SRS", align: "right" },
              ]}
              rows={standings}
              initialSort="w"
            />
          </section>

          <section id="leaders">
            <h2 className="mb-2 text-xl font-bold">League Leaders - Points</h2>
            <StatsTable
              columns={[
                { key: "full_name", label: "Player" },
                { key: "team_abbrev", label: "Team" },
                { key: "g", label: "G", align: "right" },
                { key: "pts_pg", label: "PTS/G", align: "right" },
                { key: "pts", label: "Total PTS", align: "right" },
              ]}
              rows={ptsLeaders}
              initialSort="pts_pg"
            />

            <h2 className="mb-2 mt-6 text-xl font-bold">League Leaders - Rebounds</h2>
            <StatsTable
              columns={[
                { key: "full_name", label: "Player" },
                { key: "team_abbrev", label: "Team" },
                { key: "g", label: "G", align: "right" },
                { key: "reb_pg", label: "REB/G", align: "right" },
              ]}
              rows={rebLeaders}
              initialSort="reb_pg"
            />

            <h2 className="mb-2 mt-6 text-xl font-bold">League Leaders - Assists</h2>
            <StatsTable
              columns={[
                { key: "full_name", label: "Player" },
                { key: "team_abbrev", label: "Team" },
                { key: "g", label: "G", align: "right" },
                { key: "ast_pg", label: "AST/G", align: "right" },
              ]}
              rows={astLeaders}
              initialSort="ast_pg"
            />
          </section>

          <section id="awards">
            <h2 className="mb-2 text-xl font-bold">Awards</h2>
            <StatsTable
              columns={[
                { key: "award_name", label: "Award" },
                { key: "full_name", label: "Player" },
                { key: "team_abbrev", label: "Team" },
                { key: "award_type", label: "Type" },
              ]}
              rows={awards}
              initialSort="award_name"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
```

---

## File Change Summary

| Phase | File | Change Type | Lines Added | Description |
|-------|------|-------------|-------------|-------------|
| 1.1 | `src/lib/queries.ts` | Modify | ~25 | getPlayerPer36Stats |
| 1.1 | `src/app/players/[id]/page.tsx` | Modify | ~35 | Per 36 section + import + anchor |
| 1.2 | `src/lib/queries.ts` | Modify | ~20 | getPlayerPer100Stats |
| 1.2 | `src/app/players/[id]/page.tsx` | Modify | ~30 | Per 100 section + import + anchor |
| 1.3 | `src/lib/queries.ts` | Modify | ~15 | getPlayerAdjustedShooting |
| 1.3 | `src/app/players/[id]/page.tsx` | Modify | ~30 | Adjusted Shooting section |
| 1.4 | `src/lib/queries.ts` | Modify | ~25 | getPlayerFullGameLog |
| 1.4 | `src/app/players/[id]/page.tsx` | Modify | ~15 | Update game log section |
| 2.1 | `src/lib/queries.ts` | Modify | ~45 | getGamePlayerBox, getGameQuarterScores |
| 2.2 | `src/app/games/[id]/page.tsx` | Modify | ~150 | Complete rewrite with player box scores |
| 2.3 | `src/lib/queries.ts` | Modify | ~5 | Add team IDs to getGameById |
| 3.1 | `src/lib/queries.ts` | Modify | ~15 | getTeamVsOpponentStats |
| 3.2 | `src/lib/queries.ts` | Modify | ~30 | getTeamRosterWithStats |
| 4.1 | `src/lib/queries.ts` | Modify | ~60 | Season queries |
| 4.2 | `src/app/seasons/[id]/page.tsx` | Create | ~150 | New season page |

**Total:** ~650 lines of changes across 4 files, no new abstractions.

---

## Verification Checklist

After implementation, verify:

- [ ] `npx tsc --noEmit` - TypeScript compiles without errors
- [ ] Player page shows Per 36, Per 100, Adjusted Shooting sections
- [ ] Player page shows full game log (100 games)
- [ ] Game page shows quarter scores
- [ ] Game page shows player box scores for both teams
- [ ] Season page exists at `/seasons/[id]`
- [ ] All anchor links work correctly
- [ ] No runtime errors when navigating to pages
