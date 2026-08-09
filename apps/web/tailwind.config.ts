import type { Config } from "tailwindcss";
import { DesignTokens } from "@agbofa/ui";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: DesignTokens.colors.primary,
        "primary-hover": DesignTokens.colors.primaryHover,
        secondary: DesignTokens.colors.secondary,
        background: DesignTokens.colors.background,
        surface: DesignTokens.colors.surface,
        error: DesignTokens.colors.error,
        success: DesignTokens.colors.success,
        "text-primary": DesignTokens.colors.textPrimary,
        "text-secondary": DesignTokens.colors.textSecondary,
      },
    },
  },
  plugins: [],
};

export default config;
