import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing"],
        disallow: ["/api/", "/w/", "/kiosk"],
      },
    ],
    sitemap: "https://health.dalxic.com/sitemap.xml",
    host: "https://health.dalxic.com",
  }
}
