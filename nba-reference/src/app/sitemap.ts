import type { MetadataRoute } from 'next';
import { getAllStarSeasons } from '@/lib/queries/allstar';
import { getDraftSeasons } from '@/lib/queries/draft';
import { getPlayoffSeasons } from '@/lib/queries/playoffs';
import { getSeasonList } from '@/lib/queries/seasons';
import { getTeamDirectory } from '@/lib/query/directory';
import { getSiteUrl } from '@/lib/site-config';
import { getAllBlogPosts, getAllPodcastEpisodes } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    {
      url: `${baseUrl}/players`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    { url: `${baseUrl}/teams`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    {
      url: `${baseUrl}/seasons`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaders`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/boxscores`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    { url: `${baseUrl}/draft`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    {
      url: `${baseUrl}/playoffs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/awards`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/allstar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/leagues/salary-cap`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/standings`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/podcast`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Dynamic routes - Teams
  const teams = getTeamDirectory();
  const teamRoutes: MetadataRoute.Sitemap = teams.map((team: { abbreviation: string }) => ({
    url: `${baseUrl}/teams/${team.abbreviation}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const teamSalaryRoutes: MetadataRoute.Sitemap = teams.map((team: { abbreviation: string }) => ({
    url: `${baseUrl}/teams/${team.abbreviation}/salaries`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Dynamic routes - Seasons
  const seasons = getSeasonList();
  const seasonRoutes: MetadataRoute.Sitemap = seasons.map((season: { end_year: number }) => ({
    url: `${baseUrl}/seasons/${season.end_year}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Dynamic routes - Draft years
  const draftYears = getDraftSeasons();
  const draftRoutes: MetadataRoute.Sitemap = draftYears.map((year: { end_year: number }) => ({
    url: `${baseUrl}/draft/${year.end_year}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Dynamic routes - Playoff seasons
  const playoffSeasons = getPlayoffSeasons();
  const playoffRoutes: MetadataRoute.Sitemap = playoffSeasons.map(season => ({
    url: `${baseUrl}/playoffs/${season.season_id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Dynamic routes - All-Star years
  const allStarSeasons = getAllStarSeasons();
  const allStarRoutes: MetadataRoute.Sitemap = allStarSeasons.map(season => {
    const year = season.end_year.toString().slice(-2);
    return {
      url: `${baseUrl}/allstar/${year}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    };
  });

  // Award pages
  const awardRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/awards/mvp`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/awards/dpoy`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/awards/roy`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/awards/all_league`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/awards/all_defense`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  const allLeagueVoteRoutes: MetadataRoute.Sitemap = seasons.map(
    (season: { season_id: string }) => ({
      url: `${baseUrl}/awards/all_league/${season.season_id}/votes`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  );

  // Dynamic routes - Blog posts
  const blogPosts = getAllBlogPosts();
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Dynamic routes - Podcast episodes
  const podcastEpisodes = getAllPodcastEpisodes();
  const podcastRoutes: MetadataRoute.Sitemap = podcastEpisodes.map(ep => ({
    url: `${baseUrl}/podcast/${ep.slug}`,
    lastModified: new Date(ep.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...teamRoutes,
    ...teamSalaryRoutes,
    ...seasonRoutes,
    ...draftRoutes,
    ...playoffRoutes,
    ...allStarRoutes,
    ...awardRoutes,
    ...allLeagueVoteRoutes,
    ...blogRoutes,
    ...podcastRoutes,
  ];
}
