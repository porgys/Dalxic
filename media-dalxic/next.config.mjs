/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          /* ── Clickjacking protection ── */
          { key: "X-Frame-Options", value: "DENY" },
          /* ── Prevent MIME-type sniffing ── */
          { key: "X-Content-Type-Options", value: "nosniff" },
          /* ── XSS filter (legacy browsers) ── */
          { key: "X-XSS-Protection", value: "1; mode=block" },
          /* ── Referrer policy — don't leak full URLs to external sites ── */
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /* ── HSTS — force HTTPS for 1 year ── */
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          /* ── Permissions policy — disable unnecessary browser APIs ── */
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          /* ── Content Security Policy ── */
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss://*.firebaseio.com https://api.anthropic.com",
              "frame-src https://*.firebaseapp.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig;
