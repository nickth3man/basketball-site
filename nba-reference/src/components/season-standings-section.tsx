import type React from 'react';
import { StatsTable } from '@/components/stats-table';

type StandingRow = Record<string, string | number | null>;

const standingsColumns = [
  { key: 'bref_abbrev', label: 'Team' },
  { key: 'w', label: 'W', align: 'right' as const },
  { key: 'l', label: 'L', align: 'right' as const },
  { key: 'srs', label: 'SRS', align: 'right' as const },
  { key: 'o_rtg', label: 'ORtg', align: 'right' as const },
  { key: 'd_rtg', label: 'DRtg', align: 'right' as const },
  { key: 'n_rtg', label: 'NRtg', align: 'right' as const },
  { key: 'pace', label: 'Pace', align: 'right' as const },
];

function ConferenceTable({
  title,
  standings,
}: {
  title: string;
  standings: StandingRow[];
}): React.JSX.Element | null {
  if (standings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="inscription-title text-lg">{title}</h3>
      <StatsTable columns={standingsColumns} rows={standings} initialSort="w" />
    </div>
  );
}

export function SeasonStandingsSection({
  standings,
}: {
  standings: StandingRow[];
}): React.JSX.Element {
  const eastStandings = standings.filter(team => team['conference'] === 'East');
  const westStandings = standings.filter(team => team['conference'] === 'West');
  const otherStandings = standings.filter(
    team => team['conference'] !== 'East' && team['conference'] !== 'West'
  );
  const hasConferenceSplit =
    eastStandings.length > 0 && westStandings.length > 0 && otherStandings.length === 0;

  return (
    <section className="mb-10 space-y-6">
      <h2 className="inscription-title text-xl">Standings</h2>
      {hasConferenceSplit ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ConferenceTable title="Eastern Conference" standings={eastStandings} />
          <ConferenceTable title="Western Conference" standings={westStandings} />
        </div>
      ) : (
        <>
          {eastStandings.length > 0 || westStandings.length > 0 ? (
            <div className="mb-8 grid gap-10 lg:grid-cols-2">
              <ConferenceTable title="Eastern Conference" standings={eastStandings} />
              <ConferenceTable title="Western Conference" standings={westStandings} />
            </div>
          ) : null}
          {otherStandings.length > 0 ? (
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                {eastStandings.length > 0 || westStandings.length > 0
                  ? 'Unclassified Teams'
                  : 'League Standings'}
              </h3>
              <StatsTable columns={standingsColumns} rows={otherStandings} initialSort="w" />
            </div>
          ) : eastStandings.length === 0 && westStandings.length === 0 ? (
            <StatsTable columns={standingsColumns} rows={standings} initialSort="w" />
          ) : null}
        </>
      )}
    </section>
  );
}
