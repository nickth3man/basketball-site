/**
 * @fileoverview RSS feed for blog posts.
 *
 * Generates a valid RSS 2.0 feed at /rss/blog.xml containing all published
 * blog posts with full content. Suitable for feed readers and podcast clients.
 *
 * @module @/app/rss/blog.xml
 */

import { type NextRequest, NextResponse } from 'next/server';
import RSS from 'rss';
import { getAllBlogPosts, getBlogPost } from '@/lib/content';
import { getSiteUrl } from '@/lib/site-config';

export const dynamic = 'force-static';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const siteUrl = getSiteUrl();
  const posts = getAllBlogPosts();

  const feed = new RSS({
    title: 'NBA Reference Blog',
    description:
      'In-depth basketball analysis, statistical deep dives, and historical retrospectives from the NBA Reference editorial team.',
    feed_url: `${siteUrl}/rss/blog.xml`,
    site_url: siteUrl,
    language: 'en',
    ttl: 60,
    pubDate: posts[0] !== undefined ? new Date(posts[0].date) : new Date(),
    copyright: `${new Date().getFullYear()} NBA Reference`,
  });

  for (const post of posts) {
    const fullPost = await getBlogPost(post.slug);
    feed.item({
      title: post.title,
      description: fullPost?.content ?? post.excerpt,
      url: `${siteUrl}/blog/${post.slug}`,
      date: new Date(post.date),
      categories: post.tags,
      author: post.author,
      guid: `${siteUrl}/blog/${post.slug}`,
    });
  }

  const xml = feed.xml({ indent: true });

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
