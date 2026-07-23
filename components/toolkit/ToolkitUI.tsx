"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { Finding, HealthStatus, MetricPoint, Severity } from "@/lib/toolkit/types";

export function DemoModeBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      {compact ? "Demo Mode" : "Demo Mode — Simulated System Data"}
    </span>
  );
}

const statusStyles: Record<HealthStatus, string> = {
  healthy: "border-emerald-400/20 bg-emerald-400/8 text-emerald-300",
  attention: "border-amber-300/20 bg-amber-300/8 text-amber-200",
  critical: "border-rose-400/20 bg-rose-400/8 text-rose-300",
};

export function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
        statusStyles[status],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "healthy" && "bg-emerald-300",
          status === "attention" && "bg-amber-200",
          status === "critical" && "bg-rose-300",
        )}
        aria-hidden
      />
      {status}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduced ? undefined : { y: -3 }}
      className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
        {icon ? <span className="text-secondary">{icon}</span> : null}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-text">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
    </motion.article>
  );
}

export function HealthGauge({ score, label = "Overall health" }: { score: number; label?: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative mx-auto size-36" aria-label={`${label}: ${score} out of 100`}>
      <svg viewBox="0 0 128 128" className="-rotate-90" aria-hidden>
        <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <span className="font-display text-3xl font-semibold">{score}</span>
          <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

const findingIcons: Record<Severity, React.ReactNode> = {
  info: <Info className="size-4" />,
  warning: <AlertTriangle className="size-4" />,
  critical: <ShieldAlert className="size-4" />,
};

export function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className={cn("mt-0.5", finding.severity === "warning" ? "text-amber-200" : finding.severity === "critical" ? "text-rose-300" : "text-secondary")}>
          {findingIcons[finding.severity]}
        </span>
        <span className="flex-1">
          <span className="block font-medium text-text">{finding.title}</span>
          <span className="mt-1 block text-sm leading-relaxed text-muted">{finding.explanation}</span>
        </span>
        <span className="font-mono text-xs text-muted">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="ml-7 mt-4 border-t border-white/7 pt-4 text-sm text-muted">
          {finding.causes.length ? <p><strong className="text-secondary">Probable causes:</strong> {finding.causes.join(", ")}</p> : null}
          <p className="mt-2"><strong className="text-secondary">Next step:</strong> {finding.nextStep}</p>
        </div>
      ) : null}
    </article>
  );
}

export function ModuleHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-white/7 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function ChartPanel({
  title,
  data,
  unit = "%",
  summary,
}: {
  title: string;
  data: MetricPoint[];
  unit?: string;
  summary: string;
}) {
  return (
    <section className="rounded-[var(--radius)] border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-5">
        <h3 className="font-display text-base font-semibold text-text">{title}</h3>
        <p className="sr-only">{summary}</p>
      </div>
      <div className="h-56 min-w-0" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`toolkit-${title.replaceAll(" ", "-")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis width={30} tick={{ fill: "#777", fontSize: 10 }} axisLine={false} tickLine={false} unit={unit} />
            <Tooltip contentStyle={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12 }} />
            <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fill={`url(#toolkit-${title.replaceAll(" ", "-")})`} isAnimationActive />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function LoadingPanel({ label = "Loading simulated diagnostics…" }: { label?: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-white/8 bg-white/[0.025]">
      <div className="text-center">
        <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
        <p className="mt-3 text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}
