import type { Metadata } from "next"
import "./globals.css"

const SITE_URL = "https://operations.dalxic.com"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DalxicOperations — Business Management Platform",
    template: "%s | DalxicOperations",
  },
  description: "DalxicOperations powers retail, trade, and institutional management. Inventory, POS, enrollment, staff management, and multi-branch operations — built for businesses across Africa and beyond.",
  keywords: [
    "POS system", "retail management", "inventory management", "point of sale",
    "trade management", "school management system", "institutional management",
    "multi-branch management", "business operations", "stock management",
    "fee management", "enrollment system", "African business software",
    "DalxicTrade", "DalxicInstitute", "Dalxic", "business platform",
  ],
  authors: [{ name: "Dalxic" }],
  creator: "Dalxic",
  publisher: "Dalxic",
  category: "Business",
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website", locale: "en_US",
    url: SITE_URL,
    siteName: "DalxicOperations",
    title: "DalxicOperations — Run Your Business With Precision",
    description: "The complete business management platform. Trade, inventory, POS, enrollment, and institutional operations — all in one system.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DalxicOperations — Business Management Platform",
    description: "Trade. Institute. Operations. One platform for every business.",
  },
  alternates: { canonical: SITE_URL },
  other: {
    "theme-color": "#10B981",
    "msapplication-TileColor": "#040A0F",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "DalxicOps",
    "mobile-web-app-capable": "yes",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
