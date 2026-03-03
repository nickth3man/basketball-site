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
 * Validates a team abbreviation.
 *
 * NBA team abbreviations are exactly 3 uppercase letters.
 * Examples: "LAL", "BOS", "NYK"
 *
 * @param abbrev - The team abbreviation to validate
 * @returns The validated abbreviation (throws notFound() if invalid)
 * @example
 * const abbrev = validateTeamAbbrev('LAL'); // Returns 'LAL'
 * validateTeamAbbrev('lakers'); // Calls notFound()
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
 * Validates a season ID.
 *
 * Season IDs follow the pattern: "YYYY-YY" (e.g., "2023-24")
 *
 * @param seasonId - The season ID to validate
 * @returns The validated season ID (throws notFound() if invalid)
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
 * Validates that a string is a positive integer.
 *
 * @param value - The string to validate
 * @param max - Maximum allowed value (default: 10000)
 * @returns The validated number
 */
export function validatePositiveInt(value: string, max = 10000): number {
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0 || num > max || !Number.isInteger(num)) {
    notFound();
  }
  return num;
}
