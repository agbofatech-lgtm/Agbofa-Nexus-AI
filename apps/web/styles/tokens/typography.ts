export const fontFamilies = {
  heading: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const typeScale = {
  display: { size: "4rem", weight: 700, lineHeight: 1.05, tracking: "-0.02em" },
  hero: { size: "3.25rem", weight: 700, lineHeight: 1.1, tracking: "-0.02em" },
  heading1: {
    size: "2.5rem",
    weight: 700,
    lineHeight: 1.15,
    tracking: "-0.01em",
  },
  heading2: { size: "2rem", weight: 600, lineHeight: 1.2, tracking: "-0.01em" },
  heading3: {
    size: "1.5rem",
    weight: 600,
    lineHeight: 1.3,
    tracking: "-0.005em",
  },
  heading4: { size: "1.25rem", weight: 500, lineHeight: 1.4, tracking: "0" },
  bodyLarge: { size: "1.125rem", weight: 400, lineHeight: 1.6, tracking: "0" },
  body: { size: "1rem", weight: 400, lineHeight: 1.6, tracking: "0" },
  bodySmall: { size: "0.875rem", weight: 400, lineHeight: 1.5, tracking: "0" },
  caption: {
    size: "0.75rem",
    weight: 500,
    lineHeight: 1.4,
    tracking: "0.01em",
  },
} as const;

export type TypographyTokens = typeof typeScale;
