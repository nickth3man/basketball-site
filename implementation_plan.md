# Implementation Plan

[Overview]
Close the highest-value gaps that remain between `ANALYSIS.md` and the current app by implementing schema-supported features now and explicitly separating the still-blocked work that requires new data ingestion or new database tables.

The audit showed that many items listed as missing in `ANALYSIS.md` are already present in the codebase, including playoff, award, all-star, standings-by-date, team schedule, franchise history, player splits, sitemap, and robots coverage. The remaining work therefore needs to focus on two things: first, correcting the gap analysis so the project reflects the current state of the repository; second, implementing the highest-value missing functionality that is actually feasible with the existing SQLite schema.

The current database supports rich season, award, all-star, playoff, team, player, and game reads through `fact_game`, `fact_player_award`, `fact_all_nba`, `fact_all_nba_vote`, `fact_all_star`, and related season/player/team tables. However, several features proposed in `ANALYSIS.md` depend on tables that do not exist in the current payload, such as transactions, standings snapshots, playoff series modeling, dedicated all-star game tables, and generalized player split storage. The implementation approach therefore prioritizes improvements that can be built from existing data: improved award coverage, better season-page parity, and SEO metadata upgrades.

[Types]
Add only minimal type-system changes needed to support newly surfaced schema-backed views and metadata configuration.

Detailed type changes:

- `nba-reference/src/lib/queries/seasons.ts`
  - Extend season standings row shape returned by `getSeasonStandings()` to also include:
    - `full_name: string`
    - `conference: string | null`
    - `division: string | null`
  - Validation rules:
    - `conference` is expected to be `East`, `West`, or `null`
    - `division` may be null for incomplete historical rows
  - Relationship notes:
    - Data is derived by joining `fact_team_season` to `dim_team`

- `nba-reference/src/app/seasons/[year]/page.tsx`
  - Add a local interface for season standings rows with optional conference fields when splitting into East/West tables.

- `nba-reference/src/app/layout.tsx`
  - Expand metadata typing usage with `metadataBase`, `openGraph`, `twitter`, and canonical alternates, using the existing `Metadata` type from Next.js.

[Files]
Modify app routes, shared metadata, and season/award query consumers; add one new award route and one planning document.

Detailed breakdown:

- New files to be created
  - `implementation_plan.md`
    - Purpose: permanent implementation record of the audit results, feasible scope, and execution order.
  - `nba-reference/src/app/awards/all_defense/page.tsx`
    - Purpose: standalone All-Defensive history page backed by existing `getAllDefensiveHistory()` query.

- Existing files to be modified
  - `nba-reference/src/app/awards/page.tsx`
    - Add All-Defensive page to awards index.
  - `nba-reference/src/app/sitemap.ts`
    - Include `/awards/all_defense` in generated routes.
  - `nba-reference/src/app/layout.tsx`
    - Add richer SEO metadata: canonical base URL, OpenGraph, and Twitter card config.
  - `nba-reference/src/app/page.tsx`
    - Add homepage JSON-LD structured data and direct links to implemented discovery pages.
  - `nba-reference/src/lib/queries/seasons.ts`
    - Join `dim_team` in `getSeasonStandings()` so season pages can render conference-grouped standings.
  - `nba-reference/src/app/seasons/[year]/page.tsx`
    - Split standings into Eastern and Western Conference sections.
    - Add season awards summary using existing award queries.

- Files not to be modified now
  - Database payload under `db/`
    - Remains read-only; no schema migration is possible within the current app task.

- Configuration updates
  - No package additions are required.
  - Metadata configuration will continue to use `NEXT_PUBLIC_SITE_URL` if present.

[Functions]
Add one new route component and enhance a small set of existing data/metadata functions.

Detailed breakdown:

- New functions
  - `AllDefensePage(): React.JSX.Element`
    - File: `nba-reference/src/app/awards/all_defense/page.tsx`
    - Purpose: render historical All-Defensive first/second-team selections.

- Modified functions
  - `getSeasonStandings(seasonId: string)`
    - File: `nba-reference/src/lib/queries/seasons.ts`
    - Change: return team name and conference/division fields in addition to existing standings metrics.
  - `SeasonPage(...)`
    - File: `nba-reference/src/app/seasons/[year]/page.tsx`
    - Change: render standings by conference and add season awards summary/cards.
  - `sitemap()`
    - File: `nba-reference/src/app/sitemap.ts`
    - Change: register the new All-Defensive route.
  - `Home()`
    - File: `nba-reference/src/app/page.tsx`
    - Change: add structured data and quick-link surfacing for already implemented parity pages.

- Removed functions
  - None.

[Classes]
No class-based changes are required.

Detailed breakdown:

- New classes
  - None.

- Modified classes
  - None.

- Removed classes
  - None.

[Dependencies]
No dependency changes are required.

The work is fully supported by the existing Next.js, React, and better-sqlite3 stack. Structured data can be emitted with standard JSX `<script type="application/ld+json">` usage, and award/season improvements rely on existing internal query modules.

[Testing]
Validate the new award route, updated season-page rendering logic, and metadata-safe changes with targeted static checks and the existing CI toolchain where feasible.

Test requirements and validation strategy:

- Run type-check after modifying season query return shapes and page consumers.
- Run lint for metadata and JSX script changes.
- Prefer adding lightweight route-level tests only if failures emerge from current coverage gaps; otherwise rely on existing integration surface and static verification.
- Manually validate:
  - `/awards/all_defense`
  - `/awards`
  - `/seasons/[year]`
  - homepage metadata/JSON-LD output

[Implementation Order]
Implement the plan by first documenting the audit, then adding the missing schema-supported award page, then improving season parity and metadata so higher-value user-visible changes land before final validation.

1. Create `implementation_plan.md` capturing the audit findings and feasible scope.
2. Add `/awards/all_defense` and wire it into the awards index and sitemap.
3. Extend `getSeasonStandings()` with conference-aware team metadata.
4. Update the season detail page to render East/West standings and an awards summary section.
5. Upgrade root metadata and homepage structured data/quick links.
6. Run targeted validation (`type-check` and, if practical, lint/tests) and record the still-blocked gaps that require new schema/data ingestion.
