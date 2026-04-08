import "./globals.css"
import Script from "next/script"

const SITE_URL = "https://dalxic.com"

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dalxic — Forensic Excellence | We Catch Every Lie",
    template: "%s | Dalxic",
  },
  description: "Dalxic is the world's most advanced AI detection and forensic intelligence platform. Trained on 2.4 billion samples, Nexus-7™ detects AI-manipulated images, deepfake videos, synthetic audio, misinformation and fake news with 98.9% accuracy.",
  keywords: [
    "AI detection", "deepfake detector", "AI image detector", "fake video detector",
    "AI audio detection", "misinformation detection", "fake news detector", "AI forensics",
    "government AI detection", "media authenticity", "synthetic media detector",
    "deepfake forensics", "AI manipulation detection", "news verification AI",
    "AI content verification", "digital forensics AI", "detect AI generated content",
    "AI video detector", "AI audio detector", "forensic AI analysis",
    "Dalxic", "Nexus-7", "AI authenticity checker", "media forensics platform",
    "enterprise AI detection", "broadcast media forensics", "journalism AI tools",
    "AI disinformation", "counter-disinformation AI", "AI-generated media",
    "government forensics tool", "judiciary AI analysis", "tax authority AI verification",
  ],
  authors: [{ name: "Dalxic" }],
  creator: "Dalxic",
  publisher: "Dalxic",
  category: "Technology",
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website", locale: "en_US",
    url: SITE_URL,
    siteName: "Dalxic",
    title: "Dalxic — We Catch Every Lie | 98.9% Detection Accuracy",
    description: "The world's leading forensic AI platform. Nexus-7™ trained on 2.4B+ samples detects AI manipulation in images, videos, audio and news with unprecedented precision.",
    images: [{ url: "/logo.jpg", width: 1200, height: 630, alt: "Dalxic — Forensic Excellence" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DalxicAI",
    creator: "@DalxicAI",
    title: "Dalxic — Forensic Excellence | Detect AI Manipulation",
    description: "98.9% accurate AI detection. Trusted by governments, broadcasters and judiciary worldwide. Nexus-7™ catches every lie.",
    images: ["/logo.jpg"],
  },
  alternates: { canonical: SITE_URL },
  other: {
    "theme-color": "#6366F1",
    "msapplication-TileColor": "#03050F",
    "msapplication-TileImage": "/logo.jpg",
    "msapplication-config": "/browserconfig.xml",
    "application-name": "Dalxic",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Dalxic",
    "mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/logo.jpg", sizes: "32x32",   type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "96x96",   type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "192x192", type: "image/jpeg" },
    ],
    apple: [
      { url: "/logo.jpg", sizes: "57x57",   type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "60x60",   type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "72x72",   type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "76x76",   type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "114x114", type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "120x120", type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "144x144", type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "152x152", type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "180x180", type: "image/jpeg" },
    ],
    other: [
      { rel: "mask-icon", url: "/logo.jpg", color: "#6366F1" },
    ],
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: "Dalxic",
      url: SITE_URL,
      description: "World's leading AI forensic detection platform. Detects AI-generated images, deepfake videos, synthetic audio, and misinformation with 98.9% accuracy.",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Any",
      featureList: ["AI image detection","Deepfake video forensics","Synthetic audio detection","News & misinformation analysis","Combined audio-video forensics","Advanced PDF forensic reports","Enterprise integrations","Dalxic Chat AI assistant"],
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.98", ratingCount: "3841", bestRating: "5" },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Dalxic",
      url: SITE_URL,
      description: "The world's highest-standard AI detection and forensic intelligence company, trained on 2.4 billion samples.",
      foundingDate: "2023",
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={SITE_URL} />
        <link rel="manifest" href="/site.webmanifest" />
        {/* Google Fonts — Space Grotesk + Lato */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Master font import — every family/weight used across the entire site */}
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=Lato:ital,wght@0,100;0,300;0,400;0,700;1,100;1,300&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
