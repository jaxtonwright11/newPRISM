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
            base: "#0F1114",
            surface: "#181B20",
            elevated: "#1F2228",
            overlay: "#262A31",
          },
          border: "#262A31",
          text: {
            primary: "#EDEDEF",
            secondary: "#9CA3AF",
            dim: "#5C6370",
          },
          accent: {
            primary: "#D4956B",
            glow: "#E8B898",
            live: "#4ADE80",
            destructive: "#EF4444",
          },
          community: {
            civic: "#3B82F6",
            diaspora: "#A855F7",
            rural: "#F59E0B",
            policy: "#22C55E",
            academic: "#06B6D4",
            cultural: "#F97316",
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
