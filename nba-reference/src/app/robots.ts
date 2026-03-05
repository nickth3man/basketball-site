import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const configuredBaseUrl = process.env['NEXT_PUBLIC_SITE_URL']?.trim();
  const baseUrl =
    configuredBaseUrl != null && configuredBaseUrl.length > 0
      ? configuredBaseUrl
      : 'https://nba-reference.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
