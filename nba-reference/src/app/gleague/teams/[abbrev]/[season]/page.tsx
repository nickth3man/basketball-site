/**
 * @fileoverview G-League team season page - placeholder until data is available.
 *
 * @module @/app/gleague/teams/[abbrev]/[season]/page
 */

import { notFound } from 'next/navigation';

/**
 * G-League team season detail page. Calls notFound() until G-League team data is available.
 */
export default function GLeagueTeamSeasonPage(): never {
  return notFound();
}
