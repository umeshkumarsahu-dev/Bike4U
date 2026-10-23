import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.bikeforu.in';

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  try {
    const models = await prisma.model.findMany({
      include: { brand: true },
      take: 200,
    });

    for (const m of models) {
      routes.push({
        url: `${baseUrl}/bikes/${m.brand.slug}/${m.slug}`,
        lastModified: m.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  } catch (e) {
    // ignore during build if DB is unseeded
  }

  return routes;
}
