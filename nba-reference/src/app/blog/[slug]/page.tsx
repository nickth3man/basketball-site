/**
 * @fileoverview Individual blog post page.
 *
 * Renders a single blog post from markdown content. Uses structured data
 * (JSON-LD Article schema) for SEO, and editorial typography from the
 * "Scholarly Spectacle" design system.
 *
 * @module @/app/blog/[slug]
 */

import type React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPost, getAllBlogPosts } from '@/lib/content';
import { getSiteUrl } from '@/lib/site-config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): Array<{ slug: string }> {
  const posts = getAllBlogPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: 'Post Not Found | NBA Reference' };

  const siteUrl = getSiteUrl();
  return {
    title: `${post.title} | NBA Reference Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      url: `${siteUrl}/blog/${post.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

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

export default async function BlogPostPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  const siteUrl = getSiteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    datePublished: post.date,
    publisher: {
      '@type': 'Organization',
      name: 'NBA Reference',
      url: siteUrl,
    },
    url: `${siteUrl}/blog/${post.slug}`,
    keywords: post.tags.join(', '),
  };

  return (
    <>
      {/* JSON-LD structured data for SEO */}
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
          <Link href="/blog" className="hover:text-link hover:underline">
            Blog
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-crumb">{post.title}</span>
        </nav>

        {/* Article header — fresco hero */}
        <header className="fresco-hero mb-8 rounded-lg px-8 py-10">
          <div className="mb-3 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="stat-coin text-xs">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="mb-3 font-serif text-3xl leading-tight font-bold tracking-[var(--tracking-inscription)] text-[var(--dc-tertiary-fixed)] md:text-4xl">
            {post.title}
          </h1>
          <p className="text-sm text-white/70">
            By {post.author} &middot; {formatDate(post.date)} &middot; {post.readingTime} min read
          </p>
        </header>

        {/* Article body */}
        <article className="panel-paper px-8 py-8">
          {/* Excerpt / lead */}
          <p className="mb-8 text-base leading-relaxed font-medium text-muted-strong italic">
            {post.excerpt}
          </p>

          {/* Drop cap + rendered markdown */}
          <div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Footer nav */}
        <div className="mt-8 flex justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-link transition-all hover:gap-2 hover:underline"
          >
            <span aria-hidden="true">&larr;</span>
            Back to Blog
          </Link>
          <Link
            href="/rss/blog.xml"
            className="text-sm text-muted transition-colors hover:text-link"
          >
            Subscribe via RSS 🔔
          </Link>
        </div>
      </main>
    </>
  );
}
