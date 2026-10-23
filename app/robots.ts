import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/results/', '/api/', '/admin/'],
      },
    ],
    sitemap: 'https://www.bikeforu.in/sitemap.xml',
  };
}
