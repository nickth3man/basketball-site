export const chartColors = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
};

export const chartStyles = {
  grid: { stroke: 'hsl(var(--line))', strokeDasharray: '3 3' },
  axis: { stroke: 'hsl(var(--muted))' },
  tick: { fill: 'hsl(var(--muted))', fontSize: 12 },
  tooltip: {
    contentStyle: {
      backgroundColor: 'hsl(var(--paper))',
      border: '1px solid hsl(var(--line))',
      borderRadius: '8px',
      color: 'hsl(var(--heading))',
    },
  },
};
