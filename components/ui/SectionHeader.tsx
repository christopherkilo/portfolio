"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animation";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  id?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  id,
}: SectionHeaderProps) {
  return (
    <motion.header
      id={id}
      className={cn(
        "mb-10 max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
          {description}
        </p>
      ) : null}
    </motion.header>
  );
}
