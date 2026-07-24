import type { MetadataRoute } from 'next';
import { blogPosts } from '@/data/blog-posts';
import { absoluteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: '2026-07-24', changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/blog'), lastModified: '2026-07-24', changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/exames'), lastModified: '2026-07-24', changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/privacidade'), lastModified: '2026-07-24', changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/editorial'), lastModified: '2026-07-24', changeFrequency: 'yearly', priority: 0.5 },
    { url: absoluteUrl('/medicos/dr-paulo-roberto-nogueira'), lastModified: '2026-07-24', changeFrequency: 'monthly', priority: 0.9 },
    { url: absoluteUrl('/medicos/dra-cristiani-nogueira'), lastModified: '2026-07-24', changeFrequency: 'monthly', priority: 0.9 },
  ];

  const articles: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.updatedAt,
    changeFrequency: 'monthly',
    priority: post.featured ? 0.8 : 0.7,
    images: [absoluteUrl(post.coverImage)],
  }));

  return [...staticPages, ...articles];
}
