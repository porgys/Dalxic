export default function sitemap() {
  const base = "https://dalxic.com"
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
  ]
}
