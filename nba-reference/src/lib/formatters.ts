/**
 * @fileoverview Data formatting utilities for displaying basketball statistics.
 *
 * Provides consistent formatting for:
 * - Percentage values (FG%, 3P%, FT%)
 * - Currency/salary values
 * - Signed numbers (for +/- stats)
 *
 * All formatters handle null/undefined values gracefully by returning "-".
 *
 * @module @/lib/formatters
 */

/**
 * Formats a decimal value as a three-digit percentage string.
 *
 * Used for shooting percentages (FG%, 3P%, FT%) displayed in tables.
 * Returns "-" for null, undefined, or NaN values.
 *
 * @param value - Decimal value (e.g., 0.452 for 45.2%)
 * @returns Formatted percentage string (e.g., "0.452") or "-"
 * @example
 * ```ts
 * formatPercentage(0.452)   // "0.452"
 * formatPercentage("0.452") // "0.452"
 * formatPercentage(null)    // "-"
 * formatPercentage(NaN)     // "-"
 * ```
 */
export function formatPercentage(value: string | number | null | undefined): string {
  if (value == null) return '-';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '-';
  return numericValue.toFixed(3);
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/**
 * Formats a numeric value as US dollar currency with no fractional digits.
 *
 * @param value - Numeric value or numeric string representing an amount
 * @returns The formatted currency string (e.g., "$45,000,000"), or "-" for null, undefined, or NaN
 */
export function formatUsd(value: string | number | null | undefined): string {
  if (value == null) return '-';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '-';
  return usdFormatter.format(numericValue);
}

/**
 * Format a number with an explicit "+" prefix for positive values.
 *
 * @param value - The number to format
 * @returns A string with a leading `"+"` for values greater than zero, the numeric string for zero or negative values (e.g., `"-3"` or `"0"`), or `"-"` when `value` is `null` or `undefined`
 */
export function formatSignedNumber(value: number | null | undefined): string {
  if (value == null) return '-';
  return value > 0 ? `+${value}` : String(value);
}
