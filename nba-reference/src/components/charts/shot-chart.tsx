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
import type { ShotEvent } from '@/lib/queries/games';
import { chartStyles, COLOR_SHOT_MADE, COLOR_SHOT_MISSED } from './chart-theme';

/** Gold for made shots (consistent with marble/gold palette) */
const COLOR_MADE = COLOR_SHOT_MADE;
/** Terracotta for missed shots */
const COLOR_MISSED = COLOR_SHOT_MISSED;

const ZONE_ORDER = [
  'Restricted Area',
  'In The Paint',
  'Mid-Range',
  'Long 2',
  'Corner 3',
  'Above Break 3',
];

interface ZoneStat {
  zone: string;
  made: number;
  missed: number;
  attempts: number;
  pct: number;
}

function aggregateByZone(shots: ShotEvent[]): ZoneStat[] {
  const map = new Map<string, { made: number; missed: number }>();

  for (const shot of shots) {
    const zone = shot.shot_zone ?? 'Unknown';
    const entry = map.get(zone) ?? { made: 0, missed: 0 };
    if (shot.shot_result === 'made') {
      entry.made += 1;
    } else {
      entry.missed += 1;
    }
    map.set(zone, entry);
  }

  const stats: ZoneStat[] = [];
  for (const zone of ZONE_ORDER) {
    const entry = map.get(zone);
    if (entry != null) {
      const attempts = entry.made + entry.missed;
      stats.push({
        zone,
        made: entry.made,
        missed: entry.missed,
        attempts,
        pct: attempts > 0 ? Math.round((entry.made / attempts) * 100) : 0,
      });
    }
  }
  // Append any zones not in the canonical order (e.g. "Unknown")
  for (const [zone, entry] of map.entries()) {
    if (!ZONE_ORDER.includes(zone)) {
      const attempts = entry.made + entry.missed;
      stats.push({
        zone,
        made: entry.made,
        missed: entry.missed,
        attempts,
        pct: attempts > 0 ? Math.round((entry.made / attempts) * 100) : 0,
      });
    }
  }

  return stats;
}

interface ShotChartTooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface ShotChartTooltipProps {
  active?: boolean;
  payload?: ShotChartTooltipPayload[];
  label?: string;
}

function ShotChartTooltip({ active, payload, label }: ShotChartTooltipProps): JSX.Element | null {
  if (active !== true || payload == null || payload.length === 0) return null;

  const made = payload.find(p => p.name === 'Made')?.value ?? 0;
  const missed = payload.find(p => p.name === 'Missed')?.value ?? 0;
  const attempts = made + missed;
  const pct = attempts > 0 ? Math.round((made / attempts) * 100) : 0;

  return (
    <div
      style={{
        backgroundColor: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: '8px',
        color: 'var(--heading)',
        padding: '8px 12px',
        fontSize: 13,
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ color: COLOR_MADE }}>Made: {made}</p>
      <p style={{ color: COLOR_MISSED }}>Missed: {missed}</p>
      <p>FG%: {pct}%</p>
    </div>
  );
}

interface ShotChartProps {
  shots: ShotEvent[];
  height?: number;
}

/**
 * Zone-based shot chart using a stacked bar chart.
 *
 * Displays made and missed field goal attempts broken down by shot zone.
 * This approach is used because `fact_play_by_play` does not yet expose
 * shot coordinates (x/y); the zone is inferred from the event description.
 * When coordinates become available the chart can be upgraded to a scatter
 * plot with a court background (see `docs/data-pipeline-contract.md`).
 */
export function ShotChart({ shots, height = 300 }: ShotChartProps): JSX.Element {
  const data = aggregateByZone(shots);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-strong italic">No shot data available for this game.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid {...chartStyles.grid} />
        <XAxis
          dataKey="zone"
          {...chartStyles.axis}
          tick={{ ...chartStyles.tick, angle: -35, textAnchor: 'end' }}
          interval={0}
        />
        <YAxis {...chartStyles.axis} tick={chartStyles.tick} allowDecimals={false} />
        <Tooltip content={<ShotChartTooltip />} />
        <Legend verticalAlign="top" />
        <Bar dataKey="made" name="Made" stackId="a" fill={COLOR_MADE} />
        <Bar dataKey="missed" name="Missed" stackId="a" fill={COLOR_MISSED} />
      </BarChart>
    </ResponsiveContainer>
  );
}
