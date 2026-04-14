import type { MetadataRoute } from "next"

/**
 * Sitemap — only public-facing pages.
 * All workstation routes, API endpoints, and internal paths are excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://health.dalxic.com"
  const now = new Date()

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/kiosk`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]
}
