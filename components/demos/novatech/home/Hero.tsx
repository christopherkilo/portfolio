"use client";

import {
  Clock3,
  Headphones,
  Map,
  ShieldCheck,
  ArrowRight,
  ClipboardCheck,
  Waypoints,
  Rocket,
  Radar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/demos/novatech/ui/Button";
import { CTA, DEMO_BASE, SITE } from "@/lib/demos/novatech/constants";
import { contactHref } from "@/lib/demos/novatech/paths";
import { staggerContainer, staggerItem } from "@/lib/demos/novatech/animation";

const BENEFITS = [
  {
    title: "Reduced Downtime",
    detail: "Monitoring and escalation before outages become business events.",
    icon: Clock3,
  },
  {
    title: "Safer Systems",
    detail: "Practical baselines for identity, endpoints, and recovery readiness.",
    icon: ShieldCheck,
  },
  {
    title: "Predictable Support",
    detail: "Clear intake, priorities, and status updates your team can trust.",
    icon: Headphones,
  },
  {
    title: "Technology Planning",
    detail: "Roadmaps phased by risk, budget, and operational capacity.",
    icon: Map,
  },
] as const;

const METHOD_STEPS = [
  {
    title: "Assessment",
    detail: "Baseline risk, coverage, and operational gaps.",
    icon: ClipboardCheck,
  },
  {
    title: "Planning",
    detail: "Prioritize by impact, budget, and capacity.",
    icon: Waypoints,
  },
  {
    title: "Implementation",
    detail: "Roll out changes with clear ownership.",
    icon: Rocket,
  },
  {
    title: "Monitoring",
    detail: "Continuous visibility across critical systems.",
    icon: Radar,
  },
  {
    title: "Optimization",
    detail: "Tune performance, cost, and resilience.",
    icon: Sparkles,
  },
  {
    title: "Growth",
    detail: "Scale the stack as the business scales.",
    icon: TrendingUp,
  },
] as const;

function HeroDepth() {
  return (
    <>
      <div className="nt-hero-depth" aria-hidden />
      <div className="nt-hero-blueprint" aria-hidden />
      <svg
        className="nt-hero-nodes hidden sm:block"
        viewBox="0 0 1200 720"
        fill="none"
        aria-hidden
      >
        {/* Soft architecture routes — opacity kept discovery-level */}
        <path
          className="nt-path-flow"
          d="M60 560 C180 520 260 420 380 390 C520 350 600 300 740 270 C880 240 980 170 1140 140"
          stroke="rgba(37,99,235,0.09)"
          strokeWidth="1.4"
          strokeDasharray="4 10"
        />
        <path
          className="nt-path-flow nt-path-flow-delay"
          d="M40 200 C200 240 300 300 420 340 C560 390 680 430 820 470 C960 510 1060 560 1180 600"
          stroke="rgba(20,184,166,0.08)"
          strokeWidth="1.25"
          strokeDasharray="3 12"
        />
        <path
          d="M200 80 C280 160 320 240 360 320 C400 400 460 480 560 540"
          stroke="rgba(16,185,129,0.07)"
          strokeWidth="1.1"
        />
        <path
          d="M900 40 C860 140 820 220 780 300 C740 380 660 460 580 520"
          stroke="rgba(37,99,235,0.06)"
          strokeWidth="1.1"
        />

        {/* Intersection nodes */}
        <circle cx="380" cy="390" r="3.2" fill="rgba(37,99,235,0.14)" />
        <circle cx="740" cy="270" r="2.8" fill="rgba(20,184,166,0.14)" />
        <circle cx="420" cy="340" r="2.4" fill="rgba(16,185,129,0.12)" />
        <circle cx="820" cy="470" r="2.6" fill="rgba(37,99,235,0.1)" />
        <circle className="nt-data-pulse" cx="560" cy="540" r="2.2" fill="rgba(20,184,166,0.16)" />
        <circle className="nt-data-pulse nt-data-pulse-delay" cx="780" cy="300" r="2" fill="rgba(37,99,235,0.14)" />

        {/* Quiet blueprint frames */}
        <rect
          x="140"
          y="120"
          width="220"
          height="140"
          rx="8"
          stroke="rgba(37,99,235,0.05)"
          strokeWidth="1"
        />
        <rect
          x="820"
          y="420"
          width="200"
          height="120"
          rx="8"
          stroke="rgba(20,184,166,0.05)"
          strokeWidth="1"
        />
      </svg>
    </>
  );
}

export function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="gradient-hero relative overflow-hidden">
      <HeroDepth />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:min-h-[74vh] sm:px-6 sm:py-20 lg:grid-cols-[1.12fr_0.88fr] lg:gap-14 lg:px-8 lg:py-24">
        <motion.div
          variants={reducedMotion ? undefined : staggerContainer}
          initial={reducedMotion ? false : "hidden"}
          animate={reducedMotion ? undefined : "visible"}
        >
          <motion.p
            variants={reducedMotion ? undefined : staggerItem}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-accent"
          >
            {SITE.name} · Managed IT demo
          </motion.p>
          <motion.h1
            variants={reducedMotion ? undefined : staggerItem}
            className="font-display max-w-xl text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-[3.4rem] lg:leading-[1.06]"
          >
            {SITE.tagline}
          </motion.h1>
          <motion.p
            variants={reducedMotion ? undefined : staggerItem}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg md:leading-relaxed"
          >
            {SITE.description}
          </motion.p>
          <motion.p
            variants={reducedMotion ? undefined : staggerItem}
            className="mt-3 max-w-xl text-sm leading-relaxed text-muted"
          >
            {SITE.audience}
          </motion.p>

          <motion.div
            variants={reducedMotion ? undefined : staggerItem}
            className="mt-7 flex flex-wrap gap-3"
          >
            <div className="rounded-xl border border-border bg-surface/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Demo uptime
              </p>
              <p className="mt-1 font-display text-xl font-bold tabular-nums text-primary">
                99.98%
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Monitoring
              </p>
              <p className="mt-1 font-display text-xl font-bold text-primary">
                24/7 coverage
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Avg. response
              </p>
              <p className="mt-1 font-display text-xl font-bold tabular-nums text-primary">
                18 min
              </p>
            </div>
          </motion.div>

          <motion.ul
            variants={reducedMotion ? undefined : staggerItem}
            className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2"
          >
            {BENEFITS.map(({ title, detail, icon: Icon }) => (
              <li
                key={title}
                className="nt-card flex gap-3 p-3.5 transition hover:-translate-y-0.5"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    {detail}
                  </span>
                </span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            variants={reducedMotion ? undefined : staggerItem}
            className="mt-9 flex flex-wrap gap-3"
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
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.55,
            delay: reducedMotion ? 0 : 0.1,
          }}
        >
          <div className="nt-card nt-method-panel overflow-hidden rounded-2xl p-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  Partnership method
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  From assessment to growth
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
                <TrendingUp className="size-3" aria-hidden />
                Outcomes
              </span>
            </div>

            <ol className="relative px-5 py-4">
              <span
                className="nt-method-spine absolute left-[2.05rem] top-6 bottom-6 w-px bg-gradient-to-b from-primary via-highlight to-accent"
                aria-hidden
              />
              {METHOD_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === METHOD_STEPS.length - 1;
                return (
                  <li
                    key={step.title}
                    className="relative flex gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span
                      className={
                        isLast
                          ? "relative z-[1] inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary-contrast shadow-sm"
                          : "relative z-[1] inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-primary shadow-sm"
                      }
                    >
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="flex items-baseline gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-semibold text-ink">{step.title}</span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                        {step.detail}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="border-t border-border bg-bg/60 px-5 py-3.5">
              <p className="text-[11px] leading-relaxed text-muted">
                Business goals and technical delivery converge into one accountable
                operating rhythm—demo methodology, not live client telemetry.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
