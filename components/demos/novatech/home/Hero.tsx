"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/demos/novatech/ui/Button";
import { CTA, DEMO_BASE, SITE } from "@/lib/demos/novatech/constants";
import { contactHref } from "@/lib/demos/novatech/paths";
import { staggerContainer, staggerItem } from "@/lib/demos/novatech/animation";

export function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="gradient-hero relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:min-h-[72vh] sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
        <motion.div
          variants={reducedMotion ? undefined : staggerContainer}
          initial={reducedMotion ? false : "hidden"}
          animate={reducedMotion ? undefined : "visible"}
        >
          <motion.p
            variants={reducedMotion ? undefined : staggerItem}
            className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-accent"
          >
            {SITE.name} · Managed IT demo
          </motion.p>
          <motion.h1
            variants={reducedMotion ? undefined : staggerItem}
            className="font-display max-w-xl text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]"
          >
            {SITE.tagline}
          </motion.h1>
          <motion.p
            variants={reducedMotion ? undefined : staggerItem}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg"
          >
            {SITE.description}
          </motion.p>
          <motion.p
            variants={reducedMotion ? undefined : staggerItem}
            className="mt-3 max-w-xl text-sm leading-relaxed text-muted"
          >
            {SITE.audience}
          </motion.p>
          <motion.ul
            variants={reducedMotion ? undefined : staggerItem}
            className="mt-6 grid max-w-xl gap-2 text-sm text-ink sm:grid-cols-2"
          >
            {[
              "Reduced downtime",
              "Safer systems",
              "Predictable support",
              "Clearer technology planning",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-surface/60 px-3 py-2"
              >
                <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                {item}
              </li>
            ))}
          </motion.ul>
          <motion.div
            variants={reducedMotion ? undefined : staggerItem}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button href={contactHref()} size="lg">
              {CTA.primary}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button href={`${DEMO_BASE}/services`} variant="outline" size="lg">
              {CTA.exploreServices}
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mx-auto w-full max-w-md"
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.55,
            delay: reducedMotion ? 0 : 0.12,
          }}
        >
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Illustrative service blueprint
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              How NovaTech would frame an MSP engagement before tools and tickets take over.
            </p>
            <ul className="mt-5 space-y-3">
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
