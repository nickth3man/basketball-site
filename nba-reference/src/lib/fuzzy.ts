function levenshteinDistance(a: string, b: string): number {
  const rows = b.length + 1;
  const cols = a.length + 1;

  const matrix: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(0);
    }
    matrix.push(row);
  }

  for (let i = 0; i < rows; i++) {
    matrix[i]![0] = i;
  }

  for (let j = 0; j < cols; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        const diag = matrix[i - 1]![j - 1]!;
        const left = matrix[i]![j - 1]!;
        const up = matrix[i - 1]![j]! + 1;
        matrix[i]![j] = Math.min(diag + 1, left + 1, up + 1);
      }
    }
  }

  return matrix[rows - 1]![cols - 1]!;
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
  items: Array<T>,
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
