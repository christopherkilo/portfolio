"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowRight, BrainCircuit, Clock3, HardDrive, MemoryStick, Network, ShieldCheck, TriangleAlert } from "lucide-react";
import { useToolkit } from "@/components/toolkit/ToolkitContext";
import { DemoModeBadge, HealthGauge, LoadingPanel, MetricCard, ModuleHeader, StatusBadge } from "@/components/toolkit/ToolkitUI";

const modules = [
  { href: "/toolkit/system", title: "SystemScope", icon: Activity, description: "System hardware, performance, storage, and health overview.", metric: "88 / 100", label: "System health" },
  { href: "/toolkit/memory", title: "MemoryMedic", icon: BrainCircuit, description: "Memory consumption, processes, usage patterns, and upgrade guidance.", metric: "68%", label: "Memory in use" },
  { href: "/toolkit/network", title: "NetCheck", icon: Network, description: "Connection health, latency, DNS, adapters, and guided troubleshooting.", metric: "18 ms", label: "Simulated latency" },
];

export default function ToolkitOverviewPage() {
  const { system, memory, network, loading } = useToolkit();
  const reduced = useReducedMotion();

  if (loading || !system || !memory || !network) return <LoadingPanel />;

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Unified diagnostics"
        title="System health at a glance"
        description="A single simulated diagnostic session connecting hardware, memory performance, and network troubleshooting."
        action={<DemoModeBadge />}
      />

      <section className="grid gap-4 xl:grid-cols-[1.3fr_2fr]">
        <article className="rounded-3xl border border-white/8 bg-white/[0.035] p-6 backdrop-blur-xl">
          <HealthGauge score={system.health} />
          <div className="mt-4 flex items-center justify-center gap-2"><StatusBadge status="healthy" /><span className="text-xs text-muted">3 advisory findings</span></div>
          <p className="mt-5 text-center text-sm leading-relaxed text-muted">The simulated system is stable. Storage headroom and browser memory deserve routine attention.</p>
        </article>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="CPU usage" value={`${system.metrics.cpu}%`} detail="Normal interactive load" icon={<Activity className="size-4" />} />
          <MetricCard label="Memory usage" value={`${memory.usagePercent}%`} detail={`${memory.availableGb} GB available`} icon={<MemoryStick className="size-4" />} />
          <MetricCard label="Storage health" value="96%" detail="Primary NVMe estimate" icon={<HardDrive className="size-4" />} />
          <MetricCard label="Network status" value="Connected" detail={`${network.quality.latency} ms latency`} icon={<Network className="size-4" />} />
          <MetricCard label="Active warnings" value="2" detail="No critical findings" icon={<TriangleAlert className="size-4" />} />
          <MetricCard label="Latest scan" value="Just now" detail="Simulated provider refresh" icon={<Clock3 className="size-4" />} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted">Specialized modules</p><h2 className="mt-1 font-display text-2xl font-semibold">Open a diagnostic workspace</h2></div></div>
        <div className="grid gap-5 lg:grid-cols-3">
          {modules.map((module, index) => (
            <motion.article
              key={module.href}
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={reduced ? undefined : { y: -7, rotateX: 1.2, rotateY: index === 1 ? 0 : index ? -1 : 1 }}
              className="gradient-border group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.035] p-6 [transform-style:preserve-3d]"
            >
              <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-primary/[0.04] blur-3xl transition group-hover:bg-primary/[0.08]" />
              <module.icon className="size-6 text-secondary transition group-hover:text-primary" aria-hidden />
              <h3 className="mt-8 font-display text-2xl font-semibold">{module.title}</h3>
              <p className="mt-3 min-h-14 text-sm leading-relaxed text-muted">{module.description}</p>
              <div className="mt-7 flex items-end justify-between border-t border-white/7 pt-5"><div><p className="font-display text-xl font-semibold">{module.metric}</p><p className="text-xs text-muted">{module.label}</p></div><Link href={module.href} className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-primary">Open Module <ArrowRight className="size-4" /></Link></div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-secondary" /><h2 className="font-display text-lg font-semibold">Recent recommendations</h2></div><ul className="mt-4 space-y-3 text-sm text-muted"><li className="rounded-xl bg-black/20 p-3"><strong className="text-text">Recover storage headroom.</strong> Review development caches and downloads before the system drive reaches 85% utilization.</li><li className="rounded-xl bg-black/20 p-3"><strong className="text-text">Review browser workload first.</strong> Tab and extension usage should be checked before recommending more RAM.</li></ul></article>
        <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"><h2 className="font-display text-lg font-semibold">Quick diagnostic actions</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Link href="/toolkit/memory#processes" className="rounded-xl border border-white/8 p-3 text-sm text-muted transition hover:border-primary/30 hover:text-text">Review high-memory processes</Link><Link href="/toolkit/network#connection-test" className="rounded-xl border border-white/8 p-3 text-sm text-muted transition hover:border-primary/30 hover:text-text">Run connection test</Link><Link href="/toolkit/system#storage" className="rounded-xl border border-white/8 p-3 text-sm text-muted transition hover:border-primary/30 hover:text-text">Inspect storage health</Link><Link href="/toolkit/network#troubleshooting" className="rounded-xl border border-white/8 p-3 text-sm text-muted transition hover:border-primary/30 hover:text-text">Start guided troubleshooting</Link></div></article>
      </section>
    </div>
  );
}
