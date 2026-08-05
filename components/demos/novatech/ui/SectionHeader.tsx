"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp } from "@/lib/demos/novatech/animation";
import { cn } from "@/lib/demos/novatech/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  headingLevel?: "h1" | "h2";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  headingLevel = "h2",
}: SectionHeaderProps) {
  const reducedMotion = useReducedMotion();
  const Heading = headingLevel;

  const content = (
    <>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <Heading className="font-display text-3xl font-bold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.15]">
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg md:leading-relaxed",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </>
  );

  if (reducedMotion) {
    return (
      <header
        className={cn(
          "mb-12",
          align === "center" && "mx-auto text-center",
          className,
        )}
      >
        {content}
      </header>
    );
  }

  return (
    <motion.header
      className={cn(
        "mb-12",
        align === "center" && "mx-auto text-center",
        className,
      )}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {content}
    </motion.header>
  );
}
