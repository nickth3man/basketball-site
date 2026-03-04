// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('@/lib/query/home', () => ({
  getHomeSeasonId: vi.fn(),
  getHomeStandings: vi.fn(),
  getRecentGames: vi.fn(),
}));

import { getHomeSeasonId, getHomeStandings, getRecentGames } from '@/lib/query/home';
import Page from './page';

const getHomeSeasonIdMock = vi.mocked(getHomeSeasonId);
const getHomeStandingsMock = vi.mocked(getHomeStandings);
const getRecentGamesMock = vi.mocked(getRecentGames);

beforeEach(() => {
  vi.clearAllMocks();
  getHomeSeasonIdMock.mockReturnValue('2024-25');
  getHomeStandingsMock.mockReturnValue([
    {
      season_id: '2024-25',
      bref_abbrev: 'LAL',
      w: 50,
      l: 32,
      n_rtg: 4.1,
      pace: 99.9,
    },
  ]);
  getRecentGamesMock.mockReturnValue([
    {
      game_id: '0022400001',
      game_date: '2025-01-01',
      away_abbrev: 'BOS',
      away_score: 108,
      home_abbrev: 'LAL',
      home_score: 112,
    },
  ]);
});

test('renders page component', () => {
  const ServerPage = Page();
  render(ServerPage);

  expect(screen.getByText(/Basketball Stats and History/i)).toBeInTheDocument();
  expect(screen.getByText(/Season 2024-25 standings/i)).toBeInTheDocument();
  expect(screen.getAllByText('LAL').length).toBeGreaterThan(0);
  expect(screen.getByText('BOS')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Box Score/i })).toHaveAttribute(
    'href',
    '/games/0022400001'
  );
});
