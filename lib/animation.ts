import type { Transition, Variants } from "framer-motion";

export const durations = {
  button: 0.15,
  card: 0.25,
  section: 0.5,
  /** Page fade/up — keep under 300ms for seamless navigation */
  page: 0.28,
  image: 0.35,
} as const;

export const easings = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

export const springHover = {
  type: "spring" as const,
  stiffness: 420,
  damping: 28,
  mass: 0.6,
};

export const buttonTransition: Transition = {
  duration: durations.button,
  ease: easings.out,
};

export const cardTransition: Transition = {
  duration: durations.card,
  ease: easings.out,
};

export const pageTransition: Transition = {
  duration: durations.page,
  ease: easings.out,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.section, ease: easings.out },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.section, ease: easings.out },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.section, ease: easings.out },
  },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: durations.page * 0.85, ease: easings.out },
  },
};
