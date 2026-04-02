-- Migration: Add referee tables
-- Created: 2026-04-01
-- Description: Adds dim_referee and fact_game_referee tables for per-game referee tracking.
--
-- Run this migration against the nba_raw_data.db to enable referee pages:
--   sqlite3 db/nba_raw_data.db < db/migrations/001_add_referee_tables.sql

-- dim_referee: referee metadata
CREATE TABLE IF NOT EXISTS dim_referee (
  referee_id      INTEGER PRIMARY KEY,
  first_name      TEXT    NOT NULL,
  last_name       TEXT    NOT NULL,
  full_name       TEXT    NOT NULL,
  career_start_year INTEGER,
  active          INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1))
);

-- fact_game_referee: links referees to the games they officiated
CREATE TABLE IF NOT EXISTS fact_game_referee (
  game_id     TEXT    NOT NULL,
  referee_id  INTEGER NOT NULL,
  role        TEXT    NOT NULL CHECK(role IN ('crew_chief', 'referee', 'alternate')),
  PRIMARY KEY (game_id, referee_id),
  FOREIGN KEY (referee_id) REFERENCES dim_referee(referee_id)
);

CREATE INDEX IF NOT EXISTS idx_fact_game_referee_game     ON fact_game_referee(game_id);
CREATE INDEX IF NOT EXISTS idx_fact_game_referee_referee  ON fact_game_referee(referee_id);

-- ----------------------------------------------------------------
-- Seed data: sample NBA referees
-- ----------------------------------------------------------------
INSERT OR IGNORE INTO dim_referee (referee_id, first_name, last_name, full_name, career_start_year, active) VALUES
(1,  'Tony',       'Brothers',             'Tony Brothers',             1994, 1),
(2,  'Scott',      'Foster',               'Scott Foster',              1994, 1),
(3,  'Ed',         'Malloy',               'Ed Malloy',                 2003, 1),
(4,  'Marc',       'Davis',                'Marc Davis',                2000, 1),
(5,  'Jason',      'Phillips',             'Jason Phillips',            2001, 1),
(6,  'Derrick',    'Stafford',             'Derrick Stafford',          1999, 1),
(7,  'Ken',        'Mauer',                'Ken Mauer',                 1986, 0),
(8,  'Dan',        'Crawford',             'Dan Crawford',              1990, 0),
(9,  'Joey',       'Crawford',             'Joey Crawford',             1977, 0),
(10, 'Dick',       'Bavetta',              'Dick Bavetta',              1975, 0),
(11, 'Courtney',   'Kirkland',             'Courtney Kirkland',         2004, 1),
(12, 'Zach',       'Zarba',                'Zach Zarba',                2008, 1),
(13, 'Lauren',     'Holtkamp-Sterling',    'Lauren Holtkamp-Sterling',  2014, 1),
(14, 'Seun',       'Shobe',                'Seun Shobe',                2014, 1),
(15, 'Phenizee',   'Ransom',               'Phenizee Ransom',           2010, 1);

-- ----------------------------------------------------------------
-- Seed data: sample game-referee assignments
-- (game IDs correspond to fact_game rows in nba_raw_data.db)
-- ----------------------------------------------------------------
INSERT OR IGNORE INTO fact_game_referee (game_id, referee_id, role) VALUES
('0022500808', 1,  'crew_chief'),
('0022500808', 2,  'referee'),
('0022500808', 3,  'referee'),
('0022500804', 4,  'crew_chief'),
('0022500804', 5,  'referee'),
('0022500804', 6,  'referee'),
('0022500805', 11, 'crew_chief'),
('0022500805', 12, 'referee'),
('0022500805', 13, 'referee'),
('0022500803', 1,  'crew_chief'),
('0022500803', 14, 'referee'),
('0022500803', 15, 'referee'),
('0022500802', 2,  'crew_chief'),
('0022500802', 3,  'referee'),
('0022500802', 4,  'referee'),
('0022500806', 5,  'crew_chief'),
('0022500806', 6,  'referee'),
('0022500806', 11, 'referee'),
('0022500807', 12, 'crew_chief'),
('0022500807', 13, 'referee'),
('0022500807', 14, 'referee'),
('0022500810', 1,  'crew_chief'),
('0022500810', 15, 'referee'),
('0022500810', 2,  'referee'),
('0022500793', 3,  'crew_chief'),
('0022500793', 4,  'referee'),
('0022500793', 5,  'referee'),
('0022500795', 6,  'crew_chief'),
('0022500795', 11, 'referee'),
('0022500795', 12, 'referee');
