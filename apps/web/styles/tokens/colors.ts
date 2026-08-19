export const colors = {
  brand: { gold: "#D4AF37", goldLight: "#E4C65D", goldDark: "#A88924" },
  background: {
    black: "#0D1321",
    dark: "#11192B",
    surface: "#151D30",
    elevated: "#1A233A",
  },
  accent: {
    blue: "#4A7CF7",
    blueDark: "#315FD6",
    cyan: "#55C2FF",
    purple: "#8B7CF6",
  },
  text: { white: "#E8EDF5", silver: "#B7C1D3", muted: "#8E9AAF" },
  status: {
    success: "#36B37E",
    warning: "#F5A524",
    error: "#E25563",
    info: "#4A7CF7",
  },
  light: {
    background: "#F6F8FC",
    surface: "#FFFFFF",
    elevated: "#EEF2F8",
    text: "#172033",
    secondary: "#475569",
    muted: "#64748B",
    border: "#D8DFEA",
    primary: "#315FD6",
    gold: "#A77D00",
  },
} as const;
export type ColorTokens = typeof colors;
