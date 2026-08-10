"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/demos/novatech/ui/CountUp";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/demos/novatech/animation";
import {
  BUSINESS_INSIGHTS,
  GROWTH_SERIES,
  PIPELINE_STAGES,
  RECENT_ACTIVITY,
} from "@/lib/demos/novatech/insights";

export function BusinessInsights() {
  const reduced = useReducedMotion();
  const maxGrowth = Math.max(...GROWTH_SERIES.map((p) => p.value));

  return (
    <section className="border-y border-border bg-surface/70">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeader
          eyebrow="Business insights"
          title="A living view of operations and growth"
          description="Illustrative metrics that show how NovaTech would present outcomes to a business owner—clear, calm, and actionable."
        />

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? false : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={{ once: true, margin: "-60px" }}
        >
          {BUSINESS_INSIGHTS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={reduced ? undefined : staggerItem}
              className="nt-card p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {stat.label}
              </p>
              <p className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
                <CountUp
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
              </p>
              <p className="mt-2 text-sm font-medium text-success">{stat.delta}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            className="nt-card p-6"
            variants={reduced ? undefined : fadeUp}
            initial={reduced ? false : "hidden"}
            whileInView={reduced ? undefined : "visible"}
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Growth chart
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-ink">
                  Resolved tickets · 8 weeks
                </h3>
              </div>
              <p className="text-sm font-semibold text-success">+18% QoQ</p>
            </div>
            <div
              className="mt-8 flex h-44 items-end gap-2 sm:gap-3"
              role="img"
              aria-label="Bar chart of resolved tickets over eight weeks"
            >
              {GROWTH_SERIES.map((point, index) => {
                const heightPct = (point.value / maxGrowth) * 100;
                return (
                  <div
                    key={point.label}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div className="flex w-full flex-1 items-end justify-center">
                      <motion.div
                        className="w-full max-w-[2.75rem] rounded-t-md bg-gradient-to-t from-primary-dark to-highlight"
                        initial={reduced ? false : { height: 0 }}
                        whileInView={
                          reduced ? undefined : { height: `${heightPct}%` }
                        }
                        viewport={{ once: true }}
                        transition={{
                          duration: reduced ? 0 : 0.55,
                          delay: reduced ? 0 : index * 0.05,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        style={reduced ? { height: `${heightPct}%` } : undefined}
                      />
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="nt-card p-6"
            variants={reduced ? undefined : fadeUp}
            initial={reduced ? false : "hidden"}
            whileInView={reduced ? undefined : "visible"}
            viewport={{ once: true, margin: "-60px" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Lead pipeline
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink">
              Consultation funnel
            </h3>
            <ul className="mt-6 space-y-4">
              {PIPELINE_STAGES.map((stage) => (
                <li key={stage.label}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium text-ink">{stage.label}</span>
                    <span className="tabular-nums text-muted">{stage.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={reduced ? false : { width: 0 }}
                      whileInView={
                        reduced ? undefined : { width: `${stage.percent}%` }
                      }
                      viewport={{ once: true }}
                      transition={{
                        duration: reduced ? 0 : 0.7,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={reduced ? { width: `${stage.percent}%` } : undefined}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <motion.div
            className="nt-card p-6"
            variants={reduced ? undefined : fadeUp}
            initial={reduced ? false : "hidden"}
            whileInView={reduced ? undefined : "visible"}
            viewport={{ once: true, margin: "-60px" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Recent activity
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink">
              What happened this week
            </h3>
            <ul className="mt-5 space-y-4">
              {RECENT_ACTIVITY.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 border-b border-border/70 pb-4 last:border-0 last:pb-0"
                >
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
                    <p className="mt-1 text-xs text-muted">{item.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="nt-card flex flex-col justify-between p-6"
            variants={reduced ? undefined : fadeUp}
            initial={reduced ? false : "hidden"}
            whileInView={reduced ? undefined : "visible"}
            viewport={{ once: true, margin: "-60px" }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Sales summary
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">
                Pipeline health
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Illustrative snapshot of consultation demand and close rates—positioned
                for leadership reviews, not vanity dashboards.
              </p>
            </div>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-bg/80 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Qualified leads
                </dt>
                <dd className="mt-2 font-display text-2xl font-bold text-ink">
                  <CountUp value={42} />
                </dd>
              </div>
              <div className="rounded-xl border border-border bg-bg/80 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Win rate
                </dt>
                <dd className="mt-2 font-display text-2xl font-bold text-success">
                  <CountUp value={34} suffix="%" />
                </dd>
              </div>
              <div className="rounded-xl border border-border bg-bg/80 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Avg. response
                </dt>
                <dd className="mt-2 font-display text-2xl font-bold text-ink">
                  <CountUp value={18} suffix="m" />
                </dd>
              </div>
              <div className="rounded-xl border border-border bg-bg/80 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  CSAT
                </dt>
                <dd className="mt-2 font-display text-2xl font-bold text-ink">
                  <CountUp value={4.8} decimals={1} suffix="/5" />
                </dd>
              </div>
            </dl>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
