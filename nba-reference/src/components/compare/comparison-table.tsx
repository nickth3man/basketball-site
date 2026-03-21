import type { JSX } from 'react';
import { cn } from '@/lib/utils';
import type { PlayerCareerStats } from '@/lib/queries/compare';

interface ComparisonRow {
  label: string;
  key: keyof PlayerCareerStats;
  format: (value: number | null) => string;
  higherIsBetter: boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'PPG', key: 'ppg', format: v => v?.toFixed(1) ?? '-', higherIsBetter: true },
  { label: 'RPG', key: 'rpg', format: v => v?.toFixed(1) ?? '-', higherIsBetter: true },
  { label: 'APG', key: 'apg', format: v => v?.toFixed(1) ?? '-', higherIsBetter: true },
  { label: 'SPG', key: 'spg', format: v => v?.toFixed(1) ?? '-', higherIsBetter: true },
  { label: 'BPG', key: 'bpg', format: v => v?.toFixed(1) ?? '-', higherIsBetter: true },
  {
    label: 'FG%',
    key: 'fg_pct',
    format: v => (v != null ? `${(v * 100).toFixed(1)}%` : '-'),
    higherIsBetter: true,
  },
  {
    label: '3P%',
    key: 'fg3_pct',
    format: v => (v != null ? `${(v * 100).toFixed(1)}%` : '-'),
    higherIsBetter: true,
  },
  {
    label: 'FT%',
    key: 'ft_pct',
    format: v => (v != null ? `${(v * 100).toFixed(1)}%` : '-'),
    higherIsBetter: true,
  },
  { label: 'PER', key: 'per', format: v => v?.toFixed(1) ?? '-', higherIsBetter: true },
  { label: 'WS', key: 'ws', format: v => v?.toFixed(1) ?? '-', higherIsBetter: true },
];

interface ComparisonTableProps {
  player1Name: string;
  player2Name: string;
  player1Stats: PlayerCareerStats;
  player2Stats: PlayerCareerStats;
}

export function ComparisonTable({
  player1Name,
  player2Name,
  player1Stats,
  player2Stats,
}: ComparisonTableProps): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-thead">
            <th className="px-4 py-3 text-left font-semibold text-heading">Stat</th>
            <th className="px-4 py-3 text-right font-semibold text-heading">{player1Name}</th>
            <th className="px-4 py-3 text-right font-semibold text-heading">{player2Name}</th>
            <th className="px-4 py-3 text-center font-semibold text-heading">Diff</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, index) => {
            const v1 = player1Stats[row.key];
            const v2 = player2Stats[row.key];
            const diff = v1 != null && v2 != null ? v1 - v2 : null;
            const p1Leads = diff != null && diff > 0;
            const p2Leads = diff != null && diff < 0;
            const isAltRow = index % 2 === 1;

            return (
              <tr
                key={row.key}
                className={cn(
                  'border-b border-line-soft transition-colors',
                  isAltRow ? 'bg-row-alt' : 'bg-paper',
                  'hover:bg-row-hover'
                )}
              >
                <td className="px-4 py-3 font-medium text-heading">{row.label}</td>
                <td
                  className={cn(
                    'px-4 py-3 text-right tabular-nums',
                    p1Leads ? 'text-chart-1 font-semibold' : 'text-ink'
                  )}
                >
                  {row.format(v1)}
                </td>
                <td
                  className={cn(
                    'px-4 py-3 text-right tabular-nums',
                    p2Leads ? 'text-chart-2 font-semibold' : 'text-ink'
                  )}
                >
                  {row.format(v2)}
                </td>
                <td className="px-4 py-3 text-center text-muted tabular-nums">
                  {diff != null
                    ? (() => {
                        // For percentage stats (fg_pct, fg3_pct, ft_pct), scale diff to percentage points
                        const isPct =
                          row.key === 'fg_pct' || row.key === 'fg3_pct' || row.key === 'ft_pct';
                        const scaledDiff = isPct ? diff * 100 : diff;
                        return scaledDiff > 0 ? `+${scaledDiff.toFixed(1)}` : scaledDiff.toFixed(1);
                      })()
                    : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
