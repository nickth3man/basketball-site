/**
 * @fileoverview Podcast index page — lists all episodes.
 *
 * Displays an episode list with embedded audio players and episode metadata.
 * Uses terracotta accent (#9f402d) per the design system specification.
 *
 * @module @/app/podcast
 */

import type React from 'react';
import type { Route } from 'next';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPodcastEpisodes } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Podcast | NBA Reference',
  description:
    'The NBA Reference Podcast — basketball analysis, statistical deep dives, and historical discussions.',
  openGraph: {
    title: 'Podcast | NBA Reference',
    description: 'Basketball analysis and statistics discussions from the NBA Reference team.',
    type: 'website',
  },
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function PodcastIndexPage(): React.JSX.Element {
  const episodes = getAllPodcastEpisodes();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <p className="mb-1 editorial-kicker">Listen &amp; Learn</p>
        <h1 className="mb-2 inscription-title text-4xl">The NBA Reference Podcast</h1>
        <p className="max-w-2xl text-sm text-muted">
          Statistical deep dives, historical discussions, and basketball analysis. New episodes
          dropping regularly — subscribe on your favorite podcast app.
        </p>
      </div>

      {/* Subscribe links */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/rss/blog.xml"
          className="surface-altar rounded-full px-4 py-2 text-xs font-medium text-heading ghost-border transition-all hover:shadow-[var(--shadow-glow-gold)]"
        >
          Blog RSS
        </Link>
      </div>

      {episodes.length === 0 ? (
        <div className="panel-paper p-8 text-center">
          <p className="text-muted">No episodes published yet. Check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {episodes.map(episode => (
            <article key={episode.slug} className="overflow-hidden panel-paper rounded-lg">
              {/* Episode header */}
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
                {/* Episode number badge */}
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg font-serif text-sm font-bold text-white"
                  style={{ background: 'var(--dc-secondary)' }}
                  aria-label={`Episode ${episode.episodeNumber}`}
                >
                  Ep.
                  <br />
                  {episode.episodeNumber}
                </div>

                <div className="flex-1">
                  <p className="mb-1 text-xs text-muted">
                    {formatDate(episode.date)} &middot; {episode.duration}
                  </p>
                  <h2 className="mb-2 inscription-title text-lg leading-snug">
                    <Link
                      href={`/podcast/${episode.slug}`}
                      className="hover:text-link hover:underline"
                    >
                      {episode.title}
                    </Link>
                  </h2>
                  <p className="mb-3 text-sm text-muted">{episode.excerpt}</p>

                  {/* Tags */}
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {episode.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="stat-coin text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Audio player */}
                  {episode.audioUrl.length > 0 && (
                    <audio
                      controls
                      preload="none"
                      className="w-full max-w-xl"
                      aria-label={`Audio player for ${episode.title}`}
                    >
                      <source src={episode.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.{' '}
                      <Link href={episode.audioUrl as Route} className="text-link underline">
                        Download the episode
                      </Link>
                      .
                    </audio>
                  )}
                </div>

                <Link
                  href={`/podcast/${episode.slug}`}
                  className="shrink-0 text-sm text-link transition-all hover:underline"
                >
                  View episode →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
