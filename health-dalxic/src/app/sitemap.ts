import type { MetadataRoute } from "next"

/**
 * Sitemap — only public-facing pages.
 * All workstation routes, API endpoints, and internal paths are excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://health.dalxic.com"

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
