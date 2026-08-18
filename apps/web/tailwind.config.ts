import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        nexus: {
          gold: "var(--nexus-gold)",
          "gold-light": "var(--nexus-gold-light)",
          blue: "var(--nexus-blue)",
          cyan: "var(--nexus-cyan)",
          purple: "var(--nexus-purple)",
          surface: "var(--surface-1)",
          raised: "var(--surface-2)",
          text: "var(--text-primary)",
          muted: "var(--text-secondary)",
        },
      },
      borderRadius: {
        control: "var(--radius-control)",
        card: "var(--radius-card)",
        panel: "var(--radius-panel)",
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        card: "var(--shadow-card)",
        cinematic: "var(--shadow-cinematic)",
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
        editorial: ["var(--font-editorial)"],
        mono: ["var(--font-mono)"],
      },
      transitionDuration: {
        fast: "var(--motion-fast)",
        standard: "var(--motion-standard)",
        slow: "var(--motion-slow)",
      },
    },
  },
  plugins: [],
};

export default config;
