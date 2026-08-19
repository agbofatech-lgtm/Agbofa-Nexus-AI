export const fontFamilies = {
  heading:
    "'Space Grotesk', 'Avenir Next', 'Segoe UI Variable Display', 'Segoe UI', sans-serif",
  body:
    "Inter, 'Avenir Next', 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif",
  editorial: "Iowan Old Style, Charter, 'Bitstream Charter', Georgia, serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
} as const;

export const typeScale = {
  display: {
    size: "clamp(3.25rem, 7vw, 7.25rem)",
    weight: 650,
    lineHeight: 0.94,
    tracking: "-0.055em",
  },
  hero: {
    size: "clamp(2.5rem, 5vw, 5.25rem)",
    weight: 650,
    lineHeight: 1,
    tracking: "-0.045em",
  },
  heading1: {
    size: "clamp(2rem, 3.5vw, 3.75rem)",
    weight: 650,
    lineHeight: 1.06,
    tracking: "-0.038em",
  },
  heading2: {
    size: "clamp(1.5rem, 2.25vw, 2.5rem)",
    weight: 620,
    lineHeight: 1.12,
    tracking: "-0.028em",
  },
  heading3: {
    size: "clamp(1.2rem, 1.5vw, 1.625rem)",
    weight: 600,
    lineHeight: 1.25,
    tracking: "-0.018em",
  },
  heading4: {
    size: "1.125rem",
    weight: 600,
    lineHeight: 1.35,
    tracking: "-0.01em",
  },
  bodyLarge: {
    size: "clamp(1.0625rem, 1.2vw, 1.25rem)",
    weight: 400,
    lineHeight: 1.7,
    tracking: "-0.005em",
  },
  body: {
    size: "clamp(1rem, 0.25vw + 0.94rem, 1.125rem)",
    weight: 400,
    lineHeight: 1.65,
    tracking: "0",
  },
  bodySmall: {
    size: "0.9375rem",
    weight: 400,
    lineHeight: 1.55,
    tracking: "0",
  },
  caption: {
    size: "0.75rem",
    weight: 600,
    lineHeight: 1.45,
    tracking: "0.075em",
  },
  editorial: {
    size: "clamp(1.0625rem, 0.6vw + 0.95rem, 1.25rem)",
    weight: 400,
    lineHeight: 1.82,
    tracking: "-0.004em",
  },
} as const;

export type TypographyTokens = typeof typeScale;
