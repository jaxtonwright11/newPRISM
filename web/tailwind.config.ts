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
            primary: "#0A0A0F",
            secondary: "#12121A",
            elevated: "#1A1A26",
          },
          border: "#2A2A3A",
          text: {
            primary: "#F0F0F8",
            secondary: "#8888A8",
            dim: "#4A4A6A",
          },
          accent: {
            live: "#FF3B3B",
            active: "#4A9EFF",
            verified: "#4AE87A",
            like: "#FF6B8A",
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
            ocean: "#0D1117",
            land: "#161B22",
            borders: "#2A3441",
          },
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fadeIn 200ms ease-out",
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
      },
    },
  },
  plugins: [],
};
export default config;
