export interface AwardWinnerRow {
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
  team_name: string | null;
  votes_received: number | null;
  votes_possible: number | null;
  vote_percentage: number | null;
}

export interface AwardHistoryRow extends AwardWinnerRow {
  season_id: string;
  start_year: number;
  end_year: number;
}

export interface AllTeamSelectionRow {
  team_number: number;
  position: string;
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
  team_name: string | null;
}

export interface AllTeamHistoryRow {
  season_id: string;
  start_year: number;
  end_year: number;
  team_number: number;
  team_name: string;
  position: string;
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
}

export interface AwardWinnerWithTrophyRow extends AwardHistoryRow {
  trophy_name: string | null;
}

export interface AwardVotingRow {
  season_id: string;
  rank: number;
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
  team_name: string | null;
  votes_received: number | null;
  votes_possible: number | null;
  vote_percentage: number | null;
  first_place_votes: number | null;
  second_place_votes: number | null;
  third_place_votes: number | null;
  [key: string]: string | number | null;
}

export const AWARD_PLAYER_DEDUP = `
  (SELECT DISTINCT ps.season_id, ps.bref_player_id
   FROM fact_player_season_stats ps
   WHERE ps.team_abbrev NOT LIKE '%TM'
     AND (ps.lg = 'NBA' OR ps.lg IS NULL)) ps_dedup`;

export const AWARD_PLAYER_JOIN = `
  JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ps_dedup.season_id
  JOIN dim_season s ON s.season_id = pa.season_id
  JOIN dim_player p ON p.bref_id = pa.player_id
  LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
    AND t_ps.season_id = pa.season_id
    AND t_ps.team_abbrev NOT LIKE '%TM'
    AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
  LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev`;

export const AWARD_PLAYER_JOIN_SINGLE_SEASON = `
  JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ps_dedup.season_id
  JOIN dim_player p ON p.bref_id = pa.player_id
  LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
    AND t_ps.season_id = pa.season_id
    AND t_ps.team_abbrev NOT LIKE '%TM'
    AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
  LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev`;

export const AWARD_SELECT_COLUMNS = `
  pa.season_id,
  s.start_year,
  s.end_year,
  p.bref_id,
  p.full_name,
  t.bref_abbrev as team_abbrev,
  t.full_name as team_name,
  pa.votes_received,
  pa.votes_possible,
  CASE
    WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
    ELSE NULL
  END as vote_percentage`;

export const AWARD_VOTING_SELECT_COLUMNS = `
  pa.season_id,
  RANK() OVER (ORDER BY pa.votes_received DESC) as rank,
  p.bref_id,
  p.full_name,
  t.bref_abbrev as team_abbrev,
  t.full_name as team_name,
  pa.votes_received,
  pa.votes_possible,
  CASE
    WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
    ELSE NULL
  END as vote_percentage,
  pa.first_place_votes,
  pa.second_place_votes,
  pa.third_place_votes`;

export const AWARD_SINGLE_SELECT_COLUMNS = `
  p.bref_id,
  p.full_name,
  t.bref_abbrev as team_abbrev,
  t.full_name as team_name,
  pa.votes_received,
  pa.votes_possible,
  CASE
    WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
    ELSE NULL
  END as vote_percentage`;
