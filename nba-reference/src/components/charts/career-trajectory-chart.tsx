'use client';

import type { JSX } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { CareerSeasonData } from '@/lib/types/charts';
import { chartColors, chartStyles } from './chart-theme';

interface CareerTrajectoryChartProps {
  data: CareerSeasonData[];
  height?: number;
}

export function CareerTrajectoryChart({
  data,
  height = 300,
}: CareerTrajectoryChartProps): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid {...chartStyles.grid} />
        <XAxis dataKey="season" {...chartStyles.axis} tick={chartStyles.tick} />
        <YAxis {...chartStyles.axis} tick={chartStyles.tick} />
        <Tooltip {...chartStyles.tooltip} />
        <Legend />
        <Line
          type="monotone"
          dataKey="ppg"
          name="PPG"
          stroke={chartColors.primary}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="rpg"
          name="RPG"
          stroke={chartColors.secondary}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="apg"
          name="APG"
          stroke={chartColors.tertiary}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
