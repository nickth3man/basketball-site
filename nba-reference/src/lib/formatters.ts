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
 * formatPct(0.452)   // "0.452"
 * formatPct("0.452") // "0.452"
 * formatPct(null)    // "-"
 * formatPct(NaN)     // "-"
 * ```
 */
export function formatPct(value: string | number | null | undefined) {
  if (value == null) return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return n.toFixed(3);
}

/**
 * Formats a numeric value as USD currency.
 * 
 * Uses Intl.NumberFormat for locale-aware formatting with:
 * - USD currency symbol ($)
 * - No decimal places (rounded to whole dollars)
 * 
 * Returns "-" for null, undefined, or NaN values.
 * 
 * @param value - Numeric salary value
 * @returns Formatted currency string (e.g., "$45,000,000") or "-"
 * @example
 * ```ts
 * formatMoney(45000000)   // "$45,000,000"
 * formatMoney("45000000") // "$45,000,000"
 * formatMoney(null)       // "-"
 * ```
 */
export function formatMoney(value: string | number | null | undefined) {
  if (value == null) return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Formats a number with explicit + sign for positive values.
 * 
 * Used for stats like plus/minus (+/-) where the sign is significant.
 * Returns "-" for null or undefined values.
 * 
 * @param value - Numeric value to format
 * @returns Signed string (e.g., "+5" or "-3") or "-"
 * @example
 * ```ts
 * formatSignedNumber(5)   // "+5"
 * formatSignedNumber(-3)  // "-3"
 * formatSignedNumber(0)   // "0"
 * formatSignedNumber(null) // "-"
 * ```
 */
export function formatSignedNumber(value: number | null | undefined) {
  if (value == null) return "-";
  return value > 0 ? `+${value}` : String(value);
}
