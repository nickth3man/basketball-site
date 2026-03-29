import type React from 'react';
import type { AwardWinnerRow } from '@/lib/queries/awards';

interface SeasonAwardsSummaryProps {
  mvp: AwardWinnerRow | undefined;
  dpoy: AwardWinnerRow | undefined;
  roy: AwardWinnerRow | undefined;
}

function AwardWinnerCard({
  label,
  winner,
}: {
  label: string;
  winner: AwardWinnerRow | undefined;
}): React.JSX.Element {
  return (
    <div className="surface-inset p-4">
      <div className="mb-1 editorial-kicker">{label}</div>
      <div className="font-semibold text-heading">{winner?.full_name ?? '-'}</div>
      <div className="text-sm text-tertiary">{winner?.team_abbrev ?? '-'}</div>
    </div>
  );
}

export function SeasonAwardsSummary({
  mvp,
  dpoy,
  roy,
}: SeasonAwardsSummaryProps): React.JSX.Element {
  return (
    <section className="mb-8 surface-pedestal p-5 text-sm">
      <h2 className="mb-4 inscription-title text-lg">Season Awards</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <AwardWinnerCard label="MVP" winner={mvp} />
        <AwardWinnerCard label="DPOY" winner={dpoy} />
        <AwardWinnerCard label="ROY" winner={roy} />
      </div>
    </section>
  );
}
