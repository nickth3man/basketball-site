#!/bin/bash

# =============================================================================
# NBA Reference Codebase Migration Script
# =============================================================================
#
# Purpose: Split monolithic queries.ts into domain modules
# Author: Phase 7 Generated Artifacts
# Date: March 2026
#
# Usage:
#   cd nba-reference
#   chmod +x ../scripts/migrate.sh
#   ../scripts/migrate.sh
#
# Prerequisites:
#   - Run from the nba-reference/ directory
#   - Ensure git working directory is clean (commit all changes first)
#   - Node.js and npm installed
#
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}NBA Reference Migration Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src/lib" ]; then
    echo -e "${RED}Error: Please run this script from the nba-reference/ directory${NC}"
    exit 1
fi

# Check if queries.ts exists
if [ ! -f "src/lib/queries.ts" ]; then
    echo -e "${YELLOW}Warning: src/lib/queries.ts not found. Migration may have already been run.${NC}"
    echo -e "${YELLOW}Proceeding with caution...${NC}"
fi

# =============================================================================
# STEP 1: Create Directory Structure
# =============================================================================
echo ""
echo -e "${GREEN}Step 1: Creating directory structure...${NC}"

mkdir -p src/lib/queries
mkdir -p src/app/api/search/__tests__
mkdir -p src/app/api/export/[type]/__tests__
mkdir -p scripts

echo "  ✓ Created src/lib/queries/"
echo "  ✓ Created src/app/api/search/__tests__/"
echo "  ✓ Created src/app/api/export/[type]/__tests__/"
echo "  ✓ Created scripts/"

# =============================================================================
# STEP 2: Create Domain Module Files (Placeholder)
# =============================================================================
echo ""
echo -e "${GREEN}Step 2: Creating domain module files...${NC}"

# Note: This creates placeholder files. The actual function extraction
# should be done manually or with a more sophisticated script.

# Create players.ts placeholder
cat > src/lib/queries/players.ts << 'EOF'
/**
 * Player Domain Query Functions
 *
 * Extracted from src/lib/queries.ts during Phase 7 reorganization.
 * Contains all player-related database queries.
 *
 * @module lib/queries/players
 */

import { getDb, getLatestSeasonId } from "@/lib/db";

// Re-export types for consumers
export type PlayerRecord = {
  player_id: string;
  bref_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  birth_date: string | null;
  birth_city: string | null;
  birth_country: string | null;
  college: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  is_active: number;
  hof: number;
};

// TODO: Move player-related functions from queries.ts to this file
// Functions to migrate:
// - getPlayerByBrefId()
// - getPlayerSeasonStats()
// - getPlayerPer36Stats()
// - getPlayerPer100Stats()
// - getPlayerPerGameStats()
// - getPlayerAdvancedSeasonStats()
// - getPlayerShootingSeasonStats()
// - getPlayerCareerTotals()
// - getPlayerGameLog()
// - etc.

EOF
echo "  ✓ Created src/lib/queries/players.ts"

# Create teams.ts placeholder
cat > src/lib/queries/teams.ts << 'EOF'
/**
 * Team Domain Query Functions
 *
 * Extracted from src/lib/queries.ts during Phase 7 reorganization.
 * Contains all team-related database queries.
 *
 * @module lib/queries/teams
 */

import { getDb, getLatestSeasonId } from "@/lib/db";

// TODO: Move team-related functions from queries.ts to this file
// Functions to migrate:
// - getTeamByAbbrev()
// - getTeamRoster()
// - getTeamSeasonStats()
// - getTeamGameLog()
// - getTeamStandings()
// - etc.

EOF
echo "  ✓ Created src/lib/queries/teams.ts"

# Create games.ts placeholder
cat > src/lib/queries/games.ts << 'EOF'
/**
 * Game Domain Query Functions
 *
 * Extracted from src/lib/queries.ts during Phase 7 reorganization.
 * Contains all game-related database queries.
 *
 * @module lib/queries/games
 */

import { getDb, getLatestSeasonId } from "@/lib/db";

// TODO: Move game-related functions from queries.ts to this file
// Functions to migrate:
// - getGameById()
// - getGamesByDate()
// - getGamesByTeam()
// - getBoxScore()
// - etc.

EOF
echo "  ✓ Created src/lib/queries/games.ts"

# Create seasons.ts placeholder
cat > src/lib/queries/seasons.ts << 'EOF'
/**
 * Season Domain Query Functions
 *
 * Extracted from src/lib/queries.ts during Phase 7 reorganization.
 * Contains all season-related database queries.
 *
 * @module lib/queries/seasons
 */

import { getDb, getLatestSeasonId } from "@/lib/db";

// TODO: Move season-related functions from queries.ts to this file
// Functions to migrate:
// - getSeasonLeaders()
// - getSeasonStandings()
// - getSeasonTeamStats()
// - getSeasonPlayerStats()
// - etc.

EOF
echo "  ✓ Created src/lib/queries/seasons.ts"

# =============================================================================
# STEP 3: Create Index File for Backward Compatibility
# =============================================================================
echo ""
echo -e "${GREEN}Step 3: Creating index.ts for backward compatibility...${NC}"

cat > src/lib/queries/index.ts << 'EOF'
/**
 * Query Module Index
 *
 * Re-exports all domain query modules for backward compatibility.
 * This allows existing imports from "@/lib/queries" to continue working.
 *
 * @example
 * // Old import (still works):
 * import { getPlayerByBrefId } from "@/lib/queries";
 *
 * // New import (preferred after migration):
 * import { getPlayerByBrefId } from "@/lib/queries/players";
 */

// Re-export from existing queries.ts temporarily
// TODO: After migration, change these to re-export from domain modules
export * from "../queries";

// Future structure (uncomment after migration):
// export * from "./players";
// export * from "./teams";
// export * from "./games";
// export * from "./seasons";

// Re-export feature queries
export { getHomeStandings, getRecentGames } from "../query/home";
export { searchEntities } from "../query/search";
export { getPlayerDirectory, getTeamDirectory } from "../query/directory";

EOF
echo "  ✓ Created src/lib/queries/index.ts"

# =============================================================================
# STEP 4: Create API Test Placeholders
# =============================================================================
echo ""
echo -e "${GREEN}Step 4: Creating API test placeholders...${NC}"

cat > src/app/api/search/__tests__/route.test.ts << 'EOF'
/**
 * Search API Route Tests
 *
 * Integration tests for /api/search endpoint
 */

import { describe, it, expect, vi } from "vitest";
// TODO: Add proper imports and tests

describe("GET /api/search", () => {
  it.todo("returns 400 for missing query parameter");
  it.todo("returns 400 for query shorter than 2 characters");
  it.todo("returns search results for valid query");
  it.todo("returns empty array for no matches");
});
EOF
echo "  ✓ Created src/app/api/search/__tests__/route.test.ts"

cat > src/app/api/export/[type]/__tests__/route.test.ts << 'EOF'
/**
 * Export API Route Tests
 *
 * Integration tests for /api/export/[type] endpoint
 */

import { describe, it, expect, vi } from "vitest";
// TODO: Add proper imports and tests

describe("GET /api/export/[type]", () => {
  it.todo("returns 400 for invalid export type");
  it.todo("returns JSON data for valid type");
  it.todo("handles large datasets efficiently");
});
EOF
echo "  ✓ Created src/app/api/export/[type]/__tests__/route.test.ts"

# =============================================================================
# STEP 5: Update .gitignore (show changes needed)
# =============================================================================
echo ""
echo -e "${GREEN}Step 5: .gitignore updates (manual step)...${NC}"
echo ""
echo "  Add the following patterns to .gitignore if not present:"
echo ""
echo "    # SQLite WAL files"
echo "    *.db-shm"
echo "    *.db-wal"
echo ""

# Check for committed artifacts that should be removed
if [ -d ".next" ]; then
    echo -e "${YELLOW}  Warning: .next/ directory exists (should be in .gitignore)${NC}"
    echo "    Run: git rm -r --cached .next/"
fi

if ls *.db-shm 1> /dev/null 2>&1; then
    echo -e "${YELLOW}  Warning: *.db-shm files found${NC}"
    echo "    Run: git rm --cached *.db-shm"
fi

if ls *.db-wal 1> /dev/null 2>&1; then
    echo -e "${YELLOW}  Warning: *.db-wal files found${NC}"
    echo "    Run: git rm --cached *.db-wal"
fi

# =============================================================================
# STEP 6: Run Tests to Verify
# =============================================================================
echo ""
echo -e "${GREEN}Step 6: Running tests to verify setup...${NC}"

npm test 2>/dev/null || {
    echo -e "${YELLOW}  Tests may need attention. Run 'npm test' manually to review.${NC}"
}

# =============================================================================
# COMPLETE
# =============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Migration structure created successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Review the created files in src/lib/queries/"
echo "  2. Move functions from queries.ts to appropriate domain modules"
echo "  3. Update src/lib/queries/index.ts to export from domain modules"
echo "  4. Run tests: npm test"
echo "  5. Delete src/lib/queries.ts after verifying all imports work"
echo "  6. Commit changes: git add . && git commit -m 'feat: split queries.ts into domain modules'"
echo ""
echo "See ARCHITECTURE.md for detailed documentation."
echo ""
