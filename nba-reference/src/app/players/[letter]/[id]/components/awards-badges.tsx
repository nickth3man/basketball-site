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
    <section className="mb-5 border border-line-mid bg-white p-3">
      <h2 className="mb-2 text-lg font-bold">Leaderboards, Awards, & Honors</h2>
      <div className="flex flex-wrap gap-2">
        {awardCounts.map(([name, count]) => (
          <span key={name} className="rounded border border-line bg-button-bg px-2 py-1 text-xs">
            {count}x {name}
          </span>
        ))}
      </div>
    </section>
  );
}
