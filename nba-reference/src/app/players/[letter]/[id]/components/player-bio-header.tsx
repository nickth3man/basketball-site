/**
 * @fileoverview Player bio header component - displays player photo, basic info, and career summary.
 *
 * @module @/app/players/[letter]/[id]/components/player-bio-header
 */

import Image from 'next/image';
import { StarButton } from '@/components/favorites';
import { formatPercentage } from '@/lib/formatters';
import type { PlayerProfile } from '@/lib/queries/players/profile';

interface PlayerBioHeaderProps {
  player: PlayerProfile;
  summary: Record<string, number | null>;
}

/**
 * Renders the player bio header with photo, basic information, and career summary stats.
 */
export function PlayerBioHeader({ player, summary }: PlayerBioHeaderProps): React.JSX.Element {
  return (
    <section className="mb-5 border border-line bg-paper-soft p-4">
      <div className="grid gap-4 md:grid-cols-[140px_1fr_260px]">
        {/* Player headshot from Basketball-Reference CDN */}
        <div>
          <Image
            src={`https://www.basketball-reference.com/req/202106291/images/headshots/${player.bref_id}.jpg`}
            alt={`Photo of ${player.full_name}`}
            width={130}
            height={170}
            className="h-42.5 w-32.5 border border-image-line object-cover"
          />
        </div>

        {/* Basic player info grid */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-3xl font-bold">{player.full_name}</h1>
            <StarButton id={player.bref_id} type="player" name={player.full_name} />
          </div>
          <div className="grid gap-1 text-sm text-muted-strong sm:grid-cols-2">
            <div>Position: {player.position ?? '-'}</div>
            <div>Birth: {player.birth_date ?? '-'}</div>
            <div>
              Birthplace:{' '}
              {(() => {
                const parts = [player.birth_city, player.birth_country].filter(
                  (part): part is string => part !== null && part.length > 0
                );
                return parts.length > 0 ? parts.join(', ') : '-';
              })()}
            </div>
            <div>College: {player.college ?? '-'}</div>
            <div>
              Height: {player.height_cm !== null ? `${Math.round(player.height_cm)} cm` : '-'}
            </div>
            <div>
              Weight: {player.weight_kg !== null ? `${Math.round(player.weight_kg)} kg` : '-'}
            </div>
            <div>
              Draft:{' '}
              {player.draft_year != null
                ? `${player.draft_year} R${player.draft_round ?? '?'} P${player.draft_number ?? '?'}`
                : '-'}
            </div>
            <div>Status: {player.is_active === 1 ? 'Active' : 'Inactive'}</div>
            <div>Hall of Fame: {player.hof === 1 ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Career summary stats card */}
        <div className="border border-line-mid bg-white p-3 text-xs">
          <div className="mb-2 font-bold tracking-wide text-crumb uppercase">Career Summary</div>
          <div className="grid grid-cols-2 gap-y-1">
            <span>G</span>
            <span className="text-right tabular-nums">{summary['g'] ?? '-'}</span>
            <span>PTS/G</span>
            <span className="text-right tabular-nums">{summary['pts_pg'] ?? '-'}</span>
            <span>REB/G</span>
            <span className="text-right tabular-nums">{summary['reb_pg'] ?? '-'}</span>
            <span>AST/G</span>
            <span className="text-right tabular-nums">{summary['ast_pg'] ?? '-'}</span>
            <span>FG%</span>
            <span className="text-right tabular-nums">
              {formatPercentage(summary['fg_pct'] as number | null)}
            </span>
            <span>3P%</span>
            <span className="text-right tabular-nums">
              {formatPercentage(summary['fg3_pct'] as number | null)}
            </span>
            <span>FT%</span>
            <span className="text-right tabular-nums">
              {formatPercentage(summary['ft_pct'] as number | null)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
