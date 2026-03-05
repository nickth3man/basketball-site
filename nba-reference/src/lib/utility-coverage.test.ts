import { describe, expect, it } from 'vitest';
import { formatPercentage, formatSignedNumber, formatUsd } from '@/lib/formatters';
import {
  endYearToSeasonId,
  parseSeasonTokenToSeasonId,
  seasonIdToEndYear,
  seasonIdToLeagueSlug,
} from '@/lib/season-utils';
import { routes } from '@/lib/routes';

describe('utility coverage', () => {
  it('formats percentages and currency consistently', () => {
    expect(formatPercentage(0.4521)).toBe('0.452');
    expect(formatPercentage('0.5')).toBe('0.500');
    expect(formatPercentage(null)).toBe('-');

    expect(formatUsd(45000000)).toBe('$45,000,000');
    expect(formatUsd('2500')).toBe('$2,500');
    expect(formatUsd(undefined)).toBe('-');

    expect(formatSignedNumber(3)).toBe('+3');
    expect(formatSignedNumber(0)).toBe('0');
    expect(formatSignedNumber(-2)).toBe('-2');
    expect(formatSignedNumber(null)).toBe('-');
  });

  it('parses and converts season tokens', () => {
    expect(seasonIdToEndYear('2024-25')).toBe(2025);
    expect(seasonIdToEndYear('1999-00')).toBe(2000);
    expect(seasonIdToEndYear('bad')).toBeNull();

    expect(endYearToSeasonId(2025)).toBe('2024-25');
    expect(parseSeasonTokenToSeasonId('2024-25')).toBe('2024-25');
    expect(parseSeasonTokenToSeasonId('2025')).toBe('2024-25');
    expect(parseSeasonTokenToSeasonId('NBA_2025')).toBe('2024-25');
    expect(parseSeasonTokenToSeasonId('INVALID')).toBeNull();

    expect(seasonIdToLeagueSlug('2024-25')).toBe('NBA_2025');
    expect(seasonIdToLeagueSlug('oops')).toBeNull();
  });

  it('builds typed routes with normalized path segments', () => {
    expect(routes.boxscore('0022400001')).toBe('/boxscores/0022400001');
    expect(routes.player('J', 'jamesle01')).toBe('/players/j/jamesle01');
    expect(routes.playerLetter('K')).toBe('/players/k');
    expect(routes.team('lal')).toBe('/teams/LAL');
    expect(routes.teamSeason('lal', '2024-25')).toBe('/teams/LAL/2024-25');
    expect(routes.league('NBA_2025')).toBe('/leagues/NBA_2025');
    expect(routes.draft(2025)).toBe('/draft/2025');
    expect(routes.game('0022400001')).toBe('/games/0022400001');
  });
});
