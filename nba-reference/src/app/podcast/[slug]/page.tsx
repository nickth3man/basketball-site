/**
 * @fileoverview Individual podcast episode page.
 *
 * Renders a single podcast episode with embedded audio player, show notes
 * rendered from markdown, and related links. Uses terracotta accent per design spec.
 *
 * @module @/app/podcast/[slug]
 */

import type React from 'react';
import type { CSSProperties } from 'react';
import type { Route } from 'next';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPodcastEpisode, getAllPodcastEpisodes } from '@/lib/content';
import { getSiteUrl } from '@/lib/site-config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): Array<{ slug: string }> {
  const episodes = getAllPodcastEpisodes();
  return episodes.map(ep => ({ slug: ep.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getPodcastEpisode(slug);
  if (!episode) return { title: 'Episode Not Found | NBA Reference' };

  const siteUrl = getSiteUrl();
  return {
    title: `${episode.title} | NBA Reference Podcast`,
    description: episode.excerpt,
    openGraph: {
      title: episode.title,
      description: episode.excerpt,
      type: 'article',
      publishedTime: episode.date,
      url: `${siteUrl}/podcast/${episode.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: episode.title,
      description: episode.excerpt,
    },
  };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default async function PodcastEpisodePage({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const episode = await getPodcastEpisode(slug);

  if (!episode) notFound();

  const siteUrl = getSiteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: episode.title,
    description: episode.excerpt,
    episodeNumber: episode.episodeNumber,
    datePublished: episode.date,
    duration: episode.duration,
    url: `${siteUrl}/podcast/${episode.slug}`,
    audio:
      episode.audioUrl.length > 0
        ? {
            '@type': 'AudioObject',
            contentUrl: episode.audioUrl,
            encodingFormat: 'audio/mpeg',
          }
        : undefined,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'NBA Reference Podcast',
      url: `${siteUrl}/podcast`,
    },
    keywords: episode.tags.join(', '),
  };

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-link hover:underline">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/podcast" className="hover:text-link hover:underline">
            Podcast
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-crumb">Episode {episode.episodeNumber}</span>
        </nav>

        {/* Episode header */}
        <header
          className="mb-8 overflow-hidden rounded-lg"
          style={{ background: 'var(--dc-secondary)' }}
        >
          <div className="px-8 py-10">
            <div className="mb-3 flex items-center gap-3">
              <span
                className="rounded-full px-3 py-1 font-serif text-xs font-bold text-white/90"
                style={{ background: 'rgba(0,0,0,0.25)' }}
              >
                Episode {episode.episodeNumber}
              </span>
              <span className="text-sm text-white/70">{episode.duration}</span>
            </div>
            <h1 className="mb-3 font-serif text-2xl leading-tight font-bold tracking-[var(--tracking-inscription)] text-white md:text-3xl">
              {episode.title}
            </h1>
            <p className="text-sm text-white/70">{formatDate(episode.date)}</p>
          </div>

          {/* Audio player — full width */}
          {episode.audioUrl.length > 0 && (
            <div className="px-8 pb-8">
              <audio
                controls
                preload="metadata"
                className="w-full"
                aria-label={`Audio player for ${episode.title}`}
                style={{ accentColor: 'var(--dc-tertiary-fixed)' } satisfies CSSProperties}
              >
                <source src={episode.audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.{' '}
                <Link href={episode.audioUrl as Route} className="text-white underline">
                  Download the episode
                </Link>
                .
              </audio>
            </div>
          )}
        </header>

        {/* Tags */}
        <div className="mb-6 flex flex-wrap gap-2">
          {episode.tags.map(tag => (
            <span key={tag} className="stat-coin text-xs">
              {tag}
            </span>
          ))}
        </div>

        {/* Excerpt */}
        <p className="mb-6 text-base leading-relaxed font-medium text-muted-strong italic">
          {episode.excerpt}
        </p>

        {/* Show notes rendered from markdown */}
        <div className="panel-paper px-8 py-8">
          <div className="prose-blog" dangerouslySetInnerHTML={{ __html: episode.content }} />
        </div>

        {/* Footer nav */}
        <div className="mt-8 flex justify-between">
          <Link
            href="/podcast"
            className="inline-flex items-center gap-1 text-sm text-link transition-all hover:gap-2 hover:underline"
          >
            <span aria-hidden="true">&larr;</span>
            All Episodes
          </Link>
          <Link href="/blog" className="text-sm text-muted transition-colors hover:text-link">
            Read the Blog →
          </Link>
        </div>
      </main>
    </>
  );
}
