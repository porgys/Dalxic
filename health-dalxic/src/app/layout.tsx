import type { Metadata } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const SITE_URL = "https://health.dalxic.com"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DalxicHealth — Worlds Best Hospital Management System",
    template: "%s | DalxicHealth",
  },
  description: "End-to-end hospital management powered by Nexus-7™. 46+ connected workstations from patient intake to pharmacy dispensing. Built for Africa, designed for precision. Real-time queue systems, intelligent billing, emergency protocols, and complete operational connectivity.",
  keywords: [
    "hospital management system", "hospital management software", "healthcare management platform",
    "patient queue system", "hospital queue management", "pharmacy management system",
    "hospital billing software", "medical records system", "hospital ERP",
    "African hospital management", "Ghana hospital software", "Nigeria hospital system",
    "Kenya healthcare platform", "South Africa hospital management",
    "emergency department system", "ICU management", "ward management system",
    "laboratory information system", "radiology workflow", "maternity management",
    "blood bank management", "hospital bed management", "nursing station software",
    "DalxicHealth", "Nexus-7", "LiveQueue", "FlowEngine", "RedLine", "AuditVault",
    "BillStream", "CareChain", "StationGuard", "BedSync", "HemoVault",
    "hospital management Africa", "healthcare technology Africa", "digital health Africa",
  ],
  authors: [{ name: "Dalxic" }],
  creator: "Dalxic",
  publisher: "Dalxic",
  category: "Healthcare",
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "DalxicHealth",
    title: "DalxicHealth — Worlds Best Hospital Management System",
    description: "46+ connected workstations. Real-time patient flow. Intelligent billing. Emergency protocols. Built for Africa, powered by Nexus-7™.",
    images: [{ url: "/images/command-center.jpg", width: 1200, height: 630, alt: "DalxicHealth — Hospital Management Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@Dalxic",
    creator: "@Dalxic",
    title: "DalxicHealth — Worlds Best Hospital Management System",
    description: "46+ connected workstations. Real-time patient flow. Built for Africa, powered by Nexus-7™.",
    images: ["/images/command-center.jpg"],
  },
  alternates: { canonical: SITE_URL },
  other: {
    "theme-color": "#0EA5E9",
    "msapplication-TileColor": "#03050F",
    "application-name": "DalxicHealth",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "DalxicHealth",
    "mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: "DalxicHealth",
      url: SITE_URL,
      description: "End-to-end hospital management platform with 46+ connected workstations. Real-time patient flow, intelligent billing, emergency protocols.",
      applicationCategory: "HealthApplication",
      operatingSystem: "Any",
      featureList: [
        "Real-time patient queue management",
        "46+ connected workstations",
        "Intelligent billing and revenue capture",
        "Emergency fast-track protocols",
        "Laboratory order management",
        "Pharmacy dispensing workflow",
        "Inpatient and ward management",
        "Maternity lifecycle tracking",
        "Blood bank inventory",
        "Imaging and radiology workflow",
        "PIN-gated operator access",
        "WhatsApp patient notifications",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Dalxic",
      url: "https://dalxic.com",
      description: "Technology company building institutional-grade platforms for healthcare, forensics, and judiciary across Africa.",
      foundingDate: "2024",
    },
    {
      "@type": "MedicalOrganization",
      "@id": `${SITE_URL}/#medical`,
      name: "DalxicHealth",
      url: SITE_URL,
      description: "Hospital management platform serving healthcare facilities across Africa with 46+ connected workstations.",
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
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
