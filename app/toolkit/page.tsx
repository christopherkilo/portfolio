"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Clock3,
  HardDrive,
  MemoryStick,
  Network,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useToolkit } from "@/components/toolkit/ToolkitContext";
import {
  DemoModeBadge,
  HealthGauge,
  LoadingPanel,
  MetricCard,
  ModuleHeader,
  ModuleStatusBadge,
  RecommendationCard,
  ScenarioProfilePanel,
} from "@/components/toolkit/ToolkitUI";
import { scoreLabel, statusFromScore } from "@/lib/toolkit/simulation";

export default function ToolkitOverviewPage() {
  const {
    system,
    memory,
    network,
    liveMetrics,
    healthScore,
    recommendations,
    lastRefreshedAt,
    loading,
    scanning,
    refreshDiagnostics,
    activeProfileId,
    customControls,
    profileLabel,
    setActiveProfile,
    updateCustomControls,
    restoreHealthySystem,
  } = useToolkit();
  const reduced = useReducedMotion();

  if (loading || !system || !memory || !network) return <LoadingPanel />;

  const metrics = liveMetrics ?? system.metrics;
  const warningCount =
    system.findings.filter((item) => item.severity === "warning").length +
    memory.findings.filter((item) => item.severity === "warning").length;
  const modules = [
    {
      href: "/toolkit/system",
      title: "SystemScope",
      icon: Activity,
      description: "Hardware, performance, storage, and health overview.",
      metric: `${healthScore}`,
      label: "System health",
    },
    {
      href: "/toolkit/memory",
      title: "MemoryMedic",
      icon: BrainCircuit,
      description: "Memory consumption, processes, and upgrade guidance.",
      metric: `${Math.round(metrics.memory)}%`,
      label: "Memory in use",
    },
    {
      href: "/toolkit/network",
      title: "NetCheck",
      icon: Network,
      description: "Connection health, latency, DNS, and troubleshooting.",
      metric: `${network.quality.latency} ms`,
      label: "Latency",
    },
  ];

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Unified diagnostics"
        title="System health at a glance"
        description="A live diagnostic session across hardware, memory, and network—built to feel like a desktop utility."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DemoModeBadge compact />
            <Link
              href="/toolkit/troubleshooting"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-muted transition hover:border-white/20 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Guided Troubleshooting
            </Link>
            <button
              type="button"
              onClick={() => void refreshDiagnostics()}
              disabled={scanning}
              className="inline-flex items-center gap-2 tk-btn-primary px-4 py-2 disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${scanning ? "animate-spin" : ""}`} />
              Refresh Diagnostics
            </button>
          </div>
        }
      />

      <ScenarioProfilePanel
        activeProfileId={activeProfileId}
        customControls={customControls}
        onProfileChange={setActiveProfile}
        onCustomChange={updateCustomControls}
        onRestoreHealthy={restoreHealthySystem}
      />

      <section className="grid gap-4 xl:grid-cols-[1.3fr_2fr]">
        <article className="rounded-3xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-6 backdrop-blur-xl">
          <HealthGauge score={healthScore} />
          <div className="mt-4 flex items-center justify-center gap-2">
            <ModuleStatusBadge score={healthScore} />
            <span className="text-xs text-muted">{warningCount} advisory findings</span>
          </div>
          <p className="mt-5 text-center text-sm leading-relaxed text-muted">
            {profileLabel}: {scoreLabel(healthScore)} ({statusFromScore(healthScore)}). Metrics and
            recommendations follow the active simulation profile.
          </p>
        </article>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="CPU usage"
            numericValue={metrics.cpu}
            decimals={0}
            suffix="%"
            detail="Interactive load"
            icon={<Activity className="size-4" />}
          />
          <MetricCard
            label="Memory usage"
            numericValue={metrics.memory}
            decimals={0}
            suffix="%"
            detail={`${memory.availableGb} GB available`}
            icon={<MemoryStick className="size-4" />}
          />
          <MetricCard
            label="Disk activity"
            numericValue={metrics.disk}
            decimals={0}
            suffix="%"
            detail="Primary volume I/O"
            icon={<HardDrive className="size-4" />}
          />
          <MetricCard
            label="Network latency"
            numericValue={network.quality.latency}
            decimals={0}
            suffix=" ms"
            detail="Connected"
            icon={<Network className="size-4" />}
          />
          <MetricCard
            label="Active warnings"
            value={String(warningCount)}
            detail="No critical findings"
            icon={<TriangleAlert className="size-4" />}
          />
          <MetricCard
            label="Latest refresh"
            value={
              lastRefreshedAt
                ? new Date(lastRefreshedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "Just now"
            }
            detail="Diagnostics updated"
            icon={<Clock3 className="size-4" />}
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted">
              Specialized modules
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Open a diagnostic workspace</h2>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {modules.map((module, index) => (
            <motion.article
              key={module.href}
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={reduced ? undefined : { y: -5 }}
              className="gradient-border group relative overflow-hidden rounded-3xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-6"
            >
              <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-primary/[0.04] blur-3xl transition group-hover:bg-primary/[0.08]" />
              <module.icon className="size-6 text-secondary transition group-hover:text-primary" aria-hidden />
              <h3 className="mt-8 font-display text-2xl font-semibold">{module.title}</h3>
              <p className="mt-3 min-h-14 text-sm leading-relaxed text-muted">{module.description}</p>
              <div className="mt-7 flex items-end justify-between border-t border-white/7 pt-5">
                <div>
                  <p className="font-display text-xl font-semibold">{module.metric}</p>
                  <p className="text-xs text-muted">{module.label}</p>
                </div>
                <Link
                  href={module.href}
                  className="inline-flex items-center gap-2 tk-btn-primary px-3.5 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Open Module <ArrowRight className="size-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-secondary" />
            <h2 className="font-display text-lg font-semibold">Recommendations</h2>
          </div>
          <div className="mt-4 space-y-3">
            {recommendations.length ? (
              recommendations.map((item) => (
                <RecommendationCard key={item.id} recommendation={item} />
              ))
            ) : (
              <p className="rounded-xl bg-black/20 p-3 text-sm text-muted">
                No high-priority recommendations for this profile.
              </p>
            )}
          </div>
        </article>
        <article className="rounded-2xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-5">
          <h2 className="font-display text-lg font-semibold">Quick diagnostic actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/toolkit/memory#processes"
              className="rounded-xl border border-white/8 p-3 text-sm text-muted transition hover:border-primary/30 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Review high-memory processes
            </Link>
            <Link
              href="/toolkit/network#connection-test"
              className="rounded-xl border border-white/8 p-3 text-sm text-muted transition hover:border-primary/30 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Run connection test
            </Link>
            <Link
              href="/toolkit/system#storage"
              className="rounded-xl border border-white/8 p-3 text-sm text-muted transition hover:border-primary/30 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Inspect storage health
            </Link>
            <Link
              href="/toolkit/troubleshooting"
              className="rounded-xl border border-white/8 p-3 text-sm text-muted transition hover:border-primary/30 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Guided Troubleshooting
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
