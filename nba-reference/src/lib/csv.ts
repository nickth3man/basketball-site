import type { DbRow, DbRows, RowValue } from '@/lib/types';

export interface CsvColumn {
  key: string;
  label: string;
}

/**
 * Produce a CSV-safe string from a database row value.
 *
 * Converts null or undefined to an empty string, doubles any internal double quotes to escape them for CSV, and prefixes a leading `=`, `+`, `-`, or `@` with a single quote to prevent CSV/formula injection.
 *
 * @param value - The value to sanitize for inclusion in a CSV cell
 * @returns The sanitized string safe for CSV output
 */
function sanitizeCsvValue(value: RowValue | undefined): string {
  if (value == null) return '';
  const escaped = String(value).replaceAll('"', '""');
  if (/^[=+\-@]/.test(escaped)) {
    return `'${escaped}`;
  }
  return escaped;
}

/**
 * Wraps a CSV-safe value in double quotes for use as a CSV field.
 *
 * @param value - The value to sanitize and quote; may be undefined
 * @returns The sanitized value enclosed in double quotes
 */
function quoteCsvValue(value: RowValue | undefined): string {
  return `"${sanitizeCsvValue(value)}"`;
}

/**
 * Serialize database rows into a CSV string using the keys of the first row as the header.
 *
 * @param rows - Array of database rows; header columns are derived from the keys of the first row
 * @returns A CSV-formatted string with a header line followed by one line per row; returns an empty string if `rows` is empty
 */
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

/**
 * Serialize database rows into a CSV string using an explicit column order and labels.
 *
 * @param rows - The database rows to serialize.
 * @param columns - Column definitions that determine the CSV header labels and the order of fields; each entry's `key` is used to read values from a row and `label` is used for the header.
 * @returns A CSV string whose first line is the header built from `columns` labels and whose subsequent lines are the rows' fields in the specified order; fields are CSV-quoted and escaped as necessary.
 */
export function convertRowsToCsvWithColumns(rows: DbRows, columns: CsvColumn[]): string {
  const headerLine = columns.map(column => quoteCsvValue(column.label)).join(',');
  const lines = rows.map(row => columns.map(column => quoteCsvValue(row[column.key])).join(','));
  return [headerLine, ...lines].join('\n');
}

/**
 * Coerce an array of objects that extend `DbRow` to the `DbRows` type.
 *
 * @param rows - Array of row objects compatible with `DbRow`; the input is returned unchanged
 * @returns The same array typed as `DbRows`
 */
export function castToDbRows<T extends DbRow>(rows: T[]): DbRows {
  return rows;
}
