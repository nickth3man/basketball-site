function safeGet(row: number[], idx: number): number {
  return row.at(idx) ?? 0;
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const initRow: number[] = Array.from({ length: a.length + 1 }, (_, j) => j);

  let prevRow = initRow;
  for (let rowIdx = 0; rowIdx < b.length; rowIdx++) {
    const row: number[] = [rowIdx + 1];
    for (let col = 0; col < a.length; col++) {
      const cost = b[rowIdx] === a[col] ? 0 : 1;
      row.push(
        Math.min(safeGet(prevRow, col) + cost, safeGet(prevRow, col + 1) + 1, safeGet(row, col) + 1)
      );
    }
    prevRow = row;
  }

  return safeGet(prevRow, a.length);
}

export interface FuzzyMatchResult {
  score: number;
  matched: boolean;
}

export function fuzzyScore(query: string, target: string): FuzzyMatchResult {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (q.length === 0) return { score: 0, matched: false };
  if (t.includes(q)) return { score: 1.0, matched: true };
  if (t.startsWith(q)) return { score: 0.95, matched: true };

  const words = t.split(/\s+/);
  const wordMatch = words.some(word => word.startsWith(q));
  if (wordMatch) return { score: 0.85, matched: true };

  const distance = levenshteinDistance(q, t.slice(0, q.length + 3));
  const maxLen = Math.max(q.length, t.length);
  const similarity = 1 - distance / maxLen;

  if (similarity >= 0.6) {
    return { score: similarity * 0.8, matched: true };
  }

  return { score: 0, matched: false };
}

export function fuzzyFilter<T extends { label: string }>(
  query: string,
  items: T[],
  minScore = 0.4
): Array<T & { score: number }> {
  return items
    .map(item => ({
      ...item,
      ...fuzzyScore(query, item.label),
    }))
    .filter(item => item.matched && item.score >= minScore)
    .sort((a, b) => b.score - a.score);
}
