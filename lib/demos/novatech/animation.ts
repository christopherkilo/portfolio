import type { Transition, Variants } from "framer-motion";

export const durations = {
  fast: 0.15,
  medium: 0.25,
  section: 0.5,
} as const;

export const easings = {
  out: [0.22, 1, 0.36, 1] as const,
};

export const springHover = {
  type: "spring" as const,
  stiffness: 420,
  damping: 28,
  mass: 0.55,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.section, ease: easings.out },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.section, ease: easings.out },
  },
};

export const buttonTransition: Transition = {
  duration: durations.fast,
  ease: easings.out,
};
