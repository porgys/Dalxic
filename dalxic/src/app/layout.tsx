import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Dalxic — One Universal Business Platform",
    template: "%s | Dalxic",
  },
  description: "Run your hospital, store, school, salon, or any business from one platform. Built in Ghana for Africa.",
  keywords: ["business management", "POS system", "hospital management", "school management", "Ghana", "Africa", "ERP"],
  authors: [{ name: "Dalxic" }],
  creator: "Dalxic",
  metadataBase: new URL("https://dalxic.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dalxic.com",
    siteName: "Dalxic",
    title: "Dalxic — One Universal Business Platform",
    description: "Run your hospital, store, school, salon, or any business from one platform. Built in Ghana for Africa.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dalxic — One Universal Business Platform",
    description: "Run your hospital, store, school, salon, or any business from one platform. Built in Ghana for Africa.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Dalxic",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "One universal business platform. Run your hospital, store, school, salon, or any business from one platform.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "GHS",
              },
              author: {
                "@type": "Organization",
                name: "Dalxic",
                url: "https://dalxic.com",
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  )
}
