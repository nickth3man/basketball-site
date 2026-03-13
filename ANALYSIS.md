# Basketball-Reference.com Comprehensive Tear-Down Analysis

## Executive Summary

This document provides a detailed analysis of basketball-reference.com's structure, features, and data organization, followed by a gap analysis comparing it to our current nba-reference project. The goal is to identify all missing features and create a prioritized implementation roadmap.

---

## 1. Basketball-Reference.com Site Architecture

### 1.1 Technology Stack
- **Frontend**: Static HTML generation with dynamic content loading
- **CDN**: Content delivery via cdn.ssref.net
- **Data Source**: SportRadar (official NBA stats partner)
- **Rate Limiting**: 20 requests/minute (10 for FBref/Stathead)
- **No Public API**: Contractual restrictions prevent API access

### 1.2 URL Structure Patterns

#### Player Pages
- **Base**: `/players/{first-letter}/{player-id}.html`
- **Example**: `/players/j/jamesle01.html`
- **Format**: `{lastname}{firstname}{number}` (e.g., `jamesle01`)

**Sub-pages**:
- Game Logs: `/players/{letter}/{id}/gamelog/{year}/`
- Advanced Game Logs: `/players/{letter}/{id}/gamelog-advanced/{year}/`
- Splits: `/players/{letter}/{id}/splits/`
- Shooting: `/players/{letter}/{id}/shooting/`
- Lineups: `/players/{letter}/{id}/lineups/`
- On-Off: `/players/{letter}/{id}/on-off/`

#### Team Pages
- **Base**: `/teams/{team-abbreviation}/{season}.html`
- **Example**: `/teams/LAL/2026.html`
- **Abbreviations**: LAL, BOS, GSW, etc.

**Sub-pages**:
- Roster: `/teams/{abbr}/{season}.html` (main page)
- Game Log: `/teams/{abbr}/{season}/gamelog/`
- Schedule: `/teams/{abbr}/{season}_games.html`
- Transactions: `/teams/{abbr}/{season}_transactions.html`

#### Season/League Pages
- **Pattern**: `/leagues/NBA_{season}_{type}.html`
- **Types**:
  - Standings: `NBA_2025_standings.html`
  - Totals: `NBA_2025_totals.html`
  - Per Game: `NBA_2025_per_game.html`
  - Advanced: `NBA_2025_advanced.html`
  - Schedule: `NBA_2024_games.html`

#### Box Scores
- **Pattern**: `/boxscores/{date}.html` or `/boxscores/{game-id}.html`
- **Features**: Daily summaries, date picker, quarter scoring

#### Playoffs
- **Pattern**: `/playoffs/NBA_{season}.html`
- **Features**: Series results, game logs, brackets

#### Draft
- **Pattern**: `/draft/NBA_{year}.html`
- **Features**: Pick-by-pick breakdown, historical drafts

#### Awards
- **Pattern**: `/awards/{award-name}.html`
- **Examples**: `/awards/mvp.html`, `/awards/all_league.html`

---

## 2. Core Features Analysis

### 2.1 Player Pages (jamesle01.html example)

**Bio Section**:
- Photo from BRef CDN
- Full name, position(s), shooting hand
- Height, weight
- Birth date, birthplace
- College
- Draft info (year, round, pick, team)
- NBA debut date
- Experience (years)
- Relatives (e.g., Bronny James)
- Nicknames
- Awards badges (22x All-Star, 4x MVP, etc.)
- Uniform numbers worn

**Stat Tables** (14+ sections):
1. **Career Summary Card**: G, PTS/G, REB/G, AST/G, FG%, 3P%, FT%, eFG%, PER, WS
2. **Per Game**: Season-by-season per-game stats
3. **Totals**: Season-by-season total stats
4. **Per 36 Minutes**: Normalized per-36-minutes stats
5. **Per 100 Possessions**: Pace-adjusted stats
6. **Advanced**: PER, TS%, USG%, WS, VORP, BPM, etc.
7. **Adjusted Shooting**: eFG+, TS+ (league-relative)
8. **Play-by-Play**: Position estimates, foul types
9. **Shooting**: Distance zones, assisted %, dunks, corner 3s
10. **Game Highs**: Career single-game highs
11. **Awards History**: All awards with seasons
12. **Salaries**: Year-by-year salary history
13. **Transactions**: Trades, signings
14. **Full Game Log**: Every game with Game Score

**Sub-page Features**:
- Splits: Home/Away, Monthly, By Opponent, By Division
- Shooting Charts: Visual shot charts
- On-Off: Stats when player on court vs off
- Lineups: Most/Least effective lineups
- Game Finder: Searchable game history

### 2.2 Team Pages (LAL/2026.html example)

**Header**:
- Team logo
- Record (W-L)
- Conference/Division rank
- Last/Next game
- Coach
- Executive
- Points per game (rank)
- SRS, Pace, Off Rtg, Def Rtg, Net Rtg
- Expected W-L
- Arena, Attendance

**Navigation Menu**:
- Franchise Index
- Roster & Stats
- Schedule & Results
- Transactions
- Game Log
- Splits
- Contracts
- Lineups
- On/Off
- Starting Lineups
- Depth Charts
- Referees

**Stat Sections**:
1. Recent Game Results (visual bar chart)
2. Roster table
3. Assistant Coaches and Staff
4. Team and Opponent Stats
5. Team Misc
6. Per Game stats
7. Per 36 Minutes
8. Per 100 Possessions
9. Advanced
10. Adjusted Shooting
11. Shooting
12. Play-by-Play
13. Players on Leaderboards
14. Salaries
15. Draft Rights

### 2.3 Season Pages (NBA_2026.html example)

**Header**:
- Season logo
- PPG Leader
- RPG Leader
- APG Leader
- WS Leader

**Navigation Menu**:
- Season Summary
- Standings
- Schedule and Results
- Leaders
- Coaches
- Player Stats (Per Game, Totals, Per 36, Per 100, Adjusted Shooting, Advanced, Play-by-Play, Shooting)
- Other (Rookies, Team Ratings, Uniform Numbers, Transactions, Standings by Date, Projected Draft Order, Preseason Odds)

**Sections**:
1. Conference Standings (East/West)
2. Division Standings
3. Per Game Stats (all teams)
4. Total Stats
5. Per 100 Poss Stats
6. Advanced Stats
7. Shooting Stats
8. League Awards
9. Players of the Week & Month
10. League Leaders

### 2.4 Box Scores

**Daily View**:
- Date picker (calendar navigation)
- Games list with scores
- Quarter-by-quarter scoring
- Top performers (PTS, TRB, AST)

**Game Detail**:
- Line score by period
- Team box score totals
- Four Factors comparison
- Player box scores (home/away)
- Advanced player box scores
- Play-by-play event stream
- Shot charts

### 2.5 Standings

**Features**:
- Conference standings (East/West)
- Division standings
- Historical standings on any date
- Columns: W, L, W/L%, GB, PS/G, PA/G, SRS
- Playoff team indicators
- Sortable columns

### 2.6 Playoffs

**Features**:
- Series-by-series results
- Game logs for each series
- Playoff brackets visualization
- Playoff leaders (PTS, TRB, AST, WS)
- Historical playoff data
- Conference Finals MVPs
- Finals MVP

### 2.7 Draft

**Features**:
- Year-by-year draft results
- Pick-by-pick breakdown
- Player career stats summary
- College links
- Team draft history

### 2.8 Awards

**Award Types**:
- MVP (Michael Jordan Trophy)
- Rookie of the Year (Wilt Chamberlain Trophy)
- Defensive Player of the Year (Hakeem Olajuwon Trophy)
- Sixth Man (John Havlicek Trophy)
- Most Improved (George Mikan Trophy)
- Finals MVP (Bill Russell Trophy)
- Conference Finals MVPs (Larry Bird, Magic Johnson Trophies)
- All-NBA Teams
- All-Defensive Teams
- All-Rookie Teams
- Player/Coach of the Month/Week
- Hall of Fame

**Features**:
- Voting results with vote counts
- Historical winners table
- Winner stats for that season

### 2.9 Leaders

**Leaderboard Types**:
- Single Season
- Career
- Active
- Progressive
- Year-by-Year
- Year-by-Year Top 10
- Single Game

**Stat Categories**:
- Points (PTS)
- Rebounds (TRB)
- Assists (AST)
- Steals (STL)
- Blocks (BLK)
- Minutes Played (MP)
- Field Goals (FG)
- 3-Pointers (3P)
- Free Throws (FT)

---

## 3. Navigation & UX Patterns

### 3.1 Main Navigation
- Players (alphabetical index, active greats, all-time greats)
- Teams (by division)
- Seasons (year-by-year)
- Leaders (season/career)
- Scores (daily results)
- WNBA (complete coverage)
- Draft
- Stathead (premium tools)

### 3.2 Breadcrumb Navigation
- Clear hierarchy: Home > Category > Subcategory > Page
- Example: BBR Home > Players > J > LeBron James

### 3.3 In-Page Navigation
- Keyboard shortcuts (\ for sidebar, / for search)
- Jump links to page sections
- Sticky navigation bars

### 3.4 Table Features
- Sortable columns (click header)
- CSV export
- Pagination for long lists
- Responsive design

---

## 4. Data Export & API

### 4.1 CSV Export
- Available on most stat tables
- "Share & Export" options
- Format: `&format=csv` parameter

### 4.2 No Public API
- Data comes from third-party providers
- Contractual restrictions prevent API access
- Scraping is rate-limited (20 req/min)

---

## 5. Gap Analysis: Current vs Basketball-Reference.com

### 5.1 Pages We Have ✅
- ✅ Homepage with standings and recent games
- ✅ Players directory (A-Z filtering)
- ✅ Player detail page (14+ stat sections)
- ✅ Teams directory
- ✅ Team detail page (current season)
- ✅ Team historical season pages
- ✅ Games/Box Scores list
- ✅ Game detail (box score, PBP)
- ✅ Box Scores by date
- ✅ Seasons directory
- ✅ Season detail (standings, leaders)
- ✅ Leaders page (season per-game + all-time)
- ✅ Draft years index
- ✅ Draft detail by year

### 5.2 Critical Missing Pages ❌

#### High Priority (Core BBR Experience)
1. ❌ **Playoffs Pages**
   - Playoff brackets
   - Series pages
   - Playoff leaders
   - Conference Finals/Finals pages

2. ❌ **Awards Standalone Pages**
   - MVP history page
   - All-NBA teams page
   - DPOY, ROY, All-Defensive pages
   - Voting results

3. ❌ **All-Star Game Pages**
   - All-Star game history
   - Box scores by year
   - MVP winners

4. ❌ **Standings by Date**
   - Historical standings on any date
   - Date picker interface

#### Medium Priority (Enhanced Experience)
5. ❌ **Player Sub-Pages**
   - Splits (home/away, monthly, vs opponent)
   - Shooting charts/visualizations
   - Transactions history
   - College stats
   - Injury history
   - Contract details

6. ❌ **Team Sub-Pages**
   - Full season schedule
   - Opponent stats detail
   - Coaching history
   - Arena history
   - Attendance trends
   - Franchise history

7. ❌ **Schedule Pages**
   - League-wide schedule
   - Team schedules
   - Month-by-month views

#### Lower Priority (Advanced Features)
8. ❌ **Comparison Tools**
   - Player comparison
   - Team comparison

9. ❌ **Search/Filter Tools**
   - Player/Season finder
   - Advanced search filters

10. ❌ **Frivolities**
    - Birthdays
    - Colleges
    - Milestones
    - Players on multiple teams

### 5.3 Missing Features on Existing Pages

#### Player Page Gaps
- ❌ Splits section (home/away, monthly, etc.)
- ❌ Shooting shot charts
- ❌ Transactions history
- ❌ College statistics
- ❌ Injury history
- ❌ Contract details
- ❌ On-Off stats
- ❌ Lineup data
- ❌ Game Finder tool

#### Team Page Gaps
- ❌ Full season schedule
- ❌ Coaching staff details
- ❌ Franchise history
- ❌ Historical arena info
- ❌ Attendance data
- ❌ Depth charts
- ❌ Referee info

#### Season Page Gaps
- ❌ Playoff brackets
- ❌ Conference standings (currently shows all teams)
- ❌ MVP voting results
- ❌ Statistical leaders by all categories (only PTS/REB/AST)
- ❌ Team opponent stats

#### Game Page Gaps
- ❌ Shot charts
- ❌ Four Factors visualization
- ❌ Player on-court/off-court

### 5.4 Technical Gaps

- ❌ No sitemap.xml
- ❌ No robots.txt
- ❌ No OpenGraph meta tags
- ❌ No structured data (JSON-LD)
- ❌ Limited search (no filters)
- ❌ No player/team comparison
- ❌ No CSV export on all tables

---

## 6. Implementation Roadmap

### Phase 1: Core Missing Pages (High Priority)
**Goal**: Achieve parity with essential BBR pages

1. **Playoffs System**
   - Create `/playoffs/[season]/page.tsx`
   - Create playoff bracket component
   - Create series detail pages
   - Add playoff leaders queries

2. **Awards Pages**
   - Create `/awards/page.tsx` (awards index)
   - Create `/awards/mvp/page.tsx`
   - Create `/awards/roy/page.tsx`
   - Create `/awards/dpoy/page.tsx`
   - Create `/awards/all_league/page.tsx`
   - Create `/awards/all_defense/page.tsx`

3. **All-Star Pages**
   - Create `/allstar/page.tsx`
   - Create `/allstar/[year]/page.tsx`

4. **Standings by Date**
   - Create `/standings/page.tsx` with date picker
   - Add historical standings queries

### Phase 2: Player Enhancement (Medium Priority)
**Goal**: Complete player page feature set

1. **Player Splits**
   - Create `/players/[letter]/[id]/splits/page.tsx`
   - Add splits queries (home/away, monthly, vs opponent)

2. **Player Transactions**
   - Add transactions section to player page
   - Create transactions queries

3. **Player Shooting Charts**
   - Add shot chart visualization
   - Create shooting zone queries

4. **Player vs Opponent**
   - Create `/players/[letter]/[id]/vs/[team]/page.tsx`
   - Add vs opponent queries

### Phase 3: Team Enhancement (Medium Priority)
**Goal**: Complete team page feature set

1. **Team Schedule**
   - Create `/teams/[abbrev]/[season]/schedule/page.tsx`
   - Add schedule queries

2. **Team Franchise History**
   - Create `/teams/[abbrev]/franchise/page.tsx`
   - Add franchise history queries

3. **Team Coaching History**
   - Add coaching section to team page
   - Create coaching queries

### Phase 4: Advanced Features (Lower Priority)
**Goal**: Match advanced BBR features

1. **Comparison Tools**
   - Create `/compare/players/page.tsx`
   - Create `/compare/teams/page.tsx`

2. **Enhanced Search**
   - Add filters to search
   - Create Player/Season finder

3. **Frivolities**
   - Create `/friv/birthdays/page.tsx`
   - Create `/friv/colleges/page.tsx`
   - Create `/friv/milestones/page.tsx`

4. **SEO Improvements**
   - Add sitemap.xml
   - Add robots.txt
   - Add OpenGraph tags
   - Add JSON-LD structured data

---

## 7. Database Schema Additions Needed

### New Tables Required

```sql
-- Playoffs
CREATE TABLE fact_playoff_series (
    series_id TEXT PRIMARY KEY,
    season_id INTEGER,
    round TEXT, -- 'First Round', 'Conference Semifinals', etc.
    conference TEXT, -- 'East', 'West', NULL for Finals
    team1_id TEXT,
    team2_id TEXT,
    team1_wins INTEGER,
    team2_wins INTEGER,
    winner_id TEXT,
    FOREIGN KEY (season_id) REFERENCES dim_season(season_id)
);

CREATE TABLE fact_playoff_game (
    game_id TEXT PRIMARY KEY,
    series_id TEXT,
    game_number INTEGER,
    is_home_team1 BOOLEAN,
    team1_score INTEGER,
    team2_score INTEGER,
    FOREIGN KEY (game_id) REFERENCES fact_game(game_id),
    FOREIGN KEY (series_id) REFERENCES fact_playoff_series(series_id)
);

-- Awards
CREATE TABLE dim_award (
    award_id TEXT PRIMARY KEY,
    award_name TEXT,
    award_type TEXT, -- 'Season', 'Playoffs', 'All-Star'
    description TEXT
);

CREATE TABLE fact_player_award_detail (
    player_id TEXT,
    season_id INTEGER,
    award_id TEXT,
    votes INTEGER,
    vote_share REAL,
    rank INTEGER,
    PRIMARY KEY (player_id, season_id, award_id),
    FOREIGN KEY (player_id) REFERENCES dim_player(player_id),
    FOREIGN KEY (season_id) REFERENCES dim_season(season_id),
    FOREIGN KEY (award_id) REFERENCES dim_award(award_id)
);

CREATE TABLE fact_all_nba_team (
    season_id INTEGER,
    team_type TEXT, -- 'First', 'Second', 'Third', 'Rookie', 'Defense'
    player_id TEXT,
    position TEXT,
    PRIMARY KEY (season_id, team_type, position),
    FOREIGN KEY (season_id) REFERENCES dim_season(season_id),
    FOREIGN KEY (player_id) REFERENCES dim_player(player_id)
);

-- All-Star Games
CREATE TABLE fact_allstar_game (
    game_id TEXT PRIMARY KEY,
    season_id INTEGER,
    game_date DATE,
    venue TEXT,
    east_score INTEGER,
    west_score INTEGER,
    mvp_player_id TEXT,
    FOREIGN KEY (season_id) REFERENCES dim_season(season_id),
    FOREIGN KEY (mvp_player_id) REFERENCES dim_player(player_id)
);

CREATE TABLE fact_allstar_roster (
    game_id TEXT,
    player_id TEXT,
    conference TEXT, -- 'East', 'West'
    is_starter BOOLEAN,
    minutes INTEGER,
    points INTEGER,
    rebounds INTEGER,
    assists INTEGER,
    PRIMARY KEY (game_id, player_id),
    FOREIGN KEY (game_id) REFERENCES fact_allstar_game(game_id),
    FOREIGN KEY (player_id) REFERENCES dim_player(player_id)
);

-- Player Splits
CREATE TABLE fact_player_split (
    player_id TEXT,
    season_id INTEGER,
    split_type TEXT, -- 'home_away', 'month', 'opponent', 'division'
    split_value TEXT, -- 'Home', 'Away', 'Jan', 'LAL', etc.
    g INTEGER,
    mp INTEGER,
    pts INTEGER,
    reb INTEGER,
    ast INTEGER,
    -- ... other stats
    PRIMARY KEY (player_id, season_id, split_type, split_value),
    FOREIGN KEY (player_id) REFERENCES dim_player(player_id),
    FOREIGN KEY (season_id) REFERENCES dim_season(season_id)
);

-- Transactions
CREATE TABLE fact_transaction (
    transaction_id TEXT PRIMARY KEY,
    transaction_date DATE,
    player_id TEXT,
    transaction_type TEXT, -- 'Trade', 'Signing', 'Release', etc.
    from_team_id TEXT,
    to_team_id TEXT,
    description TEXT,
    FOREIGN KEY (player_id) REFERENCES dim_player(player_id),
    FOREIGN KEY (from_team_id) REFERENCES dim_team(team_id),
    FOREIGN KEY (to_team_id) REFERENCES dim_team(team_id)
);

-- Team Schedule (if not already in game table)
-- Can use fact_game but need to ensure all scheduled games are present

-- Standings by Date
CREATE TABLE fact_standings_snapshot (
    snapshot_date DATE,
    team_id TEXT,
    season_id INTEGER,
    wins INTEGER,
    losses INTEGER,
    PRIMARY KEY (snapshot_date, team_id),
    FOREIGN KEY (team_id) REFERENCES dim_team(team_id),
    FOREIGN KEY (season_id) REFERENCES dim_season(season_id)
);
```

---

## 8. Summary

### Current State
Our nba-reference project has solid foundational features:
- ✅ Complete player pages with 14+ stat sections
- ✅ Team pages with roster and stats
- ✅ Game/Box Score pages
- ✅ Season pages with standings
- ✅ Leaders pages
- ✅ Draft pages
- ✅ Search functionality
- ✅ CSV export

### Critical Gaps
The most important missing features for BBR parity are:
1. **Playoffs system** - Brackets, series pages, playoff leaders
2. **Awards pages** - MVP, All-NBA, DPOY standalone pages with voting
3. **All-Star pages** - Game history and box scores
4. **Standings by date** - Historical standings lookup
5. **Player splits** - Home/away, monthly, vs opponent breakdowns

### Recommended Priority
1. **Phase 1** (Immediate): Playoffs, Awards, All-Star pages
2. **Phase 2** (Short-term): Player splits, team schedules
3. **Phase 3** (Medium-term): Franchise history, coaching, transactions
4. **Phase 4** (Long-term): Comparison tools, frivolities, advanced search

---

*Document Version: 1.0*
*Generated: 2026-03-04*
