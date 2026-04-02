import type { Route } from 'next';

export interface SearchStaticDefinition {
  description: string;
  href: Route;
  id: string;
  keywords: string[];
  label: string;
}

export const SEARCHABLE_AWARDS = [
  {
    id: 'mvp',
    label: 'Most Valuable Player',
    description: 'Season-by-season MVP winners and history.',
    href: '/awards/mvp',
    keywords: ['mvp', 'most valuable player', 'michael jordan trophy'],
  },
  {
    id: 'dpoy',
    label: 'Defensive Player of the Year',
    description: 'DPOY winners and voting history.',
    href: '/awards/dpoy',
    keywords: ['dpoy', 'defensive player of the year', 'defense', 'hakeem olajuwon trophy'],
  },
  {
    id: 'roy',
    label: 'Rookie of the Year',
    description: 'ROY winners and first-year standouts.',
    href: '/awards/roy',
    keywords: ['roy', 'rookie of the year', 'rookie', 'wilt chamberlain trophy'],
  },
  {
    id: 'all-nba',
    label: 'All-NBA Teams',
    description: 'All-NBA first, second, and third team history.',
    href: '/awards/all_league',
    keywords: ['all nba', 'all-nba', 'all league', 'all team'],
  },
  {
    id: 'all-defense',
    label: 'All-Defensive Teams',
    description: 'All-Defensive first and second team history.',
    href: '/awards/all_defense',
    keywords: ['all defense', 'all-defense', 'all defensive', 'defensive teams'],
  },
] satisfies SearchStaticDefinition[];

export const SEARCHABLE_SITE_PAGES = [
  {
    id: 'games-index',
    label: 'Games Index',
    description: 'Browse recent NBA results with optional team filters.',
    href: '/games',
    keywords: ['games', 'schedule', 'results', 'scores'],
  },
  {
    id: 'boxscores',
    label: 'Box Scores',
    description: 'Jump into date-based box score browsing and game detail pages.',
    href: '/boxscores',
    keywords: ['box score', 'boxscores', 'pbp', 'play by play'],
  },
  {
    id: 'seasons-index',
    label: 'Seasons',
    description: 'Explore season indexes, standings, leaders, and recent games.',
    href: '/seasons',
    keywords: ['seasons', 'season history', 'league history'],
  },
  {
    id: 'leaders',
    label: 'League Leaders',
    description: 'Stat leaderboards and top performers across the league.',
    href: '/leaders',
    keywords: ['leaders', 'leaderboards', 'scoring leaders', 'assist leaders'],
  },
  {
    id: 'standings',
    label: 'Standings by Date',
    description: 'Look up standings snapshots across the season.',
    href: '/standings',
    keywords: ['standings', 'rankings', 'record', 'seedings'],
  },
  {
    id: 'playoffs',
    label: 'Playoffs',
    description: 'Series pages, playoff leaders, and postseason history.',
    href: '/playoffs',
    keywords: ['playoffs', 'postseason', 'series', 'bracket'],
  },
  {
    id: 'draft',
    label: 'Draft History',
    description: 'Draft classes, picks, and team selections by year.',
    href: '/draft',
    keywords: ['draft', 'nba draft', 'rookies', 'draft class'],
  },
  {
    id: 'allstar',
    label: 'All-Star History',
    description: 'All-Star rosters, MVP winners, and yearly event history.',
    href: '/allstar',
    keywords: ['all star', 'all-star', 'allstar', 'all-star game'],
  },
  {
    id: 'salary-cap',
    label: 'Salary Cap History',
    description: 'Salary cap and league spending context by season.',
    href: '/leagues/salary-cap',
    keywords: ['salary cap', 'cap', 'luxury tax', 'cba'],
  },
  {
    id: 'birthdays',
    label: 'Player Birthdays',
    description: 'Browse NBA players by birthday and date.',
    href: '/friv/birthdays',
    keywords: ['birthdays', 'birthday', 'born on'],
  },
  {
    id: 'colleges',
    label: 'Players by College',
    description: 'See which colleges produced the most NBA players.',
    href: '/friv/colleges',
    keywords: ['colleges', 'college', 'alma mater', 'school'],
  },
  {
    id: 'wnba',
    label: 'WNBA',
    description: 'WNBA standings, players, and team stats.',
    href: '/wnba' as Route,
    keywords: ['wnba', "women's basketball", 'women nba'],
  },
  {
    id: 'gleague',
    label: 'G-League',
    description: 'NBA G-League player development and statistics.',
    href: '/gleague' as Route,
    keywords: ['g-league', 'gleague', 'nba g league', 'development league', 'dleague'],
  },
  {
    id: 'college',
    label: 'College Basketball',
    description: 'NCAA college basketball statistics and players.',
    href: '/college' as Route,
    keywords: ['college', 'ncaa', 'college basketball', 'university'],
  },
  {
    id: 'international',
    label: 'International Basketball',
    description: 'EuroLeague, CBA, NBL, and other international leagues.',
    href: '/international' as Route,
    keywords: ['international', 'euroleague', 'cba', 'nbl', 'fiba', 'overseas'],
  },
] satisfies SearchStaticDefinition[];
