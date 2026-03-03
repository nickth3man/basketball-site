import type { DbRow, DbRows, RowValue } from '@/lib/types';

export interface CsvColumn {
  key: string;
  label: string;
}

function sanitizeCsvValue(value: RowValue | undefined): string {
  if (value == null) return '';
  const escaped = String(value).replaceAll('"', '""');
  if (/^[=+\-@]/.test(escaped)) {
    return `'${escaped}`;
  }
  return escaped;
}

function quoteCsvValue(value: RowValue | undefined): string {
  return `"${sanitizeCsvValue(value)}"`;
}

export function convertRowsToCsv(rows: DbRows): string {
  if (rows.length === 0) return '';

  const firstRow = rows[0];
  if (firstRow === undefined) return '';

  const headers = Object.keys(firstRow);
  const output: string[] = [headers.join(',')];

  for (const row of rows) {
    output.push(headers.map(header => quoteCsvValue(row[header])).join(','));
  }

  return output.join('\n');
}

export function convertRowsToCsvWithColumns(rows: DbRows, columns: CsvColumn[]): string {
  const headerLine = columns.map(column => quoteCsvValue(column.label)).join(',');
  const lines = rows.map(row => columns.map(column => quoteCsvValue(row[column.key])).join(','));
  return [headerLine, ...lines].join('\n');
}

export function castToDbRows<T extends DbRow>(rows: T[]): DbRows {
  return rows;
}
