/**
 * @fileoverview Blog index page — lists all blog posts with tag filtering.
 *
 * Displays a paginated grid of blog post cards sorted newest-first.
 * Integrates with the "Scholarly Spectacle" design system.
 *
 * @module @/app/blog
 */

import type React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllBlogPosts } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Blog | NBA Reference',
  description:
    'In-depth basketball analysis, statistical deep dives, and historical retrospectives from the NBA Reference editorial team.',
  openGraph: {
    title: 'Blog | NBA Reference',
    description:
      'In-depth basketball analysis, statistical deep dives, and historical retrospectives.',
    type: 'website',
  },
};

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

export default function BlogIndexPage(): React.JSX.Element {
  const posts = getAllBlogPosts();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <p className="mb-1 editorial-kicker">Analysis &amp; Insights</p>
        <h1 className="mb-2 inscription-title text-4xl">The Scholarly Spectacle Blog</h1>
        <p className="max-w-2xl text-sm text-muted">
          Deep statistical dives, historical retrospectives, and basketball analysis from the NBA
          Reference editorial team.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="panel-paper p-8 text-center">
          <p className="text-muted">No posts published yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <article
              key={post.slug}
              className="group flex flex-col overflow-hidden panel-paper rounded-lg ambient-glow-hover"
            >
              {/* Fresco header band */}
              <div className="fresco-hero px-5 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="stat-coin text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="mb-1 text-xs text-muted">
                  {formatDate(post.date)} &middot; {post.readingTime} min read
                </p>
                <h2 className="mb-2 inscription-title text-lg leading-snug transition-colors group-hover:text-link">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="mb-4 flex-1 text-sm text-muted">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-link transition-all hover:gap-2 hover:underline"
                >
                  Read article
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* RSS link */}
      <div className="mt-10 text-center">
        <Link
          href="/rss/blog.xml"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-link"
        >
          <span aria-hidden="true">🔔</span>
          Subscribe via RSS
        </Link>
      </div>
    </main>
  );
}
