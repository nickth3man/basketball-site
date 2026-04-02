/**
 * @fileoverview WNBA player detail page - placeholder until data is available.
 *
 * @module @/app/wnba/players/[letter]/[id]/page
 */

import { notFound } from 'next/navigation';

/**
 * WNBA player detail page. Calls notFound() until WNBA player data is available.
 */
export default function WnbaPlayerPage(): never {
  return notFound();
}
