export const animationTokens = {
  duration: {
    instant: 100,
    fast: 180,
    normal: 300,
    slow: 500,
  },
  easing: {
    standard: [0.2, 0, 0, 1],
    entrance: [0.16, 1, 0.3, 1],
    exit: [0.4, 0, 1, 1],
  },
  distance: {
    subtle: 4,
    standard: 20,
    dramatic: 40,
  },
} as const;

export type AnimationTokens = typeof animationTokens;
