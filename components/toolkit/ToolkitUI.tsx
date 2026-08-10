"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
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
import { scoreLabel } from "@/lib/toolkit/simulation";
import {
  SCENARIO_OPTIONS,
  getProfile,
  type CustomScenarioControls,
  type SimulationProfileId,
} from "@/lib/toolkit/scenarios";
import type {
  Finding,
  HealthStatus,
  MetricPoint,
  Recommendation,
  Severity,
} from "@/lib/toolkit/types";

export function DemoModeBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      {compact ? "Demo Mode" : "Demo Mode"}
    </span>
  );
}

const statusStyles: Record<HealthStatus, string> = {
  healthy: "border-success/25 bg-success/10 text-success",
  attention: "border-warning/25 bg-warning/10 text-warning",
  critical: "border-danger/25 bg-danger/10 text-danger",
};

const moduleStatusStyles: Record<string, string> = {
  Healthy: "border-success/25 bg-success/10 text-success",
  Optimized: "border-success/25 bg-success/10 text-success",
  Monitoring: "border-primary/25 bg-primary/10 text-primary",
  Attention: "border-warning/25 bg-warning/10 text-warning",
  "Minor Warning": "border-warning/25 bg-warning/10 text-warning",
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
          status === "healthy" && "bg-success",
          status === "attention" && "bg-warning",
          status === "critical" && "bg-danger",
        )}
        aria-hidden
      />
      {status}
    </span>
  );
}

export function ModuleStatusBadge({ score }: { score: number }) {
  const label = scoreLabel(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        moduleStatusStyles[label],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {label}
    </span>
  );
}

function useAnimatedNumber(value: number, enabled = true) {
  const reduced = useReducedMotion();
  const spring = useSpring(reduced || !enabled ? value : value, {
    stiffness: 90,
    damping: 22,
    mass: 0.7,
  });
  const display = useTransform(spring, (latest) => latest);
  const [current, setCurrent] = useState(value);

  useEffect(() => {
    if (!enabled || reduced) {
      spring.jump(value);
      return;
    }
    spring.set(value);
  }, [value, enabled, reduced, spring]);

  useEffect(() => {
    if (!enabled || reduced) {
      return;
    }
    return display.on("change", (latest) => {
      setCurrent(latest);
    });
  }, [display, enabled, reduced]);

  if (!enabled || reduced) return value;
  return current;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const display = useAnimatedNumber(value);
  const formatted = `${prefix}${display.toFixed(decimals)}${suffix}`;
  return (
    <span className={className} aria-label={formatted}>
      {formatted}
    </span>
  );
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  numericValue,
  decimals = 0,
  suffix = "",
  detail,
  icon,
  sparkline,
}: {
  label: string;
  value?: string;
  numericValue?: number;
  decimals?: number;
  suffix?: string;
  detail?: string;
  icon?: React.ReactNode;
  sparkline?: number[];
}) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduced ? undefined : { y: -2 }}
      transition={{ duration: 0.28 }}
      className="rounded-2xl border border-white/8 bg-surface/90 p-4 shadow-[var(--card-shadow)] transition hover:border-primary/25"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
        {icon ? <span className="text-primary/80">{icon}</span> : null}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-text">
        {typeof numericValue === "number" ? (
          <AnimatedNumber value={numericValue} decimals={decimals} suffix={suffix} />
        ) : (
          value
        )}
      </p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
      {sparkline?.length ? (
        <div className="mt-3">
          <Sparkline values={sparkline} />
        </div>
      ) : null}
    </motion.article>
  );
});

export function HealthGauge({
  score,
  label = "Overall health",
}: {
  score: number;
  label?: string;
}) {
  const reduced = useReducedMotion();
  const mounted = useRef(false);
  const spring = useSpring(0, { stiffness: 70, damping: 20 });
  const animated = useAnimatedNumber(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = useTransform(spring, (latest) => circumference - (latest / 100) * circumference);

  useEffect(() => {
    if (reduced) {
      spring.jump(score);
      return;
    }
    if (!mounted.current) {
      mounted.current = true;
      spring.jump(0);
    }
    spring.set(score);
  }, [score, reduced, spring]);

  return (
    <div className="relative mx-auto size-36" aria-label={`${label}: ${Math.round(score)} out of 100`}>
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
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <span className="font-display text-3xl font-semibold tabular-nums">
            {Math.round(animated)}
          </span>
          <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function CapacityBar({
  usedPercent,
  usedLabel,
  freeLabel,
  reservedLabel,
}: {
  usedPercent: number;
  usedLabel: string;
  freeLabel: string;
  reservedLabel?: string;
}) {
  const reduced = useReducedMotion();
  const reserved = Math.min(8, Math.max(0, 100 - usedPercent) * 0.15);
  const free = Math.max(0, 100 - usedPercent - reserved);
  const tone =
    usedPercent >= 85 ? "bg-danger" : usedPercent >= 70 ? "bg-warning" : "bg-success";

  return (
    <div>
      <div
        className="flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(usedPercent)}
        aria-label={`Storage used ${Math.round(usedPercent)} percent`}
      >
        <motion.div
          className={cn("h-full", tone)}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${usedPercent}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        {reservedLabel ? (
          <motion.div
            className="h-full bg-white/20"
            initial={reduced ? false : { width: 0 }}
            animate={{ width: `${reserved}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          />
        ) : null}
        <div className="h-full bg-transparent" style={{ width: `${free}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span>
          <span className={cn("mr-1.5 inline-block size-1.5 rounded-full", tone)} />
          Used · {usedLabel}
        </span>
        <span>
          <span className="mr-1.5 inline-block size-1.5 rounded-full bg-white/25" />
          Free · {freeLabel}
        </span>
        {reservedLabel ? (
          <span>
            <span className="mr-1.5 inline-block size-1.5 rounded-full bg-white/40" />
            Reserved · {reservedLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const path = useMemo(() => {
    if (!values.length) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(0.001, max - min);
    return values
      .map((value, index) => {
        const x = (index / Math.max(1, values.length - 1)) * 100;
        const y = 22 - ((value - min) / range) * 18;
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [values]);

  return (
    <svg viewBox="0 0 100 24" className={cn("h-6 w-full text-primary", className)} aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const priorityTone =
    recommendation.priority === "high"
      ? "text-danger"
      : recommendation.priority === "medium"
        ? "text-warning"
        : "text-primary";

  return (
    <article className="rounded-xl bg-black/20 p-3 transition hover:bg-black/30">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-mono text-[10px] uppercase tracking-[0.14em]", priorityTone)}>
          {recommendation.priority} priority
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {recommendation.module}
        </span>
      </div>
      <h3 className="mt-2 font-medium text-text">{recommendation.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {recommendation.reason ?? recommendation.description}
      </p>
      {recommendation.benefit ? (
        <p className="mt-2 text-sm leading-relaxed text-secondary">{recommendation.benefit}</p>
      ) : null}
    </article>
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
    <article className="rounded-2xl border border-white/8 bg-surface/70 p-4 transition hover:border-primary/25">
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span
          className={cn(
            "mt-0.5",
            finding.severity === "warning"
              ? "text-warning"
              : finding.severity === "critical"
                ? "text-danger"
                : "text-primary",
          )}
        >
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
          {finding.causes.length ? (
            <p>
              <strong className="text-secondary">Probable causes:</strong> {finding.causes.join(", ")}
            </p>
          ) : null}
          <p className="mt-2">
            <strong className="text-secondary">Next step:</strong> {finding.nextStep}
          </p>
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
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          {title}
        </h1>
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
  animate = true,
}: {
  title: string;
  data: MetricPoint[];
  unit?: string;
  summary: string;
  animate?: boolean;
}) {
  const gradientId = `toolkit-${title.replaceAll(/[^a-zA-Z0-9]+/g, "-")}`;
  return (
    <section className="rounded-[var(--radius)] border border-white/8 bg-surface/90 p-5 shadow-[var(--card-shadow)]">
      <div className="mb-5">
        <h3 className="font-display text-base font-semibold text-text">{title}</h3>
        <p className="sr-only">{summary}</p>
      </div>
      <div className="h-56 min-w-0" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis
              width={30}
              tick={{ fill: "var(--muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              unit={unit}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--text)",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={animate}
              animationDuration={450}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function LoadingPanel({ label = "Loading diagnostics…" }: { label?: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-white/8 bg-surface/70">
      <div className="text-center">
        <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
        <p className="mt-3 text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export function DiagnosticScanOverlay({
  open,
  stageLabel,
  progress,
}: {
  open: boolean;
  stageLabel: string;
  progress: number;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-x-0 top-16 z-40 border-b border-primary/20 bg-black/80 px-4 py-3 backdrop-blur-xl sm:px-6"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
        <span className="size-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
        <p className="text-sm text-text">{stageLabel}</p>
        <div className="ml-auto h-1.5 w-40 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

export function StartupOverlay({
  open,
  stageLabel,
}: {
  open: boolean;
  stageLabel: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-bg" role="status" aria-live="polite">
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-surface font-display text-lg font-bold text-primary">
          K
        </span>
        <p className="mt-5 font-display text-xl font-semibold">Kilo Toolkit</p>
        <p className="mt-2 text-sm text-muted">{stageLabel}</p>
        <span className="mx-auto mt-5 block h-1 w-40 overflow-hidden rounded-full bg-white/[0.08]">
          <span className="block h-full w-1/2 animate-pulse bg-primary" />
        </span>
      </div>
    </div>
  );
}

export function ScenarioProfilePanel({
  activeProfileId,
  customControls,
  onProfileChange,
  onCustomChange,
  onRestoreHealthy,
}: {
  activeProfileId: SimulationProfileId;
  customControls: CustomScenarioControls;
  onProfileChange: (id: SimulationProfileId) => void;
  onCustomChange: (next: Partial<CustomScenarioControls>) => void;
  onRestoreHealthy: () => void;
}) {
  const profile = getProfile(activeProfileId, customControls);

  return (
    <section
      className="rounded-3xl border border-white/8 bg-surface/90 p-5 shadow-[var(--card-shadow)]"
      aria-labelledby="simulation-profile-heading"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Scenario Mode
          </p>
          <h2 id="simulation-profile-heading" className="mt-1 font-display text-xl font-semibold">
            Simulation Profile
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Simulation Profiles demonstrate how the Toolkit responds to different system conditions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="min-w-[220px] flex-1 text-sm text-muted">
            <span className="sr-only">Simulation Profile</span>
            <select
              value={activeProfileId}
              onChange={(event) => onProfileChange(event.target.value as SimulationProfileId)}
              className="mt-1 w-full rounded-xl border border-white/8 bg-bg px-3 py-2.5 text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-describedby="simulation-profile-help"
            >
              {SCENARIO_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={onRestoreHealthy}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted transition hover:border-white/20 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Restore Healthy System
          </button>
        </div>
      </div>
      <p id="simulation-profile-help" className="mt-3 text-sm text-secondary">
        Active: <strong className="text-text">{profile.label}</strong> — {profile.description}
      </p>

      {activeProfileId === "custom" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {(
            [
              ["cpu", "CPU %", 5, 95],
              ["memory", "Memory %", 20, 98],
              ["disk", "Disk activity %", 5, 95],
              ["latency", "Latency ms", 8, 200],
              ["healthScore", "Health score", 60, 99],
            ] as const
          ).map(([key, label, min, max]) => (
            <label key={key} className="rounded-xl border border-white/8 bg-black/20 p-3 text-sm text-muted">
              <span className="flex items-center justify-between gap-2">
                <span>{label}</span>
                <span className="font-mono text-xs text-text">{customControls[key]}</span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                value={customControls[key]}
                onChange={(event) => onCustomChange({ [key]: Number(event.target.value) })}
                className="mt-3 w-full accent-primary"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={customControls[key]}
              />
            </label>
          ))}
        </div>
      ) : null}
    </section>
  );
}
