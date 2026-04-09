export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://dalxic.com/sitemap.xml",
    host: "https://dalxic.com",
  }
}
