import "./globals.css"

export const metadata = {
  title: "Dalxic — Technology That Protects",
  description: "The parent company powering DalxicHealth, DalxicMedia, and DalxicJudiciary. Built on Nexus-7 engine technology.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
