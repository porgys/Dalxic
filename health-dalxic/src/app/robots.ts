import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/", "/w/", "/kiosk", "/pricing"],
      },
    ],
    sitemap: "https://health.dalxic.com/sitemap.xml",
    host: "https://health.dalxic.com",
  }
}
