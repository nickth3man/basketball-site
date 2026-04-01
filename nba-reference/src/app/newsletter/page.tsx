/**
 * @fileoverview Newsletter landing & subscription page.
 *
 * Displays:
 * - Hero section with "Subscribe to the Daily NBA Recap" headline
 * - Email subscription form (client component)
 * - Sample newsletter preview rendered in email-template styling
 * - Link to the newsletter archive
 *
 * @module @/app/newsletter/page
 */

import type React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SubscribeForm } from './subscribe-form';
import { getSiteUrl } from '@/lib/site-config';

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  return {
    title: 'Daily NBA Newsletter — NBA Reference',
    description:
      "Subscribe to the Daily NBA Recap: last night's scores, top performers, and statistical highlights delivered every morning.",
    alternates: { canonical: `${siteUrl}/newsletter` },
    openGraph: {
      title: 'Daily NBA Newsletter',
      description:
        "Last night's scores, top performers, and highlights — in your inbox each morning.",
      url: `${siteUrl}/newsletter`,
      type: 'website',
    },
  };
}

// ---------------------------------------------------------------------------
// Sample newsletter preview (static HTML-in-React representation)
// ---------------------------------------------------------------------------

function SamplePreview(): React.JSX.Element {
  return (
    <div
      className="overflow-hidden surface-pedestal rounded-xl border border-[var(--line)]"
      aria-label="Sample newsletter edition"
    >
      {/* Email header */}
      <div className="fresco-hero px-6 py-5">
        <p className="text-xs font-semibold tracking-[0.12em] text-[color-mix(in_srgb,var(--dc-on-primary)_70%,transparent)] uppercase">
          NBA Reference · Daily Recap
        </p>
        <h3 className="mt-1 font-serif text-xl font-semibold">Monday, April 7 — Recap</h3>
        <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--dc-on-primary)_80%,transparent)]">
          4 games · 1 record broken
        </p>
      </div>

      {/* Email body */}
      <div className="divide-y divide-[var(--line)] px-6">
        {/* Scores */}
        <div className="py-4">
          <h4 className="mb-3 inscription-title text-sm">Last Night&apos;s Scores</h4>
          <div className="space-y-2 text-sm">
            {[
              { away: 'BOS', awayPts: 118, home: 'NYK', homePts: 109 },
              { away: 'LAL', awayPts: 122, home: 'GSW', homePts: 115 },
              { away: 'MIL', awayPts: 104, home: 'MIA', homePts: 97 },
              { away: 'DAL', awayPts: 131, home: 'PHX', homePts: 128 },
            ].map(g => (
              <div key={`${g.away}-${g.home}`} className="flex items-center gap-2">
                <span className="w-8 text-right font-mono text-muted">{g.awayPts}</span>
                <span className="w-8 font-semibold">{g.away}</span>
                <span className="text-muted">@</span>
                <span className="w-8 font-semibold">{g.home}</span>
                <span className="w-8 font-mono text-muted">{g.homePts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top performers */}
        <div className="py-4">
          <h4 className="mb-3 inscription-title text-sm">Top Performers</h4>
          <div className="space-y-1.5 text-sm">
            {[
              { name: 'J. Tatum', team: 'BOS', line: '38 PTS · 11 REB · 6 AST' },
              { name: 'L. James', team: 'LAL', line: '32 PTS · 8 REB · 11 AST' },
              { name: 'D. Lively', team: 'DAL', line: '24 PTS · 14 REB · 3 BLK' },
            ].map(p => (
              <div key={p.name} className="flex items-baseline justify-between gap-2">
                <span>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-1 text-xs text-muted">{p.team}</span>
                </span>
                <span className="stat-coin px-2 py-0.5 text-xs">{p.line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlight */}
        <div className="py-4">
          <h4 className="mb-2 inscription-title text-sm">Stat of the Night</h4>
          <p className="text-sm text-muted-strong">
            LeBron James recorded his{' '}
            <span className="font-semibold text-[var(--dc-tertiary)]">
              145th career triple-double
            </span>
            , extending his own NBA record.
          </p>
        </div>

        {/* Footer */}
        <div className="py-3 text-center">
          <p className="text-xs text-muted">
            View full box scores and stats at{' '}
            <span className="font-medium text-link">nba-reference.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Value proposition bullets
// ---------------------------------------------------------------------------

const BENEFITS = [
  {
    icon: '🏀',
    title: "Last night's scores",
    desc: 'Every completed game with final scores, delivered by 7 AM ET.',
  },
  {
    icon: '⭐',
    title: 'Top performers',
    desc: 'The biggest individual lines — points, rebounds, assists, and records.',
  },
  {
    icon: '📊',
    title: 'Stat highlights',
    desc: 'Records broken, milestones reached, and standout statistical achievements.',
  },
  {
    icon: '🗓️',
    title: "Today's schedule",
    desc: "A quick look at what's on tap tonight so you never miss a tip-off.",
  },
] as const;

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

/**
 * Newsletter subscription landing page.
 *
 * Renders the hero, subscription form, sample preview, and an archive link.
 */
export default function NewsletterPage(): React.JSX.Element {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 pt-4 pb-16">
      {/* Hero */}
      <section className="fresco-hero relative -mx-4 mb-10 fade-slide-in overflow-hidden px-5 py-12 sm:mx-0 sm:rounded-xl md:px-10 md:py-16">
        <p className="mb-2 editorial-kicker">NBA Reference Newsletter</p>
        <h1 className="font-serif text-3xl font-semibold tracking-[var(--tracking-inscription)] sm:text-4xl">
          Your Daily NBA Recap
        </h1>
        <p className="mt-4 max-w-xl text-sm text-[color-mix(in_srgb,var(--dc-on-primary)_85%,transparent)]">
          Last night&apos;s scores, top performers, and statistical highlights — delivered to your
          inbox every morning before you start your day.
        </p>
      </section>

      <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
        {/* Left column: form + benefits */}
        <div className="fade-slide-in space-y-8 [animation-delay:120ms]">
          {/* Subscription form */}
          <section className="surface-altar rounded-xl p-6">
            <h2 className="mb-1 inscription-title text-lg">Subscribe — it&apos;s free</h2>
            <p className="mb-5 text-sm text-muted">
              Join thousands of fans who wake up to NBA news every morning.
            </p>
            <SubscribeForm />
          </section>

          {/* Benefits */}
          <section>
            <h2 className="mb-4 inscription-title text-base">What&apos;s inside each edition</h2>
            <ul className="space-y-4">
              {BENEFITS.map(b => (
                <li key={b.title} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-xl leading-none" aria-hidden>
                    {b.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-muted">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Archive link */}
          <p className="text-sm text-muted">
            Curious what an edition looks like?{' '}
            <Link
              href="/newsletter/archive"
              className="text-link underline-offset-2 hover:underline"
            >
              Browse past editions →
            </Link>
          </p>
        </div>

        {/* Right column: sample preview */}
        <div className="fade-slide-in [animation-delay:220ms]">
          <h2 className="mb-4 inscription-title text-base">Sample edition</h2>
          <SamplePreview />
        </div>
      </div>
    </main>
  );
}
