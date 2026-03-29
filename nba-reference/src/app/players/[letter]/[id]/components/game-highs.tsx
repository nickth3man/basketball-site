/**
 * @fileoverview Game highs component - displays career single-game maximums.
 *
 * @module @/app/players/[letter]/[id]/components/game-highs
 */

interface GameHighsProps {
  highs: Record<string, number | null>;
}

/**
 * Renders a grid of career single-game highs.
 */
export function GameHighs({ highs }: GameHighsProps): React.JSX.Element {
  return (
    <section id="highs" className="scroll-mt-4 surface-pedestal p-4">
      <h2 className="mb-4 inscription-title text-xl">Game Highs</h2>
      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="surface-inset p-3">
          MP: <span className="font-bold tabular-nums">{highs['mp'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          FG: <span className="font-bold tabular-nums">{highs['fg'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          FGA: <span className="font-bold tabular-nums">{highs['fga'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          3P: <span className="font-bold tabular-nums">{highs['fg3'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          3PA: <span className="font-bold tabular-nums">{highs['fg3a'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          FT: <span className="font-bold tabular-nums">{highs['ft'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          FTA: <span className="font-bold tabular-nums">{highs['fta'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          PTS: <span className="font-bold tabular-nums">{highs['pts'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          REB: <span className="font-bold tabular-nums">{highs['reb'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          AST: <span className="font-bold tabular-nums">{highs['ast'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          STL: <span className="font-bold tabular-nums">{highs['stl'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          BLK: <span className="font-bold tabular-nums">{highs['blk'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          TOV: <span className="font-bold tabular-nums">{highs['tov'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          PF: <span className="font-bold tabular-nums">{highs['pf'] ?? '-'}</span>
        </div>
        <div className="surface-inset p-3">
          +/-: <span className="font-bold tabular-nums">{highs['plus_minus'] ?? '-'}</span>
        </div>
      </div>
    </section>
  );
}
