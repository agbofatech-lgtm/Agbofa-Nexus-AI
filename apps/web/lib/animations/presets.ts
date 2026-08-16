import type { Transition, Variants } from "framer-motion";

const entranceEase = [0.16, 1, 0.3, 1] as const;

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInTransition: Transition = {
  duration: 0.4,
  ease: "easeOut",
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

export const slideUpTransition: Transition = {
  duration: 0.5,
  ease: entranceEase,
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

export const goldPulse: Variants = {
  initial: { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0)" },
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(212, 175, 55, 0.4)",
      "0 0 0 15px rgba(212, 175, 55, 0)",
    ],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeOut" },
  },
};

export const statusPulse: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.72, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

export const reducedMotionTransition: Transition = { duration: 0 };
