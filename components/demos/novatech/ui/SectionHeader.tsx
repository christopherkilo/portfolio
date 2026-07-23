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
  light?: boolean;
  headingLevel?: "h1" | "h2";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  light = false,
  headingLevel = "h2",
}: SectionHeaderProps) {
  const reducedMotion = useReducedMotion();
  const Heading = headingLevel;

  const content = (
    <>
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 text-xs font-semibold uppercase tracking-[0.2em]",
            light ? "text-band-ink/85" : "text-accent",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <Heading
        className={cn(
          "font-display text-3xl font-semibold tracking-tight md:text-4xl",
          light ? "text-band-ink" : "text-ink",
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-2xl text-base leading-relaxed md:text-lg",
            light ? "text-band-ink/80" : "text-muted",
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
          "mb-10",
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
        "mb-10",
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
