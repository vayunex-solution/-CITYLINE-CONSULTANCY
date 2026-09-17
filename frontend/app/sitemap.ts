import { MetadataRoute } from 'next';
import { SEED_JOBS } from '@/lib/data/jobs';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://citylineconsultancy.com';
  const currentDate = new Date().toISOString();

  // Static public routes
  const staticRoutes = [
    '',
    '/about',
    '/visa-services',
    '/visa-services/freelance-visa',
    '/visa-services/visit-visa-30-days',
    '/visa-services/visit-visa-60-days',
    '/recruitment',
    '/jobs',
    '/business-setup',
    '/testimonials',
    '/contact',
    '/faq',
    '/visa-enquiry',
    '/employer-enquiry',
  ].map((route) => {
    const formattedRoute = route === '' ? '/' : `${route}/`;
    return {
      url: `${baseUrl}${formattedRoute}`,
      lastModified: currentDate,
      changeFrequency: route === '' ? ('daily' as const) : route.startsWith('/visa-services') || route === '/jobs' ? ('weekly' as const) : ('monthly' as const),
      priority: route === '' ? 1.0 : route.startsWith('/visa-services') || route === '/business-setup' ? 0.9 : 0.8,
    };
  });

  // Dynamic job listing and apply routes
  const jobRoutes = SEED_JOBS.flatMap((job) => [
    {
      url: `${baseUrl}/jobs/${job.slug}/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/jobs/${job.slug}/apply/`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ]);

  return [...staticRoutes, ...jobRoutes];
}
