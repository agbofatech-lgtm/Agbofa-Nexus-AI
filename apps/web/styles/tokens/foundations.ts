export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const radii = {
  control: "0.625rem",
  card: "0.875rem",
  panel: "1.125rem",
  modal: "1.375rem",
  pill: "999px",
} as const;

export const shadows = {
  subtle: "0 1px 0 rgba(255, 255, 255, 0.04)",
  card: "0 16px 44px rgba(0, 0, 0, 0.24)",
  elevated: "0 28px 80px rgba(0, 0, 0, 0.38)",
  cinematic: "0 42px 120px rgba(0, 0, 0, 0.48)",
} as const;

export const blur = {
  subtle: "8px",
  medium: "16px",
  heavy: "28px",
} as const;

export const motion = {
  instant: "100ms",
  fast: "180ms",
  standard: "280ms",
  slow: "520ms",
  entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
  standardEase: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

export const layers = {
  base: 0,
  raised: 10,
  sticky: 40,
  navigation: 60,
  overlay: 80,
  modal: 100,
  toast: 120,
} as const;

export const breakpoints = {
  mobile: "320px",
  mobileWide: "414px",
  tablet: "768px",
  desktop: "1024px",
  desktopWide: "1440px",
  cinema: "1920px",
} as const;

export type FoundationTokens = {
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  blur: typeof blur;
  motion: typeof motion;
  layers: typeof layers;
  breakpoints: typeof breakpoints;
};

export const foundationTokens: FoundationTokens = {
  spacing,
  radii,
  shadows,
  blur,
  motion,
  layers,
  breakpoints,
};
