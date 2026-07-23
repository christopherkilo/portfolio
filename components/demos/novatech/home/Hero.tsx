"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/demos/novatech/ui/Button";
import { SITE } from "@/lib/demos/novatech/constants";
import { staggerContainer, staggerItem } from "@/lib/demos/novatech/animation";

export function Hero() {
  return (
    <section className="gradient-hero relative overflow-hidden">
      <div className="mx-auto grid min-h-[78vh] max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={staggerItem}
            className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-accent"
          >
            {SITE.name}
          </motion.p>
          <motion.h1
            variants={staggerItem}
            className="font-display max-w-xl text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            {SITE.tagline}
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg"
          >
            {SITE.description}
          </motion.p>
          <motion.div
            variants={staggerItem}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button href="/demos/novatech-solutions/contact" size="lg">
              Start demo inquiry
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button href="/demos/novatech-solutions/services" variant="outline" size="lg">
              Our Services
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mx-auto w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
        >
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Illustrative service blueprint
            </p>
            <ul className="mt-5 space-y-4">
              {[
                ["Uptime monitoring", "Planned"],
                ["Security baseline", "Defined"],
                ["Help desk workflow", "Mapped"],
                ["Backup verification", "Scheduled"],
              ].map(([label, status]) => (
                <li
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-bg px-4 py-3"
                >
                  <span className="text-sm font-medium text-ink">{label}</span>
                  <span className="text-xs font-semibold text-accent">
                    {status}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl gradient-band p-4 text-band-ink">
              <p className="text-sm font-semibold">Demo operations model</p>
              <p className="mt-1 text-xs text-band-ink/80">
                Example interface only—no live systems or analytics.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
