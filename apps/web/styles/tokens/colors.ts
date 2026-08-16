export const colors = {
  brand: {
    gold: "#D4AF37",
    goldLight: "#E8C84A",
    goldDark: "#B8952E",
  },
  background: {
    black: "#0A0A0A",
    dark: "#121212",
    surface: "#1A1A1A",
  },
  accent: {
    blue: "#3399FF",
    blueDark: "#1A6BCC",
    cyan: "#00D4FF",
    purple: "#6C5CE7",
  },
  text: {
    white: "#FFFFFF",
    silver: "#A0A4A8",
    muted: "#6B6F73",
  },
  status: {
    success: "#0D9040",
    warning: "#F59E0B",
    error: "#CF2020",
    info: "#3399FF",
  },
} as const;

export type ColorTokens = typeof colors;
