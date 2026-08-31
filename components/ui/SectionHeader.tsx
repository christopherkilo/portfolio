"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp } from "@/lib/animation";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  id?: string;
  /** Page-level titles use h1; nested section titles stay h2. Styling is identical. */
  as?: "h1" | "h2";
};

const titleClass =
  "font-display text-[1.75rem] font-semibold tracking-tight text-text sm:text-3xl md:text-4xl";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  id,
  as: TitleTag = "h2",
}: SectionHeaderProps) {
  const reducedMotion = useReducedMotion();
  const headerClass = cn(
    "mb-8 max-w-2xl sm:mb-10",
    align === "center" && "mx-auto text-center",
    className,
  );

  const inner = (
    <>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          {eyebrow}
        </p>
      ) : null}
      <TitleTag className={titleClass}>{title}</TitleTag>
      {description ? (
        <p className="mt-4 max-w-prose text-base leading-[1.7] text-secondary md:text-lg">
          {description}
        </p>
      ) : null}
    </>
  );

  if (reducedMotion) {
    return (
      <header id={id} className={headerClass}>
        {inner}
      </header>
    );
  }

  return (
    <motion.header
      id={id}
      className={headerClass}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {inner}
    </motion.header>
  );
}
