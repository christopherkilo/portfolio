"use client";

import { Code2, Cpu, Palette } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/shared/Reveal";
import { ROLES, SITE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { staggerContainer, staggerItem } from "@/lib/animation";
import { motion } from "framer-motion";

const icons = {
  Code2,
  Palette,
  Cpu,
};

export function AboutPreview() {
  return (
    <section
      id="about"
      className="mx-auto max-w-6xl scroll-mt-[var(--scroll-mt)] px-4 py-[var(--section-y)] sm:px-6 lg:px-8"
    >
      <SectionHeader
        eyebrow="About"
        title="Three disciplines, one craft"
        description={`${SITE.name} bridges product engineering, visual design, and hands-on IT—so ideas ship cleanly and systems stay reliable.`}
      />

      <motion.div
        className="grid gap-4 md:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {ROLES.map((role) => {
          const Icon = icons[role.icon];
          return (
            <motion.div
              key={role.id}
              variants={staggerItem}
              className="group gradient-border rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl transition hover:bg-white/[0.05]"
            >
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-secondary transition group-hover:text-primary">
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="font-display text-lg font-semibold text-text">
                {role.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {role.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      <Reveal className="mt-8">
        <Button href="/about" variant="outline">
          More about me
        </Button>
      </Reveal>
    </section>
  );
}
