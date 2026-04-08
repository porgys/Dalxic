import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nl: {
          navy: {
            deepest: "#03050F",
            deep: "#0B1220",
            2: "#131726",
            3: "#1E2438",
            4: "#2A3150",
            muted: "#4A5578",
          },
          blue: {
            DEFAULT: "#0EA5E9",
            deep: "#0284C7",
            light: "#BAE6FD",
            surface: "#E0F2FE",
            glow: "rgba(14, 165, 233, 0.15)",
          },
          copper: {
            DEFAULT: "#B87333",
            mid: "#D4904F",
            light: "#FEF3E2",
            glow: "rgba(184, 115, 51, 0.15)",
          },
          chrome: "#94A3B8",
          surface: "#F1F5F9",
          white: "#FFFFFF",
          text: "#0F172A",
          muted: "#64748B",
          border: "#E2E8F0",
          "border-dark": "#1E2438",
          "card-dark": "#0D1117",
        },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "Outfit", "sans-serif"],
        body: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      letterSpacing: {
        brand: "0.22em",
        health: "0.5em",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-up": "fadeUp 0.6s ease-out",
        "slide-in": "slideIn 0.4s ease-out",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "dot-float": "dotFloat 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        dotFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(14, 165, 233, 0.08), 0 0 60px rgba(14, 165, 233, 0.04)",
        "glow-copper": "0 0 20px rgba(184, 115, 51, 0.1), 0 0 60px rgba(184, 115, 51, 0.05)",
        "glow-blue-md": "0 0 30px rgba(14, 165, 233, 0.12), 0 0 80px rgba(14, 165, 233, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
