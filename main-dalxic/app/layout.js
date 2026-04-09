import "./globals.css"

const SITE_URL = "https://dalxic.com"

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dalxic — The Worlds Most Advanced Integration Platform",
    template: "%s | Dalxic",
  },
  description: "Dalxic is a technology company creating infrastructure where it matters most. Three subsidiaries — DalxicHealth, DalxicForensics, DalxicJudiciary — powered by the Nexus-7™ engine. Built for Africa, scaled for the world.",
  keywords: [
    "Dalxic", "Nexus-7", "technology company Africa", "integration platform",
    "hospital management system", "forensic intelligence platform", "court operations system",
    "DalxicHealth", "DalxicForensics", "DalxicJudiciary",
    "healthcare technology Africa", "digital forensics Africa", "judiciary technology",
    "pan-African technology", "Ghana technology company", "African tech startup",
    "institutional technology", "enterprise platform Africa",
    "LiveQueue", "ChromaVeil", "NexusVerdict", "FlowEngine", "RedLine", "AuditVault",
  ],
  authors: [{ name: "Dalxic" }],
  creator: "Dalxic",
  publisher: "Dalxic",
  category: "Technology",
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Dalxic",
    title: "Dalxic — Technology That Solves Problems And Brings About Productivity",
    description: "Three subsidiaries. One engine. Healthcare, forensics, and judiciary — institutional-grade platforms built for Africa, scaled for the world.",
    images: [{ url: "/dalxic-city.jpg", width: 1200, height: 630, alt: "Dalxic — Technology Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@Dalxic",
    creator: "@Dalxic",
    title: "Dalxic — The Worlds Most Advanced Integration Platform",
    description: "Healthcare. Forensics. Judiciary. Three frontiers, one Nexus-7™ engine. Built for Africa.",
    images: ["/dalxic-city.jpg"],
  },
  alternates: { canonical: SITE_URL },
  other: {
    "theme-color": "#B87333",
    "msapplication-TileColor": "#03050F",
    "application-name": "Dalxic",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Dalxic",
    "mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Dalxic",
      url: SITE_URL,
      description: "Technology company creating institutional-grade infrastructure for healthcare, forensics, and judiciary across Africa.",
      foundingDate: "2024",
      areaServed: [
        { "@type": "Country", name: "Ghana" },
        { "@type": "Country", name: "Nigeria" },
        { "@type": "Country", name: "Kenya" },
        { "@type": "Country", name: "South Africa" },
        { "@type": "Country", name: "Rwanda" },
        { "@type": "Country", name: "Tanzania" },
        { "@type": "Country", name: "Ethiopia" },
        { "@type": "Country", name: "Senegal" },
      ],
      knowsAbout: ["Hospital Management", "Digital Forensics", "Court Operations", "Healthcare Technology"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Dalxic",
      url: SITE_URL,
      description: "The worlds most advanced integration platform. Three subsidiaries powered by Nexus-7™.",
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=Lato:ital,wght@0,100;0,300;0,400;0,700;1,100;1,300&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
