/**
 * Input validation utilities for route parameters.
 *
 * Provides defense-in-depth validation for user inputs before
 * they reach the database layer.
 */

import { notFound } from 'next/navigation';

/**
 * Validates a Basketball-Reference player ID.
 *
 * BRef IDs follow the pattern: lowercase letters followed by 2 digits
 * Examples: "jamesle01", "curryst01", "duranke01"
 *
 * @param id - The player ID to validate
 * @returns The validated ID (throws notFound() if invalid)
 * @example
 * const id = validateBrefId('jamesle01'); // Returns 'jamesle01'
 * validateBrefId('invalid'); // Calls notFound()
 */
export function validateBrefId(id: string): string {
  if (id.length < 4 || id.length > 20) {
    notFound();
  }
  if (!/^[a-z]+\d{2}$/.test(id)) {
    notFound();
  }
  return id;
}

/**
 * Validates an NBA team abbreviation.
 *
 * The abbreviation must be exactly three uppercase letters (e.g., "LAL", "BOS", "NYK"); invalid values trigger a not-found response.
 *
 * @param abbrev - The team abbreviation to validate
 * @returns The validated abbreviation
 */
export function validateTeamAbbrev(abbrev: string): string {
  if (abbrev.length !== 3) {
    notFound();
  }
  if (!/^[A-Z]{3}$/.test(abbrev)) {
    notFound();
  }
  return abbrev;
}

/**
 * Validates that a season identifier matches the pattern YYYY-YY (for example, "2023-24").
 *
 * @param seasonId - The season identifier to validate
 * @returns The input `seasonId` when it matches the `YYYY-YY` pattern
 */
export function validateSeasonId(seasonId: string): string {
  if (seasonId.length !== 7) {
    notFound();
  }
  if (!/^\d{4}-\d{2}$/.test(seasonId)) {
    notFound();
  }
  return seasonId;
}

/**
 * Ensures a string represents an integer greater than 0 and less than or equal to `max`.
 *
 * Calls `notFound()` for invalid inputs.
 *
 * @param value - The string to validate as a positive integer
 * @param max - Maximum allowed value (default: 10000)
 * @returns The numeric value of `value` when it is an integer > 0 and <= `max`
 */
export function validatePositiveInt(value: string, max = 10000): number {
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0 || num > max || !Number.isInteger(num)) {
    notFound();
  }
  return num;
}
