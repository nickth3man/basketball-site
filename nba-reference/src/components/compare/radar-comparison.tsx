'use client';

import type { JSX } from 'react';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

export interface RadarDataPoint {
  stat: string;
  player1: number;
  player2: number;
}

interface RadarComparisonProps {
  data: RadarDataPoint[];
  player1Name: string;
  player2Name: string;
}

export function RadarComparison({
  data,
  player1Name,
  player2Name,
}: RadarComparisonProps): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--line))" />
        <PolarAngleAxis dataKey="stat" tick={{ fill: 'hsl(var(--muted))', fontSize: 12 }} />
        <PolarRadiusAxis stroke="hsl(var(--line))" />
        <Radar
          name={player1Name}
          dataKey="player1"
          stroke="hsl(var(--chart-1))"
          fill="hsl(var(--chart-1))"
          fillOpacity={0.3}
        />
        <Radar
          name={player2Name}
          dataKey="player2"
          stroke="hsl(var(--chart-2))"
          fill="hsl(var(--chart-2))"
          fillOpacity={0.3}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
