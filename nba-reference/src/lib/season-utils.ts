export function seasonIdToEndYear(seasonId: string): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(seasonId);
  if (match == null) return null;

  const startYear = Number(match[1]);
  const shortEndYear = Number(match[2]);

  if (Number.isNaN(startYear) || Number.isNaN(shortEndYear)) return null;

  const baseCentury = Math.floor(startYear / 100) * 100;
  let endYear = baseCentury + shortEndYear;
  if (endYear < startYear) endYear += 100;

  return endYear;
}

export function endYearToSeasonId(endYear: number): string {
  const startYear = endYear - 1;
  const suffix = String(endYear).slice(-2);
  return `${startYear}-${suffix}`;
}

export function parseSeasonTokenToSeasonId(token: string): string | null {
  if (/^\d{4}-\d{2}$/.test(token)) {
    return token;
  }

  const numericYearMatch = /^(\d{4})$/.exec(token);
  if (numericYearMatch != null) {
    return endYearToSeasonId(Number(numericYearMatch[1]));
  }

  const leagueSlugMatch = /^NBA_(\d{4})$/.exec(token);
  if (leagueSlugMatch != null) {
    return endYearToSeasonId(Number(leagueSlugMatch[1]));
  }

  return null;
}

export function seasonIdToLeagueSlug(seasonId: string): string | null {
  const endYear = seasonIdToEndYear(seasonId);
  if (endYear == null) return null;
  return `NBA_${endYear}`;
}
