export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/about", "/team", "/pricing", "/workstation", "/chat", "/reports", "/integrations"], disallow: ["/api/", "/auth"] },
    ],
    sitemap: "https://dalxic.com/sitemap.xml",
    host: "https://dalxic.com",
  }
}
