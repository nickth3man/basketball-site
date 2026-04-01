import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function AwardsPage(): React.JSX.Element {
  const awards = [
    {
      name: 'Most Valuable Player (MVP)',
      description:
        'The Michael Jordan Trophy - awarded to the best performing player of the regular season',
      href: '/awards/mvp',
      trophy: 'Michael Jordan Trophy',
    },
    {
      name: 'Defensive Player of the Year (DPOY)',
      description: 'The Hakeem Olajuwon Trophy - awarded to the best defensive player',
      href: '/awards/dpoy',
      trophy: 'Hakeem Olajuwon Trophy',
    },
    {
      name: 'Rookie of the Year (ROY)',
      description: 'The Wilt Chamberlain Trophy - awarded to the best first-year player',
      href: '/awards/roy',
      trophy: 'Wilt Chamberlain Trophy',
    },
    {
      name: 'All-NBA Teams',
      description: 'The best 15 players in the league, selected to First, Second, and Third teams',
      href: '/awards/all_league',
      trophy: 'Annual Selection',
    },
    {
      name: 'All-Defensive Teams',
      description: "The league's best defenders, selected to First and Second teams each season",
      href: '/awards/all_defense',
      trophy: 'Annual Selection',
    },
    {
      name: 'All-Rookie Teams',
      description:
        'First-team and second-team All-Rookie selections — 5 players per team each season',
      href: '/awards/all_rookie',
      trophy: 'Annual Selection',
    },
    {
      name: 'Scoring Champions',
      description: 'Player with the highest points per game each season (min. 25 games)',
      href: '/awards/scoring',
      trophy: 'Scoring Title',
    },
    {
      name: 'Assists Leaders',
      description: 'Player with the highest assists per game each season (min. 25 games)',
      href: '/awards/assists',
      trophy: 'Assists Title',
    },
    {
      name: 'Steals Leaders',
      description: 'Player with the highest steals per game each season (min. 25 games)',
      href: '/awards/steals',
      trophy: 'Steals Title',
    },
    {
      name: 'Blocks Leaders',
      description: 'Player with the highest blocks per game each season (min. 25 games)',
      href: '/awards/blocks',
      trophy: 'Blocks Title',
    },
    {
      name: 'Rebounds Leaders',
      description: 'Player with the highest rebounds per game each season (min. 25 games)',
      href: '/awards/rebounds',
      trophy: 'Rebounds Title',
    },
    {
      name: 'NBA All-Star Game MVP',
      description: 'Most Valuable Player of the NBA All-Star Game by season',
      href: '/awards/allstar_mvp',
      trophy: 'Kobe Bryant Trophy',
    },
    {
      name: 'NBA All-Star Selections',
      description: 'All-Star game rosters — starters and reserves for each conference by season',
      href: '/awards/allstar_voting',
      trophy: 'Annual Selection',
    },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">NBA Awards</h1>
      <p className="mb-5 text-sm text-muted">
        Historical award winners, voting results, and All-NBA team selections.
      </p>

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">Select Award</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Award</th>
                <th className={tableHeaderCellClass('left')}>Trophy Name</th>
                <th className={tableHeaderCellClass('left')}>Description</th>
                <th className={tableHeaderCellClass('left')}>View</th>
              </tr>
            </thead>
            <tbody>
              {awards.map((award, index) => (
                <tr key={award.href} className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}>
                  <td className={tableCellClass('left')}>
                    <Link href={award.href as Route} className={tableLinkClass}>
                      {award.name}
                    </Link>
                  </td>
                  <td className={tableCellClass('left')}>{award.trophy}</td>
                  <td className={tableCellClass('left')}>{award.description}</td>
                  <td className={tableCellClass('left')}>
                    <Link href={award.href as Route} className="text-link hover:underline">
                      View History →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
