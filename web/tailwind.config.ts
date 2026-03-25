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
        background: "var(--background)",
        foreground: "var(--foreground)",
        prism: {
          bg: {
            primary: "#0F0A0B",
            secondary: "#1A0E11",
            elevated: "#221318",
          },
          border: "#2A1219",
          text: {
            primary: "#F5F0E8",
            secondary: "#C4A882",
            dim: "#8A7A6A",
          },
          accent: {
            live: "#C23B5A",
            active: "#8B1A2E",
            glow: "#C23B5A",
            verified: "#4AE87A",
            like: "#C23B5A",
          },
          community: {
            civic: "#4A9EFF",
            diaspora: "#A855F7",
            rural: "#F59E0B",
            policy: "#10B981",
            academic: "#06B6D4",
            cultural: "#F97316",
          },
          map: {
            ocean: "#0D0809",
            land: "#150D10",
            borders: "#2A1219",
          },
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fadeIn 200ms ease-out",
        "story-ring": "storyRing 6s linear infinite",
        "story-progress": "storyProgress 5s linear",
        "slide-in-right": "slideInRight 300ms ease-out",
        "slide-up": "slideUp 300ms ease-out",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        storyRing: {
          "0%": { filter: "hue-rotate(0deg)" },
          "100%": { filter: "hue-rotate(360deg)" },
        },
        storyProgress: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
