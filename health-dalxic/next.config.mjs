import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})({
  async rewrites() {
    return [
      // Workstations — obfuscated routes → real page directories
      { source: "/w/xK9~vR3mZp7Q-dW1nB5tYj8sLf", destination: "/front-desk" },
      { source: "/w/Tj4_bN8wXq2R~hF6yA0cVm3eKs", destination: "/waiting-room" },
      { source: "/w/mH7~pD1kZr5W-vJ9nQ3xBf8tLa", destination: "/doctor" },
      { source: "/w/Qw2_jF5nXd8T~cK0rV4mYb7hGs", destination: "/pharmacy" },
      { source: "/w/dR6~xA9sZm3P-tN1yJ7wBk5vLf", destination: "/billing" },
      { source: "/w/Yn3_kW8rXb1Q~mF4dH0pTj6cAs", destination: "/lab" },
      { source: "/w/sB5~hJ2nZf9V-xK7rD3mYw1tLp", destination: "/injection-room" },
      { source: "/w/Fk8_vQ4dXt6R~bN0yH2jAm9wCs", destination: "/nurse-station" },
      { source: "/w/pA1~tL7kZs4W-mR9xF3nBd5vYj", destination: "/radiology" },
      { source: "/w/Wm6_rH3bXn9T~jK2vD8sYf0cQa", destination: "/ward" },
      { source: "/w/jV4~nB8wZd2P-yF5kR1mXt7hLs", destination: "/ultrasound" },
      { source: "/w/Rh9_xK5tXm3Q~wA7nJ2dBp4vFs", destination: "/emergency-triage" },
      { source: "/w/bN2~sF6kZj8V-rD0mH4nYt9wLa", destination: "/icu" },
      { source: "/w/Xd7_yR1nXf5T~vK3bJ8mAw0cPs", destination: "/maternity" },
      { source: "/w/kQ5~hW9sZr2P-tB6nF3dYm8jLv", destination: "/blood-bank" },
      { source: "/w/Gn4~rL8kZv2W-mB5xJ1nYt9hQs", destination: "/bookkeeping" },
      // Utility
      { source: "/w/Vt8_mA4bXk1R~wN7rJ0nDs3hFy", destination: "/admin" },
      { source: "/w/nF3~jK7dZs9W-yR2vH5mBt1xQa", destination: "/beds" },
      { source: "/w/Hp6_wB0nXr4T~kF8dJ3mYv5tLs", destination: "/display" },
      { source: "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh", destination: "/platform" },
      { source: "/w/Ys9_dF2bXh6R~mK0rV3nJt7wLp", destination: "/kiosk" },
      { source: "/s/ZXJ2LkQ9Mnx0V3hCYTVrUw.aGVhbHRo", destination: "/ops" },
      { source: "/w/Dk7_xQ3nXv0T~sF6bW2mYr8hLa", destination: "/emergency-override" },
      { source: "/w/fR2~kV6dZt9W-nA1mJ4bXh7cPs", destination: "/print/ticket" },
    ];
  },
});

export default nextConfig;
