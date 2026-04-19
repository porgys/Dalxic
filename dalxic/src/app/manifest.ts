import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dalxic",
    short_name: "Dalxic",
    description: "One universal business platform for Africa",
    start_url: "/",
    display: "standalone",
    background_color: "#040A0F",
    theme_color: "#10B981",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
