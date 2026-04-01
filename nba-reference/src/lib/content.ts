/**
 * @fileoverview Utilities for reading blog post and podcast episode content
 * from markdown files in the /content directory.
 *
 * Content files use YAML frontmatter (parsed via gray-matter) for metadata
 * and CommonMark markdown for body text.
 *
 * @module @/lib/content
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

const contentRoot = path.join(process.cwd(), '..', 'content');

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  author: string;
  readingTime: number;
  content: string;
}

export type BlogPostMeta = Omit<BlogPost, 'content'>;

function getBlogDir(): string {
  return path.join(contentRoot, 'blog');
}

function getPodcastDir(): string {
  return path.join(contentRoot, 'podcast');
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

/**
 * Returns all blog post slugs (derived from filenames).
 */
export function getBlogSlugs(): string[] {
  const dir = getBlogDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''));
}

/**
 * Returns metadata for all blog posts, sorted newest-first.
 */
export function getAllBlogPosts(): BlogPostMeta[] {
  const slugs = getBlogSlugs();
  const posts = slugs.map(slug => {
    const fullPath = path.join(getBlogDir(), `${slug}.md`);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(raw);
    return {
      slug: str(data['slug'], slug),
      title: str(data['title']),
      date: str(data['date']),
      excerpt: str(data['excerpt']),
      tags: strArr(data['tags']),
      author: str(data['author']),
      readingTime: num(data['readingTime'], 5),
    } satisfies BlogPostMeta;
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Returns a single blog post including rendered HTML content.
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  // Try both the slug itself and filename patterns like YYYY-MM-slug
  const dir = getBlogDir();
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const match = files.find(f => {
    const fileSlug = f.replace(/\.md$/, '');
    return fileSlug === slug || fileSlug.endsWith(`-${slug}`) || fileSlug.includes(slug);
  });

  if (match === undefined) return null;

  const fullPath = path.join(dir, match);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, content: rawContent } = matter(raw);

  const processed = await remark().use(remarkHtml, { sanitize: false }).process(rawContent);
  const contentHtml = processed.toString();

  return {
    slug: str(data['slug'], slug),
    title: str(data['title']),
    date: str(data['date']),
    excerpt: str(data['excerpt']),
    tags: strArr(data['tags']),
    author: str(data['author']),
    readingTime: num(data['readingTime'], 5),
    content: contentHtml,
  };
}

// ---------------------------------------------------------------------------
// Podcast episodes
// ---------------------------------------------------------------------------

export interface PodcastEpisode {
  slug: string;
  title: string;
  date: string;
  episodeNumber: number;
  duration: string;
  audioUrl: string;
  excerpt: string;
  tags: string[];
  author: string;
  hasTranscript: boolean;
  content: string;
}

export type PodcastEpisodeMeta = Omit<PodcastEpisode, 'content'>;

/**
 * Returns all podcast episode slugs.
 */
export function getPodcastSlugs(): string[] {
  const dir = getPodcastDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''));
}

/**
 * Returns metadata for all podcast episodes, sorted newest-first.
 */
export function getAllPodcastEpisodes(): PodcastEpisodeMeta[] {
  const slugs = getPodcastSlugs();
  const episodes = slugs.map(slug => {
    const fullPath = path.join(getPodcastDir(), `${slug}.md`);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(raw);
    return {
      slug: str(data['slug'], slug),
      title: str(data['title']),
      date: str(data['date']),
      episodeNumber: num(data['episodeNumber']),
      duration: str(data['duration']),
      audioUrl: str(data['audioUrl']),
      excerpt: str(data['excerpt']),
      tags: strArr(data['tags']),
      author: str(data['author']),
      hasTranscript: bool(data['hasTranscript']),
    } satisfies PodcastEpisodeMeta;
  });

  return episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);
}

/**
 * Returns a single podcast episode including rendered HTML content.
 */
export async function getPodcastEpisode(slug: string): Promise<PodcastEpisode | null> {
  const dir = getPodcastDir();
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const match = files.find(f => {
    const fileSlug = f.replace(/\.md$/, '');
    return fileSlug === slug || fileSlug.endsWith(`-${slug}`) || fileSlug.includes(slug);
  });

  if (match === undefined) return null;

  const fullPath = path.join(dir, match);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, content: rawContent } = matter(raw);

  const processed = await remark().use(remarkHtml, { sanitize: false }).process(rawContent);
  const contentHtml = processed.toString();

  return {
    slug: str(data['slug'], slug),
    title: str(data['title']),
    date: str(data['date']),
    episodeNumber: num(data['episodeNumber']),
    duration: str(data['duration']),
    audioUrl: str(data['audioUrl']),
    excerpt: str(data['excerpt']),
    tags: strArr(data['tags']),
    author: str(data['author']),
    hasTranscript: bool(data['hasTranscript']),
    content: contentHtml,
  };
}
