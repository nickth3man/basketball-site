import { describe, expect, it } from "vitest";
import {
  getGameById,
  getPlayerPer100Stats,
  getPlayerAdjustedShootingStats,
  getPlayerByBrefId,
  getPlayerGameHighs,
  getPlayerSeasonStats,
  getTeamByAbbrev,
  getTeamGameBox,
  getTeamRoster,
  getTeamSeasonStats,
} from "@/lib/queries";

describe("query helpers", () => {
  it("finds known teams", () => {
    const lakers = getTeamByAbbrev("LAL");
    expect(lakers).toBeTruthy();
    expect(lakers?.abbreviation).toBe("LAL");
  });

  it("returns team season stats when available", () => {
    const rows = getTeamSeasonStats("LAL");
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("season_id");
  });

  it("returns team roster rows", () => {
    const team = getTeamByAbbrev("NYK");
    expect(team).toBeTruthy();
    const roster = getTeamRoster(team!.team_id);
    expect(Array.isArray(roster)).toBe(true);
  });

  it("finds known player by bref id", () => {
    const player = getPlayerByBrefId("jamesle01");
    expect(player).toBeTruthy();
    expect(player?.full_name.toLowerCase()).toContain("james");
  });

  it("returns player season stats rows", () => {
    const stats = getPlayerSeasonStats("jamesle01", 3);
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
  });

  it("returns realistic per-100 values", () => {
    const rows = getPlayerPer100Stats("jamesle01", 1);
    expect(rows.length).toBeGreaterThan(0);
    const pts100 = Number(rows[0].pts_100);
    expect(Number.isNaN(pts100)).toBe(false);
    expect(pts100).toBeGreaterThan(5);
    expect(pts100).toBeLessThan(70);
  });

  it("returns adjusted shooting rows with plus metrics", () => {
    const rows = getPlayerAdjustedShootingStats("jamesle01", 1);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("efg_plus");
    expect(rows[0]).toHaveProperty("ts_plus");
  });

  it("returns player metadata including active status", () => {
    const player = getPlayerByBrefId("jamesle01") as Record<string, unknown> | undefined;
    expect(player).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(player ?? {}, "is_active")).toBe(true);
  });

  it("returns expanded game highs including minutes and shooting", () => {
    const player = getPlayerByBrefId("jamesle01");
    expect(player).toBeTruthy();
    const highs = getPlayerGameHighs(player!.player_id) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(highs, "mp")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(highs, "fga")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(highs, "plus_minus")).toBe(true);
  });

  it("returns game box for a known game", () => {
    const game = getGameById("0022300001") ?? getGameById("0022400001");
    expect(game).toBeTruthy();
    const box = getTeamGameBox(game!.game_id as string);
    expect(Array.isArray(box)).toBe(true);
    expect(box.length).toBeGreaterThan(0);
  });
});
