import { describe, expect, it } from "vitest";
import {
  getLatestSeasonId,
} from "@/lib/db";
import { getHomeStandings, getRecentGames } from "@/lib/query/home";
import { searchEntities } from "@/lib/query/search";

describe("db utilities", () => {
  it("returns a latest season id", () => {
    const seasonId = getLatestSeasonId();
    expect(seasonId).toMatch(/^\d{4}-\d{2}$/);
  });

  it("returns standings rows", () => {
    const rows = getHomeStandings(5);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("bref_abbrev");
    expect(rows[0]).toHaveProperty("w");
    expect(rows[0]).toHaveProperty("l");
  });

  it("returns recent finished games", () => {
    const games = getRecentGames(5);
    expect(games.length).toBeGreaterThan(0);
    expect(games[0]).toHaveProperty("game_id");
    expect(games[0]).toHaveProperty("home_abbrev");
    expect(games[0]).toHaveProperty("away_abbrev");
  });

  it("search finds players and/or teams", () => {
    const results = searchEntities("laker");
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("type");
    expect(results[0]).toHaveProperty("id");
    expect(results[0]).toHaveProperty("label");
  });
});
