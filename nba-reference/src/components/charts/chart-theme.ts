export const chartColors = {
  primary: 'hsl(38 100% 55%)',
  secondary: 'hsl(210 80% 55%)',
  tertiary: 'hsl(140 60% 50%)',
};

/** Gold — made shots, positive events (marble/gold palette) */
export const COLOR_SHOT_MADE = '#c9a227';
/** Terracotta — missed shots, negative events */
export const COLOR_SHOT_MISSED = '#9f402d';

export const chartStyles = {
  grid: { stroke: 'var(--line)', strokeDasharray: '3 3' },
  axis: { stroke: 'var(--muted)' },
  tick: { fill: 'var(--muted)', fontSize: 12 },
  tooltip: {
    contentStyle: {
      backgroundColor: 'var(--paper)',
      border: '1px solid var(--line)',
      borderRadius: '8px',
      color: 'var(--heading)',
    },
  },
};
