import { describe, expect, it } from 'vitest';
import { castToDbRows, convertRowsToCsv, convertRowsToCsvWithColumns } from '@/lib/csv';

describe('csv utilities', () => {
  it('returns empty csv for empty rows', () => {
    expect(convertRowsToCsv([])).toBe('');
  });

  it('escapes double quotes correctly', () => {
    const csv = convertRowsToCsv([{ name: 'Shaquille "Shaq" O\'Neal' }]);
    expect(csv).toContain('"Shaquille ""Shaq"" O\'Neal"');
  });

  it('prevents formula injection for dangerous prefixes', () => {
    const csv = convertRowsToCsv([
      { name: '=cmd' },
      { name: '+SUM(A1:A2)' },
      { name: '-42+2' },
      { name: '@evil' },
    ]);

    expect(csv).toContain('"\'=cmd"');
    expect(csv).toContain('"\'+SUM(A1:A2)"');
    expect(csv).toContain('"\'-42+2"');
    expect(csv).toContain('"\'@evil"');
  });

  it('does not prefix numeric values with apostrophe', () => {
    const csv = convertRowsToCsv([{ value: 123 }]);
    expect(csv).toContain('"123"');
    expect(csv).not.toContain('"\'123"');
  });

  it('supports explicit column ordering and labels', () => {
    const rows = castToDbRows([
      { name: 'LeBron James', team: 'LAL', points: 27 },
      { name: 'Stephen Curry', team: 'GSW', points: 26 },
    ]);

    const csv = convertRowsToCsvWithColumns(rows, [
      { key: 'name', label: 'Player' },
      { key: 'points', label: 'PPG' },
    ]);

    const lines = csv.split('\n');
    expect(lines[0]).toBe('"Player","PPG"');
    expect(lines[1]).toBe('"LeBron James","27"');
    expect(lines[2]).toBe('"Stephen Curry","26"');
  });
});
