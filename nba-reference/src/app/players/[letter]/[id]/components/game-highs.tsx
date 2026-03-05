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
    <section id="highs" className="scroll-mt-4 border border-line-mid bg-white p-3">
      <h2 className="mb-2 text-xl font-bold">Game Highs</h2>
      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          MP: <span className="font-bold tabular-nums">{highs['mp'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          FG: <span className="font-bold tabular-nums">{highs['fg'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          FGA: <span className="font-bold tabular-nums">{highs['fga'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          3P: <span className="font-bold tabular-nums">{highs['fg3'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          3PA: <span className="font-bold tabular-nums">{highs['fg3a'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          FT: <span className="font-bold tabular-nums">{highs['ft'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          FTA: <span className="font-bold tabular-nums">{highs['fta'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          PTS: <span className="font-bold tabular-nums">{highs['pts'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          REB: <span className="font-bold tabular-nums">{highs['reb'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          AST: <span className="font-bold tabular-nums">{highs['ast'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          STL: <span className="font-bold tabular-nums">{highs['stl'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          BLK: <span className="font-bold tabular-nums">{highs['blk'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          TOV: <span className="font-bold tabular-nums">{highs['tov'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          PF: <span className="font-bold tabular-nums">{highs['pf'] ?? '-'}</span>
        </div>
        <div className="rounded border border-line-subtle bg-row-alt p-2">
          +/-: <span className="font-bold tabular-nums">{highs['plus_minus'] ?? '-'}</span>
        </div>
      </div>
    </section>
  );
}
