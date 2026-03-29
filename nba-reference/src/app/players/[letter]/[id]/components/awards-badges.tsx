/**
 * @fileoverview Awards badges component - displays aggregated award counts.
 *
 * @module @/app/players/[letter]/[id]/components/awards-badges
 */

interface AwardsBadgesProps {
  awardCounts: Array<[string, number]>;
}

/**
 * Renders award badges showing count for each award type.
 * Returns null if no awards to display.
 */
export function AwardsBadges({ awardCounts }: AwardsBadgesProps): React.JSX.Element | null {
  if (awardCounts.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 surface-pedestal p-4">
      <h2 className="mb-3 inscription-title text-lg">Leaderboards, Awards, & Honors</h2>
      <div className="flex flex-wrap gap-2">
        {awardCounts.map(([name, count]) => (
          <span key={name} className="stat-coin">
            {count}x {name}
          </span>
        ))}
      </div>
    </section>
  );
}
