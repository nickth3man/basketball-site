'use client';

import type { JSX } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartStyles } from './chart-theme';

/** Canonical position order and display colors */
const POSITION_CONFIG: Record<string, { label: string; color: string }> = {
  PG: { label: 'PG', color: '#00245e' },
  SG: { label: 'SG', color: '#1a4a8a' },
  SF: { label: 'SF', color: '#9f402d' },
  PF: { label: 'PF', color: '#c4603e' },
  C: { label: 'C', color: '#735c00' },
};

export interface DepthChartRow {
  full_name: string;
  bref_id: string;
  pos: string | null;
  mp: number | null;
  mpg: number | null;
  g: number | null;
}

interface DepthChartProps {
  players: DepthChartRow[];
  height?: number;
}

interface ChartDatum {
  name: string;
  PG: number;
  SG: number;
  SF: number;
  PF: number;
  C: number;
  OTHER: number;
}

/**
 * Renders a stacked horizontal bar chart of minutes played by position.
 *
 * Each player is a bar; bars are colour-coded by position. Players are
 * ordered from most minutes (top) to fewest (bottom) for quick scanning.
 */
export function DepthChart({ players, height = 420 }: DepthChartProps): JSX.Element {
  if (players.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        No minutes data available for this season.
      </p>
    );
  }

  // Build one datum per player; minutes go into the position slot
  const data: ChartDatum[] = players
    .filter(p => (p.mp ?? 0) > 0)
    .slice(0, 20) // cap at 20 for readability
    .map(p => {
      const pos = (p.pos ?? 'OTHER').toUpperCase();
      const mp = p.mp ?? 0;
      return {
        name: p.full_name,
        PG: pos === 'PG' ? mp : 0,
        SG: pos === 'SG' ? mp : 0,
        SF: pos === 'SF' ? mp : 0,
        PF: pos === 'PF' ? mp : 0,
        C: pos === 'C' ? mp : 0,
        OTHER: !Object.keys(POSITION_CONFIG).includes(pos) ? mp : 0,
      };
    });

  const positions = Object.entries(POSITION_CONFIG);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
        <CartesianGrid {...chartStyles.grid} horizontal={false} />
        <XAxis
          type="number"
          {...chartStyles.axis}
          tick={chartStyles.tick}
          tickFormatter={v => String(Math.round(Number(v)))}
          label={{
            value: 'Minutes Played',
            position: 'insideBottom',
            offset: -2,
            fill: 'var(--muted)',
            fontSize: 11,
          }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={115}
          {...chartStyles.axis}
          tick={{ ...chartStyles.tick, textAnchor: 'end' }}
        />
        <Tooltip
          {...chartStyles.tooltip}
          formatter={(value, name) => [`${Number(value ?? 0).toLocaleString()} min`, String(name)]}
        />
        <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 8 }} />
        {positions.map(([pos, cfg]) => (
          <Bar key={pos} dataKey={pos} name={cfg.label} stackId="a" fill={cfg.color} />
        ))}
        <Bar dataKey="OTHER" name="Other" stackId="a" fill="#888888" />
      </BarChart>
    </ResponsiveContainer>
  );
}
