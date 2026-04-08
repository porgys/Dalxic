export default function sitemap() {
  const base = "https://media.dalxic.com"
  const routes = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/team`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/workstation`, changeFrequency: "always", priority: 0.95 },
    { url: `${base}/reports`, changeFrequency: "always", priority: 0.85 },
    { url: `${base}/chat`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/integrations`, changeFrequency: "monthly", priority: 0.7 },
  ]
  return routes.map(r => ({ ...r, lastModified: new Date() }))
}
