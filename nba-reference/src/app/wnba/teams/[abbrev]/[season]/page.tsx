/**
 * @fileoverview WNBA team season page - placeholder until data is available.
 *
 * @module @/app/wnba/teams/[abbrev]/[season]/page
 */

import { notFound } from 'next/navigation';

/**
 * WNBA team season detail page. Calls notFound() until WNBA team data is available.
 */
export default function WnbaTeamSeasonPage(): never {
  return notFound();
}
