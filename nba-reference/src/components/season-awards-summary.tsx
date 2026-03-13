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
    <div>
      <div className="text-xs tracking-wide text-crumb uppercase">{label}</div>
      <div className="font-semibold">{winner?.full_name ?? '-'}</div>
      <div className="text-muted-strong">{winner?.team_abbrev ?? '-'}</div>
    </div>
  );
}

export function SeasonAwardsSummary({
  mvp,
  dpoy,
  roy,
}: SeasonAwardsSummaryProps): React.JSX.Element {
  return (
    <section className="mb-8 border border-line-mid bg-paper-soft p-3 text-sm">
      <h2 className="mb-2 text-lg font-bold">Season Awards</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <AwardWinnerCard label="MVP" winner={mvp} />
        <AwardWinnerCard label="DPOY" winner={dpoy} />
        <AwardWinnerCard label="ROY" winner={roy} />
      </div>
    </section>
  );
}
